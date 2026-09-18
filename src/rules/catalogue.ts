/**
 * Where DAZN sells, and what it sells there.
 *
 * Two dimensions, kept apart on purpose. A market is a country (or the
 * catch-all for the ones not named); a channel is a product sold inside the
 * markets that carry it. They were one list before this file existed — the
 * leagues sat among the countries — and that made "NFL" answer both questions
 * at once, which is how NFL in Japan and NFL in the UK ended up as one thing.
 *
 * Nothing here is derived from a name. "DACH" and "ROW" are how the business
 * groups these markets for reading, and grouping is all they do: Germany and
 * Austria share a prefix and share nothing else, and Ireland is as separate
 * from "Everyone else" as Japan is.
 */

/** Which half of the portfolio a market sits in. Organisation, not behaviour. */
export type MarketGroup = 'core' | 'growth'

export interface MarketConfigEntry {
  /** Stable id. Never derived from the label, never parsed for a prefix. */
  id: string
  /** As the business writes it, prefix included. */
  label: string
  group: MarketGroup
  /**
   * The country's flag, as the pricing backend carries it.
   *
   * A picture of the answer, not the answer: it sits beside the label in a
   * picker and nothing reads it. The catch-all gets a globe, because "everyone
   * else" is not a country and giving it somebody's flag would say it was.
   */
  flag: string
  /** Everything not named by another market. Exactly one may say this. */
  catchAll?: true
}

/**
 * The twenty-one markets — the ones DAZN's offers service prices.
 *
 * Read from the pricing API on 18 Sep 2026 (`scripts/pull-dazn.mjs`), not from
 * a spec. Every one of these answered with priced DAZN plans in its own
 * currency. What is not here is "ROW: Everyone else": the service has no such
 * country, so the tool has no such market — a catch-all that cannot be priced
 * cannot be sold. Australia and Brazil are here because the service prices
 * them, whatever an earlier list said.
 */
export const MARKETS: readonly MarketConfigEntry[] = [
  // Core
  { id: 'be', label: 'Belgium', group: 'core', flag: '🇧🇪' },
  { id: 'at', label: 'Austria', group: 'core', flag: '🇦🇹' },
  { id: 'de', label: 'Germany', group: 'core', flag: '🇩🇪' },
  { id: 'li', label: 'Liechtenstein', group: 'core', flag: '🇱🇮' },
  { id: 'lu', label: 'Luxembourg', group: 'core', flag: '🇱🇺' },
  { id: 'ch', label: 'Switzerland', group: 'core', flag: '🇨🇭' },
  { id: 'fr', label: 'France', group: 'core', flag: '🇫🇷' },
  { id: 'it', label: 'Italy', group: 'core', flag: '🇮🇹' },
  { id: 'jp', label: 'Japan', group: 'core', flag: '🇯🇵' },
  { id: 'pt', label: 'Portugal', group: 'core', flag: '🇵🇹' },
  { id: 'es', label: 'Spain', group: 'core', flag: '🇪🇸' },
  { id: 'tw', label: 'Taiwan', group: 'core', flag: '🇹🇼' },

  // Growth
  { id: 'au', label: 'Australia', group: 'growth', flag: '🇦🇺' },
  { id: 'br', label: 'Brazil', group: 'growth', flag: '🇧🇷' },
  { id: 'ca', label: 'Canada', group: 'growth', flag: '🇨🇦' },
  { id: 'ie', label: 'Ireland', group: 'growth', flag: '🇮🇪' },
  { id: 'mx', label: 'Mexico', group: 'growth', flag: '🇲🇽' },
  { id: 'nl', label: 'Netherlands', group: 'growth', flag: '🇳🇱' },
  { id: 'pl', label: 'Poland', group: 'growth', flag: '🇵🇱' },
  { id: 'gb', label: 'United Kingdom', group: 'growth', flag: '🇬🇧' },
  { id: 'us', label: 'United States', group: 'growth', flag: '🇺🇸' },
]

export const MARKET_GROUP_LABELS: Record<MarketGroup, string> = {
  core: 'Core',
  growth: 'Growth Markets',
}

export interface ChannelConfigEntry {
  /** Stable id, used as the second half of a channel journey's key. */
  id: string
  label: string
  /**
   * Where this channel is sold. Exactly one of these, or neither.
   *
   * Neither means every market. Written as the exception rather than as a
   * twenty-entry list per channel, because the exception is the fact anyone
   * has actually decided — and a list repeated seven times is seven places for
   * a new market to be forgotten.
   */
  soldOnlyIn?: readonly string[]
  notSoldIn?: readonly string[]
}

/**
 * The seven channels. Six are DAZN's product groups, named as the pricing
 * service names them, with availability read from which markets it priced
 * them in on 18 Sep 2026. The rules an earlier spec wrote — "the leagues are
 * not sold in the US" — were wrong in both directions: the US does sell NFL,
 * and NHL is sold in twelve markets, not twenty.
 *
 * The seventh, the RSNs, is in neither API. It is the one flow the design file
 * draws and the content the tool shipped with, so it stays — as what it is,
 * one American product this tool knows about and DAZN's pricing service does
 * not. Nothing else in this list is decided by hand.
 */
export const CHANNELS: readonly ChannelConfigEntry[] = [
  { id: 'fiba', label: 'FIBA' },
  { id: 'nfl', label: 'NFL', notSoldIn: ['ca'] },
  { id: 'nhl', label: 'NHL', soldOnlyIn: ['at', 'ch', 'de', 'fr', 'gb', 'ie', 'jp', 'li', 'lu', 'pl', 'pt', 'tw'] },
  { id: 'college-sports', label: 'College Sports', notSoldIn: ['ca', 'us'] },
  { id: 'rallytv', label: 'Rally TV', notSoldIn: ['fr', 'jp', 'pl', 'pt'] },
  { id: 'national-league', label: 'National League TV' },
  { id: 'rsns', label: 'RSNs', soldOnlyIn: ['us'] },
]

/** Whether a channel is sold in a market. The one place this is decided. */
export function channelAvailable(channelId: string, marketId: string): boolean {
  const channel = CHANNELS.find((c) => c.id === channelId)
  if (!channel) return false
  if (channel.soldOnlyIn) return channel.soldOnlyIn.includes(marketId)
  if (channel.notSoldIn) return !channel.notSoldIn.includes(marketId)
  return true
}

/** The channels a market carries, in catalogue order. */
export function channelsFor(marketId: string): readonly ChannelConfigEntry[] {
  return CHANNELS.filter((c) => channelAvailable(c.id, marketId))
}

export const marketById = (id: string): MarketConfigEntry | undefined =>
  MARKETS.find((m) => m.id === id)

export const channelById = (id: string): ChannelConfigEntry | undefined =>
  CHANNELS.find((c) => c.id === id)

/** Markets in a group, for a picker that shows the two headings. */
export const marketsInGroup = (group: MarketGroup): readonly MarketConfigEntry[] =>
  MARKETS.filter((m) => m.group === group)
