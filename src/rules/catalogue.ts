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
  /** Everything not named by another market. Exactly one may say this. */
  catchAll?: true
}

/**
 * The twenty markets.
 *
 * Every country named here resolves to itself. "ROW: Everyone else" is the
 * market for countries that are not named — a market in its own right, not a
 * fallback that swallows the ones above it. The US in particular must never
 * fall into it: it is the one market whose channel list differs from all the
 * others, so resolving it by accident is the failure this list exists to stop.
 */
export const MARKETS: readonly MarketConfigEntry[] = [
  // Core
  { id: 'be', label: 'Belgium', group: 'core' },
  { id: 'at', label: 'DACH: Austria', group: 'core' },
  { id: 'de', label: 'DACH: Germany', group: 'core' },
  { id: 'li', label: 'DACH: Liechtenstein', group: 'core' },
  { id: 'lu', label: 'DACH: Luxembourg', group: 'core' },
  { id: 'ch', label: 'DACH: Switzerland', group: 'core' },
  { id: 'fr', label: 'France', group: 'core' },
  { id: 'it', label: 'Italy', group: 'core' },
  { id: 'jp', label: 'Japan', group: 'core' },
  { id: 'pt', label: 'Portugal', group: 'core' },
  { id: 'es', label: 'Spain', group: 'core' },
  { id: 'tw', label: 'Taiwan', group: 'core' },

  // Growth
  { id: 'ca', label: 'Canada', group: 'growth' },
  { id: 'row', label: 'ROW: Everyone else', group: 'growth', catchAll: true },
  { id: 'ie', label: 'ROW: Ireland', group: 'growth' },
  { id: 'mx', label: 'ROW: Mexico', group: 'growth' },
  { id: 'nl', label: 'ROW: Netherlands', group: 'growth' },
  { id: 'pl', label: 'ROW: Poland', group: 'growth' },
  { id: 'gb', label: 'UK', group: 'growth' },
  { id: 'us', label: 'US', group: 'growth' },
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
 * The seven channels, with the availability rules on them rather than in the
 * screens that ask.
 *
 * The rule is a single split: the RSNs are American and nothing else is. The
 * US carries FIBA, RallyTV and the RSNs; every other market carries FIBA,
 * RallyTV and the four leagues.
 */
export const CHANNELS: readonly ChannelConfigEntry[] = [
  { id: 'fiba', label: 'FIBA' },
  { id: 'national-league', label: 'National League', notSoldIn: ['us'] },
  { id: 'ncaa', label: 'NCAA', notSoldIn: ['us'] },
  { id: 'nfl', label: 'NFL', notSoldIn: ['us'] },
  { id: 'nhl', label: 'NHL', notSoldIn: ['us'] },
  { id: 'rallytv', label: 'RallyTV' },
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
