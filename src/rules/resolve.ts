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
  { channel = DIRECT, includeLegacy = false }: { channel?: string; includeLegacy?: boolean } = {},
): Tier[] {
  const onDirect = channel === DIRECT
  return tiers.filter((tier) => {
    const tierChannel = tier.channel || DIRECT
    if (tierChannel === channel) {
      if (onDirect && !includeLegacy && tier.status !== 'live') return false
      return true
    }
    if (!onDirect && tierChannel === DIRECT) return tier.visibleToPartners === true
    return false
  })
}

export interface ResolvedCard {
  tier: Tier
  offer: CadenceOffer
}

/** Tiers this storefront sells at this cadence, in display order. */
export function resolveSet(set: CardSet, context: Context = set.context): ResolvedCard[] {
  return filterAcquirableTiers(set.tiers, { channel: context.channel })
    .map((tier) => ({ tier: resolveTier(tier, context), offer: resolveOffer(set, tier.id, context) }))
    .filter((r): r is ResolvedCard => r.offer !== null)
    .sort((a, b) => a.tier.displayOrder - b.tier.displayOrder)
}

/** Tiers dropped from this view, and why — for the preview's blast radius. */
export function excludedTiers(set: CardSet, context: Context = set.context) {
  const acquirable = new Set(
    filterAcquirableTiers(set.tiers, { channel: context.channel }).map((t) => t.id),
  )
  return set.tiers
    .filter((t) => !acquirable.has(t.id) || resolveOffer(set, t.id, context) === null)
    .map((t) => ({
      tier: t,
      reason: !acquirable.has(t.id)
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

/** Every context worth validating — markets × channels × cadences, with campaigns. */
export function allContexts(set: CardSet): Context[] {
  const out: Context[] = []
  for (const market of set.markets) {
    for (const channel of set.channels) {
      // A partner storefront belongs to its markets. Validating Movistar in
      // Germany does not just waste a check — it invents a context nobody can
      // reach, and a failure reported there is unfixable by definition.
      if (channel.markets && !channel.markets.includes(market.code)) continue
      for (const cadence of set.cadences) {

        out.push({ market: market.code, channel: channel.code, cadence })
        for (const campaign of set.campaigns) {
          out.push({ market: market.code, channel: channel.code, cadence, campaign: campaign.code })
        }
      }
    }
  }
  return out
}

export function findOverride(tier: Tier, context: Context): Override | undefined {
  return tier.overrides.find(
    (o) => o.when.market === context.market && o.when.campaign === context.campaign,
  )
}
