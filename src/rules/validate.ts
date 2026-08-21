import type { CadenceOffer, CardSet, Context, Tier } from './content'
import { deriveCard } from './derive'
import { allContexts, marketFor, resolveOffer, resolveSet, resolveTier } from './resolve'

/**
 * The rules that can reject a publish.
 *
 * Set-level rules depend on the cards rendered beside them, so they run over a
 * resolved set — and because a market override can flip a switch, they run for
 * every context, not only the one on screen.
 */

export type Severity = 'error' | 'warning'

export interface Violation {
  rule: string
  severity: Severity
  message: string
  tierId?: string
}

export interface ContextResult {
  context: Context
  violations: Violation[]
}

export const contextLabel = (c: Context) =>
  [c.market, c.channel, c.cadence, c.campaign].filter(Boolean).join(' · ')

/** S-1 · Max one Ultimate per set. Zero is valid. */
function checkS1(tiers: Tier[]): Violation[] {
  const ultimates = tiers.filter((t) => t.ultimate)
  if (ultimates.length <= 1) return []
  return [
    {
      rule: 'S-1',
      severity: 'error',
      message: `${ultimates.length} Ultimate tiers — only one is allowed. Two gold-stroked cards cancel the signal out.`,
    },
  ]
}

/** Offer-level rules, from the engineering schema. */
function checkOffer(offer: CadenceOffer, tier: Tier): Violation[] {
  const out: Violation[] = []
  const id = tier.id

  if (!(offer.standardPrice > 0)) {
    out.push({ rule: 'O-price', severity: 'error', message: `No price for ${offer.cadence}.`, tierId: id })
  }
  if (offer.discount && (offer.introPrice === null || !(offer.introPrice > 0))) {
    out.push({ rule: 'O-intro', severity: 'error', message: 'Discount is on but no discount price is set.', tierId: id })
  }
  if (offer.discount && offer.introPrice !== null && offer.introPrice >= offer.standardPrice) {
    out.push({ rule: 'O-intro-high', severity: 'error', message: 'Discount price must be below the standard price, or the card strikes a price identical to the one beside it.', tierId: id })
  }
  if (offer.addOnId && offer.includedAddOnIds.includes(offer.addOnId)) {
    out.push({ rule: 'O-addon-both', severity: 'error', message: `"${offer.addOnId}" is both sold and bundled on the same offer — a bundled benefit is never independently purchasable.`, tierId: id })
  }
  if (offer.addOnId && !offer.addOnPurchaseType) {
    out.push({ rule: 'O-addon-type', severity: 'error', message: 'A sellable add-on needs a purchase type.', tierId: id })
  }
  if (!offer.addOnId && (offer.addOnPurchaseType || offer.addOnDiscountPercent)) {
    out.push({ rule: 'O-addon-orphan', severity: 'error', message: 'Purchase type set with no add-on to sell.', tierId: id })
  }
  if (
    offer.addOnPurchaseType === 'discount_code' &&
    !(offer.addOnDiscountPercent && offer.addOnDiscountPercent > 0 && offer.addOnDiscountPercent < 100)
  ) {
    out.push({ rule: 'O-addon-pct', severity: 'error', message: 'A discount-code add-on needs a percentage between 0 and 100.', tierId: id })
  }
  return out
}

function checkTier(set: CardSet, tier: Tier, offer: CadenceOffer, context: Context): Violation[] {
  const out: Violation[] = []
  const d = deriveCard(set, tier, offer, marketFor(set, context.market), context)

  if (!tier.planName.trim()) {
    out.push({ rule: 'C-name', severity: 'error', message: 'Plan Name is required — it feeds the header, the CTA and the add-on label.', tierId: tier.id })
  }
  if (!tier.description.trim()) {
    out.push({ rule: 'C-desc', severity: 'error', message: 'Description is required.', tierId: tier.id })
  }
  if (tier.features.length === 0) {
    out.push({ rule: 'C-features', severity: 'warning', message: 'No features listed.', tierId: tier.id })
  }
  if (tier.logoTotal < tier.logoTiles.length) {
    out.push({ rule: 'C-logos', severity: 'error', message: `Total competitions (${tier.logoTotal}) is fewer than the ${tier.logoTiles.length} logos supplied.`, tierId: tier.id })
  }

  // Unknown catalogue ids render a placeholder in preview but never publish.
  for (const ref of d.missingRefs) {
    out.push({ rule: 'A-missing', severity: 'error', message: `${ref} is not in its catalogue — no artwork exists for it yet.`, tierId: tier.id })
  }
  const deprecated = [...d.logos, ...d.features].filter((x) => x.state === 'deprecated')
  if (deprecated.length) {
    out.push({ rule: 'A-deprecated', severity: 'warning', message: `${deprecated.length} retired asset(s) still in use — they render, but should be swapped.`, tierId: tier.id })
  }

  return [...out, ...checkOffer(offer, tier)]
}

export function validateContext(set: CardSet, context: Context): Violation[] {
  const cards = resolveSet(set, context)
  return [
    ...checkS1(cards.map((c) => c.tier)),
    ...cards.flatMap(({ tier, offer }) => checkTier(set, tier, offer, context)),
  ]
}

/** Offers whose tier no longer exists, checked once rather than per context. */
function checkOrphans(set: CardSet): Violation[] {
  const ids = new Set(set.tiers.map((t) => t.id))
  return set.offers
    .filter((o) => !ids.has(o.tierId))
    .map((o) => ({
      rule: 'O-orphan',
      severity: 'error' as const,
      message: `Offer "${o.id}" points at a tier that does not exist.`,
    }))
}

export function validateAll(set: CardSet): ContextResult[] {
  const orphans = checkOrphans(set)
  return allContexts(set).map((context) => ({
    context,
    violations: [...orphans, ...validateContext(set, context)],
  }))
}

export const hasErrors = (violations: Violation[]) => violations.some((v) => v.severity === 'error')

export function summarise(results: ContextResult[]) {
  const failing = results.filter((r) => hasErrors(r.violations))
  const warning = results.filter((r) => !hasErrors(r.violations) && r.violations.length > 0)
  return {
    total: results.length,
    failing,
    warning,
    failingLabels: failing.map((r) => contextLabel(r.context)),
    warningLabels: warning.map((r) => contextLabel(r.context)),
  }
}

export { resolveTier, resolveOffer }
