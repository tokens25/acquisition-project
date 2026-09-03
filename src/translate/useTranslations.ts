import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CardSet, Context, MarketConfig } from '../rules/content'
import { everyString, keepAsIs } from './fields'
import { languageOf, nameOf, offerableFor, SOURCE_LANGUAGE, type Language } from './languages'
import { judgeTranslation } from './judge'
import { currentAt, type Translated, type Translations } from './apply'

/**
 * The journey's words in the languages a market reads.
 *
 * Kept per market in this browser, never in the content: a machine translation
 * is a draft, and the store is where published copy lives. A person promotes a
 * string once they have read it, and that promotion goes through the panel's
 * own methods like any other edit.
 *
 * A market has one official language, taken from its locale, and the journey is
 * translated into it without being asked. Beyond that a market may be given as
 * many languages as someone needs to check, and they belong to that market
 * alone: a market owns its screens, so the same language in two markets is two
 * different translations of two different sets of words.
 */
// v3: per market, then per language. v2 was per language alone, which was only
// right while every market shared one copy of the flow.
const KEY = 'acquisition-translations-v3'

type Store = Record<string, Record<string, Translations>>

/**
 * Which market-and-language pairs have been asked for, outside the component.
 *
 * A ref is per mount, and React's development mode mounts twice on purpose.
 * That meant the first switch to a language sent the whole journey to the
 * translator twice over, two long runs racing each other for the same answer.
 * Module scope is the right scope for "this page has already asked".
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
  /** The market these languages belong to. */
  market: MarketConfig
  /** The language it reads in officially, which is never optional. */
  official: Language
  /** Every language this market has, official first. */
  languages: Language[]
  /** Languages this market could be given, which it does not have yet. */
  offerable: Language[]
  /** The language on screen. */
  current: Language
  /** Read the journey in one of this market's languages. */
  show: (code: string) => void
  state: TranslationState
  /** Why, when the state is unavailable or failed, or what was left behind. */
  note: string | null
  /** Which language is being worked on, and how many are still to come. */
  progress: { language: string; left: number } | null
  /** What is on screen for this market and language. */
  entries: Translations
  /** How many strings are machine, accepted, out of date, or held back. */
  counts: { machine: number; reviewed: number; stale: number; held: number }
  /** Translate this market's journey into these languages. */
  translate: (codes: string[]) => void
  /** Ask for the language on screen again, from scratch. */
  retranslate: () => void
  /** Accept one string, so it can be published. */
  accept: (key: string) => void
  /** Drop one string's translation and show the English again. */
  discard: (key: string) => void
  /** Take a language away from this market, with its words. */
  remove: (code: string) => void
}

export function useTranslations(set: CardSet, context: Context): TranslationStore {
  const market = useMemo(
    () => set.markets.find((m) => m.code === context.market) ?? set.markets[0],
    [set.markets, context.market],
  )
  const official = useMemo(() => languageOf(market), [market])

  const [store, setStore] = useState<Store>(read)
  const [runState, setState] = useState<TranslationState>('idle')
  const [note, setNote] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ language: string; left: number } | null>(null)
  /** Which of this market's languages is on screen, when it is not the official one. */
  const [shown, setShown] = useState<Record<string, string>>({})

  const mine = useMemo(() => store[market.code] ?? {}, [store, market.code])

  /** Official first, then whatever this market has been given, in order. */
  const languages = useMemo<Language[]>(() => {
    const extra = Object.keys(mine)
      .filter((code) => code !== official.code)
      .map((code) => ({ code, name: nameOf(code) }))
    return official.code === SOURCE_LANGUAGE ? [official, ...extra] : [official, ...extra]
  }, [mine, official])

  const offerable = useMemo(
    () => offerableFor(set, market).filter((l) => !(l.code in mine)),
    [set, market, mine],
  )

  const current = useMemo(
    () => languages.find((l) => l.code === shown[market.code]) ?? official,
    [languages, shown, market.code, official],
  )
  const wanted = current.code !== SOURCE_LANGUAGE
  const state: TranslationState = !wanted ? 'off' : runState

  const entries = useMemo(() => (wanted ? (mine[current.code] ?? {}) : {}), [wanted, mine, current.code])

  const save = useCallback((marketCode: string, code: string, next: Translations) => {
    setStore((prev) => {
      const merged = { ...prev, [marketCode]: { ...(prev[marketCode] ?? {}), [code]: next } }
      try {
        localStorage.setItem(KEY, JSON.stringify(merged))
      } catch {
        // A full or blocked store is not a reason to lose the screen.
      }
      return merged
    })
  }, [])

  /**
   * One language, start to finish: ask, judge what comes back, keep what
   * passes.
   *
   * The judging is the point. Every other line this tool writes goes through
   * the Coach, and a translation is a line this tool wrote, so a string that
   * changes a number or drops a brand keeps its English and is counted as held
   * back rather than going on screen unread.
   */
  const runOne = useCallback(
    async (lang: Language, force: boolean): Promise<{ ok: boolean; note: string | null }> => {
      if (lang.code === SOURCE_LANGUAGE) return { ok: true, note: null }
      const have = force ? {} : (read()[market.code]?.[lang.code] ?? {})
      const strings = everyString(set).filter((s) => {
        const already = have[s.key]
        // Already translated from this exact English, so leave it alone.
        return !(already && already.from === s.text)
      })
      if (strings.length === 0) return { ok: true, note: null }

      try {
        const probe = await fetch('/api/translate', { headers: { accept: 'application/json' } })
        const status = (await probe.json()) as { configured?: boolean; reason?: string }
        if (!probe.ok || !status.configured) {
          setState('unavailable')
          return { ok: false, note: status.reason ?? 'No key is set.' }
        }
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ language: lang.name, market: market.label, keep: keepAsIs(set), strings }),
        })
        const body = (await res.json()) as { strings?: { key: string; text: string }[]; error?: string; note?: string | null }
        if (!res.ok || body.error) {
          setState('failed')
          return { ok: false, note: body.error ?? `The translator returned ${res.status}.` }
        }
        const next: Translations = { ...have }
        const byKey = new Map(strings.map((s) => [s.key, s.text]))
        const held: string[] = []
        for (const row of body.strings ?? []) {
          const from = byKey.get(row?.key)
          if (!from || typeof row.text !== 'string') continue
          const verdict = judgeTranslation(set, from, row.text)
          if (!verdict.ok) {
            held.push(`${row.key} ${verdict.reason}`)
            continue
          }
          next[row.key] = { text: row.text.trim(), state: 'machine', from }
        }
        save(market.code, lang.code, next)
        const heldNote = held.length > 0 ? `${held.length} ${held.length === 1 ? 'line was' : 'lines were'} held back and left in English. ${held[0]}.` : null
        return { ok: true, note: body.note ?? heldNote }
      } catch (error) {
        setState('failed')
        return { ok: false, note: error instanceof Error ? error.message : String(error) }
      }
    },
    [set, save, market.code, market.label],
  )

  /** Several languages, one after another, so the first is readable soonest. */
  const runMany = useCallback(
    async (codes: string[], force: boolean) => {
      const todo = codes.filter((c) => c !== SOURCE_LANGUAGE)
      if (todo.length === 0) return
      setState('working')
      setNote(null)
      const notes: string[] = []
      for (const [i, code] of todo.entries()) {
        const lang = { code, name: nameOf(code) }
        setProgress({ language: lang.name, left: todo.length - i - 1 })
        const result = await runOne(lang, force)
        if (result.note) notes.push(`${lang.name}: ${result.note}`)
        if (!result.ok) {
          setProgress(null)
          setNote(notes.join(' '))
          return
        }
      }
      setProgress(null)
      setNote(notes.length > 0 ? notes.join(' ') : null)
      setState('ready')
    },
    [runOne],
  )

  // A market's official language is translated without being asked, once.
  useEffect(() => {
    if (official.code === SOURCE_LANGUAGE) return
    const stamp = `${market.code}|${official.code}`
    if (askedFor.has(stamp)) return
    askedFor.add(stamp)
    void runMany([official.code], false)
  }, [market.code, official.code, runMany])

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
    // Held back: on screen in English because the gate rejected the
    // translation, or because the translator never answered for it.
    const held = wanted ? Math.max(0, everyString(set).length - Object.keys(entries).length) : 0
    return { machine, reviewed, stale, held }
  }, [entries, set, wanted])

  return {
    market,
    official,
    languages,
    offerable,
    current,
    show: (code: string) => setShown((prev) => ({ ...prev, [market.code]: code })),
    state,
    note,
    progress,
    entries,
    counts,
    translate: (codes: string[]) => {
      // A language a market has been given exists from the moment it is
      // chosen, so the switch can offer it while it is still being written.
      setStore((prev) => {
        const forMarket = { ...(prev[market.code] ?? {}) }
        for (const code of codes) if (!(code in forMarket)) forMarket[code] = {}
        return { ...prev, [market.code]: forMarket }
      })
      for (const code of codes) askedFor.add(`${market.code}|${code}`)
      void runMany(codes, false)
    },
    retranslate: () => {
      askedFor.delete(`${market.code}|${current.code}`)
      void runMany([current.code], true)
    },
    accept: (key: string) => {
      const already = entries[key]
      if (!already) return
      save(market.code, current.code, { ...entries, [key]: { ...already, state: 'reviewed' } as Translated })
    },
    discard: (key: string) => {
      const next = { ...entries }
      delete next[key]
      save(market.code, current.code, next)
    },
    remove: (code: string) => {
      setStore((prev) => {
        const forMarket = { ...(prev[market.code] ?? {}) }
        delete forMarket[code]
        const merged = { ...prev, [market.code]: forMarket }
        try {
          localStorage.setItem(KEY, JSON.stringify(merged))
        } catch {
          // Nothing to do about a blocked store.
        }
        return merged
      })
      askedFor.delete(`${market.code}|${code}`)
      setShown((prev) => ({ ...prev, [market.code]: official.code }))
    },
  }
}
