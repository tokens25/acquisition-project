import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CadenceOffer, CardSet, Context, Tier, TierPatch } from '../rules/content'
import type { PipelineDoc } from '../rules/pipeline'
import { emptyPipeline } from '../rules/pipeline'
import { DIRECT } from '../rules/content'
import { defaultFlow, type FlowContent } from '../rules/flow'
import { defaultSet } from '../rules/defaults'
import { adaptEngineContent, isEngineContent } from '../rules/adapt'
import { readTemplate } from '../rules/sheet'
import { readWorkbook } from '../rules/xlsx'
import type { Journey } from '../rules/journey'
import { applyStepOrder, isReordered, journeysFor } from '../rules/journey'
import { journeys } from '../rules/journeys'
import { findOverride, resolveOffer } from '../rules/resolve'
import type { RemoteState } from './remote'
import { loadRemote, publishRemote } from './remote'

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
function hydrate(raw: unknown): CardSet {
  if (typeof raw !== 'object' || raw === null) return defaultSet
  const input = raw as Partial<CardSet>
  if (!Array.isArray(input.tiers) || !Array.isArray(input.offers)) return defaultSet
  return {
    ...defaultSet,
    ...input,
    context: { ...defaultSet.context, ...input.context },
    tiers: input.tiers.map((t) => ({ ...t, overrides: t.overrides ?? [] })),
    logoCatalog: withShippedBlurbs(input.logoCatalog),
    // A screen the saved copy predates. Saved work never reseeds, so content
    // stored before a screen existed would carry a hole where its words go,
    // and everything that reads the flow would find nothing there. Merged per
    // screen, so anything a person wrote wins over the shipped default.
    flow: mergeFlow(input.flow),
  }
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
    out[key] = (saved ? { ...shipped, ...saved } : shipped) as never
  }
  return out
}

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


function selectorFor(context: Context): Partial<Pick<Context, 'market' | 'campaign'>> {
  const when: Partial<Pick<Context, 'market' | 'campaign'>> = {}
  if (context.market !== BASE_MARKET) when.market = context.market
  if (context.campaign) when.campaign = context.campaign
  return when
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
  updateTier: (id: string, patch: TierPatch) => void
  /** Edits the offer pricing this tier at the current cadence and market. */
  updateOffer: (tierId: string, patch: Partial<CadenceOffer>) => void
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
  const [set, setSet] = useState<CardSet>(initial.set)
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

  const updateTier = useCallback((id: string, patch: TierPatch) => {
    setSet((prev) => {
      const ctx = prev.context
      if (isBaseContext(ctx)) {
        return {
          ...prev,
          ...withdrawn(prev),
          tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }
      }
      const when = selectorFor(ctx)
      return {
        ...prev,
        ...withdrawn(prev),
        tiers: prev.tiers.map((t) => {
          if (t.id !== id) return t
          const existing = findOverride(t, ctx)
          if (existing) {
            return {
              ...t,
              overrides: t.overrides.map((o) =>
                o.id === existing.id ? { ...o, patch: { ...o.patch, ...patch } } : o,
              ),
            }
          }
          const oid = `${t.id}-${when.market ?? 'all'}${when.campaign ? `-${when.campaign}` : ''}`
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
  const updateOffer = useCallback((tierId: string, patch: Partial<CadenceOffer>) => {
    setSet((prev) => {
      const ctx = prev.context
      const target = resolveOffer(prev, tierId, ctx)
      if (!target) return prev

      const scopeMarket = ctx.market === BASE_MARKET ? undefined : ctx.market
      const alreadyScoped = target.market === scopeMarket

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
        id: `${target.id}-${scopeMarket ?? 'all'}`,
        market: scopeMarket,
      }
      return { ...prev, ...withdrawn(prev), offers: [...prev.offers, forked] }
    })
  }, [])

  const offerFor = useCallback(
    (tierId: string) => resolveOffer(set, tierId, context),
    [set, context],
  )

  const overriddenKeys = useCallback(
    (tier: Tier) => {
      if (editingBase) return []
      const existing = findOverride(tier, context)
      return existing
        ? Object.entries(existing.patch)
            .filter(([, v]) => v !== undefined)
            .map(([k]) => k)
        : []
    },
    [context, editingBase],
  )

  const updatePipeline = useCallback((fn: (doc: PipelineDoc) => PipelineDoc) => {
    setSet((prev) => ({ ...prev, pipeline: fn(prev.pipeline ?? emptyPipeline()) }))
  }, [])

  const reset = useCallback(() => {
    setSet(defaultSet)
    setSeed(SEED_FINGERPRINT)
  }, [])

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
  const chosen =
    journeysFor(journeys, context).find((j) => j.id === set.journeyId) ??
    journeysFor(journeys, context)[0] ??
    journeys[0]
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
    loadRemote().then((state) => {
      if (cancelled) return
      setRemote(state)
      if (state.kind !== 'published' && state.kind !== 'file') return

      // The file has no sha, so it can be read but not written back through
      // the API — publishing it means committing it.
      setPublishedSha(state.kind === 'published' ? state.sha : null)
      const text = JSON.stringify(state.set)
      setPublishedText(text)

      if (!initial.hadLocal || JSON.stringify(initial.set) === text) {
        setSet(hydrate(state.set))
        setSeed(SEED_FINGERPRINT)
      } else {
        setRemoteDiffers(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [initial])

  /** Take the shared copy, replacing this browser's version. */
  const takeShared = useCallback(() => {
    const state = remote
    if (state?.kind !== 'published' && state?.kind !== 'file') return
    setSet(hydrate(state.set))
    setSeed(SEED_FINGERPRINT)
    setRemoteDiffers(false)
  }, [remote])

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
    staleSeed,
    acceptSeed,
    journey,
    setStepOrder,
    reordered,

    updateSet,
    updateTier,
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
