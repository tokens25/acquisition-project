import type { CheckoutLine, CheckoutScreen, PaymentMethod } from './flow'

/**
 * The lines in the summary box, each with an identity.
 *
 * Lines used to be told apart by their label, which was fine while they were
 * fixed and different. Once you can add one, two blank lines are the same
 * label, so they carry an id — minted here for content written before it.
 */
export function linesOf(checkout: CheckoutScreen): CheckoutLine[] {
  return checkout.lines.map((line, i) => (line.id ? line : { ...line, id: `line-${i + 1}` }))
}

/** A new summary line, plain until someone says otherwise. */
export function blankLine(existing: CheckoutLine[]): CheckoutLine {
  return { id: nextId('line', existing), label: '', value: '' }
}

/**
 * The ways to pay the screen offers.
 *
 * Content published before the list carries the three the design drew, as three
 * separate fields. They are read back as the same three options rather than as
 * none: a checkout with nothing to pay by would be a worse answer to an old
 * shape than reading it.
 */
export function methodsOf(checkout: CheckoutScreen): PaymentMethod[] {
  if (checkout.methods) return checkout.methods
  return [
    {
      id: 'method-1',
      label: checkout.cardsLabel ?? 'Credit & Debit Cards',
      marks: 'cards',
      overflow: checkout.cardsOverflow ?? '',
      card: true,
    },
    { id: 'method-2', label: checkout.googlePayLabel ?? 'Google Pay', marks: 'gpay' },
    { id: 'method-3', label: checkout.paypalLabel ?? 'Paypal', marks: 'paypal' },
  ]
}

/** Which option opens chosen — the written one, or the first that exists. */
export function chosenMethod(checkout: CheckoutScreen): string {
  const all = methodsOf(checkout)
  if (checkout.chosen && all.some((m) => m.id === checkout.chosen)) return checkout.chosen
  return all[0]?.id ?? ''
}

/** A new way to pay. A card by default, since that is what gets added. */
export function blankMethod(existing: PaymentMethod[]): PaymentMethod {
  return { id: nextId('method', existing), label: '', marks: 'cards', card: true }
}

function nextId(stem: string, existing: { id?: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}
