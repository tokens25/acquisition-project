import type { AuthoredCard, MarketConfig } from './content'
import { formatMoney, formatMoneyWhole } from './money'

/**
 * Everything the card renders that is NOT authored.
 *
 * Source: "Acquisition Card — Rules & Logic" §3 switches, §4 content rules,
 * §5 LogoTiles, §7 authored vs derived. Show-properties are outputs of the
 * switches here — they are never inputs (§7, final paragraph).
 */

/** Static strings. Never authored, never overridable per market. */
export const STATIC = {
  priceCaption: 'Starts at',
  badge: 'BEST EXPERIENCE',
  footer: 'All features & content',
} as const

export const LOGO_SLOTS_PER_ROW = 5

export interface DerivedCard {
  /* §3 Ultimate — one switch, four outputs */
  showBadge: boolean
  badgeText: string | null
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

export function deriveCard(card: AuthoredCard, market: MarketConfig): DerivedCard {
  const { locale, currency } = market
  const money = (amount: number) => formatMoney(amount, locale, currency)

  // §5 — rows = 1 IF add-on present ELSE 2 (max 2, never 3)
  const logoRows: 1 | 2 = card.addOn.enabled ? 1 : 2
  const logoCapacity = LOGO_SLOTS_PER_ROW * logoRows
  const total = Math.max(card.logoTotal, 0)
  const overflows = total > logoCapacity
  const visibleLogoCount = overflows ? logoCapacity - 1 : Math.min(total, logoCapacity)
  const overflowCount = overflows ? total - (logoCapacity - 1) : 0

  const { ultimate, discount } = card
  const annualSaving = Math.max(0, card.standardPrice - card.introPrice) * 12

  return {
    showBadge: ultimate,
    badgeText: ultimate ? STATIC.badge : null,
    ctaAppearance: ultimate ? 'subscribe' : 'primary',

    priceCaption: discount ? STATIC.priceCaption : null,
    primaryPrice: money(discount ? card.introPrice : card.standardPrice),
    struckPrice: discount ? money(card.standardPrice) : null,
    showExplainer: discount,
    explainer: discount
      ? `For the first ${card.introMonths} months, then ${money(card.standardPrice)}/${card.installment}`
      : null,
    ctaArea: discount ? 'ButtonLabelEyebrow' : 'Button/CTA',
    savingsLabel: discount
      ? `Save up to ${formatMoneyWhole(annualSaving, locale, currency)} /year`
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
