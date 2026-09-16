import { structureKey } from './onboarding'

/**
 * Telling which generated flow a plan belongs to.
 *
 * Its own module, and a leaf one: the resolver needs the answer, and the
 * generator needs to produce ids the resolver can read, and putting it in
 * either of those two would have them importing each other.
 *
 * The answer comes from the id rather than from parsing it back into parts.
 * Channel ids contain hyphens — `national-league` — so a parser would have to
 * guess where the market ends, and guess wrong on exactly the channels nobody
 * tests. Comparing against the prefix this situation would produce needs no
 * guess.
 */

/** `channel:jp/nfl` → `channel-jp-nfl`. Must match what the generator uses. */
const slug = (key: string): string => key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

/** The id prefix every plan of one flow shares. */
export const flowIdKey = (marketId: string, channelId?: string): string =>
  `gen-${slug(structureKey(marketId, channelId))}`

/** What a generated plan's id begins with, for this flow. */
export const planIdPrefix = (marketId: string, channelId?: string): string =>
  `${flowIdKey(marketId, channelId)}-plan-`

/** Whether setup made this plan at all. Hand-written plans are nobody's flow. */
export const isGeneratedPlan = (tierId: string): boolean => tierId.startsWith('gen-')

/**
 * Whether this plan was built by setup for a different flow.
 *
 * Plans belong to the flow that made them. A plan built for Japan's general
 * flow has no product on it, which every product then reads as "sold with all
 * of them" — so without this, running setup once for a market puts its plans
 * in the picker of every channel in that market, where nobody can price them
 * and nobody asked for them.
 */
export function fromAnotherFlow(
  tierId: string,
  marketId: string,
  channelId?: string,
): boolean {
  if (!isGeneratedPlan(tierId)) return false
  return !tierId.startsWith(planIdPrefix(marketId, channelId))
}
