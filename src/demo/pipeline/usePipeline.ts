import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CardSetStore } from '../../editor/useCardSet'
import type { Mode, PipelineDoc, Section, SectionStatus } from '../../rules/pipeline'
import {
  emptyPipeline,
  markCompleted,
  markReady,
  recordEdits,
  removeReady,
  reopen,
  sectionsFor,
  statusOf,
  valuesOf,
} from '../../rules/pipeline'

/** The mode is per person, not per document, so it lives beside the set. */
const MODE_KEY = 'acquisition-pipeline-mode'

function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'dev' ? 'dev' : 'market'
  } catch {
    return 'market'
  }
}

const EMPTY = emptyPipeline()

export interface Pipeline {
  mode: Mode
  setMode: (mode: Mode) => void
  doc: PipelineDoc
  sections: Section[]
  section: (id: string) => Section | undefined
  status: (id: string) => SectionStatus
  /** Which chip's dropdown is open. One at a time, across the whole page. */
  pop: string | null
  setPop: (id: string | null) => void
  markReady: (id: string) => void
  markCompleted: (id: string) => void
  reopen: (id: string) => void
  removeReady: (id: string) => void
}

/**
 * The pipeline over a card set.
 *
 * Edits are noticed rather than reported: every field already writes to the
 * set, so instead of wiring every onChange, the hook diffs each ready
 * section's strings against what they were a render ago and records what
 * changed. The chip goes orange on the same render as the keystroke.
 */
export function usePipeline(store: CardSetStore, labels: Record<string, string>): Pipeline {
  const [mode, setModeState] = useState<Mode>(readMode)
  const [pop, setPop] = useState<string | null>(null)

  const setMode = useCallback((next: Mode) => {
    setModeState(next)
    setPop(null)
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch {
      // Private mode — the toggle still works, it just starts on Market next time.
    }
  }, [])

  const doc = store.set.pipeline ?? EMPTY
  const { set, updatePipeline } = store

  const sections = useMemo(() => sectionsFor(set, labels), [set, labels])
  const byId = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections])

  const previous = useRef<Record<string, Record<string, string>> | null>(null)
  useEffect(() => {
    const current = Object.fromEntries(sections.map((s) => [s.id, valuesOf(s)]))
    const before = previous.current
    previous.current = current
    if (!before) return
    const touched = sections.filter((s) => {
      const was = before[s.id]
      if (!was) return false
      const is = current[s.id]
      const keys = new Set([...Object.keys(was), ...Object.keys(is)])
      for (const k of keys) if ((was[k] ?? '') !== (is[k] ?? '')) return true
      return false
    })
    if (touched.length === 0) return
    updatePipeline((p) =>
      touched.reduce((acc, s) => (acc.ready[s.id] ? recordEdits(acc, s, before[s.id]) : acc), p),
    )
  }, [sections, updatePipeline])

  /** A transition on one section; `closes` shuts the dropdown it was chosen from. */
  const act = useCallback(
    (fn: (doc: PipelineDoc, section: Section) => PipelineDoc, closes = false) =>
      (id: string) => {
        const section = byId.get(id)
        if (!section) return
        if (closes) setPop(null)
        updatePipeline((p) => fn(p, section))
      },
    [byId, updatePipeline],
  )

  return {
    mode,
    setMode,
    doc,
    sections,
    section: (id) => byId.get(id),
    status: (id) => {
      const s = byId.get(id)
      return s ? statusOf(doc, s) : 'draft'
    },
    pop,
    setPop,
    markReady: act(markReady),
    markCompleted: act(markCompleted, true),
    reopen: act((d, s) => reopen(d, s.id)),
    removeReady: act((d, s) => removeReady(d, s.id), true),
  }
}
