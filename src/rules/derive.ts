import type { AuthoredCard, CardSet } from './content'
import { formatMoney, formatMoneyWhole, type Money } from './money'

/**
 * Everything the card renders that is NOT authored.
 *
 * Source: "Acquisition Card — Rules & Logic" §3 switches, §4 content rules,
 * §5 LogoTiles, §7 authored vs derived. Show-properties are outputs of the
 * switches here — they are never inputs (§7, final paragraph).
 */

/** Static strings. Never authored, never per-market overridable. */
export const STATIC = {
  priceCaption: 'Starts at',
  badge: 'BEST EXPERIENCE',
  footer: 'All features & content',
} as const

export const LOGO_SLOTS_PER_ROW = 5

export interface DerivedCard {
  /* §3 Ultimate — one switch, four outputs */
  strokeToken: 'subscribe-gold' | 'border-subtle'
  showBadge: boolean
  badgeText: string | null
  planNameFill: 'subscribe-gold' | 'text-primary'
  ctaAppearance: 'subscribe' | 'primary'

  /* §3 Discount — one switch, five outputs */
  priceCaption: string | null
  primaryPrice: string
  struckPrice: string | null
  showExplainer: boolean
  explainer: string | null
  ctaArea: 'ButtonLabelEyebrow' | 'Button/CTA'
  savingsLabel: string | null

  /* §4 Plan Name — one binding, three surfaces */
  headerText: string
  ctaLabel: string
  addOnIncludedLabel: string

  /* §5 LogoTiles */
  logoRows: 1 | 2
  logoCapacity: number
  visibleLogoCount: number
  overflowCount: number
  overflowLabel: string | null

  /* §6 footer */
  footerLabel: string
}

/** Annual saving from taking the intro price — the "computed delta" of §7. */
function annualSaving(card: AuthoredCard): Money {
  const perPeriod = card.standardPrice.amount - card.introPrice.amount
  return { amount: Math.max(0, perPeriod) * 12, currency: card.standardPrice.currency }
}

export function deriveCard(card: AuthoredCard, locale: string): DerivedCard {
  // §3 — Ultimate. Four outputs that must move together; a gold stroke with a
  // white CTA is invalid, so they are computed from one switch, never set apart.
  const ultimate = card.ultimate

  // §5 — rows = 1 IF add-on present ELSE 2 (max 2, never 3)
  const logoRows: 1 | 2 = card.addOn.enabled ? 1 : 2
  const logoCapacity = LOGO_SLOTS_PER_ROW * logoRows
  const total = Math.max(card.logoTotal, 0)
  const overflows = total > logoCapacity
  const visibleLogoCount = overflows ? logoCapacity - 1 : Math.min(total, logoCapacity)
  const overflowCount = overflows ? total - (logoCapacity - 1) : 0

  // §3 — Discount. Five outputs across two components.
  const discount = card.discount
  const saving = annualSaving(card)

  return {
    strokeToken: ultimate ? 'subscribe-gold' : 'border-subtle',
    showBadge: ultimate,
    badgeText: ultimate ? STATIC.badge : null,
    planNameFill: ultimate ? 'subscribe-gold' : 'text-primary',
    ctaAppearance: ultimate ? 'subscribe' : 'primary',

    priceCaption: discount ? STATIC.priceCaption : null,
    primaryPrice: formatMoney(discount ? card.introPrice : card.standardPrice, locale),
    struckPrice: discount ? formatMoney(card.standardPrice, locale) : null,
    showExplainer: discount,
    explainer: discount
      ? `For the first ${card.introMonths} months, then ${formatMoney(
          card.standardPrice,
          locale,
        )}/${card.installment}`
      : null,
    ctaArea: discount ? 'ButtonLabelEyebrow' : 'Button/CTA',
    savingsLabel: discount
      ? `Save up to ${formatMoneyWhole(saving, locale)} /year`
      : null,

    headerText: card.planName,
    ctaLabel: `Get ${card.planName}`,
    addOnIncludedLabel: `Included in ${card.planName}`,

    logoRows,
    logoCapacity,
    visibleLogoCount,
    overflowCount,
    overflowLabel: overflowCount > 0 ? `+${overflowCount}` : null,

    footerLabel: STATIC.footer,
  }
}

export function deriveSet(set: CardSet): DerivedCard[] {
  return set.cards.map((card) => deriveCard(card, set.locale))
}
