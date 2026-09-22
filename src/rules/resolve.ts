import type {
  AddOnEntry,
  CadenceOffer,
  CardSet,
  CatalogEntry,
  Context,
  FeatureEntry,
  Override,
  Tier,
  TierPatch,
} from './content'
import { DIRECT } from './content'
import { channelsFor } from './catalogue'
import { cadenceOnTab, cadenceTabOf } from './tabs'

/**
 * Base plus differences, then joined to a way of paying.
 *
 * A tier is authored once. Markets and campaigns carry sparse patches applied
 * by specificity; pricing is a separate join, because the same plan is sold at
 * different prices depending on cadence and is often not sold at some at all.
 */

export function matches(override: Override, context: Context): boolean {
  const { market, campaign, tab } = override.when
  if (market !== undefined && market !== context.market) return false
  if (campaign !== undefined && campaign !== context.campaign) return false
  if (tab !== undefined && tab !== context.tab) return false
  return true
}

export function specificity(override: Override): number {
  return Object.values(override.when).filter((v) => v !== undefined).length
}

function applyPatch(tier: Tier, patch: TierPatch): Tier {
  // A sparse patch states what it changes. A key present but undefined is not a
  // change — spreading it would erase the base value.
  const stated = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<Tier>
  return { ...tier, ...stated }
}

export function resolveTier(tier: Tier, context: Context): Tier {
  return tier.overrides
    .map((o, index) => ({ o, index }))
    .filter(({ o }) => matches(o, context))
    .sort((a, b) => {
      const bySpecificity = specificity(a.o) - specificity(b.o)
      if (bySpecificity !== 0) return bySpecificity
      const byPriority = (a.o.priority ?? 0) - (b.o.priority ?? 0)
      if (byPriority !== 0) return byPriority
      return a.index - b.index
    })
    .reduce((acc, { o }) => applyPatch(acc, o.patch), tier)
}

/**
 * The offer for a tier at this cadence, in this market, on this tab.
 *
 * The row that names the most of them wins, market before tab: a price written
 * for this market is about where it is sold, and a price written for a tab is
 * about how it is presented, so the first is the stronger claim. Returning null
 * means the tier is not sold this way here — a fact to respect, not a gap to
 * fill.
 */
export function resolveOffer(
  set: CardSet,
  tierId: string,
  context: Context,
): CadenceOffer | null {
  const named = (o: CadenceOffer) => (o.market !== undefined ? 2 : 0) + (o.tab !== undefined ? 1 : 0)
  return set.offers
    .filter(
      (o) =>
        o.tierId === tierId &&
        o.cadence === context.cadence &&
        (o.market === undefined || o.market === context.market) &&
        (o.tab === undefined || o.tab === context.tab),
    )
    .reduce<CadenceOffer | null>((best, o) => (!best || named(o) > named(best) ? o : best), null)
}

/**
 * Which tiers a storefront may sell to new customers.
 *
 * `status` and partner visibility are separate dimensions. Direct enforces
 * live/legacy on itself; a partner storefront carries its own exclusive tiers
 * plus any direct tier flagged visible to partners — regardless of status,
 * because a partner may still be selling what DAZN has closed on its own.
 */
export function filterAcquirableTiers(
  tiers: Tier[],
  {
    channel = DIRECT,
    subscription,
    includeLegacy = false,
  }: {
    channel?: string
    subscription?: string
    includeLegacy?: boolean
  } = {},
): Tier[] {
  const onDirect = channel === DIRECT
  return tiers.filter((tier) => {
    if (!sellsTier(tier, subscription)) return false
    const tierChannel = tier.channel || DIRECT
    if (tierChannel === channel) {
      if (onDirect && !includeLegacy && tier.status !== 'live') return false
      return true
    }
    if (!onDirect && tierChannel === DIRECT) return tier.visibleToPartners === true
    return false
  })
}

/**
 * Whether this product sells this plan.
 *
 * A plan that names no product is the market's own — DAZN's plans, as the
 * pricing service groups them — and is sold in the market's general flow and
 * nowhere else. It used to mean "every product", from when MSG+ was the only
 * content and nothing had a product yet; now everything does, and a DAZN plan
 * turning up under FIBA is a plan on a page that is not selling it.
 *
 * A context that has not said what it is selling at all (`undefined`) is asked
 * nothing: the rules run over such contexts and cannot be told a plan is the
 * wrong one. The general flow says `''`, which is an answer.
 */
export function sellsTier(tier: Tier, subscription?: string): boolean {
  if (subscription === undefined) return true
  if (!tier.subscriptions?.length) return subscription === ''
  return tier.subscriptions.includes(subscription)
}

export interface ResolvedCard {
  tier: Tier
  offer: CadenceOffer
}

/**
 * The price a plan's card shows: its offer at the cadence on screen, or,
 * when it is not sold that way, the first way it is sold — in the set's
 * cadence order, so monthly before yearly.
 *
 * The picker is a picker of plans, not of plans sold monthly. DAZN Ultimate
 * in the UK is sold yearly only, and a picker set to Monthly that dropped it
 * would be hiding a plan rather than a price. The card says "Starts at" and
 * carries the unit of the offer it shows, so a yearly price beside monthly
 * ones reads as what it is.
 */
export function offerForCard(set: CardSet, tierId: string, context: Context): CadenceOffer | null {
  const at = resolveOffer(set, tierId, context)
  if (at) return at
  for (const cadence of set.cadences) {
    if (cadence === context.cadence) continue
    const other = resolveOffer(set, tierId, { ...context, cadence })
    if (other) return other
  }
  return null
}

/**
 * The price a card leads with. "Starts at" is the entry price: a card drawn
 * while a yearly or seasonal payment is the one on screen still says what a
 * month costs, where the plan is sold by the month — $279.99/year is not
 * where MSG+ starts. The checkout keeps reading the cadence on screen.
 */
function entryOffer(set: CardSet, tierId: string, context: Context): CadenceOffer | null {
  // A tab that names the way of paying prices every card its way, and a
  // plan not sold that way is not on it: the Weekly tab shows the weekly
  // passes, the Season tab the season prices.
  const tab = cadenceTabOf(set, context)
  if (tab) {
    const sold = set.cadences.filter((cadence) => resolveOffer(set, tierId, { ...context, cadence }))
    const cadence = cadenceOnTab(tab, sold)
    return cadence ? resolveOffer(set, tierId, { ...context, cadence }) : null
  }
  if (/year|season|annual/i.test(context.cadence)) {
    const monthly = resolveOffer(set, tierId, { ...context, cadence: 'Monthly' })
    if (monthly) return monthly
  }
  return offerForCard(set, tierId, context)
}

/** Tiers this storefront sells, in display order, each with the price its card shows. */
export function resolveSet(set: CardSet, context: Context = set.context): ResolvedCard[] {
  // Resolved before it is filtered: whether a plan is live here, or on this
  // tab, is a fact a market may patch — Spain's youth plans are live on their
  // tab and legacy everywhere else — and the filter must read the patch.
  return filterAcquirableTiers(
    set.tiers.map((tier) => resolveTier(tier, context)),
    { channel: context.channel, subscription: context.subscription },
  )
    .map((tier) => ({ tier, offer: entryOffer(set, tier.id, context) }))
    .filter((r): r is ResolvedCard => r.offer !== null)
    .sort((a, b) => a.tier.displayOrder - b.tier.displayOrder)
}

/** Tiers dropped from this view, and why — for the preview's blast radius. */
export function excludedTiers(set: CardSet, context: Context = set.context) {
  const acquirable = new Set(
    filterAcquirableTiers(set.tiers.map((t) => resolveTier(t, context)), {
      channel: context.channel,
      subscription: context.subscription,
    }).map((t) => t.id),
  )
  return set.tiers
    .filter((t) => !acquirable.has(t.id) || resolveOffer(set, t.id, context) === null)
    .map((t) => ({
      tier: t,
      reason: !sellsTier(t, context.subscription)
        ? context.subscription
          ? (`not sold with ${context.subscription}` as const)
          : ('not in the general flow' as const)
        : !acquirable.has(t.id)
          ? (`not sold on ${context.channel}` as const)
          : (`not sold ${context.cadence}` as const),
    }))
}

/* ── Catalogue resolution ─────────────────────────────────────
   Unknown id means no artwork exists — render a placeholder so the layout an
   editor sees now matches what lands later, and block publish. Deprecated means
   the artwork still exists, so keep rendering it and flag it. */

export type Resolution<T> =
  | { state: 'ok'; entry: T }
  | { state: 'deprecated'; entry: T }
  | { state: 'missing'; id: string }

function lookup<T extends { id: string; status: 'active' | 'deprecated' }>(
  catalog: T[],
  id: string,
): Resolution<T> {
  const entry = catalog.find((e) => e.id === id)
  if (!entry) return { state: 'missing', id }
  return entry.status === 'deprecated' ? { state: 'deprecated', entry } : { state: 'ok', entry }
}

export const resolveLogo = (set: CardSet, id: string): Resolution<CatalogEntry> =>
  lookup(set.logoCatalog, id)

export const resolveFeature = (set: CardSet, id: string): Resolution<FeatureEntry> =>
  lookup(set.featureCatalog, id)

export const findAddOn = (set: CardSet, id: string): AddOnEntry | undefined =>
  set.addOnCatalog.find((a) => a.id === id)

export function marketFor(set: CardSet, code: string) {
  return set.markets.find((m) => m.code === code) ?? set.markets[0]
}

/**
 * Every context worth validating — markets × products × channels × cadences,
 * with campaigns.
 *
 * The product is here because the set now varies by it. Left out, every context
 * would resolve every product's plans at once and the set-level rules would be
 * read over a set nobody is ever shown: two products each with one Ultimate
 * would fail S-1 together, which is a fact about the sum and not about anything
 * a customer can see.
 *
 * And a product is skipped where it is not sold, for the reason Movistar is
 * skipped in Germany: a context nobody can reach is not a gap to fill, and a
 * failure reported there is unfixable by definition.
 */
export function allContexts(set: CardSet): Context[] {
  const out: Context[] = []
  for (const market of set.markets) {
    // The market's general flow first — DAZN's own plans — then each product.
    const subscriptions = ['', ...channelsFor(market.code).map((c) => c.id)]
    for (const subscription of subscriptions) {
      for (const channel of set.channels) {
        if (channel.markets && !channel.markets.includes(market.code)) continue
        for (const cadence of set.cadences) {
          const base = {
            market: market.code,
            subscription,
            channel: channel.code,
            cadence,
          }
          out.push(base)
          for (const campaign of set.campaigns) {
            out.push({ ...base, campaign: campaign.code })
          }
        }
      }
    }
  }
  return out
}

/**
 * The override a write with this selector belongs to, if there is one.
 *
 * Matched on the whole selector, tab included. Matching on the market alone
 * was near enough while nothing was ever written per tab: now that the panel
 * always names one, it would hand an edit made on Ultimate to the override
 * Standard is written in, and the two tabs would quietly share a value they
 * are meant to be able to differ on.
 */
export function findOverride(tier: Tier, when: Override['when']): Override | undefined {
  return tier.overrides.find(
    (o) =>
      o.when.market === when.market &&
      o.when.campaign === when.campaign &&
      o.when.tab === when.tab,
  )
}
