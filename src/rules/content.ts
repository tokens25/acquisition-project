import type { Money } from './money'

/**
 * Authored content only.
 *
 * Nothing derived or static appears here — that is the point. If a value can be
 * computed from another value, it lives in `derive.ts`, not in this type, so an
 * editor cannot author a number that contradicts the one beside it.
 *
 * Source: "Acquisition Card — Rules & Logic", §7 Authored vs derived strings.
 */

export type AddOnType = 'included' | 'one-time-payment' | 'discount-code'

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
  /** one-time-payment only. */
  price: Money
  /** discount-code only. */
  code: string
  discountPercent: number
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

  standardPrice: Money
  /** Used as the primary price when `discount` is on. */
  introPrice: Money
  /** How long the intro price runs, for the derived explainer. */
  introMonths: number
  /** Billing period word, e.g. "month". */
  installment: string

  /** CMS order is preserved, never sorted client-side (§5). */
  logos: AuthoredLogo[]
  /** Total competitions in the plan; drives the derived "+{n}" tile. */
  logoTotal: number

  addOn: AuthoredAddOn

  /** CMS order preserved (§7). */
  features: string[]
}

export type Device = 'mobile' | 'desktop' | 'xl'

/** A set is the unit that S-1, S-2 and S-3 are evaluated over (§2). */
export interface CardSet {
  locale: string
  device: Device
  cards: AuthoredCard[]
}
