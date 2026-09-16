import { channelAvailable, channelById, marketById } from './catalogue'
import type { Journey } from './journey'
import { usRsnJourneys } from './journeys'

/**
 * Which journey runs where — configured, never inferred.
 *
 * Two lookups, not one. A market journey is the general DAZN flow for a
 * country; a channel journey is one product's flow inside one country. They
 * are resolved separately because they are separately decided: a market can
 * have its own acquisition flow while every channel in it is still unwritten,
 * and a channel can be configured in Japan and not in the UK.
 *
 * A channel journey is keyed by the pair. NFL being sold in eight markets is a
 * fact about availability and says nothing about the flow: eight markets means
 * eight entries, because the pricing, the proposition and the steps are eight
 * separate decisions. Sharing is allowed — assign the same template to two
 * keys deliberately — but nothing shares by default, so editing Japan cannot
 * move the UK.
 */

/** One configured entry. Several journeys because a flow branches by who arrives. */
export interface JourneyConfig {
  /**
   * The variants of this flow — by user status and entry point. At least one.
   *
   * A list rather than a single journey because the entry point changes the
   * structure: arriving from a plan CTA already knows the tier, and the step
   * that would have asked is skipped rather than shown empty.
   */
  journeys: Journey[]
  /** Where the requirements came from, so a populated entry can be traced. */
  source?: string
}

/**
 * The general acquisition journey per market. Absent means unconfigured — an
 * honest state, and never a reason to show another market's flow.
 */
export const marketJourneys: Record<string, JourneyConfig> = {
  // Nothing agreed yet. The MSG flow that used to stand here was the US RSN
  // flow wearing every market's name, which is the bug this file exists to fix.
}

/**
 * The acquisition journey per market and channel, keyed market first.
 *
 * Only what has been confirmed is written. Everything else is absent and says
 * so on screen — an eligible channel with no flow yet is a channel that is
 * available and unconfigured, which are two different facts.
 */
export const channelJourneys: Record<string, Record<string, JourneyConfig>> = {
  us: {
    /**
     * The flow the Figma section actually draws: MSG+ on DAZN, its TV-provider
     * sign-in, its ZIP check and its migration paths. It belongs here and only
     * here — it is one American regional network's journey, not a template.
     *
     * Other RSN products are not assumed to share it. When a second one is
     * written it gets its own entry.
     */
    rsns: {
      journeys: usRsnJourneys,
      source: 'Figma — Landing page journeys (node 2350:75321), reconciled screen counts',
    },
  },
}

/** Why a journey could not be handed back. */
export type JourneyMiss =
  | { state: 'unavailable'; message: string }
  | { state: 'unconfigured'; scope: 'market' | 'channel'; message: string }

export type JourneyResolution =
  | { state: 'ok'; scope: 'market' | 'channel'; config: JourneyConfig }
  | JourneyMiss

/** The wording the tool shows. One sentence, and it does not apologise. */
export const UNCONFIGURED_CHANNEL = 'Journey not configured yet for this market and channel.'
export const UNCONFIGURED_MARKET = 'Journey not configured yet for this market.'

/**
 * The general journey for a market.
 *
 * Unknown market and unconfigured market are the same answer to the caller:
 * there is nothing to show and nothing to invent.
 */
export function resolveMarketJourney(marketId: string): JourneyResolution {
  const config = marketJourneys[marketId]
  if (!config) return { state: 'unconfigured', scope: 'market', message: UNCONFIGURED_MARKET }
  return { state: 'ok', scope: 'market', config }
}

/**
 * The journey for one channel in one market.
 *
 * Availability is checked first and separately. A channel that is not sold
 * here cannot be opened by a saved selection or a pasted link, and saying
 * "not configured" about it would be the wrong answer to a different question.
 */
export function resolveChannelJourney(marketId: string, channelId: string): JourneyResolution {
  if (!channelAvailable(channelId, marketId)) {
    const channel = channelById(channelId)?.label ?? channelId
    const market = marketById(marketId)?.label ?? marketId
    return { state: 'unavailable', message: `${channel} is not available in ${market}.` }
  }
  const config = channelJourneys[marketId]?.[channelId]
  if (!config) return { state: 'unconfigured', scope: 'channel', message: UNCONFIGURED_CHANNEL }
  return { state: 'ok', scope: 'channel', config }
}

/** Whether an entry has been written, without resolving it. */
export const hasChannelJourney = (marketId: string, channelId: string): boolean =>
  Boolean(channelJourneys[marketId]?.[channelId])

export const hasMarketJourney = (marketId: string): boolean => Boolean(marketJourneys[marketId])

/**
 * Every journey any entry configures.
 *
 * What used to be a cross product of two hundred and forty-six generated
 * copies. Now it is what somebody wrote down, which is why it is short.
 */
export const configuredJourneys: Journey[] = [
  ...Object.values(marketJourneys).flatMap((c) => c.journeys),
  ...Object.values(channelJourneys).flatMap((byChannel) =>
    Object.values(byChannel).flatMap((c) => c.journeys),
  ),
]
