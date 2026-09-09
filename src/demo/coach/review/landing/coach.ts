import type { CoachReviewContext } from '../../brief'
import { evidenceGuard } from '../coach'
import { scoreReview } from '../score'
import type { JourneySnapshot } from '../snapshot'
import type { Finding, Review, Severity } from '../types'
import { LANDING_RULES } from '../rules/landingRules'
import { runContentRules } from '../rules/run'
import { LANDING_BRAINS } from './brains'
import type { LandingFacts } from './facts'

/**
 * The Coach, reading the landing page.
 *
 * The same engine as the journey's: the specialists run, the evidence guard
 * holds a Fix to what the page itself shows, the same questions are scored
 * and the same review comes out — so the panel, the marks and the results
 * rail need to know nothing about which of the two they are showing.
 *
 * What changes is who reads and what they read. The journey's brains ask
 * whether somebody can get through; these ask whether a page says something,
 * says it once, and offers a way in.
 */

const SEVERITY_RANK: Record<Severity, number> = { fix: 4, test: 3, check: 2, note: 1 }
const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 }
const rank = (f: Finding) => SEVERITY_RANK[f.severity] * 10 + CONFIDENCE_RANK[f.confidence]

export function runLandingCoach(
  snapshot: JourneySnapshot,
  facts: LandingFacts,
  context: CoachReviewContext,
  extra: Finding[] = [],
): Review {
  const raw = [
    ...runContentRules(LANDING_RULES, facts),
    ...LANDING_BRAINS.flatMap((b) => b.run(facts, context)),
    ...extra,
  ]
  /*
   * No merge step. Two brains reading one element is a thing that happens to
   * a screen with a plan card on it; here each rule owns its own element, and
   * merging on the element would fold two true observations about the same
   * component into one sentence that says neither.
   */
  const { findings, guarded } = evidenceGuard(raw)
  findings.sort((a, b) => rank(b) - rank(a))
  const scores = scoreReview(findings, context, snapshot)
  return {
    at: new Date().toISOString(),
    context,
    journey: {
      id: snapshot.journey.id,
      name: snapshot.journey.name,
      entryCta: snapshot.journey.entryCta,
      market: snapshot.market.label,
    },
    /* The components a reader meets, which is what was actually read. */
    screensReviewed: facts.drawn.length,
    findings,
    ...scores,
    reliability: { guarded, total: findings.length },
    ai: 'pending',
  }
}
