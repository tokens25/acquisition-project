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

import type { FlowContent } from './flow'
import type { FlowLayer } from './layers'
import type { PipelineDoc } from './pipeline'

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
  /**
   * One line about what the competition gives you. Only the
   * "All features & content" dialog has room for it; the card shows the badge
   * alone. Authored on the catalogue rather than per tier, so the same
   * competition reads the same way in every plan that carries it.
   */
  blurb?: string
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

/** One tab over the plan picker. */
export interface PlanTab {
  id: string
  name: string
  /**
   * How the tab is drawn. `celebratory` is the Ultimate treatment — the gold
   * bolt before the name and the sparkle running behind it.
   *
   * Absent on tabs written before the choice existed; see `styleOf`.
   */
  style?: 'plain' | 'celebratory'
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
  /**
   * Which tabs of the plan picker this tier appears under.
   *
   * Absent — and empty — means every tab, which is what the design draws and
   * what every tier written before there were tabs meant. A tab is only worth
   * adding if the cards can differ between them, and this is how they differ.
   */
  tabs?: string[]
  /**
   * The words on the badge. Authored, not derived.
   *
   * Whether a badge appears at all is still the highlight switch's to decide —
   * two badged cards would contradict the rule that one plan is the
   * recommended one. What it *says* is copy, and copy is written rather than
   * computed. Left empty it falls back to the standing wording, so clearing
   * the field cannot ship a blank ribbon.
   */
  badge?: string
  /**
   * Who writes the description — a person, or the assistant.
   *
   * Stored per tier because it is a decision about this plan's copy, not a
   * preference of whoever has the panel open. Absent means custom: content
   * written before the choice existed was written by hand.
   */
  descriptionSource?: 'ai' | 'custom'
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

  /**
   * Which tab this price is for. Omitted applies on every tab, and a
   * tab-scoped row wins — the same sparseness `market` has, for the same
   * reason: most plans cost the same on both tabs, and the ones that do not
   * are a row rather than a second plan.
   */
  tab?: string

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

  /**
   * The sentence under the price. Authored, not derived.
   *
   * On the offer rather than the tier because it names this offer's numbers —
   * the intro months, the price it reverts to, the cadence it reverts at.
   * Empty falls back to the standing sentence built from those same numbers,
   * so clearing it cannot leave the price unexplained.
   */
  explainer?: string
  /** Who writes it — a person, or the assistant. Absent means custom. */
  explainerSource?: 'ai' | 'custom'

  /**
   * What the button says beyond the plan's name.
   *
   * `plain` is "Get Ultimate". The other two append the saving this offer
   * makes, as money or as a percentage. Both need a discount to have anything
   * to say, so without one they read as plain rather than as a promise of
   * nothing — the choice is remembered, it just has no effect until there is a
   * discount again.
   */
  ctaStyle?: 'plain' | 'saving-amount' | 'saving-percent'
  /**
   * What the button says, written out.
   *
   * Wins over the wording `ctaStyle` would build, because a person who has
   * typed something meant it. Empty falls back to that wording, so clearing
   * the field cannot ship a blank button — and the menu of savings is a way
   * of filling this in, not a second place the answer lives.
   */
  ctaLabel?: string
}

/** The fields a market or campaign may override on a tier. Sparse by design. */
export interface TierPatch {
  planName?: string
  description?: string
  features?: string[]
  logoTiles?: string[]
  logoTotal?: number
  ultimate?: boolean
  tabs?: string[]
  badge?: string
  descriptionSource?: Tier['descriptionSource']
  status?: Tier['status']
  visibleToPartners?: boolean
}

/** Where a card is being rendered. Omitted keys match anything. */
export interface Context {
  market: string
  /**
   * Which product is being sold — DAZN's own subscription, or one of the
   * league packages.
   *
   * Optional because nothing derives from it yet: it picks the journey and
   * waits there. Made required it would multiply every context the rules run
   * over, and there is nothing yet for those extra runs to find.
   */
  subscription?: string
  campaign?: string
  /** Which storefront — `direct` or a partner code. */
  channel: string
  /** Which way of paying is on screen. */
  cadence: string
  /**
   * Which tab of the plan picker is on screen.
   *
   * Here with the rest of what is being looked at, because a tab is one: the
   * same plan can be sold at a different price on the Ultimate tab, and the
   * price a card shows depends on the tab the same way it depends on the
   * cadence. Absent means no tab is showing — the picker has none.
   */
  tab?: string
}

export interface Override {
  id: string
  when: Partial<Pick<Context, 'market' | 'campaign' | 'tab'>>
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
/**
 * How far this content has got through review.
 *
 * `draft` — being written; nothing has been asked of anyone.
 * `in-review` — handed to product and UX, waiting on them.
 * `approved` — they said yes.
 */
export type ReviewState = 'draft' | 'in-review' | 'approved'

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
  /**
   * The tabs over the plan picker.
   *
   * Here rather than in `flow` because a tab is a way of dividing the cards,
   * and the cards live here. Absent means the two the design draws, so content
   * written before tabs were authored still draws Standard and Ultimate.
   */
  planTabs?: PlanTab[]
  /**
   * A market's own tabs, once it has taken them.
   *
   * Markets are separate, and the tabs are as much a market's decision as the
   * words on its screens — one market sells Standard and Ultimate, another
   * sells neither. A market reads `planTabs` until it edits, and owns its list
   * from then on.
   */
  planTabsByMarket?: Record<string, PlanTab[]>

  context: Context
  journeyId: string
  /**
   * Step order per journey, when it differs from the one drawn in Figma.
   *
   * Only journeys that have been reordered appear here, so an absent key means
   * "as drawn" rather than "unknown" — and resetting is deleting, not restoring
   * a copy of the default that could itself go stale.
   */
  stepOrder?: Record<string, string[]>
  /**
   * How every feature line draws its icon.
   *
   * `feature` uses the one paired with the line in the catalogue. `check` draws
   * a tick on every row, and `hidden` draws none — both are set-wide house
   * styles, which is why they live here and not on a line.
   */
  featureIcons?: 'feature' | 'check' | 'hidden'
  /**
   * What follows the slash after a price, per cadence — "$29.99 /month".
   *
   * Keyed by cadence rather than held on an offer, because it is a fact about
   * how you pay and not about what a particular plan costs: every price at a
   * cadence reads the same way, and writing it per offer is how one plan ends
   * up saying "/month" beside another saying "/monthly".
   *
   * Absent means the cadence's own name, lower-cased — so nothing has to be
   * written until something needs to read differently from how it is listed.
   */
  priceUnits?: Record<string, string>
  /**
   * The words on the screens after the plan picker.
   *
   * A separate shape rather than more fields here: a plan and a checkout page
   * are different kinds of content, and folding one into the other would put
   * a nav title beside a price.
   */
  flow?: FlowContent
  /**
   * Copy that differs by situation — market, subscription, user status, entry
   * point — as sparse layers over `flow`.
   *
   * Layers rather than a copy of `flow` per situation: there are 240 of them,
   * and a fix to a shared line has to reach every one that has not deliberately
   * said otherwise. A layer holds only the fields it changes.
   */
  flowLayers?: FlowLayer[]
  /**
   * Kept with the content rather than in the page, because it is a fact about
   * this content and not about this browser tab: reloading does not un-ask for
   * a review, and editing after asking drops it back to `draft` rather than
   * leaving an approval standing over copy nobody approved.
   */
  review?: ReviewState
  /** Where each section stands in the Market → Dev handoff. */
  pipeline?: PipelineDoc
  stepId: string
  device: Device
}
