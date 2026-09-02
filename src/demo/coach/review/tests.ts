import type { TestProposal } from './types'

/**
 * When the Coach proposes an A/B test, and how it describes one.
 *
 * A test is warranted when there is a meaningful issue or opportunity, a
 * credible mechanism from science or DAZN evidence, at least two defensible
 * variants, no existing evidence that settles it, a variable that can be
 * isolated, relevance to the configured goal, and something to learn. The
 * brains supply the specifics; this file keeps the shape honest: measures are
 * named only as things DAZN may have, and the winner is unknown unless
 * evidence gives a direction. None of this is a calculation; the worth is a
 * judgement stated in words.
 */
export interface TestInput {
  hypothesis: string
  science: string
  observation: string
  goal?: string
  control: string
  variant: string
  /** The behaviour that answers the hypothesis, named as DAZN may measure it. */
  primaryMeasure: string
  guardrail?: string
  learn: string
  /** Does it matter to the configured direction? Raises the worth. */
  goalRelevant: boolean
  /** Is the mechanism strong (strong science) or contested? */
  strongMechanism: boolean
  /** A direction the evidence supports, if any. */
  expectedDirection?: string
}

export function proposeTest(t: TestInput): TestProposal {
  const worth: TestProposal['worth'] = t.goalRelevant && t.strongMechanism ? 'high' : t.goalRelevant || t.strongMechanism ? 'medium' : 'low'
  return {
    hypothesis: t.hypothesis,
    why: `${t.science} gives a credible mechanism. ${t.observation}${t.goal ? ` It matters because the configured direction is ${t.goal}.` : ''} The DAZN-specific size and side effects are unknown.`,
    control: t.control,
    variant: t.variant,
    primaryMeasure: `${t.primaryMeasure}, if available.`,
    guardrail: `${t.guardrail ?? 'Overall acquisition completion'}, if available.`,
    learn: t.learn,
    worth,
    win: t.expectedDirection ?? 'Unknown. No evidence gives a direction.',
  }
}
