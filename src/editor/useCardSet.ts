import { useCallback, useEffect, useState } from 'react'
import type { CadenceOffer, CardSet, Context, Tier, TierPatch } from '../rules/content'
import { DIRECT } from '../rules/content'
import { defaultSet } from '../rules/defaults'
import { adaptEngineContent, isEngineContent } from '../rules/adapt'
import { findOverride, resolveOffer } from '../rules/resolve'

const STORAGE_KEY = 'acquisition-card-set-v3'

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
  }
}

function read(): CardSet {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? hydrate(JSON.parse(stored)) : defaultSet
  } catch {
    return defaultSet
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
  importError: string | null
  /** Assumptions the adapter had to make, surfaced rather than swallowed. */
  importNotes: string[]
}

export function useCardSet(): CardSetStore {
  const [set, setSet] = useState<CardSet>(read)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotes, setImportNotes] = useState<string[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(set))
    } catch {
      // Private mode or a full quota — the page still works, it just won't persist.
    }
  }, [set])

  const context = set.context
  const editingBase = isBaseContext(context)

  const setContext = useCallback((next: Context) => {
    setSet((prev) => ({ ...prev, context: next }))
  }, [])

  const updateSet = useCallback((patch: Partial<CardSet>) => {
    setSet((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateTier = useCallback((id: string, patch: TierPatch) => {
    setSet((prev) => {
      const ctx = prev.context
      if (isBaseContext(ctx)) {
        return { ...prev, tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
      }
      const when = selectorFor(ctx)
      return {
        ...prev,
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
          offers: prev.offers.map((o) => (o.id === target.id ? { ...o, ...patch } : o)),
        }
      }
      const forked: CadenceOffer = {
        ...target,
        ...patch,
        id: `${target.id}-${scopeMarket ?? 'all'}`,
        market: scopeMarket,
      }
      return { ...prev, offers: [...prev.offers, forked] }
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

  const reset = useCallback(() => setSet(defaultSet), [])

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
  const importJson = useCallback(async (file: File) => {
    try {
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

  return {
    set,
    context,
    editingBase,
    setContext,
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
  }
}

export { DIRECT }
