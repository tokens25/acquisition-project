import { useCallback, useEffect, useState } from 'react'
import { type CardContent, defaultContent } from './content'

const STORAGE_KEY = 'acquisition-card-content'

/**
 * Merges a parsed file over the defaults so that content saved by an older
 * version of the editor still loads when new fields are added.
 */
function hydrate(raw: unknown): CardContent {
  if (typeof raw !== 'object' || raw === null) return defaultContent
  const input = raw as Partial<CardContent>
  return {
    ...defaultContent,
    ...input,
    pricing: { ...defaultContent.pricing, ...input.pricing },
    logos: { ...defaultContent.logos, ...input.logos },
    addOn: { ...defaultContent.addOn, ...input.addOn },
    features: input.features ?? defaultContent.features,
  }
}

function read(): CardContent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? hydrate(JSON.parse(stored)) : defaultContent
  } catch {
    // Corrupt or unreadable storage shouldn't stop the page rendering.
    return defaultContent
  }
}

export interface CardContentStore {
  content: CardContent
  /** Applies a partial patch to the top level of the content. */
  update: (patch: Partial<CardContent>) => void
  /** Patches one nested section (pricing / logos / addOn). */
  updateSection: <K extends 'pricing' | 'logos' | 'addOn'>(
    section: K,
    patch: Partial<CardContent[K]>,
  ) => void
  reset: () => void
  exportJson: () => void
  importJson: (file: File) => Promise<void>
  /** Set after a failed import, cleared on the next successful one. */
  importError: string | null
}

/** Card content held in React state and mirrored to localStorage on every change. */
export function useCardContent(): CardContentStore {
  const [content, setContent] = useState<CardContent>(read)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
    } catch {
      // Private mode or a full quota — the page still works, it just won't persist.
    }
  }, [content])

  const update = useCallback((patch: Partial<CardContent>) => {
    setContent((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateSection = useCallback(
    <K extends 'pricing' | 'logos' | 'addOn'>(section: K, patch: Partial<CardContent[K]>) => {
      setContent((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
    },
    [],
  )

  const reset = useCallback(() => setContent(defaultContent), [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'acquisition-card.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  const importJson = useCallback(async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      setContent(hydrate(parsed))
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that file')
    }
  }, [])

  return { content, update, updateSection, reset, exportJson, importJson, importError }
}
