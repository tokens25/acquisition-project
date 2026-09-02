import { BUSINESS_GOALS, type BusinessGoalId, type CoachReviewContext } from '../brief'
import { BASELINE, HEALTH_CRITERIA, type CriterionId } from './doctrine'
import { screenName, type JourneySnapshot } from './snapshot'
import type { AlignmentScore, Confidence, CriterionScore, Finding, Review, ScoreBand, ScreenId, ScreenScore, Severity } from './types'

/**
 * Two scores, never blended.
 *
 * JOURNEY HEALTH is the always-on baseline (questions 1 to 8), unweighted, so
 * the same journey gets the same number whichever goal is chosen. GOAL
 * ALIGNMENT is how strongly the journey supports each configured direction,
 * from the findings that speak to it.
 *
 * PRODUCT-DEFINED WEIGHTS. The costs and factors below are choices made to
 * make the score legible, not measurements. They have not been calibrated
 * against DAZN experiments, analytics, expert review or research, and they
 * should not be read as scientifically derived. Each finding takes a share of
 * what is left, so penalties compound rather than stack.
 */
export const WEIGHTS = {
  cost: { fix: 22, test: 12, check: 9, note: 0 } as Record<Severity, number>,
  confidence: { high: 1, medium: 0.7, low: 0.4 } as Record<Confidence, number>,
  note: 'Product-defined weights, not calibrated.',
}

const cost = (f: Finding) => WEIGHTS.cost[f.severity] * WEIGHTS.confidence[f.confidence]
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const remaining = (fs: Finding[]) => fs.reduce((left, f) => left * (1 - cost(f) / 100), 100)

export function band(score: number): ScoreBand {
  if (score >= 85) return 'strong'
  if (score >= 70) return 'sound'
  if (score >= 50) return 'needs-work'
  return 'at-risk'
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  strong: 'Ready to ship',
  sound: 'Nearly there',
  'needs-work': 'Needs work',
  'at-risk': 'Not ready',
}

export const ALIGNMENT_LABEL: Record<ScoreBand, string> = {
  strong: 'Strongly supports it',
  sound: 'Mostly supports it',
  'needs-work': 'Partly supports it',
  'at-risk': 'Works against it',
}

const counts = (fs: Finding[]) => ({
  fixes: fs.filter((f) => f.severity === 'fix').length,
  tests: fs.filter((f) => f.severity === 'test').length,
  checks: fs.filter((f) => f.severity === 'check').length,
  notes: fs.filter((f) => f.severity === 'note').length,
})

export function scoreCriteria(findings: Finding[]): CriterionScore[] {
  return BASELINE.map((c) => {
    const mine = findings.filter((f) => f.criterion === c.id)
    return { id: c.id, n: c.n, label: c.label, question: c.question, score: clamp(remaining(mine)), ...counts(mine) }
  })
}

/** Alignment with one direction: the findings that support or work against it. */
function scoreAlignment(findings: Finding[], goals: BusinessGoalId[]): AlignmentScore[] {
  return goals.map((goal) => {
    const against = findings.filter((f) => f.goals[goal] === -1)
    const supports = findings.filter((f) => f.goals[goal] === 1)
    const score = clamp(remaining(against))
    return {
      goal,
      label: BUSINESS_GOALS.find((g) => g.id === goal)?.label ?? goal,
      score,
      band: band(score),
      supports: supports.length,
      against: against.length,
    }
  })
}

function scoreScreens(findings: Finding[], s: JourneySnapshot): ScreenScore[] {
  const ids: ScreenId[] = ['journey', ...s.rendered.map((r) => r.id)]
  return ids.map((id) => {
    const mine = findings.filter((f) => f.screen === id || f.alsoOn?.includes(id))
    return { screen: id, name: screenName(s, id), score: clamp(remaining(mine.filter((f) => f.screen === id))), ...counts(mine) }
  })
}

export function scoreReview(findings: Finding[], ctx: CoachReviewContext, s: JourneySnapshot): Pick<Review, 'health' | 'alignment' | 'byScreen'> {
  const byCriterion = scoreCriteria(findings)
  const health = byCriterion.filter((c) => HEALTH_CRITERIA.some((h) => h.id === c.id))
  const overall = clamp(health.reduce((n, c) => n + c.score, 0) / health.length)
  return {
    health: { overall, band: band(overall), byCriterion },
    alignment: scoreAlignment(findings, ctx.businessGoals),
    byScreen: scoreScreens(findings, s),
  }
}

/** Points a question gets back if this one finding were resolved. */
export function gainIfResolved(findings: Finding[], f: Finding): number {
  const mine = findings.filter((x) => x.criterion === f.criterion)
  return Math.max(0, Math.round(remaining(mine.filter((x) => x.id !== f.id)) - remaining(mine)))
}

/** Where a question would land with its fixes done, and with tests and checks settled too. */
export function reachIfResolved(findings: Finding[], criterion: CriterionId): { fixesDone: number; allSettled: number } {
  const mine = findings.filter((x) => x.criterion === criterion)
  return {
    fixesDone: clamp(remaining(mine.filter((x) => x.severity !== 'fix'))),
    allSettled: clamp(remaining(mine.filter((x) => x.severity === 'note'))),
  }
}
