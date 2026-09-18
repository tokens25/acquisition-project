/**
 * Prices are numbers in major units, e.g. 25.99.
 *
 * Currency is not authored on a card — it belongs to the market, so a card
 * cannot carry a currency that contradicts the market rendering it. Which
 * currency a market sells in is a decision, and one the tool can change; what
 * it cannot do is let one plan disagree with the country it is sold in.
 * Formatting resolves at render time from the market's locale and currency.
 */
export function formatMoney(amount: number, locale: string, currency: string): string {
  // As many decimals as the currency has — two for most, none for yen — and
  // always that many, so a round price still reads "25,00 €" beside "25,99 €".
  // Forcing two on every currency wrote "￥980.00", which no Japanese price does.
  const digits = fractionDigits(locale, currency)
  return format(amount, locale, currency, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fractionDigits(locale: string, currency: string): number {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions().minimumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/** Rounds to whole units — savings copy never shows cents. */
export function formatMoneyWhole(amount: number, locale: string, currency: string): string {
  return format(amount, locale, currency, { maximumFractionDigits: 0 })
}

/**
 * `Intl` throws on a code it does not recognise, and content arrives from a
 * spreadsheet and from other people's exports. A typo in one cell should read
 * as a wrong price, not take the whole preview down with it.
 */
function format(
  amount: number,
  locale: string,
  currency: string,
  digits: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, ...digits }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(digits.maximumFractionDigits === 0 ? 0 : 2)}`
  }
}

/**
 * The currencies a market can be sold in.
 *
 * A list rather than a typed code: `Intl` accepts only real ISO 4217 codes and
 * throws on the rest, and a field that can be typed into is a field somebody
 * types `EURO` into. Every currency DAZN's markets use is here, plus the ones
 * a new market would plausibly arrive with.
 */
export const CURRENCIES: readonly { code: string; name: string }[] = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US dollar' },
  { code: 'GBP', name: 'Pound sterling' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'CHF', name: 'Swiss franc' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'NZD', name: 'New Zealand dollar' },
  { code: 'MXN', name: 'Mexican peso' },
  { code: 'BRL', name: 'Brazilian real' },
  { code: 'PLN', name: 'Polish złoty' },
  { code: 'TWD', name: 'New Taiwan dollar' },
  { code: 'SEK', name: 'Swedish krona' },
  { code: 'NOK', name: 'Norwegian krone' },
  { code: 'DKK', name: 'Danish krone' },
  { code: 'CZK', name: 'Czech koruna' },
  { code: 'HUF', name: 'Hungarian forint' },
  { code: 'RON', name: 'Romanian leu' },
  { code: 'TRY', name: 'Turkish lira' },
  { code: 'ZAR', name: 'South African rand' },
  { code: 'INR', name: 'Indian rupee' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'HKD', name: 'Hong Kong dollar' },
  { code: 'KRW', name: 'South Korean won' },
  { code: 'AED', name: 'UAE dirham' },
  { code: 'SAR', name: 'Saudi riyal' },
  { code: 'ILS', name: 'Israeli shekel' },
]

/** The sign a locale draws for a currency — "€", "$", "CHF". */
export function currencySign(locale: string, currency: string): string {
  try {
    return (
      new Intl.NumberFormat(locale, { style: 'currency', currency })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    )
  } catch {
    return currency
  }
}
