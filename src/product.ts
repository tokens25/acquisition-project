/**
 * Which of the two things is being made.
 *
 * The front door asks it first because it changes what the rest of the
 * questions are: a landing page is not entered from anywhere, so the entry
 * point stops being a question, and it opens on its own page rather than on
 * the whole flow.
 *
 * One module rather than a string repeated at each end, so the front door, the
 * wait and the routes cannot disagree about what a product is called or where
 * it opens.
 */
export type Product = 'flow' | 'landing'

export const PRODUCTS: { value: Product; label: string }[] = [
  { value: 'landing', label: 'Landing page' },
  { value: 'flow', label: 'Acquisition flow' },
]

/**
 * What the brand strip says, on the page this product opens.
 *
 * The landing page says its own name. The flow keeps the tool's, because the
 * tool has been the flow for as long as it has existed and renaming it is a
 * decision of its own rather than a side effect of this one.
 */
export function titleFor(product: Product): string {
  if (product === 'flow') return 'Agentic acquisition'
  return PRODUCTS.find((p) => p.value === product)?.label ?? 'Agentic acquisition'
}

/** Where Create goes, for the product it was pressed for. */
export function pathFor(product: Product): string {
  return product === 'landing' ? '/landing' : '/demo'
}
