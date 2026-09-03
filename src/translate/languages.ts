import type { CardSet, MarketConfig } from '../rules/content'

/**
 * The language a market reads in, taken from the locale the market already
 * carries. No second list to keep in step: add a market with `de-AT` and it
 * reads German because its locale says so.
 *
 * That one is the market's official language, and it is the language the
 * journey is translated into without being asked. Any other language a market
 * reads in is a language somebody chose for it, and is offered beside the
 * official one rather than in place of it.
 *
 * English is the source. The screens are written in it, so an English market
 * needs no translation and never asks for one.
 */
export const SOURCE_LANGUAGE = 'en'

const NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ja: 'Japanese',
  pl: 'Polish',
  tr: 'Turkish',
  ar: 'Arabic',
}

export interface Language {
  /** The two-letter code, e.g. `de`. */
  code: string
  /** What to call it on screen. */
  name: string
  /** The full locale the market carries, e.g. `de-DE`. Absent for a language
   *  chosen for a market rather than owned by one. */
  locale?: string
}

export function nameOf(code: string): string {
  return NAMES[code] ?? code.toUpperCase()
}

/** The language a market reads in, from its own locale. */
export function languageOf(market: MarketConfig): Language {
  const code = (market.locale.split('-')[0] || SOURCE_LANGUAGE).toLowerCase()
  return { code, name: nameOf(code), locale: market.locale }
}

/**
 * Every language a market could be translated into.
 *
 * The ones DAZN's own markets read come first, because those are the languages
 * a real screen has to work in; the rest of what the tool can name follows. A
 * market's own language is not offered, because it is never optional.
 */
export function offerableFor(set: CardSet, market: MarketConfig): Language[] {
  const own = languageOf(market).code
  const theirs = [...new Set(set.markets.map((m) => languageOf(m).code))]
  const rest = Object.keys(NAMES).filter((c) => !theirs.includes(c))
  return [...theirs, ...rest]
    .filter((code) => code !== own && code !== SOURCE_LANGUAGE)
    .map((code) => ({ code, name: nameOf(code) }))
}

/** Every language the set's markets read in, English first. */
export function languagesIn(set: CardSet): Language[] {
  const seen = new Map<string, Language>()
  for (const m of set.markets) {
    const l = languageOf(m)
    if (!seen.has(l.code)) seen.set(l.code, l)
  }
  return [...seen.values()].sort((a, b) => (a.code === SOURCE_LANGUAGE ? -1 : b.code === SOURCE_LANGUAGE ? 1 : a.name.localeCompare(b.name)))
}

/** The markets that read in a language. */
export function marketsSpeaking(set: CardSet, code: string): MarketConfig[] {
  return set.markets.filter((m) => languageOf(m).code === code)
}

export function needsTranslation(market: MarketConfig): boolean {
  return languageOf(market).code !== SOURCE_LANGUAGE
}
