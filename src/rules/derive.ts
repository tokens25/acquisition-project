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
 * What a cadence reads as beside a price, before anyone writes it.
 *
 * A cadence is named for how often you pay — "Monthly" — and a price is
 * followed by the period itself: "$29.99 /month". Lower-casing the name gets
 * that wrong for exactly this reason, so the ones that differ are listed.
 * Anything absent falls through to its own name, which is right for a cadence
 * whose name is already the period.
 */
const UNIT_DEFAULTS: Record<string, string> = {
  Monthly: 'month',
}

/**
 * What reads after the price: "$29.99 /month".
 *
 * Written if someone wrote it for this cadence, then the default above, then
 * the cadence's own name lower-cased — the same string is a proper label in
 * the panel's picker and running text on the card. Lowered against the
 * market's locale, so a market whose language cases differently is not forced
 * through English rules.
 *
 * Shared with the panel so the field shows what the card will say.
 */
export function priceUnitFor(set: CardSet, cadence: string, locale: string): string {
  return (
    set.priceUnits?.[cadence]?.trim() ||
    UNIT_DEFAULTS[cadence] ||
    cadence.toLocaleLowerCase(locale)
  )
}

/**
 * Whether the add-on shows at all. Off for now.
 *
 * One switch rather than two deletions: the card stops drawing the panel and
 * the panel stops offering the fields, so neither can advertise something the
 * other has hidden. Everything behind it is intact — the catalogue, the offer
 * fields, the validation — so turning it back on is this line.
 *
 * The logo grid follows on its own: with no add-on there is room for two rows
 * rather than one, which is what §5 already says and what the design draws.
 */
export const SHOW_ADDON = false

/**
 * What the button says.
 *
 * Exported so the panel can label its options with the button they produce —
 * "Get Ultimate and save $9.00" rather than "saving-amount". Building the same
 * strings twice would let the menu describe a button the card does not render.
 *
 * A saving style needs a discount and an intro price to have a number; without
 * one it falls back to plain rather than announcing a saving of nothing.
 */
export function ctaLabelFor(
  planName: string,
  offer: Pick<CadenceOffer, 'discount' | 'standardPrice' | 'introPrice' | 'ctaStyle'>,
  market: MarketConfig,
): string {
  const plain = `Get ${planName}`
  const { discount, standardPrice, introPrice } = offer
  if (!discount || introPrice === null || standardPrice <= 0) return plain

  const saved = Math.max(0, standardPrice - introPrice)
  if (offer.ctaStyle === 'saving-amount') {
    return `${plain} and save ${formatMoney(saved, market.locale, market.currency)}`
  }
  if (offer.ctaStyle === 'saving-percent') {
    return `${plain} and save ${Math.round((saved / standardPrice) * 100)}%`
  }
  return plain
}

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
  /** Authored on the catalogue entry; absent for most of them. */
  blurb: string | null
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
  /**
   * Every competition the tier carries, uncapped.
   *
   * `logos` is what the card has room for and `overflowCount` is what it hides;
   * the "All features & content" dialog exists to show the rest, so it reads
   * this instead of the two of them plus a rule for putting them back together.
   */
  allLogos: DerivedLogo[]

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

  const priceUnit = priceUnitFor(set, context.cadence, locale)
  const missingRefs: string[] = []

  /* Add-on. A bundled benefit and a sellable one are mutually exclusive; the
     offer's wiring decides which panel appears. */
  const includedId = offer.includedAddOnIds[0]
  const sellableId = offer.addOnId
  const addOnId = sellableId ?? includedId ?? null
  const addOnEntry = addOnId ? findAddOn(set, addOnId) : undefined
  if (addOnId && !addOnEntry) missingRefs.push(`add-on:${addOnId}`)

  const addOn = SHOW_ADDON && addOnEntry
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

  // Resolved once, then sliced: the tile shows what fits and the dialog shows
  // all of them, and resolving twice would report every missing reference twice.
  const allLogos: DerivedLogo[] = tier.logoTiles.map((id) => {
    const r = resolveLogo(set, id)
    if (r.state === 'missing') {
      missingRefs.push(`logo:${id}`)
      return { id, name: id, altText: 'Artwork not available', blurb: null, state: r.state }
    }
    return {
      id,
      name: r.entry.name,
      altText: r.entry.altText,
      blurb: r.entry.blurb?.trim() || null,
      state: r.state,
    }
  })
  const logos: DerivedLogo[] = allLogos.slice(0, visibleCount)

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

    // Always. The tiles carry "Starts at" above an undiscounted price too —
    // it says the price is a floor, which is true whether or not an intro
    // offer is running.
    priceCaption: STATIC.priceCaption,
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
    ctaLabel: offer.ctaLabel?.trim() || ctaLabelFor(tier.planName, offer, market),
    addOnIncludedLabel: `Included in ${tier.planName}`,

    logoRows,
    logoCapacity,
    logos,
    overflowCount,
    overflowLabel: overflowCount > 0 ? `+${overflowCount}` : null,
    allLogos,

    features,
    addOn,
    footerLabel: STATIC.footer,
    missingRefs,
  }
}
