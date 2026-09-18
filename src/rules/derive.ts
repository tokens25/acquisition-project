import type { CadenceOffer, CardSet, Context, MarketConfig, Tier } from './content'
import { formatMoney, formatMoneyWhole } from './money'
import { findAddOn, resolveFeature, resolveLogo, resolveOffer, type Resolution } from './resolve'

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
/** Benefit lines the card face shows. The rest are in "All features & content". */
export const FEATURE_SLOTS = 5

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
  /** The word before the name, so a market can say it in its own language. */
  verb = 'Get',
): string {
  const plain = `${verb} ${planName}`
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
  /** An uploaded glyph, when there is one. Null means the paired icon. */
  icon: string | null
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
  /** An uploaded badge, when there is one. Null means the shipped artwork. */
  image: string | null
  state: Resolution<unknown>['state']
}

export interface DerivedCard {
  /* §3 Highlighted — one switch, four outputs */
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

  /** The lines the card face shows — the first `FEATURE_SLOTS`. */
  features: DerivedFeature[]
  /** Every line, for the dialog. */
  allFeatures: DerivedFeature[]

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

  /**
   * §6 The facts — what DAZN's catalogue states about the plan.
   *
   * Every way this plan is priced here, the under-25 rate where one exists,
   * the limits it is sold with and what can be added to it. Drawn from the
   * offers and the tier's `limits`, so a plan written by hand shows only what
   * was written and a live one shows what DAZN sells.
   */
  billing: DerivedBilling[]
  youth: string | null
  limits: { label: string; value: string }[]
  canAdd: string[]

  /** Ids referenced but absent from a catalogue — these block publish. */
  missingRefs: string[]
}

export interface DerivedBilling {
  cadence: string
  /** "Monthly", "Annual", "12×" */
  label: string
  /** The price paid per unit, formatted: what the card's headline would say at that cadence. */
  price: string
  /** "/mo", "/yr" */
  unit: string
  /** This is the cadence the card is showing. */
  current: boolean
  /** "12-mo contract" — the commitment, when there is one. */
  term: string | null
}

/** How a cadence reads in a row of billing options — short, like a price tag. */
export function billingLabel(cadence: string, termMonths?: number): { label: string; unit: string } {
  const c = cadence.toLowerCase()
  if (termMonths && /instal/.test(c)) return { label: `${termMonths}×`, unit: 'mo' }
  if (/instal/.test(c)) return { label: 'Instalments', unit: 'mo' }
  if (/year|annual/.test(c)) return { label: 'Annual', unit: 'yr' }
  if (/month/.test(c)) return { label: 'Monthly', unit: 'mo' }
  return { label: cadence, unit: c }
}

/**
 * Every way this plan is priced in this market, in the set's cadence order.
 *
 * Read through `resolveOffer` per cadence, so the same row wins as would win
 * on the card at that cadence — market-scoped over general, tab over none.
 */
export function billingFor(set: CardSet, tier: Tier, market: MarketConfig, context: Context): DerivedBilling[] {
  const out: DerivedBilling[] = []
  for (const cadence of set.cadences) {
    const offer = resolveOffer(set, tier.id, { ...context, cadence })
    if (!offer) continue
    const { label, unit } = billingLabel(cadence, offer.termMonths)
    const price = offer.discount && offer.introPrice !== null ? offer.introPrice : offer.standardPrice
    out.push({
      cadence,
      label,
      price: formatMoney(price, market.locale, market.currency),
      unit,
      current: cadence === context.cadence,
      term: offer.termMonths ? `${offer.termMonths}-mo contract` : null,
    })
  }
  return out
}

/**
 * The under-25 rate for this plan here, if DAZN sells one.
 *
 * A youth plan is the same entitlement set at a lower price for a year, sold
 * as its own SKU (`…_yp`); the import keeps it as a legacy plan beside its
 * parent. The parent's card says it in one line, at the cadence on screen
 * where that cadence has one, or the first that does.
 */
export function youthFor(set: CardSet, tier: Tier, market: MarketConfig, context: Context): string | null {
  const youth = set.tiers.find((t) => t.id === `${tier.id}-yp` && t.status === 'legacy')
  if (!youth) return null
  const at = resolveOffer(set, youth.id, context) ?? set.cadences.map((c) => resolveOffer(set, youth.id, { ...context, cadence: c })).find(Boolean)
  if (!at) return null
  const price = at.discount && at.introPrice !== null ? at.introPrice : at.standardPrice
  const { unit } = billingLabel(at.cadence, at.termMonths)
  const term = at.termMonths ? ` · ${at.termMonths} mo` : ''
  return `Youth rate: ${formatMoney(price, market.locale, market.currency)}/${unit}${term}`
}

/** The limits row: Streams 2 · IP 1 · Video HD. Only what is known. */
export function limitsFor(tier: Tier): { label: string; value: string }[] {
  const d = tier.limits
  if (!d) return []
  const out: { label: string; value: string }[] = []
  if (d.streams !== null) out.push({ label: 'Streams', value: String(d.streams) })
  if (d.networks !== null) out.push({ label: 'IP', value: String(d.networks) })
  else if (d.policy === 'multi') out.push({ label: 'IP', value: 'Any' })
  if (d.video) out.push({ label: 'Video', value: d.video })
  if (d.downloads) out.push({ label: 'Downloads', value: 'Yes' })
  if (d.mobileOnly) out.push({ label: 'Mobile', value: 'Only' })
  return out
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

  // The unit of the offer on the card, which is the cadence on screen unless
  // the plan is not sold that way — then the first way it is.
  const priceUnit = priceUnitFor(set, offer.cadence, locale)
  // The plan screen's standing words. Content now, so a market reads them in
  // its own language; the old constants are the floor when nothing is written.
  const plans = set.flow?.plans
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
  // Written wins; absent, an add-on panel has taken the second row's space.
  /*
   * One row of five, unless the plan says otherwise. A sixth competition
   * turns the last slot into "+N" rather than opening a second row. The RSN
   * plans are the exception: their Figma card is drawn with two rows of team
   * badges, and that is what they carry.
   */
  const logoRows: 1 | 2 = tier.logoRows ?? (tier.subscriptions?.includes('rsns') && !addOn ? 2 : 1)
  const logoCapacity = LOGO_SLOTS_PER_ROW * logoRows
  /*
   * How many competitions the plan carries.
   *
   * Never fewer than the badges supplied. The total is a commercial fact and
   * the badges are a selection from it, so the two disagreeing means the total
   * is out of date — and the reading that draws nothing is the wrong one to
   * take: a plan with three badges and a total of zero rendered an empty row,
   * which looked like the badges had not been added rather than like a number
   * that needed updating. The rules already call that disagreement an error
   * (C-logos); this makes the card show what the error is about.
   */
  const total = Math.max(tier.logoTotal, tier.logoTiles.length)
  const overflows = total > logoCapacity
  // The last slot is either a competition or the count of the ones left out.
  // Spending it on a badge means the row no longer says any are missing, which
  // is the trade being made — so the count goes rather than being drawn wrong.
  const countsOverflow = (tier.logoOverflow ?? 'count') === 'count'
  const visibleCount = overflows
    ? countsOverflow
      ? logoCapacity - 1
      : logoCapacity
    : Math.min(total, logoCapacity)

  // Resolved once, then sliced: the tile shows what fits and the dialog shows
  // all of them, and resolving twice would report every missing reference twice.
  const allLogos: DerivedLogo[] = tier.logoTiles.map((id) => {
    const r = resolveLogo(set, id)
    if (r.state === 'missing') {
      missingRefs.push(`logo:${id}`)
      return { id, name: id, altText: 'Artwork not available', blurb: null, image: null, state: r.state }
    }
    return {
      id,
      name: r.entry.name,
      altText: r.entry.altText,
      blurb: r.entry.blurb?.trim() || null,
      image: r.entry.image?.trim() || null,
      state: r.state,
    }
  })
  const logos: DerivedLogo[] = allLogos.slice(0, visibleCount)

  /*
   * How many the row is not showing — counted from what it actually drew.
   *
   * Against the capacity it would have been a guess that the row is full, and
   * a plan carrying twelve competitions with three badges supplied would have
   * said "+3" beside three badges: nine hidden, described as three. Counted
   * this way a full row gives the same number it always did, and a short one
   * gives the true one.
   */
  const overflowCount = overflows && countsOverflow ? Math.max(total - logos.length, 0) : 0

  const allFeatures: DerivedFeature[] = tier.features.map((id) => {
    const r = resolveFeature(set, id)
    if (r.state === 'missing') {
      missingRefs.push(`feature:${id}`)
      return { id, iconId: '', icon: null, text: id, state: r.state }
    }
    return {
      id,
      iconId: r.entry.iconId,
      icon: r.entry.icon?.trim() || null,
      text: r.entry.text,
      state: r.state,
    }
  })

  // The face lists five at most, as the card is drawn; the dialog has them all.
  const features = allFeatures.slice(0, FEATURE_SLOTS)

  const { highlighted } = tier
  const { discount, standardPrice, introPrice } = offer
  const annualSaving = discount && introPrice !== null
    ? Math.max(0, standardPrice - introPrice) * 12
    : 0

  return {
    showBadge: highlighted,
    // Whether a badge shows is still the switch's call; what it says is
    // authored. An empty field falls back rather than rendering a blank ribbon.
    badgeText: highlighted ? (tier.badge?.trim() || plans?.badge?.trim() || STATIC.badge) : null,
    ctaAppearance: highlighted ? 'subscribe' : 'primary',

    // Always. The tiles carry "Starts at" above an undiscounted price too —
    // it says the price is a floor, which is true whether or not an intro
    // offer is running.
    // Absent means drawn: a plan written before the switch existed was
    // written expecting the line.
    priceCaption:
      tier.startsAt === false ? null : plans?.priceCaption?.trim() || STATIC.priceCaption,
    primaryPrice: money(discount && introPrice !== null ? introPrice : standardPrice),
    struckPrice: discount ? money(standardPrice) : null,
    showExplainer: discount,
    priceUnit,
    // Written if someone wrote it, built from the numbers if not.
    explainer: discount
      ? (offer.explainer?.trim() || defaultExplainer(offer, market, offer.cadence))
      : null,
    ctaArea: discount ? 'ButtonLabelEyebrow' : 'Button/CTA',
    savingsLabel: discount
      ? `Save up to ${formatMoneyWhole(annualSaving, locale, currency)} /year`
      : null,

    headerText: tier.planName,
    ctaLabel: offer.ctaLabel?.trim() || ctaLabelFor(tier.planName, offer, market, plans?.ctaVerb?.trim() || 'Get'),
    addOnIncludedLabel: `Included in ${tier.planName}`,

    logoRows,
    logoCapacity,
    logos,
    overflowCount,
    overflowLabel: overflowCount > 0 ? `+${overflowCount}` : null,
    allLogos,

    features,
    allFeatures,
    addOn,
    footerLabel: plans?.footer?.trim() || STATIC.footer,

    billing: billingFor(set, tier, market, context),
    youth: youthFor(set, tier, market, context),
    limits: limitsFor(tier),
    canAdd: (offer.canAdd ?? []).map((a) => {
      const { unit } = billingLabel(a.cadence)
      return `Can add: ${a.name} ${money(a.price)}/${unit}`
    }),
    missingRefs,
  }
}
