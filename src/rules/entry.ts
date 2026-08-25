import type { Context } from './content'
import type { Journey } from './journey'
import { journeyApplies } from './journey'

/**
 * Choosing a journey by describing the situation instead of naming it.
 *
 * A journey is identified in the design by two questions — who the user is,
 * and where they arrived from — rather than by an id like `hero-signup`. That
 * is the better mental model: nobody outside this repository knows what
 * `hero-signup` means, but everyone can answer "anonymous, pressed Sign up".
 *
 * The catch is that the pair is not unique. Three situations resolve to more
 * than one journey, for three different reasons — two surfaces sharing the
 * words "Sign up", one entry with two outcomes, and one email covering three
 * account states. Rather than pretend otherwise, `journeysMatching` returns
 * every match and the caller asks which one when there is a choice.
 */

/** User statuses present in the modelled journeys, in a sensible reading order. */
const STATUS_ORDER = [
  'anonymous',
  'registered-free',
  'paying-dazn',
  'paying-msg',
  'rsn-lower-tier',
  'tve-entitled',
  'migrating',
]

export const STATUS_LABELS: Record<string, string> = {
  anonymous: 'Logged out',
  'registered-free': 'Logged in — free',
  'paying-dazn': 'Logged in — paying DAZN',
  'paying-msg': 'Logged in — paying MSG+',
  'rsn-lower-tier': 'Existing RSN subscriber',
  'tve-entitled': 'TV provider subscriber',
  migrating: 'Being migrated',
}

/** Journeys that can run at all in this market and storefront. */
function available(all: Journey[], context: Context): Journey[] {
  return all.filter((j) => journeyApplies(j, context))
}

/** User statuses with at least one journey here. */
export function userStatuses(all: Journey[], context: Context): string[] {
  const present = new Set(available(all, context).map((j) => j.audience))
  const known = STATUS_ORDER.filter((s) => present.has(s))
  const rest = [...present].filter((s) => !STATUS_ORDER.includes(s)).sort()
  return [...known, ...rest]
}

/**
 * Entry points open to a user status.
 *
 * Narrowed deliberately: someone being migrated never arrives from "Upgrade",
 * and offering the pair would produce a selection with no journey behind it.
 */
export function entryPoints(all: Journey[], context: Context, status: string): string[] {
  const ctas = available(all, context)
    .filter((j) => j.audience === status)
    .map((j) => j.entry.cta)
  return [...new Set(ctas)]
}

/** Every journey matching the situation — usually one, sometimes several. */
export function journeysMatching(
  all: Journey[],
  context: Context,
  status: string,
  entryCta: string,
): Journey[] {
  return available(all, context).filter((j) => j.audience === status && j.entry.cta === entryCta)
}

/**
 * The situation a journey represents, for restoring the pickers from a saved
 * journey id rather than making someone re-answer the questions.
 */
export function situationOf(journey: Journey): { status: string; entryCta: string } {
  return { status: journey.audience, entryCta: journey.entry.cta }
}
