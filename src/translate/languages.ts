import type { CardSet, MarketConfig } from '../rules/content'

/**
 * The language a market reads in, taken from the locale the market already
 * carries. No second list to keep in step: add a market with `de-AT` and it
 * reads German because its locale says so.
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
}

export interface Language {
  /** The two-letter code, e.g. `de`. */
  code: string
  /** What to call it on screen. */
  name: string
  /** The full locale the market carries, e.g. `de-DE`. */
  locale: string
}

export function languageOf(market: MarketConfig): Language {
  const code = (market.locale.split('-')[0] || SOURCE_LANGUAGE).toLowerCase()
  return { code, name: NAMES[code] ?? code.toUpperCase(), locale: market.locale }
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
