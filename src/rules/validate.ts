import type { AuthoredCard, CardSet, Context } from './content'
import { deriveCard } from './derive'
import { findFeature } from './features'
import { allContexts, marketFor, resolveSet } from './resolve'

/**
 * The rules that can reject a publish.
 *
 * Set-level rules (§2) depend on the cards rendered beside them, so they are
 * evaluated over a resolved set — and because a market override can change a
 * switch, they must be evaluated for EVERY market, not only the one on screen.
 */

export type Severity = 'error' | 'warning'

export interface Violation {
  rule: string
  severity: Severity
  message: string
  cardId?: string
}

export interface ContextResult {
  context: Context
  violations: Violation[]
}

const label = (c: Context) => (c.campaign ? `${c.market} · ${c.campaign}` : c.market)

/** S-1 · Max one Ultimate card per set. Zero is valid. */
function checkS1(cards: AuthoredCard[]): Violation[] {
  const ultimates = cards.filter((c) => c.ultimate)
  if (ultimates.length <= 1) return []
  return [
    {
      rule: 'S-1',
      severity: 'error',
      message: `${ultimates.length} Ultimate cards — only one is allowed. Two gold-stroked cards cancel the signal out.`,
    },
  ]
}

function checkCard(card: AuthoredCard, set: CardSet, context: Context): Violation[] {
  const out: Violation[] = []
  const market = marketFor(set, context.market)
  const d = deriveCard(card, market)

  if (!card.planName.trim()) {
    out.push({ rule: 'C-name', severity: 'error', message: 'Plan Name is required — it feeds the header, the CTA and the add-on label.', cardId: card.id })
  }
  if (!card.description.trim()) {
    out.push({ rule: 'C-desc', severity: 'error', message: 'Description is required.', cardId: card.id })
  }
  if (card.discount && card.introPrice >= card.standardPrice) {
    out.push({ rule: 'C-price', severity: 'error', message: 'Intro price must be below the standard price, or the card strikes a price identical to the one beside it.', cardId: card.id })
  }
  if (card.discount && card.introMonths < 1) {
    out.push({ rule: 'C-intro', severity: 'error', message: 'Intro period must be at least 1 month.', cardId: card.id })
  }
  if (card.logoTotal < card.logos.length) {
    out.push({ rule: 'C-logos', severity: 'error', message: `Total competitions (${card.logoTotal}) is fewer than the ${card.logos.length} logos supplied.`, cardId: card.id })
  }
  if (card.logos.length < d.visibleLogoCount) {
    out.push({ rule: 'C-logos-supply', severity: 'warning', message: `${d.visibleLogoCount} tiles will render but only ${card.logos.length} logos are supplied.`, cardId: card.id })
  }
  if (card.features.length === 0) {
    out.push({ rule: 'C-features', severity: 'warning', message: 'No features listed.', cardId: card.id })
  }
  if (card.features.some((f) => !(f.label ?? findFeature(f.featureId)?.defaultLabel ?? '').trim())) {
    out.push({ rule: 'C-features-empty', severity: 'error', message: 'A feature row is empty.', cardId: card.id })
  }
  if (card.addOn.enabled && !card.addOn.title.trim()) {
    out.push({ rule: 'C-addon', severity: 'error', message: 'Add-on is shown but has no title.', cardId: card.id })
  }
  return out
}

/** Validates one context. */
export function validateContext(set: CardSet, context: Context): Violation[] {
  const cards = resolveSet(set, context)
  return [...checkS1(cards), ...cards.flatMap((c) => checkCard(c, set, context))]
}

/**
 * Validates every market and campaign.
 *
 * This is the coverage half of review: machines check the whole matrix, so a
 * person only has to look at what changed.
 */
export function validateAll(set: CardSet): ContextResult[] {
  return allContexts(set).map((context) => ({ context, violations: validateContext(set, context) }))
}

export const hasErrors = (violations: Violation[]) => violations.some((v) => v.severity === 'error')

export function summarise(results: ContextResult[]) {
  const failing = results.filter((r) => hasErrors(r.violations))
  const warning = results.filter((r) => !hasErrors(r.violations) && r.violations.length > 0)
  return {
    total: results.length,
    failing,
    warning,
    failingLabels: failing.map((r) => label(r.context)),
    warningLabels: warning.map((r) => label(r.context)),
  }
}

export { label as contextLabel }
