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

/** Rounds to whole units — savings copy never shows cents. */
export function formatMoneyWhole(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
