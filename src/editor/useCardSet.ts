import { useCallback, useEffect, useState } from 'react'
import type { AuthoredCard, CardSet } from '../rules/content'
import { defaultSet } from '../rules/defaults'

const STORAGE_KEY = 'acquisition-card-set'

function hydrate(raw: unknown): CardSet {
  if (typeof raw !== 'object' || raw === null) return defaultSet
  const input = raw as Partial<CardSet>
  if (!Array.isArray(input.cards) || input.cards.length === 0) return defaultSet
  return {
    locale: input.locale ?? defaultSet.locale,
    device: input.device ?? defaultSet.device,
    // Merge each card over a default so content saved before a field existed
    // still loads.
    cards: input.cards.map((c, i) => ({ ...defaultSet.cards[i % defaultSet.cards.length], ...c })),
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

export interface CardSetStore {
  set: CardSet
  updateSet: (patch: Partial<CardSet>) => void
  updateCard: (id: string, patch: Partial<AuthoredCard>) => void
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

  const updateSet = useCallback((patch: Partial<CardSet>) => {
    setSet((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateCard = useCallback((id: string, patch: Partial<AuthoredCard>) => {
    setSet((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
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

  return { set, updateSet, updateCard, reset, exportJson, importJson, importError }
}
