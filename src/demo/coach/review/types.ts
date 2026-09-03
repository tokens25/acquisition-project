import type { FlowStepId } from '../../../rules/flow'
import type { BusinessGoalId, CoachReviewContext } from '../brief'
import type { CriterionId } from './doctrine'

/**
 * The Coach's vocabulary.
 *
 * A finding is the recommendation chain made into fields: what we observe,
 * what supports it, what science suggests may be happening, what we
 * recommend, the mechanism a change would work through, the business
 * outcome (unknown unless DAZN evidence says otherwise), how confident we are
 * in the diagnosis, and what would validate it. A finding may carry a
 * proposed A/B test.
 */

/** The specialist brains. The Coach sits above them and resolves conflicts. */
export type Brain = 'decision' | 'choice' | 'clarity' | 'trust' | 'journey' | 'goal' | 'copy'

export const BRAIN_LABEL: Record<Brain, string> = {
  decision: 'Decision',
  choice: 'Choice architecture',
  clarity: 'Cognitive & clarity',
  trust: 'Trust & risk',
  journey: 'Journey / UX',
  goal: 'Goal alignment',
  copy: 'Copy',
}

/**
 * Kinds of evidence. Different kinds answer different questions, so they are
 * not one ladder: content evidence says what is true on screen; behavioural
 * evidence says what people do; causal evidence says what a change caused;
 * research explains; science names a mechanism; practice is established
 * usability; AI inference is model judgement and is never dressed as science.
 */
export type EvidenceKind = 'content' | 'dazn-behavioral' | 'dazn-causal' | 'research' | 'science' | 'practice' | 'ai'

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  content: 'The content itself',
  'dazn-behavioral': 'DAZN analytics',
  'dazn-causal': 'DAZN experiment',
  research: 'User or market research',
  science: 'Established science',
  practice: 'Established practice',
  ai: 'AI inference',
}

/** What a kind of evidence can carry: only these can back a Fix. */
export const FIX_EVIDENCE: EvidenceKind[] = ['content', 'dazn-causal', 'dazn-behavioral']

export interface Evidence {
  kind: EvidenceKind
  /** What exactly: the strings that contradict, the science by name, the data. */
  source: string
}

/**
 * Confidence in the DIAGNOSIS. `high` is reserved for what the content
 * itself shows or DAZN data establishes. Science alone never gets above
 * `medium`. Confidence in a BUSINESS OUTCOME is a separate thing and is
 * unknown unless DAZN causal evidence exists; see `businessOutcome`.
 */
export type Confidence = 'high' | 'medium' | 'low'

/**
 * `fix`: enough evidence that something is incorrect, contradictory,
 * incomplete or unnecessarily unclear. `test`: a credible mechanism, two
 * defensible variants, and an unknown DAZN-specific outcome. `check`: a
 * credible concern without enough evidence to change or test yet. `note`:
 * worth knowing, including what works.
 */
export type Severity = 'fix' | 'test' | 'check' | 'note'

/** What would settle the finding. */
export type Validation = 'none' | 'dazn-data' | 'research' | 'experiment'

/** A screen in the journey, or the journey as a whole. */
export type ScreenId = FlowStepId | 'plans' | 'journey'

/** The standing answer for a business outcome the Coach has no DAZN evidence for. */
export const OUTCOME_UNKNOWN = 'Unknown until DAZN measures it.'

/**
 * A proposed A/B test, described the way the brief asks: hypothesis, why,
 * control, variant, measure, guardrail, what we learn, and two separate
 * confidences. Measures are named only as things DAZN may have ("if
 * available"); the Coach does not know DAZN's metrics.
 */
export interface TestProposal {
  hypothesis: string
  why: string
  control: string
  variant: string
  primaryMeasure: string
  guardrail: string
  learn: string
  /** Confidence the test is worth running. */
  worth: 'high' | 'medium' | 'low'
  /** Confidence the variant will win. Unknown unless evidence gives a direction. */
  win: string
}

export interface Finding {
  id: string
  brain: Brain
  /** The baseline question this finding answers. */
  criterion: CriterionId
  /** The sciences behind the reading. More than one when two brains agreed. */
  sciences: string[]
  screen: ScreenId
  /** Other screens the same finding touches, for the badges on the row. */
  alsoOn?: ScreenId[]
  /** What on the screen, so two brains reading the same thing can be merged. */
  element?: string
  /** A fact. Quotes the content; verifiable by looking at the screen. */
  observation: string
  evidence: Evidence[]
  /** What science suggests may be happening. Never a number, never a prediction. */
  interpretation: string
  /** What should change, if evidence supports acting. Null when it does not. */
  recommendation: string | null
  /** Why the proposed change could help: the mechanism, not the outcome. */
  expectedMechanism?: string
  /** Explicitly unknown unless DAZN evidence supports one. */
  businessOutcome: string
  /** Confidence in the diagnosis. */
  confidence: Confidence
  severity: Severity
  /** What would settle it. */
  validation: Validation
  /**
   * The wordings or arrangements weighed before recommending one. Present
   * where two options are both defensible and the choice needs a reason
   * rather than a preference.
   */
  alternatives?: { option: string; forIt: string; against: string; chosen?: boolean }[]
  /** How to get that validation, in plain words. */
  nextStep?: string
  /** The proposed experiment, when severity is `test`. */
  test?: TestProposal
  /** Which configured directions this touches, and which way: +1 supports, -1 works against. */
  goals: Partial<Record<BusinessGoalId, 1 | -1>>
  source: 'rules' | 'ai'
  /** Set by the Coach when two brains read the same element differently, or the guard stepped in. */
  conflict?: string
  /** The exact strings to light up on the screen and in the panel. */
  highlight?: string[]
  /** A change the Coach can make itself, when the content proves what is wrong. */
  fix?: FindingFix
  /** The piece of copy this finding is about, when it is about one. */
  copyTarget?: CopyTarget
  /** Copy proposed for that target, and the Coach's verdict on it. */
  suggestion?: CopySuggestion
}

export type FindingFix =
  | { label: string; replace: { from: string; to: string }[] }
  | { label: string; trim: true }

export interface CopyTarget {
  path: string
  label: string
  current: string
  allowedTerms?: string[]
  maxLength?: number
}

export type CopySuggestion =
  | { source: 'rules' | 'ai'; approved: true; after: string; why?: string }
  | { source: 'ai'; approved: false; after: string; reason: string }

export type ScoreBand = 'strong' | 'sound' | 'needs-work' | 'at-risk'

export interface CriterionScore {
  id: CriterionId
  n: number
  label: string
  question: string
  score: number
  fixes: number
  tests: number
  checks: number
  notes: number
}

export interface AlignmentScore {
  goal: BusinessGoalId
  label: string
  score: number
  band: ScoreBand
  supports: number
  against: number
}

export interface ScreenScore {
  screen: ScreenId
  name: string
  score: number
  fixes: number
  tests: number
  checks: number
  notes: number
}

export interface Review {
  at: string
  context: CoachReviewContext
  journey: { id: string; name: string; entryCta: string; market: string }
  screensReviewed: number
  findings: Finding[]
  /** Journey Health: the always-on baseline, the same whatever the goal. */
  health: { overall: number; band: ScoreBand; byCriterion: CriterionScore[] }
  /** Goal alignment: how strongly the journey supports each configured direction. */
  alignment: AlignmentScore[]
  byScreen: ScreenScore[]
  /** Coach reliability, outside the journey scores: readings the guard had to rein in. */
  reliability: { guarded: number; total: number }
  ai: 'pending' | 'done' | 'unavailable' | 'failed'
  aiNote?: string
  /** Where the scores began, so progress is visible as fixes land. */
  start?: { health: number; alignment: Record<string, number>; byCriterion: Record<string, number> }
}
