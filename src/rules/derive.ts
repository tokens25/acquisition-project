import type { CadenceOffer, CardSet, Context, MarketConfig, Tier } from './content'
import { formatMoney, formatMoneyWhole } from './money'
import { findAddOn, resolveFeature, resolveLogo, type Resolution } from './resolve'

/**
 * Everything the card renders that is NOT authored.
 *
 * Source: §3 switches, §4 content rules, §5 LogoTiles, §7 authored vs derived.
 * Show-properties are outputs of the switches here — never inputs.
 */

export const STATIC = {
  priceCaption: 'Starts at',
  badge: 'BEST EXPERIENCE',
  footer: 'All features & content',
} as const

export const LOGO_SLOTS_PER_ROW = 5

/**
 * The sentence under a discounted price, when nobody has written one.
 *
 * Exported because the panel shows it as what an empty field falls back to,
 * and a second copy of this string in the form would drift from the card's the
 * first time either changed.
 */
export function defaultExplainer(
  offer: Pick<CadenceOffer, 'introMonths' | 'standardPrice'>,
  market: MarketConfig,
  cadence: string,
): string {
  const unit = cadence.toLocaleLowerCase(market.locale)
  const price = formatMoney(offer.standardPrice, market.locale, market.currency)
  return `For the first ${offer.introMonths} months, then ${price}/${unit}`
}

export interface DerivedFeature {
  iconId: string
  text: string
  /** Deprecated artwork still renders; missing artwork shows a placeholder. */
  state: Resolution<unknown>['state']
  id: string
}

export interface DerivedLogo {
  id: string
  name: string
  altText: string
  state: Resolution<unknown>['state']
}

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
  /** The cadence as it reads after a price — lower case. */
  priceUnit: string
  ctaArea: 'ButtonLabelEyebrow' | 'Button/CTA'
  savingsLabel: string | null

  /* §4 Plan Name — one binding, three surfaces */
  headerText: string
  ctaLabel: string
  addOnIncludedLabel: string

  /* §5 LogoTiles */
  logoRows: 1 | 2
  logoCapacity: number
  logos: DerivedLogo[]
  overflowCount: number
  overflowLabel: string | null

  features: DerivedFeature[]

  /** The add-on panel this offer produces, if any. */
  addOn: {
    id: string
    title: string
    subtitle: string
    imageId: string
    variant: 'included' | 'one-time-payment' | 'discount-code'
    price: string | null
    codeLabel: string | null
  } | null

  footerLabel: string

  /** Ids referenced but absent from a catalogue — these block publish. */
  missingRefs: string[]
}

export function deriveCard(
  set: CardSet,
  tier: Tier,
  offer: CadenceOffer,
  market: MarketConfig,
  context: Context,
): DerivedCard {
  const { locale, currency } = market
  const money = (amount: number) => formatMoney(amount, locale, currency)

  /**
   * The cadence as it reads after a price: "$25.99 /monthly".
   *
   * Lower case here rather than in the data, because the same string is a
   * proper label in the panel's dropdown and running text on the card. Lowered
   * against the market's locale, so a market whose language cases differently
   * is not forced through English rules.
   */
  const priceUnit = context.cadence.toLocaleLowerCase(locale)
  const missingRefs: string[] = []

  /* Add-on. A bundled benefit and a sellable one are mutually exclusive; the
     offer's wiring decides which panel appears. */
  const includedId = offer.includedAddOnIds[0]
  const sellableId = offer.addOnId
  const addOnId = sellableId ?? includedId ?? null
  const addOnEntry = addOnId ? findAddOn(set, addOnId) : undefined
  if (addOnId && !addOnEntry) missingRefs.push(`add-on:${addOnId}`)

  const addOn = addOnEntry
    ? {
        id: addOnEntry.id,
        title: addOnEntry.title,
        subtitle: addOnEntry.subtitle,
        imageId: addOnEntry.imageId,
        variant: sellableId
          ? offer.addOnPurchaseType === 'discount_code'
            ? ('discount-code' as const)
            : ('one-time-payment' as const)
          : ('included' as const),
        price: addOnEntry.price !== null ? money(addOnEntry.price) : null,
        codeLabel:
          offer.addOnPurchaseType === 'discount_code' && offer.addOnDiscountPercent
            ? `-${offer.addOnDiscountPercent}% OFF`
            : null,
      }
    : null

  /* §5 — rows = 1 when an add-on renders, else 2. Capacity follows. */
  const logoRows: 1 | 2 = addOn ? 1 : 2
  const logoCapacity = LOGO_SLOTS_PER_ROW * logoRows
  const total = Math.max(tier.logoTotal, 0)
  const overflows = total > logoCapacity
  const visibleCount = overflows ? logoCapacity - 1 : Math.min(total, logoCapacity)
  const overflowCount = overflows ? total - (logoCapacity - 1) : 0

  const logos: DerivedLogo[] = tier.logoTiles.slice(0, visibleCount).map((id) => {
    const r = resolveLogo(set, id)
    if (r.state === 'missing') {
      missingRefs.push(`logo:${id}`)
      return { id, name: id, altText: 'Artwork not available', state: r.state }
    }
    return { id, name: r.entry.name, altText: r.entry.altText, state: r.state }
  })

  const features: DerivedFeature[] = tier.features.map((id) => {
    const r = resolveFeature(set, id)
    if (r.state === 'missing') {
      missingRefs.push(`feature:${id}`)
      return { id, iconId: '', text: id, state: r.state }
    }
    return { id, iconId: r.entry.iconId, text: r.entry.text, state: r.state }
  })

  const { ultimate } = tier
  const { discount, standardPrice, introPrice } = offer
  const annualSaving = discount && introPrice !== null
    ? Math.max(0, standardPrice - introPrice) * 12
    : 0

  return {
    showBadge: ultimate,
    // Whether a badge shows is still the switch's call; what it says is
    // authored. An empty field falls back rather than rendering a blank ribbon.
    badgeText: ultimate ? (tier.badge?.trim() || STATIC.badge) : null,
    ctaAppearance: ultimate ? 'subscribe' : 'primary',

    priceCaption: discount ? STATIC.priceCaption : null,
    primaryPrice: money(discount && introPrice !== null ? introPrice : standardPrice),
    struckPrice: discount ? money(standardPrice) : null,
    showExplainer: discount,
    priceUnit,
    // Written if someone wrote it, built from the numbers if not.
    explainer: discount
      ? (offer.explainer?.trim() || defaultExplainer(offer, market, context.cadence))
      : null,
    ctaArea: discount ? 'ButtonLabelEyebrow' : 'Button/CTA',
    savingsLabel: discount
      ? `Save up to ${formatMoneyWhole(annualSaving, locale, currency)} /year`
      : null,

    headerText: tier.planName,
    ctaLabel: `Get ${tier.planName}`,
    addOnIncludedLabel: `Included in ${tier.planName}`,

    logoRows,
    logoCapacity,
    logos,
    overflowCount,
    overflowLabel: overflowCount > 0 ? `+${overflowCount}` : null,

    features,
    addOn,
    footerLabel: STATIC.footer,
    missingRefs,
  }
}
