import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { CadenceOffer, CardSet, Context, Override, Tier, TierPatch } from '../rules/content'
import type { PipelineDoc } from '../rules/pipeline'
import { emptyPipeline } from '../rules/pipeline'
import { DIRECT } from '../rules/content'
import { defaultFlow, type FlowContent } from '../rules/flow'
import { defaultSet } from '../rules/defaults'
import { adaptEngineContent, isEngineContent } from '../rules/adapt'
import { readTemplate } from '../rules/sheet'
import { readWorkbook } from '../rules/xlsx'
import type { Journey } from '../rules/journey'
import type { FlowLayer, FlowPatch } from '../rules/layers'
import { applyStepOrder, chosenJourney, isReordered } from '../rules/journey'
import { allJourneys } from '../rules/liveJourneys'
import { tabsOf } from '../rules/tabs'
import { findOverride, matches, resolveOffer } from '../rules/resolve'
import type { RemoteState } from './remote'
import { loadFile, loadRemote, publishRemote } from './remote'
import { MARKETS as LIVE_MARKETS } from '../rules/dazn/spec'
import { mergeLive } from '../rules/dazn/build'
import { fetchLiveMarket, type LiveStatus } from './live'

const STORAGE_KEY = 'acquisition-card-set-v3'

/**
 * Keys that say where you are, not what the content says.
 *
 * Changing one of these must not withdraw a review: opening another step is
 * not an edit, and neither is asking for the review in the first place.
 */
const NAVIGATION = new Set<string>(['stepId', 'journeyId', 'context', 'review', 'stepOrder', 'pipeline'])

/**
 * Sends content back to draft when it changes under a standing review.
 *
 * "Waiting for product & UX approval" over copy edited since the ask is worse
 * than no status at all — it is the reviewer being told the wrong thing.
 */
function withdrawn(set: CardSet): Partial<CardSet> | null {
  return set.review && set.review !== 'draft' ? { review: 'draft' } : null
}

/** Market value meaning "the base tier, before any market difference". */
export const BASE_MARKET = '*'

export const isBaseContext = (c: Context) => c.market === BASE_MARKET && !c.campaign

/**
 * Content saved before pricing moved onto offers cannot be migrated field by
 * field — a card carried one price, an offer needs one per cadence, and
 * inventing the missing ones would fabricate commercial facts. So a v2 set is
 * not upgraded: it starts fresh, and its old key is left untouched in case
 * anything needs recovering by hand.
 */
/**
 * A shipped price a saved copy predates.
 *
 * The shipped plans' prices are authored — the networks are not in DAZN's
 * catalogue — so a way to pay added to the shipped set later would never
 * reach a browser that saved before it existed. Only an offer whose id the
 * copy does not have is added; a price somebody changed stays changed.
 */
function withShippedOffers(offers: CardSet['offers']): CardSet['offers'] {
  const have = new Set(offers.map((o) => o.id))
  const shipped = new Set(defaultSet.tiers.map((t) => t.id))
  const missing = defaultSet.offers.filter((o) => shipped.has(o.tierId) && !have.has(o.id))
  return missing.length ? [...offers, ...missing] : offers
}

/** Plans once shipped by hand that DAZN's catalogue now supplies. */
const LEGACY_TIERS = new Set(['fiba-ultimate', 'fiba-standard'])

function hydrate(raw: unknown): CardSet {
  if (typeof raw !== 'object' || raw === null) return defaultSet
  const input = raw as Partial<CardSet> & { flowStructures?: unknown; journeys?: unknown }
  if (!Array.isArray(input.tiers) || !Array.isArray(input.offers)) return defaultSet
  // Plans the setup wizard once generated, and the wizard's own records. The
  // wizard is gone and the catalogue supplies the plans now; a browser that
  // still holds its empty cards would show them beside the real ones.
  // Plans transcribed from Figma before the catalogue supplied them go the
  // same way: Courtside's two hand-written cards beside its two live ones
  // showed a market four plans where it sells two.
  const generated = new Set(input.tiers.filter((t) => /^gen-/.test(t.id) || LEGACY_TIERS.has(t.id)).map((t) => t.id))
  const kept: Partial<CardSet> & { flowStructures?: unknown; journeys?: unknown } = { ...input }
  delete kept.flowStructures
  delete kept.journeys
  return {
    ...defaultSet,
    ...kept,
    context: { ...defaultSet.context, ...input.context },
    tiers: input.tiers
      .filter((t) => !generated.has(t.id))
      .map((t) => ({ ...t, ...renamedSwitch(t), overrides: t.overrides ?? [] })),
    offers: withShippedOffers(input.offers.filter((o) => !generated.has(o.tierId))),
    logoCatalog: withShippedBlurbs(input.logoCatalog),
    // A screen the saved copy predates. Saved work never reseeds, so content
    // stored before a screen existed would carry a hole where its words go,
    // and everything that reads the flow would find nothing there. Merged per
    // screen, so anything a person wrote wins over the shipped default.
    flow: mergeFlow(input.flow),
    flowLayers: mergeLayers(input.flowLayers),
  }
}

/**
 * The saved layers, with the shipped ones they predate and without the MSG+
 * words that were written into other markets' layers while MSG+ was still
 * the base copy: a market's layer saying "New York and Buffalo DMAs" on a
 * Spanish payment screen is that history, not a decision. A layer scoped to
 * the RSNs keeps every word it has.
 */
function mergeLayers(stored: FlowLayer[] | undefined): FlowLayer[] {
  const shipped = defaultSet.flowLayers ?? []
  const kept = (stored ?? []).flatMap((layer) => {
    if (layer.when.subscription === 'rsns') return [layer]
    const patch: FlowPatch = {}
    for (const [screen, fields] of Object.entries(layer.patch) as [keyof FlowPatch, Record<string, unknown> | undefined][]) {
      if (!fields) continue
      const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => !RSN_WORDS.test(JSON.stringify(v))))
      if (Object.keys(clean).length) (patch as Record<string, unknown>)[screen] = clean
    }
    return Object.keys(patch).length ? [{ ...layer, patch }] : []
  })
  const ids = new Set(kept.map((l) => l.id))
  return [...kept, ...shipped.filter((l) => !ids.has(l.id))]
}

/**
 * A context with a tab on it, when the set draws tabs at all.
 *
 * A context naming a tab the set does not have is corrected too: a select shows
 * its first option when its value matches none, and the panel would scope its
 * edits to that first tab while the context said otherwise.
 */
function withTab(set: CardSet): CardSet {
  const tabs = tabsOf(set)
  if (!tabs.length) {
    // No tabs is one screen with nothing dividing it, and a context still
    // naming a tab from a market that had them would scope edits to a tab
    // this market cannot show.
    if (set.context.tab === undefined) return set
    const rest = { ...set.context }
    delete rest.tab
    return { ...set, context: rest }
  }
  if (tabs.some((t) => t.id === set.context.tab)) return set
  // The tab the picker opens on: the one the market says, or the first.
  const opening = tabs.find((t) => t.preselected) ?? tabs[0]
  return { ...set, context: { ...set.context, tab: opening.id } }
}

/**
 * `ultimate` was the old name for `highlighted`.
 *
 * The switch never changed — one boolean, four gold outputs — only what it is
 * called, so that a set highlighting Standard stops describing it as the
 * Ultimate one. Everything already saved says `ultimate`, and reading it as
 * nothing would quietly un-highlight every plan in every browser and in the
 * published file. A saved `highlighted` wins, because that is the newer of the
 * two; the old key is left where it is rather than deleted, so a file written
 * here still opens in a deployment that has not shipped this yet.
 */
function renamedSwitch(tier: unknown): { highlighted?: boolean } {
  const t = tier as { highlighted?: unknown; ultimate?: unknown }
  if (typeof t.highlighted === 'boolean') return {}
  return typeof t.ultimate === 'boolean' ? { highlighted: t.ultimate } : {}
}

/**
 * A screen the saved copy predates.
 *
 * Saved work never reseeds, so content stored before a screen existed would
 * carry a hole where its words go, and everything that reads the flow would
 * find nothing there. Merged screen by screen, so anything a person wrote
 * wins over the shipped default and only absent keys are filled.
 */
function mergeFlow(stored: FlowContent | undefined): FlowContent {
  if (!stored) return defaultFlow
  const out = { ...defaultFlow }
  for (const key of Object.keys(defaultFlow) as (keyof FlowContent)[]) {
    const shipped = defaultFlow[key]
    const saved = stored[key]
    // A screen saved from when MSG+ was the base copy. That copy is a layer
    // now (`flowLayers`), so a base still carrying it would put an RSN's
    // words on every market's screens; the shipped DAZN-generic base is what
    // it should have been.
    const rsnBase = saved && isRsnCopy(saved)
    const merged = saved && !rsnBase ? { ...shipped, ...saved } : shipped
    // A checkout line saved with a date typed into it — "renews on
    // 01/10/2027" — is the old default, written before the figures came
    // from the offer. It would be wrong tomorrow; the shipped line with its
    // tokens is right every day.
    if (key === 'checkout' && merged !== shipped) {
      const c = merged as Record<string, unknown>
      const stale = (v: unknown) => typeof v === 'string' && DATED.test(v) && !/\{\w+\}/.test(v)
      for (const field of ['renewalNote', 'legal', 'payCta', 'note'] as const) {
        if (stale(c[field])) c[field] = (shipped as unknown as Record<string, unknown>)[field]
      }
    }
    out[key] = merged as never
  }
  return out
}

/** A date typed into copy, in any of the ways a person types one. */
const DATED = /\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/
const RSN_WORDS = /MSG\+|TV provider|Knicks|Yankees|Gotham|YES Network|Buffalo DMA|NY sports|Nationally broadcast/i
const isRsnCopy = (screen: unknown) => RSN_WORDS.test(JSON.stringify(screen))

/**
 * Fills in a catalogue field the saved copy predates.
 *
 * Saved work never reseeds, so a browser that stored its catalogue before
 * `blurb` existed would show the dialog's competition rows bare for ever. Only
 * the absent key is filled — an entry that carries a blurb keeps its own, so
 * this cannot overwrite anything a person wrote.
 */
function withShippedBlurbs(stored: CardSet['logoCatalog'] | undefined) {
  if (!Array.isArray(stored)) return defaultSet.logoCatalog
  const shipped = new Map(defaultSet.logoCatalog.map((e) => [e.id, e.blurb]))
  return stored.map((entry) =>
    entry.blurb === undefined && shipped.has(entry.id)
      ? { ...entry, blurb: shipped.get(entry.id) }
      : entry,
  )
}

/**
 * A fingerprint of the shipped content.
 *
 * Saved work lives in localStorage and never reseeds, so a browser that loaded
 * an older build keeps that build's content for ever — and then reports
 * failures against data the repository has already fixed. That is expensive to
 * diagnose, because the code is innocent and looks it.
 *
 * Derived rather than hand-bumped: a constant someone has to remember to change
 * is a constant that eventually says the wrong thing.
 */
function fingerprint(value: unknown): string {
  const text = JSON.stringify(value)
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36)
}

const SEED_FINGERPRINT = fingerprint(defaultSet)

interface StoredPayload {
  seed: string
  set: unknown
}

function read(): { set: CardSet; seed: string; hadLocal: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { set: defaultSet, seed: SEED_FINGERPRINT, hadLocal: false }
    const parsed: unknown = JSON.parse(stored)
    // A payload saved before the stamp existed is a bare set. It is exactly the
    // case worth flagging, so absence counts as stale rather than as current.
    const wrapped = parsed as Partial<StoredPayload>
    const isWrapped = typeof wrapped?.seed === 'string' && wrapped.set !== undefined
    const raw = isWrapped ? wrapped.set : parsed
    const seed = isWrapped ? wrapped.seed : null
    return { set: hydrate(raw), seed: seed ?? 'pre-stamp', hadLocal: true }
  } catch {
    return { set: defaultSet, seed: SEED_FINGERPRINT, hadLocal: false }
  }
}


/**
 * Which situations an edit is about.
 *
 * The market and the campaign come from the context, because being in a market
 * is what makes an edit that market's. The tab does not: a tab is always on
 * screen, so taking it from the context would quietly make every edit
 * tab-only. It is passed in when somebody has said so.
 */
function selectorFor(context: Context, scope?: Scope): Override['when'] {
  const when: Override['when'] = {}
  if (context.market !== BASE_MARKET) when.market = context.market
  if (context.campaign) when.campaign = context.campaign
  if (scope?.tab) when.tab = scope.tab
  return when
}

/** How narrowly an edit is meant. Empty is "however this plan is shown". */
export interface Scope {
  tab?: string
}

export interface CardSetStore {
  set: CardSet
  context: Context
  editingBase: boolean
  setContext: (context: Context) => void
  /** Where the content on screen came from, and whether it can be published. */
  remote: RemoteState | null
  /** Local edits not yet in the published copy. */
  unpublished: boolean
  publish: (message: string) => Promise<{ ok: boolean; error?: string; conflict?: boolean }>
  publishing: boolean
  /** The shared copy differs from what this browser had. Neither has been lost. */
  remoteDiffers: boolean
  takeShared: () => void
  keepLocal: () => void
  /** Whether the plans on screen are DAZN's live catalogue, per the current market. */
  live: LiveStatus
  /** Ask DAZN again for this market's plans, now. */
  refreshLive: () => void
  /** Saved content predates the shipped defaults now in the build. */
  staleSeed: boolean
  /** Keep the saved content and stop flagging it as behind the build. */
  acceptSeed: () => void
  /** The journey that runs in this context — never one that doesn't. */
  journey: Journey
  /** Reorder a journey's steps; an empty list clears the override. */
  setStepOrder: (journeyId: string, stepIds: string[]) => void
  /** This journey runs in an order other than the one Figma draws. */
  reordered: boolean
  updateSet: (patch: Partial<CardSet>) => void
  /** Writes to the base tier, or to this context's override. */
  updateTier: (id: string, patch: TierPatch, scope?: Scope) => void
  /** Adds a plan, sold at every cadence, and returns its id. */
  /**
   * A new plan, belonging to the situation it was added from.
   *
   * The scope is not a nicety. A plan with no product on it is read everywhere
   * as sold with all of them, and an offer with no market is a price in every
   * country — so a plan added without one appears in every flow in the tool,
   * which is never what pressing "Add a plan" inside one flow means.
   */
  addTier: (scope?: { market?: string; subscription?: string }) => string
  /** Removes a plan and everything priced against it. */
  removeTier: (id: string) => void
  /** Edits the offer pricing this tier at the current cadence, market and scope. */
  updateOffer: (tierId: string, patch: Partial<CadenceOffer>, scope?: Scope) => void
  offerFor: (tierId: string) => CadenceOffer | null
  overriddenKeys: (tier: Tier) => string[]
  reset: () => void
  exportJson: () => void
  importJson: (file: File) => Promise<void>
  /** Advances the handoff pipeline. Not an edit: it never withdraws a review. */
  updatePipeline: (fn: (doc: PipelineDoc) => PipelineDoc) => void
  importError: string | null
  /** Assumptions the adapter had to make, surfaced rather than swallowed. */
  importNotes: string[]
}

export function useCardSet(): CardSetStore {
  const [initial] = useState(read)
  /*
   * Every write goes through here, so a tab is always in the context.
   *
   * The plan picker draws tabs, so something is always on one — and an edit
   * scoped to a tab is only read back by a context on that tab. Settled at the
   * point of writing rather than corrected afterwards in an effect, because a
   * correction after the fact is a render in which the panel and the preview
   * disagree about which tab is showing, which is the bug itself.
   *
   * A reducer with setState's signature, so the sixty call sites read as they
   * always did and the dispatcher is known stable to the hooks lint.
   */
  const [set, setSet] = useReducer(
    (prev: CardSet, next: CardSet | ((p: CardSet) => CardSet)) =>
      withTab(typeof next === 'function' ? next(prev) : next),
    initial.set,
    withTab,
  )
  // The seed this content was authored against, carried forward on every write.
  // Stamping the current fingerprint instead would mark stale content as fresh
  // the moment the page loaded, and the warning would never be seen twice.
  const [seed, setSeed] = useState(initial.seed)
  const [remote, setRemote] = useState<RemoteState | null>(null)
  const [publishedSha, setPublishedSha] = useState<string | null>(null)
  const [publishedText, setPublishedText] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [remoteDiffers, setRemoteDiffers] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotes, setImportNotes] = useState<string[]>([])

  /*
   * DAZN's catalogue, folded in per market.
   *
   * The facts about a plan — its name, words, prices, limits — are DAZN's to
   * state, so they are fetched for the market on screen and written over
   * whatever this browser had, every time the market changes and once per
   * market per visit. What the tool adds around them stays. Fetched once per
   * market rather than on every render, and again on request.
   */
  const [live, setLive] = useState<LiveStatus>({ state: 'off' })
  const pulled = useRef(new Set<string>())
  const pullLive = useCallback(async (market: string, refresh = false) => {
    if (!LIVE_MARKETS.includes(market)) return
    if (!refresh && pulled.current.has(market)) return
    pulled.current.add(market)
    setLive({ state: 'loading', market })
    const result = await fetchLiveMarket(market, refresh)
    if (!result.ok) {
      pulled.current.delete(market)
      setLive({ state: 'unreachable', market, reason: result.error })
      return
    }
    if (result.live) {
      const fresh = result.live
      setSet((prev) => mergeLive(prev, fresh))
    }
    setLive({ state: 'live', market, fetchedAt: result.fetchedAt })
  }, [])


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ seed, set }))
    } catch {
      // Private mode or a full quota — the page still works, it just won't persist.
    }
  }, [set, seed])

  const context = set.context
  const editingBase = isBaseContext(context)


  const setContext = useCallback((next: Context) => {
    setSet((prev) => {
      // A partner storefront belongs to its markets. Carrying `movistar` into
      // Germany would resolve tiers against a shop that isn't there — so the
      // pair is made unreachable rather than merely hidden from the picker.
      const channel = prev.channels.find((c) => c.code === next.channel)
      const operates = !channel?.markets || channel.markets.includes(next.market)
      return { ...prev, context: operates ? next : { ...next, channel: DIRECT } }
    })
  }, [])

  const updateSet = useCallback((patch: Partial<CardSet>) => {
    const edits = Object.keys(patch).some((k) => !NAVIGATION.has(k))
    setSet((prev) => ({ ...prev, ...patch, ...(edits ? withdrawn(prev) : null) }))
  }, [])

  /**
   * A new plan, and the offers that make it sellable.
   *
   * A tier with no offer is not sold at any cadence, which is a real thing to
   * mean but a strange thing to have just asked for: the card would not appear
   * anywhere, and adding a plan would look broken. So it starts sold at every
   * cadence the set carries, at what the plan above it costs, for the author to
   * price properly.
   */
  const addTier = useCallback((scope?: { market?: string; subscription?: string }) => {
    const id = `tier-${Date.now().toString(36)}`
    setSet((prev) => {
      const market = scope?.market || undefined
      const subscription = scope?.subscription || undefined
      const last = prev.tiers[prev.tiers.length - 1]
      const tier: Tier = {
        id,
        planName: 'New plan',
        description: '',
        features: [],
        logoTiles: [],
        logoTotal: 0,
        highlighted: false,
        displayOrder: (last?.displayOrder ?? 0) + 10,
        // The product this flow sells, so the plan does not turn up in the
        // others. Absent when the flow is a market's general one, where the
        // market on the prices below is what keeps it in its own country.
        subscriptions: subscription ? [subscription] : undefined,
        status: 'live',
        channel: DIRECT,
        visibleToPartners: true,
        overrides: [],
      }
      const offers: CadenceOffer[] = prev.cadences.map((cadence) => {
        // Priced like the plan beside it, which is nearly always closer than
        // zero and is in this market's own currency.
        const like = prev.offers.find(
          (o) =>
            o.tierId === last?.id &&
            o.cadence === cadence &&
            (o.market === undefined || o.market === market),
        )
        return {
          id: `${id}-${cadence.toLowerCase()}`,
          tierId: id,
          cadence,
          market,
          standardPrice: like?.standardPrice ?? 0,
          discount: false,
          introPrice: null,
          introMonths: 0,
          addOnId: null,
          addOnPurchaseType: null,
          addOnDiscountPercent: null,
          includedAddOnIds: [],
        }
      })
      return {
        ...prev,
        ...withdrawn(prev),
        tiers: [...prev.tiers, tier],
        offers: [...prev.offers, ...offers],
      }
    })
    return id
  }, [])

  /** The prices go with the plan: an offer for a tier that is gone prices nothing. */
  const removeTier = useCallback((id: string) => {
    setSet((prev) => ({
      ...prev,
      ...withdrawn(prev),
      tiers: prev.tiers.filter((t) => t.id !== id),
      offers: prev.offers.filter((o) => o.tierId !== id),
    }))
  }, [])

  const updateTier = useCallback((id: string, patch: TierPatch, scope?: Scope) => {
    setSet((prev) => {
      const ctx = prev.context
      if (isBaseContext(ctx) && !scope?.tab) {
        return {
          ...prev,
          ...withdrawn(prev),
          tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }
      }
      const when = selectorFor(ctx, scope)
      return {
        ...prev,
        ...withdrawn(prev),
        tiers: prev.tiers.map((t) => {
          if (t.id !== id) return t
          const existing = findOverride(t, when)
          if (existing) {
            return {
              ...t,
              overrides: t.overrides.map((o) =>
                o.id === existing.id ? { ...o, patch: { ...o.patch, ...patch } } : o,
              ),
            }
          }
          const oid = `${t.id}-${when.market ?? 'all'}${when.campaign ? `-${when.campaign}` : ''}${
            when.tab ? `-${when.tab}` : ''
          }`
          return { ...t, overrides: [...t.overrides, { id: oid, when, patch }] }
        }),
      }
    })
  }, [])

  /**
   * Pricing edits land on the offer for (tier, cadence, market). Editing while
   * a market is selected forks a market-scoped offer rather than changing the
   * price everywhere — the same base-plus-differences rule the tiers follow.
   */
  const updateOffer = useCallback(
    (tierId: string, patch: Partial<CadenceOffer>, scope?: Scope) => {
      setSet((prev) => {
        const ctx = prev.context
        const target = resolveOffer(prev, tierId, ctx)
        if (!target) return prev

        const scopeMarket = ctx.market === BASE_MARKET ? undefined : ctx.market
        // The row is this edit's own only if it is scoped to exactly what the
        // edit is about. A price written for every tab must not be changed by
        // someone editing one tab's price — that row is shared.
        const alreadyScoped = target.market === scopeMarket && target.tab === scope?.tab

        if (alreadyScoped) {
          return {
            ...prev,
            ...withdrawn(prev),
            offers: prev.offers.map((o) => (o.id === target.id ? { ...o, ...patch } : o)),
          }
        }
        const forked: CadenceOffer = {
          ...target,
          ...patch,
          id: `${target.id}-${scopeMarket ?? 'all'}${scope?.tab ? `-${scope.tab}` : ''}`,
          market: scopeMarket,
          tab: scope?.tab,
        }
        return { ...prev, ...withdrawn(prev), offers: [...prev.offers, forked] }
      })
    },
    [],
  )

  const offerFor = useCallback(
    (tierId: string) => resolveOffer(set, tierId, context),
    [set, context],
  )

  const overriddenKeys = useCallback(
    (tier: Tier) => {
      if (editingBase) return []
      // Every override that applies here, not just the market's: a field
      // written for this tab is written for this situation too, and marking
      // only one of the two left the other looking untouched.
      return [
        ...new Set(
          tier.overrides
            .filter((o) => matches(o, context))
            .flatMap((o) =>
              Object.entries(o.patch)
                .filter(([, v]) => v !== undefined)
                .map(([k]) => k),
            ),
        ),
      ]
    },
    [context, editingBase],
  )

  const updatePipeline = useCallback((fn: (doc: PipelineDoc) => PipelineDoc) => {
    setSet((prev) => ({ ...prev, pipeline: fn(prev.pipeline ?? emptyPipeline()) }))
  }, [])

  const reset = useCallback(() => {
    setSet(defaultSet)
    setSeed(SEED_FINGERPRINT)
    // The defaults have no live plans; fetch this market's again.
    pulled.current.clear()
    void pullLive(defaultSet.context.market)
  }, [pullLive])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(set, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'acquisition-set.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [set])

  /**
   * Accepts our own export, or the engineering-side one — that export is
   * recognisable by its `cadenceOffers` key, and is adapted on the way in so
   * their content needs no manual step to reach the renderer.
   */
  /**
   * Takes the filled spreadsheet directly, or JSON from either shape.
   *
   * The spreadsheet path exists because the alternative was a terminal command
   * between the person filling the sheet and the app reading it — which meant
   * the person who owns the content could not load their own work.
   */
  const importJson = useCallback(async (file: File) => {
    try {
      if (/\.xlsx$/i.test(file.name)) {
        const { content, notes } = readTemplate(await readWorkbook(file))
        if (!isEngineContent(content)) throw new Error('The template produced nothing readable.')
        const { set: adapted, notes: adapterNotes } = adaptEngineContent(content)
        setSet(adapted)
        setImportNotes([...notes, ...adapterNotes])
        setImportError(null)
        return
      }

      const parsed: unknown = JSON.parse(await file.text())
      if (isEngineContent(parsed)) {
        const { set: adapted, notes } = adaptEngineContent(parsed)
        setSet(adapted)
        setImportNotes(notes)
      } else {
        setSet(hydrate(parsed))
        setImportNotes([])
      }
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that file')
    }
  }, [])

  // Resolved here, not in each consumer: the editor and the preview must agree
  // on which journey is on screen, and two copies of this line would drift.
  // The set's own generated flows are in this list too, so a flow built in
  // the setup wizard resolves exactly as a committed one does.
  const chosen = chosenJourney(allJourneys(set), context, set.journeyId)
  // Applied once, here, so the rail, the frames and the preview all walk the
  // same sequence rather than each re-deriving it.
  /**
   * Memoised, and not as a nicety: `applyStepOrder` rebuilds the journey when
   * an order is recorded, so an unmemoised call handed every consumer a new
   * object on every render. Anything watching the journey by identity then ran
   * on every render, which is how a re-render loop starts.
   */
  const journey = useMemo(() => applyStepOrder(chosen, set.stepOrder?.[chosen.id]), [chosen, set.stepOrder])
  const reordered = isReordered(chosen, set.stepOrder?.[chosen.id])

  /**
   * Adopt the shared copy on load — but never over the top of local work.
   *
   * A shared surface is the point, so the shared copy is what should normally
   * be on screen. It must not cost someone their unsaved edits to get there:
   * this browser's copy is the only place those exist. When the two differ the
   * local one stays on screen and the difference is offered as a choice, the
   * same way stale seed content is.
   */
  useEffect(() => {
    let cancelled = false
    // The shared file first. It is a static file on every deployment, back in
    // milliseconds, and it carries every market's plans as of the last import
    // — so the page has plans to show before the content store or DAZN's
    // catalogue have answered, and a slow or failing store cannot leave it
    // saying "no plans here". The published copy follows and wins.
    let fileShown: string | null = null
    void loadFile().then((state) => {
      if (cancelled || state?.kind !== 'file') return
      const text = JSON.stringify(state.set)
      if (!initial.hadLocal || JSON.stringify(initial.set) === text) {
        fileShown = text
        setSet(hydrate(state.set))
        setSeed(SEED_FINGERPRINT)
        pulled.current.clear()
        void pullLive(state.set.context?.market ?? initial.set.context.market)
      }
    })
    loadRemote().then((state) => {
      if (cancelled) return
      setRemote(state)
      if (state.kind !== 'published' && state.kind !== 'file') return
      // The same bytes the file already put on screen: nothing to do again.
      if (state.kind === 'file' && fileShown !== null && JSON.stringify(state.set) === fileShown) return

      // The file has no sha, so it can be read but not written back through
      // the API — publishing it means committing it.
      setPublishedSha(state.kind === 'published' ? state.sha : null)
      const text = JSON.stringify(state.set)
      setPublishedText(text)

      if (!initial.hadLocal || JSON.stringify(initial.set) === text) {
        setSet(hydrate(state.set))
        setSeed(SEED_FINGERPRINT)
        // The shared copy replaced whatever live plans had already landed.
        pulled.current.clear()
        void pullLive(state.set.context?.market ?? initial.set.context.market)
      } else {
        setRemoteDiffers(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [initial, pullLive])

  const market = context.market
  useEffect(() => {
    // Starting the fetch is the effect; the "loading" it records first is the
    // fetch's own state, not a render's — which the rule cannot tell apart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void pullLive(market)
  }, [market, pullLive])
  const refreshLive = useCallback(() => void pullLive(market, true), [market, pullLive])

  /** Take the shared copy, replacing this browser's version. */
  const takeShared = useCallback(() => {
    const state = remote
    if (state?.kind !== 'published' && state?.kind !== 'file') return
    setSet(hydrate(state.set))
    setSeed(SEED_FINGERPRINT)
    setRemoteDiffers(false)
    pulled.current.clear()
    void pullLive(state.set.context?.market ?? market)
  }, [remote, pullLive, market])

  /** Keep this browser's version; it becomes what would be published. */
  const keepLocal = useCallback(() => setRemoteDiffers(false), [])

  const publish = useCallback(
    async (message: string) => {
      setPublishing(true)
      const result = await publishRemote(set, publishedSha, message)
      setPublishing(false)
      if (!result.ok) return { ok: false, error: result.error, conflict: result.conflict }
      setPublishedSha(result.sha)
      setPublishedText(JSON.stringify(set))
      setRemote({ kind: 'published', sha: result.sha, set })
      return { ok: true }
    },
    [set, publishedSha],
  )

  // Compared against what was published rather than tracked with a dirty flag:
  // a flag would survive an edit that was undone, and claim work that is not
  // there.
  const unpublished = publishedText !== null && publishedText !== JSON.stringify(set)

  const setStepOrder = useCallback((journeyId: string, stepIds: string[]) => {
    setSet((prev) => {
      const next = { ...(prev.stepOrder ?? {}) }
      if (stepIds.length === 0) delete next[journeyId]
      else next[journeyId] = stepIds
      return { ...prev, stepOrder: next }
    })
  }, [])

  const acceptSeed = useCallback(() => setSeed(SEED_FINGERPRINT), [])
  const staleSeed = seed !== SEED_FINGERPRINT

  return {
    set,
    context,
    editingBase,
    setContext,
    remote,
    unpublished,
    publish,
    publishing,
    remoteDiffers,
    takeShared,
    keepLocal,
    live,
    refreshLive,
    staleSeed,
    acceptSeed,
    journey,
    setStepOrder,
    reordered,

    updateSet,
    updateTier,
    addTier,
    removeTier,
    updateOffer,
    offerFor,
    overriddenKeys,
    reset,
    exportJson,
    importJson,
    importError,
    importNotes,
    updatePipeline,
  }
}

export { DIRECT }
