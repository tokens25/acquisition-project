/**
 * Authored content only.
 *
 * Nothing derived or static appears here — that is the point. If a value can be
 * computed from another value it lives in `derive.ts`, so an editor cannot
 * author a number that contradicts the one beside it.
 *
 * Source: "Acquisition Card — Rules & Logic", §7 Authored vs derived strings.
 */

export type AddOnType = 'included' | 'one-time-payment' | 'discount-code'
export type Device = 'mobile' | 'desktop' | 'xl'

export interface AuthoredLogo {
  /** Bundled badge id, or an external src. */
  id?: string
  src?: string
  alt: string
}

export interface AuthoredAddOn {
  enabled: boolean
  type: AddOnType
  /** The add-on's own name — unrelated to the plan (§7). */
  title: string
  subtitle: string
  imageId: string
  imageSrc: string
  /** one-time-payment only. Major units; currency comes from the market. */
  price: number
  /** discount-code only. */
  code: string
  discountPercent: number
}

/** The fields a market or campaign may override. Sparse by design. */
export interface CardPatch {
  planName?: string
  description?: string
  ultimate?: boolean
  discount?: boolean
  standardPrice?: number
  introPrice?: number
  introMonths?: number
  installment?: string
  logos?: AuthoredLogo[]
  logoTotal?: number
  addOn?: Partial<AuthoredAddOn>
  features?: string[]
}

/** Where a card is being rendered. Omitted keys match anything. */
export interface Context {
  market: string
  campaign?: string
}

/**
 * A sparse difference from the base card.
 *
 * `when` is a selector: omitted keys are wildcards. Overrides are applied in
 * order of specificity — the number of constraints — so a market+campaign
 * override wins over a market one, which wins over the base.
 */
export interface Override {
  id: string
  when: Partial<Context>
  /** Deterministic tiebreak when two overrides have equal specificity. */
  priority?: number
  patch: CardPatch
}

export interface AuthoredCard {
  id: string

  /** One value, three surfaces: header, "Get X", "Included in X" (§4). */
  planName: string
  /** Full text, never pre-truncated (§7). Truncation is a runtime measurement. */
  description: string

  /** Switch — drives four outputs (§3). */
  ultimate: boolean
  /** Switch — drives five outputs across two components (§3). */
  discount: boolean

  /** Major units. Currency belongs to the market, not the card. */
  standardPrice: number
  /** Primary price while `discount` is on. */
  introPrice: number
  /** How long the intro price runs, for the derived explainer. */
  introMonths: number
  /** Billing period word, e.g. "month". */
  installment: string

  /** CMS order is preserved, never sorted client-side (§5). */
  logos: AuthoredLogo[]
  /** Total competitions; drives the derived "+{n}" tile. */
  logoTotal: number

  addOn: AuthoredAddOn

  /** CMS order preserved (§7). */
  features: string[]

  /** Differences from the above, per market / campaign. */
  overrides: Override[]
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

/** A set is the unit that S-1, S-2 and S-3 are evaluated over (§2). */
export interface CardSet {
  markets: MarketConfig[]
  campaigns: CampaignConfig[]
  /** Which market / campaign the preview is showing. */
  context: Context
  device: Device
  cards: AuthoredCard[]
}
