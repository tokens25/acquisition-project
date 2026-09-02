/**
 * The Acquisition Baseline: the questions the Coach asks of every journey,
 * every time, whatever the goal. The first eight make the Journey Health
 * score, which is the same for a journey whichever goal is chosen. The
 * ninth, goal alignment, is scored on its own per configured direction.
 *
 * Coach reliability (how often the evidence guard had to step in) is not a
 * question about the journey and is reported outside these scores.
 */
export type CriterionId =
  | 'completion'
  | 'decision-clarity'
  | 'package-comparison'
  | 'decision-friction'
  | 'purchase-confidence'
  | 'offer-comprehension'
  | 'journey-consistency'
  | 'informed-choice'
  | 'goal-alignment'

export interface Criterion {
  id: CriterionId
  n: number
  label: string
  /** The owner's question, verbatim. */
  question: string
  /** Counts toward Journey Health. Goal alignment does not. */
  health: boolean
}

export const BASELINE: Criterion[] = [
  { id: 'completion', n: 1, label: 'Completion', question: 'Can the user successfully progress toward subscription?', health: true },
  { id: 'decision-clarity', n: 2, label: 'Decision clarity', question: 'Can the user understand the decision currently being asked of them?', health: true },
  { id: 'package-comparison', n: 3, label: 'Package comprehension & comparison', question: 'Can the user understand meaningful differences between available packages?', health: true },
  { id: 'decision-friction', n: 4, label: 'Decision friction', question: 'Is unnecessary cognitive or interaction effort interfering with progression?', health: true },
  { id: 'purchase-confidence', n: 5, label: 'Purchase confidence', question: 'Does the user understand what they are getting and what happens next?', health: true },
  { id: 'offer-comprehension', n: 6, label: 'Offer comprehension', question: 'Are verified offers, trials and benefits communicated correctly and understandably?', health: true },
  { id: 'journey-consistency', n: 7, label: 'Journey consistency', question: 'Does each stage maintain expectations and terminology established earlier?', health: true },
  { id: 'informed-choice', n: 8, label: 'Informed choice & trust', question: 'Are important conditions visible and understandable? Are claims, defaults, recommendations and persuasion truthful?', health: true },
  { id: 'goal-alignment', n: 9, label: 'Goal alignment', question: 'Does the journey support the configured DAZN business direction?', health: false },
]

export const CRITERION_BY_ID: Record<CriterionId, Criterion> = Object.fromEntries(BASELINE.map((c) => [c.id, c])) as Record<CriterionId, Criterion>
export const HEALTH_CRITERIA = BASELINE.filter((c) => c.health)
