import type { CoachReviewContext } from '../brief'
import type { CoachSubject } from '../subject'
import { runCoach } from './coach'
import { runLandingCoach } from './landing/coach'
import { landingFacts } from './landing/facts'
import type { JourneySnapshot } from './snapshot'
import type { Finding, Review } from './types'
import type { CardSet } from '../../../rules/content'

/**
 * The rule sets, and which product reads which.
 *
 * One place that knows a product has a Coach of its own, so adding a third —
 * a paywall, a retention flow — is a line here and a set of rules, rather
 * than another branch in the tool. Everything downstream of a review is told
 * nothing about which set produced it.
 */

export interface RuleSet {
  id: string
  /** What this set reads, in the words the interface should use for it. */
  subject: CoachSubject
  label: string
  run: (
    snapshot: JourneySnapshot,
    set: CardSet,
    context: CoachReviewContext,
    extra?: Finding[],
  ) => Review
}

export const RULE_SETS: RuleSet[] = [
  {
    id: 'flow',
    subject: 'journey',
    label: 'The acquisition flow',
    run: (snapshot, _set, context, extra) => runCoach(snapshot, context, extra),
  },
  {
    id: 'landing',
    subject: 'page',
    label: 'The landing page',
    /* The written-down rules and the readings that need judgement, together:
       see `rules/landingRules.ts` for the list and `landing/brains.ts` for
       the rest. */
    run: (snapshot, set, context, extra) => runLandingCoach(snapshot, landingFacts(set), context, extra),
  },
]

const BY_ID = Object.fromEntries(RULE_SETS.map((s) => [s.id, s]))

/** The set a product reads by, falling back to the flow's. */
export function ruleSet(id: string): RuleSet {
  return BY_ID[id] ?? BY_ID.flow
}
