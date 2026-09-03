import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CardSet, Context } from '../rules/content'
import { everyString, keepAsIs } from './fields'
import { languageOf, SOURCE_LANGUAGE } from './languages'
import { currentAt, type Translated, type Translations } from './apply'

/**
 * The journey's words in a market's language.
 *
 * Kept per market in this browser, never in the content: a machine
 * translation is a draft, and the store is where published copy lives. A
 * person promotes a string once they have read it, and that promotion goes
 * through the panel's own methods like any other edit.
 *
 * Switching to a market that reads another language fetches its translation
 * once. Coming back to it is instant, and English needs nothing.
 */
// v2: keyed by language rather than by market, now that a language can be
// chosen on its own. Two markets reading German share one translation.
const KEY = 'acquisition-translations-v2'

type Store = Record<string, Translations>

/**
 * Which languages have been asked for, outside the component.
 *
 * A ref is per mount, and React's development mode mounts twice on purpose.
 * That meant the first switch to a language sent the whole journey to the
 * translator twice over, two long runs racing each other for the same answer,
 * which is most of why the first switch felt broken. Module scope is the right
 * scope for "this page has already asked".
 */
const askedFor = new Set<string>()

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

export type TranslationState = 'off' | 'idle' | 'working' | 'ready' | 'unavailable' | 'failed'

export interface TranslationStore {
  /** The language on screen. */
  language: { code: string; name: string }
  /** The language this market reads in, whatever is on screen. */
  marketLanguage: { code: string; name: string }
  /** Whether the two agree, which is when a translation may be kept. */
  matchesMarket: boolean
  state: TranslationState
  /** Why, when the state is unavailable or failed. */
  note: string | null
  /** What is on screen for this market. Empty for an English market. */
  entries: Translations
  /** How many strings are machine, and how many a person has accepted. */
  counts: { machine: number; reviewed: number; stale: number }
  /** Ask for the translation again, from scratch. */
  retranslate: () => void
  /** Accept one string, so it can be published. */
  accept: (key: string) => void
  /** Drop one string's translation and show the English again. */
  discard: (key: string) => void
}

export function useTranslations(set: CardSet, context: Context, chosen?: string): TranslationStore {
  const market = useMemo(() => set.markets.find((m) => m.code === context.market) ?? set.markets[0], [set.markets, context.market])
  const marketLanguage = languageOf(market)
  /** What is on screen: the chosen language, or the market's own. */
  const language = useMemo(() => {
    if (!chosen || chosen === marketLanguage.code) return marketLanguage
    const other = set.markets.map(languageOf).find((l) => l.code === chosen)
    return other ?? marketLanguage
  }, [chosen, marketLanguage, set.markets])
  const wanted = language.code !== SOURCE_LANGUAGE

  const [store, setStore] = useState<Store>(read)
  const [runState, setState] = useState<TranslationState>('idle')
  /** English needs nothing, so the language decides that rather than a run. */
  const state: TranslationState = !wanted ? 'off' : runState
  const [note, setNote] = useState<string | null>(null)

  const entries = useMemo(() => (wanted ? (store[language.code] ?? {}) : {}), [wanted, store, language.code])

  const save = useCallback((code: string, next: Translations) => {
    setStore((prev) => {
      const merged = { ...prev, [code]: next }
      try {
        localStorage.setItem(KEY, JSON.stringify(merged))
      } catch {
        // A full or blocked store is not a reason to lose the screen.
      }
      return merged
    })
  }, [])

  const translate = useCallback(
    async (lang: { code: string; name: string }, force: boolean) => {
      if (lang.code === SOURCE_LANGUAGE) return
      const have = force ? {} : (read()[lang.code] ?? {})
      const strings = everyString(set).filter((s) => {
        const mine = have[s.key]
        // Already translated from this exact English, so leave it alone.
        return !(mine && mine.from === s.text)
      })
      if (strings.length === 0) {
        setState('ready')
        return
      }

      setState('working')
      setNote(null)
      try {
        const probe = await fetch('/api/translate', { headers: { accept: 'application/json' } })
        const status = (await probe.json()) as { configured?: boolean; reason?: string }
        if (!probe.ok || !status.configured) {
          setState('unavailable')
          setNote(status.reason ?? 'No key is set.')
          return
        }
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ language: lang.name, market: market.label, keep: keepAsIs(set), strings }),
        })
        const body = (await res.json()) as { strings?: { key: string; text: string }[]; error?: string; note?: string | null }
        if (!res.ok || body.error) {
          setState('failed')
          setNote(body.error ?? `The translator returned ${res.status}.`)
          return
        }
        const next: Translations = { ...have }
        const byKey = new Map(strings.map((s) => [s.key, s.text]))
        for (const row of body.strings ?? []) {
          const from = byKey.get(row?.key)
          if (!from || typeof row.text !== 'string' || !row.text.trim()) continue
          next[row.key] = { text: row.text.trim(), state: 'machine', from }
        }
        save(lang.code, next)
        // Some words back and a reason for the rest is a state a person can
        // act on. Silently showing English is not.
        if (body.note) setNote(body.note)
        setState('ready')
      } catch (error) {
        setState('failed')
        setNote(error instanceof Error ? error.message : String(error))
      }
    },
    [set, save, market.label],
  )

  // Choosing a language, or a market that reads one, fetches it once.
  useEffect(() => {
    if (!wanted || askedFor.has(language.code)) return
    askedFor.add(language.code)
    void translate(language, false)
  }, [wanted, language, translate])

  const counts = useMemo(() => {
    let machine = 0
    let reviewed = 0
    let stale = 0
    for (const [key, t] of Object.entries(entries)) {
      const now = currentAt(set, key)
      if (now !== undefined && now !== t.from) stale += 1
      else if (t.state === 'reviewed') reviewed += 1
      else machine += 1
    }
    return { machine, reviewed, stale }
  }, [entries, set])

  return {
    language: { code: language.code, name: language.name },
    marketLanguage: { code: marketLanguage.code, name: marketLanguage.name },
    matchesMarket: language.code === marketLanguage.code,
    state,
    note,
    entries,
    counts,
    retranslate: () => {
      askedFor.delete(language.code)
      void translate(language, true)
    },
    accept: (key: string) => {
      const mine = entries[key]
      if (!mine) return
      save(language.code, { ...entries, [key]: { ...mine, state: 'reviewed' } as Translated })
    },
    discard: (key: string) => {
      const next = { ...entries }
      delete next[key]
      save(language.code, next)
    },
  }
}
