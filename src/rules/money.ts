/**
 * Prices are numbers in major units, e.g. 25.99.
 *
 * Currency is NOT authored — it belongs to the market, so a card cannot carry a
 * currency that contradicts the market rendering it. Formatting resolves at
 * render time from the market's locale and currency.
 */
export function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * A price somebody typed, in the market's money.
 *
 * The hero's price is written rather than computed — it is a headline, not a
 * tier — but the rule above still holds: the amount is authored and the
 * currency is not. So a plain number becomes the market's own money, sign and
 * separators and all, and switching the market switches it.
 *
 * Anything that is not a plain number is left exactly as written. Somebody may
 * have typed a sign themselves, or written "9.99 a month", or the page may be
 * carrying a price from before this rule — and rewriting any of those would be
 * changing what they said rather than formatting it.
 */
export function statedMoney(value: string, locale?: string, currency?: string): string {
  const text = value.trim()
  if (!text || !locale || !currency) return text
  if (!/^\d+([.,]\d+)?$/.test(text)) return text
  return formatMoney(Number(text.replace(',', '.')), locale, currency)
}

/** Rounds to whole units — savings copy never shows cents. */
export function formatMoneyWhole(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
