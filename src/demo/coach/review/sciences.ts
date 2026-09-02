import type { Brain } from './types'

/**
 * The formal science stack: established research areas, named as they are
 * in the literature. Three methods sit above them and answer a different
 * question (does changing X cause Y). One system rule sits beside them:
 * deterministic cross-screen consistency checking is code, not science.
 *
 * `strength` says how far the science alone can carry a reading. A strong
 * science earns a Likely diagnosis on its own; a contested one earns
 * Possible. Neither earns Certain, and none ever earns a business-outcome
 * claim. Contested effects (Choice Overload, Compromise, Goal-Gradient) are
 * context-dependent and never universal laws.
 */
export type ScienceKind = 'science' | 'method' | 'system'

export interface Science {
  id: string
  name: string
  brain: Brain
  kind: ScienceKind
  /** What it should govern. */
  governs: string
  strength: 'strong' | 'contested'
}

const sci = (id: string, name: string, brain: Brain, governs: string, strength: Science['strength'] = 'strong'): Science => ({ id, name, brain, kind: 'science', governs, strength })

export const SCIENCES: Science[] = [
  // Decision and choice
  sci('jdm', 'Judgment and Decision Making', 'decision', 'Overall human decision-making and evaluation of alternatives'),
  sci('behavioral-decision-theory', 'Behavioral Decision Theory', 'decision', 'Systematic patterns and biases affecting choices'),
  sci('choice-architecture', 'Choice Architecture', 'choice', 'How presentation and organisation of choices influence decisions'),
  sci('default-effect', 'Default Effect', 'choice', 'Effect of preselected options'),
  sci('status-quo-bias', 'Status Quo Bias', 'choice', 'Preference for the existing or default state'),
  sci('choice-overload', 'Choice Overload / Assortment Choice Research', 'choice', 'Effects of the number and variety of alternatives', 'contested'),
  sci('madm', 'Multi-Attribute Decision Making', 'decision', 'How people evaluate options differing across several attributes'),
  sci('attribute-based-choice', 'Attribute-Based Choice', 'decision', 'Which attributes people use to compare'),
  sci('elimination-by-aspects', 'Elimination-by-Aspects Model (Tversky)', 'decision', 'How people eliminate options using important attributes'),
  sci('prospect-theory', 'Prospect Theory (Kahneman & Tversky)', 'decision', 'Gains, losses, risk and reference-dependent decisions'),
  sci('loss-aversion', 'Loss Aversion', 'decision', 'Sensitivity to perceived losses relative to gains'),
  sci('reference-dependence', 'Reference Dependence', 'decision', 'Evaluation relative to an existing reference point'),
  sci('framing', 'Framing Effect', 'decision', 'How equivalent information changes decisions depending on presentation'),
  sci('anchoring', 'Anchoring Effect', 'decision', 'How an initial value affects later judgments'),
  sci('mental-accounting', 'Mental Accounting (Thaler)', 'decision', 'How consumers mentally categorise costs and value'),
  sci('reference-price', 'Reference Price Research', 'decision', 'How a price is judged against an expected or comparison price'),
  sci('compromise-effect', 'Compromise Effect', 'choice', 'Tendency to prefer an intermediate option', 'contested'),
  // Understanding and journey
  sci('cognitive-load', 'Cognitive Load Theory (Sweller)', 'clarity', 'Mental effort required to understand a screen or decision'),
  sci('processing-fluency', 'Processing Fluency', 'clarity', 'Ease with which information is processed'),
  sci('hick-hyman', 'Hick-Hyman Law', 'clarity', 'Number and complexity of choices against decision time'),
  sci('information-foraging', 'Information Foraging Theory (Pirolli & Card)', 'journey', 'How users follow cues toward what they want'),
  sci('information-scent', 'Information Scent', 'journey', 'Strength of the cues suggesting where an action leads'),
  sci('mental-models', 'Mental Models (HCI / Cognitive Psychology)', 'journey', 'Whether the journey matches expectations of how such things work'),
  sci('recognition-over-recall', 'Recognition Rather Than Recall', 'clarity', 'Keeping needed information visible instead of remembered'),
  sci('expectation-confirmation', 'Expectation-Confirmation Theory', 'journey', 'The gap between what users expect and what the experience delivers'),
  // Trust and persuasion
  sci('persuasion-knowledge', 'Persuasion Knowledge Model (Friestad & Wright)', 'trust', 'How people recognise and respond to persuasion attempts'),
  sci('reactance', 'Psychological Reactance Theory (Brehm)', 'trust', 'Resistance when users perceive pressure or manipulation'),
  sci('perceived-risk', 'Perceived Risk Theory', 'trust', 'Uncertainty about financial, product or performance consequences'),
  sci('signaling', 'Signaling Theory', 'trust', 'How labels, prominence and recommendations communicate otherwise unobservable information'),
  sci('social-proof', 'Social Proof / Informational Social Influence', 'trust', 'Why claims such as “Most Popular” influence choice'),
  // Journey structure and effort
  sci('progressive-disclosure', 'Progressive Disclosure', 'clarity', 'Revealing information when it is needed'),
  sci('sludge', 'Behavioral Sludge', 'journey', 'Unnecessary administrative or behavioural friction'),
  sci('search-costs', 'Transaction / Search Costs', 'journey', 'Effort required to obtain, compare and act on information'),
  sci('means-end-chain', 'Means-End Chain Theory', 'copy', 'Connecting attributes to benefits to personal value'),
  sci('commitment-consistency', 'Commitment and Consistency research', 'journey', 'Effects of previous actions and commitments on later behaviour'),
  sci('goal-gradient', 'Goal-Gradient Hypothesis', 'journey', 'Motivation rising as someone approaches a goal', 'contested'),
  // Methods, above the sciences
  { id: 'experimental-design', name: 'Experimental Design', brain: 'goal', kind: 'method', governs: 'Whether a proposed change actually causes improvement', strength: 'strong' },
  { id: 'ab-testing', name: 'Online Controlled Experiments / A/B Testing', brain: 'goal', kind: 'method', governs: 'Testing alternative defaults, order, copy or structure', strength: 'strong' },
  { id: 'causal-inference', name: 'Causal Inference', brain: 'goal', kind: 'method', governs: 'Separating correlation from cause', strength: 'strong' },
  // A system rule, not a science
  { id: 'consistency-check', name: 'Deterministic cross-screen consistency checking', brain: 'copy', kind: 'system', governs: 'Two strings in one journey that cannot both be true', strength: 'strong' },
]

export const SCIENCE_BY_ID: Record<string, Science> = Object.fromEntries(SCIENCES.map((s) => [s.id, s]))

export function science(id: string): Science {
  const s = SCIENCE_BY_ID[id]
  if (!s) throw new Error(`Unknown science: ${id}`)
  return s
}
