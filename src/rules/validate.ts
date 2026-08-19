import type { AuthoredCard, CardSet } from './content'
import { deriveCard } from './derive'

/**
 * The rules that can reject a publish.
 *
 * Set-level rules (§2) are the ones a single card cannot evaluate alone — they
 * depend on the cards rendered beside it. Card-level checks cover the
 * authoring mistakes the switches don't already make impossible.
 */

export type Severity = 'error' | 'warning'

export interface Violation {
  /** Rule id from the doc, e.g. "S-1". */
  rule: string
  severity: Severity
  message: string
  /** Card the violation belongs to; absent for whole-set rules. */
  cardId?: string
}

/** S-1 · Max one Ultimate card per set. Zero is valid. */
export function checkS1(set: CardSet): Violation[] {
  const ultimates = set.cards.filter((c) => c.ultimate)
  if (ultimates.length <= 1) return []
  return [
    {
      rule: 'S-1',
      severity: 'error',
      message: `${ultimates.length} Ultimate cards in this set — only one is allowed. Ultimate marks a single recommended plan; two gold-stroked cards cancel the signal out.`,
    },
  ]
}

function checkCard(card: AuthoredCard, set: CardSet): Violation[] {
  const out: Violation[] = []
  const d = deriveCard(card, set.locale)

  if (!card.planName.trim()) {
    out.push({ rule: 'C-name', severity: 'error', message: 'Plan Name is required — it feeds the header, the CTA and the add-on label.', cardId: card.id })
  }
  if (!card.description.trim()) {
    out.push({ rule: 'C-desc', severity: 'error', message: 'Description is required.', cardId: card.id })
  }

  // A discounted card whose intro price isn't below standard produces a struck
  // price identical to the primary one, and a savings figure of zero.
  if (card.discount && card.introPrice.amount >= card.standardPrice.amount) {
    out.push({
      rule: 'C-price',
      severity: 'error',
      message: 'Intro price must be lower than the standard price, or the card strikes a price identical to the one beside it.',
      cardId: card.id,
    })
  }
  if (card.discount && card.introMonths < 1) {
    out.push({ rule: 'C-intro', severity: 'error', message: 'Intro period must be at least 1 month.', cardId: card.id })
  }
  if (card.standardPrice.currency !== card.introPrice.currency) {
    out.push({ rule: 'C-currency', severity: 'error', message: 'Standard and intro prices must use the same currency.', cardId: card.id })
  }

  // §5 — the "+{n}" tile is derived from the total, so the total has to be at
  // least the number of logos actually supplied.
  if (card.logoTotal < card.logos.length) {
    out.push({
      rule: 'C-logos',
      severity: 'error',
      message: `Total competitions (${card.logoTotal}) is fewer than the ${card.logos.length} logos supplied.`,
      cardId: card.id,
    })
  }
  if (card.logos.length < d.visibleLogoCount) {
    out.push({
      rule: 'C-logos-supply',
      severity: 'warning',
      message: `${d.visibleLogoCount} tiles will render but only ${card.logos.length} logos are supplied — the row will be short.`,
      cardId: card.id,
    })
  }

  if (card.features.length === 0) {
    out.push({ rule: 'C-features', severity: 'warning', message: 'No features listed.', cardId: card.id })
  }
  if (card.features.some((f) => !f.trim())) {
    out.push({ rule: 'C-features-empty', severity: 'error', message: 'A feature row is empty.', cardId: card.id })
  }

  if (card.addOn.enabled && !card.addOn.title.trim()) {
    out.push({ rule: 'C-addon', severity: 'error', message: 'Add-on is shown but has no title.', cardId: card.id })
  }

  return out
}

export function validateSet(set: CardSet): Violation[] {
  return [...checkS1(set), ...set.cards.flatMap((c) => checkCard(c, set))]
}

export const hasErrors = (violations: Violation[]) =>
  violations.some((v) => v.severity === 'error')
