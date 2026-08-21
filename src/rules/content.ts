/**
 * Authored content only.
 *
 * Nothing derived or static appears here — that is the point. If a value can be
 * computed from another value it lives in `derive.ts`, so an editor cannot
 * author a number that contradicts the one beside it.
 *
 * Source: "Acquisition Card — Rules & Logic" §7, and the engineering-side
 * schema it was reconciled with (Tier × CadenceOffer, channel/status,
 * catalogue lifecycle).
 */

export type AddOnPurchaseType = 'one_time_payment' | 'discount_code'
export type Device = 'mobile' | 'desktop' | 'xl'

/** Direct storefront, or a partner code. Open by design — partners keep appearing. */
export const DIRECT = 'direct'

/** Assets are never hard-deleted; a retired one still renders, flagged. */
export type AssetStatus = 'active' | 'deprecated'

export interface CatalogEntry {
  id: string
  name: string
  altText: string
  status: AssetStatus
}

/**
 * One feature line: an icon and a line of copy, paired once and reused. A tier
 * holds ordered ids, exactly as it holds logo ids — the pairing is not authored
 * per tier, so the same capability cannot end up with two different icons.
 */
export interface FeatureEntry {
  id: string
  iconId: string
  text: string
  status: AssetStatus
}

export interface AddOnEntry {
  id: string
  title: string
  subtitle: string
  /** Required when sold as one_time_payment; unused when bundled. */
  price: number | null
  imageId: string
}

/**
 * A plan, scoped to nothing — market differences are patches, not copies.
 *
 * Pricing is deliberately absent: it belongs to (tier × cadence), because the
 * same plan is sold at different prices depending on how you pay for it, and is
 * often not sold at some cadences at all.
 */
export interface Tier {
  id: string
  planName: string
  description: string
  /** Ordered FeatureEntry ids. */
  features: string[]
  /** Ordered logo CatalogEntry ids. */
  logoTiles: string[]
  /** Total competitions the plan carries; drives the derived "+N" tile. */
  logoTotal: number
  ultimate: boolean
  displayOrder: number

  /**
   * Gates the DIRECT storefront only. `legacy` is closed-book to new direct
   * customers — it does NOT hide the tier from partners, who may still be
   * actively selling it.
   */
  status: 'live' | 'legacy'
  /** `direct`, or a partner code for a tier that exists only on their storefront. */
  channel: string
  /** Only meaningful when channel is `direct`: may partners also carry it? */
  visibleToPartners: boolean

  overrides: Override[]
}

/**
 * The join of a tier and a way of paying for it. Sparse by design: a missing
 * row means "not sold that way", which is a different fact from `discount:
 * false`. Nothing may invent a row to fill the gap.
 */
export interface CadenceOffer {
  id: string
  tierId: string
  cadence: string
  /** Omitted applies everywhere; a market code narrows it, and wins. */
  market?: string

  standardPrice: number
  discount: boolean
  /** Required when `discount`, and must be below standardPrice. */
  introPrice: number | null
  introMonths: number

  /** A sellable add-on. Mutually exclusive with `includedAddOnIds`. */
  addOnId: string | null
  addOnPurchaseType: AddOnPurchaseType | null
  addOnDiscountPercent: number | null
  /** Add-ons already bundled into this offer — a fact, not a purchase option. */
  includedAddOnIds: string[]
}

/** The fields a market or campaign may override on a tier. Sparse by design. */
export interface TierPatch {
  planName?: string
  description?: string
  features?: string[]
  logoTiles?: string[]
  logoTotal?: number
  ultimate?: boolean
  status?: Tier['status']
  visibleToPartners?: boolean
}

/** Where a card is being rendered. Omitted keys match anything. */
export interface Context {
  market: string
  campaign?: string
  /** Which storefront — `direct` or a partner code. */
  channel: string
  /** Which way of paying is on screen. */
  cadence: string
}

export interface Override {
  id: string
  when: Partial<Pick<Context, 'market' | 'campaign'>>
  priority?: number
  patch: TierPatch
}

export interface MarketConfig {
  code: string
  label: string
  locale: string
  currency: string
}

export interface CampaignConfig {
  code: string
  label: string
}

export interface ChannelConfig {
  code: string
  label: string
  /**
   * Markets this storefront operates in. Omitted means everywhere, which is
   * only true of `direct` — a partner belongs to its countries, and scoping the
   * channel once beats repeating the market on every journey it owns.
   */
  markets?: string[]
}

/** A set is the unit S-1, S-2 and S-3 are evaluated over. */
export interface CardSet {
  markets: MarketConfig[]
  campaigns: CampaignConfig[]
  channels: ChannelConfig[]
  cadences: string[]

  logoCatalog: CatalogEntry[]
  featureCatalog: FeatureEntry[]
  addOnCatalog: AddOnEntry[]

  tiers: Tier[]
  offers: CadenceOffer[]

  context: Context
  journeyId: string
  /**
   * How every feature line draws its icon.
   *
   * `feature` uses the one paired with the line in the catalogue. `check` draws
   * a tick on every row, and `hidden` draws none — both are set-wide house
   * styles, which is why they live here and not on a line.
   */
  featureIcons?: 'feature' | 'check' | 'hidden'
  stepId: string
  device: Device
}
