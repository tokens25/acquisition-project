/**
 * Prices are numbers, not strings.
 *
 * The rules doc requires two derivations that a formatted string can't support:
 * the savings amount is a computed delta, and the price explainer repeats
 * standardPrice. Authoring "€25.99" makes both impossible, and makes
 * per-market formatting impossible too.
 */
export interface Money {
  /** Major units, e.g. 25.99. */
  amount: number
  /** ISO 4217, e.g. "EUR". */
  currency: string
}

export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
  }).format(money.amount)
}

/** Rounds to whole units — savings copy never shows cents. */
export function formatMoneyWhole(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount)
}
