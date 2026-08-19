import { useCallback, useEffect, useState } from 'react'
import type { AuthoredCard, CardPatch, CardSet, Context } from '../rules/content'
import { defaultSet } from '../rules/defaults'
import { findOverride } from '../rules/resolve'

const STORAGE_KEY = 'acquisition-card-set-v2'

/** Market value meaning "the base card, before any market difference". */
export const BASE_MARKET = '*'

export const isBaseContext = (c: Context) => c.market === BASE_MARKET && !c.campaign

function hydrate(raw: unknown): CardSet {
  if (typeof raw !== 'object' || raw === null) return defaultSet
  const input = raw as Partial<CardSet>
  if (!Array.isArray(input.cards) || input.cards.length === 0) return defaultSet
  return {
    markets: input.markets ?? defaultSet.markets,
    campaigns: input.campaigns ?? defaultSet.campaigns,
    context: input.context ?? defaultSet.context,
    device: input.device ?? defaultSet.device,
    cards: input.cards.map((c, i) => ({
      ...defaultSet.cards[i % defaultSet.cards.length],
      ...c,
      overrides: c.overrides ?? [],
    })),
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

/** The selector an edit in this context should be written to. */
function selectorFor(context: Context): Partial<Context> {
  const when: Partial<Context> = {}
  if (context.market !== BASE_MARKET) when.market = context.market
  if (context.campaign) when.campaign = context.campaign
  return when
}

export interface CardSetStore {
  set: CardSet
  /** Where edits currently land. */
  context: Context
  editingBase: boolean
  setContext: (context: Context) => void
  updateSet: (patch: Partial<CardSet>) => void
  /** Writes to the base card, or to this context's override. */
  updateCard: (id: string, patch: CardPatch) => void
  /** Fields this context differs from the base on. */
  overriddenKeys: (card: AuthoredCard) => string[]
  clearOverride: (id: string) => void
  reset: () => void
  exportJson: () => void
  importJson: (file: File) => Promise<void>
  importError: string | null
}

export function useCardSet(): CardSetStore {
  const [set, setSet] = useState<CardSet>(read)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(set))
    } catch {
      // Private mode or full quota — the page still works, it just won't persist.
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

  const updateCard = useCallback((id: string, patch: CardPatch) => {
    setSet((prev) => {
      const ctx = prev.context
      if (isBaseContext(ctx)) {
        return {
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === id
              ? { ...c, ...patch, addOn: patch.addOn ? { ...c.addOn, ...patch.addOn } : c.addOn }
              : c,
          ),
        }
      }

      const when = selectorFor(ctx)
      return {
        ...prev,
        cards: prev.cards.map((c) => {
          if (c.id !== id) return c
          const existing = findOverride(c, ctx)
          if (existing) {
            return {
              ...c,
              overrides: c.overrides.map((o) =>
                o.id === existing.id
                  ? {
                      ...o,
                      patch: {
                        ...o.patch,
                        ...patch,
                        addOn: patch.addOn ? { ...o.patch.addOn, ...patch.addOn } : o.patch.addOn,
                      },
                    }
                  : o,
              ),
            }
          }
          const id2 = `${c.id}-${when.market ?? 'all'}${when.campaign ? `-${when.campaign}` : ''}`
          return { ...c, overrides: [...c.overrides, { id: id2, when, patch }] }
        }),
      }
    })
  }, [])

  const overriddenKeys = useCallback(
    (card: AuthoredCard) => {
      if (editingBase) return []
      const existing = findOverride(card, context)
      // Merging can leave a key present but undefined; those are not overrides.
      return existing
        ? Object.entries(existing.patch)
            .filter(([, v]) => v !== undefined)
            .map(([k]) => k)
        : []
    },
    [context, editingBase],
  )

  const clearOverride = useCallback((id: string) => {
    setSet((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => {
        if (c.id !== id) return c
        const existing = findOverride(c, prev.context)
        return existing ? { ...c, overrides: c.overrides.filter((o) => o.id !== existing.id) } : c
      }),
    }))
  }, [])

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

  const importJson = useCallback(async (file: File) => {
    try {
      setSet(hydrate(JSON.parse(await file.text())))
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
    updateCard,
    overriddenKeys,
    clearOverride,
    reset,
    exportJson,
    importJson,
    importError,
  }
}
