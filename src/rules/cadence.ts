import type { CadenceOption, CadenceScreen } from './flow'

/**
 * What paying for a year saves against paying by the month.
 *
 * Worked out rather than written. A saving is not a fact about one card — it
 * is the difference between two of them — so authoring it invites the two to
 * disagree the moment either price is edited. Where the pair is not there to
 * compare, there is no saving and nothing is drawn.
 */

/** Units that mean a year, and a month, whatever they were typed as. */
const YEARLY = /^(year|yr|annual|annually|12 months)$/i
const MONTHLY = /^(month|mo|monthly)$/i

/**
 * The money in an authored price, with the symbol it was written with.
 *
 * Prices are strings because that is what a person types, and they are typed
 * differently market to market: "$279.99", "279,99 €", "¥29800". This reads
 * the number out and keeps the rest as written, so what is drawn beside a
 * saving is the same symbol the price beside it uses.
 *
 * Returns nothing when there is no number to find, which is a price still
 * being typed — and a saving computed from half a price would be worse than
 * no saving at all.
 */
export function readPrice(text: string): { amount: number; symbol: string } | null {
  const digits = text.match(/[\d.,]+/)
  if (!digits) return null

  let body = digits[0]
  const lastDot = body.lastIndexOf('.')
  const lastComma = body.lastIndexOf(',')
  const decimal = Math.max(lastDot, lastComma)
  // Whichever separator comes last is the decimal one, when it is followed by
  // one or two figures. Anything else is grouping and comes out.
  if (decimal >= 0 && body.length - decimal - 1 <= 2 && body.length - decimal - 1 > 0) {
    body = body.slice(0, decimal).replace(/[.,]/g, '') + '.' + body.slice(decimal + 1)
  } else {
    body = body.replace(/[.,]/g, '')
  }

  const amount = Number(body)
  if (!Number.isFinite(amount)) return null

  // The symbol is whatever was typed around the number, less the spaces.
  const symbol = (text.slice(0, digits.index ?? 0) + text.slice((digits.index ?? 0) + digits[0].length))
    .replace(/\s+/g, '')
  return { amount, symbol }
}

/** Money written back with the symbol it came with, on whichever side it sat. */
function money(amount: number, symbol: string, leading: boolean): string {
  const figure = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
  if (!symbol) return figure
  return leading ? `${symbol}${figure}` : `${figure} ${symbol}`
}

/**
 * The saving line for each option, by id. Absent where there is nothing to say.
 *
 * Only the yearly card carries one, and only when a monthly card is beside it
 * to be saved against — which is the comparison a person actually makes.
 */
export function cadenceSavings(screen: CadenceScreen): Record<string, string> {
  const yearly = screen.options.find((o) => YEARLY.test(o.unit.trim()))
  const monthly = screen.options.find((o) => MONTHLY.test(o.unit.trim()))
  if (!yearly || !monthly) return {}

  const year = readPrice(yearly.price)
  const month = readPrice(monthly.price)
  if (!year || !month) return {}

  const overAYear = month.amount * 12
  const saved = overAYear - year.amount
  // Paying yearly costing more is a thing a person can type. It is not a
  // saving, so nothing is drawn rather than a negative one.
  if (saved <= 0) return {}

  const leading = yearly.price.trimStart().startsWith(year.symbol) && year.symbol !== ''
  const label =
    screen.savingAs === 'percent'
      ? `Save ${Math.round((saved / overAYear) * 100)}% /year`
      : `Save ${money(Math.round(saved * 100) / 100, year.symbol, leading)} /year`

  return { [yearly.id]: label }
}

/** A new card, ready to be written into. */
export function blankCadenceOption(existing: CadenceOption[]): CadenceOption {
  let n = existing.length + 1
  while (existing.some((o) => o.id === `option-${n}`)) n += 1
  return { id: `option-${n}`, title: '', note: '', price: '', unit: '', badge: '' }
}
