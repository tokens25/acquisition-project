import type { BusinessGoalId } from '../brief'
import type { CriterionId } from './doctrine'
import { OUTCOME_UNKNOWN, type Brain, type Confidence, type CopySuggestion, type CopyTarget, type Finding, type FindingFix, type ScreenId, type Severity, type TestProposal, type Validation } from './types'

/**
 * One way to build a finding, so no brain can leave a field out. The
 * business outcome defaults to unknown; validation defaults from the action
 * type: a fix needs none, a test an experiment, a check DAZN data.
 */
export interface FindingInput {
  brain: Brain
  criterion: CriterionId
  sciences: string[]
  screen: ScreenId
  alsoOn?: ScreenId[]
  element?: string
  observation: string
  evidence: Finding['evidence']
  interpretation: string
  recommendation: string | null
  expectedMechanism?: string
  businessOutcome?: string
  confidence: Confidence
  severity: Severity
  validation?: Validation
  nextStep?: string
  test?: TestProposal
  goals?: Partial<Record<BusinessGoalId, 1 | -1>>
  highlight?: string[]
  fix?: FindingFix
  copyTarget?: CopyTarget
  suggestion?: CopySuggestion
}

const DEFAULT_VALIDATION: Record<Severity, Validation> = { fix: 'none', test: 'experiment', check: 'dazn-data', note: 'none' }

export function finding(input: FindingInput): Finding {
  return {
    id: `${input.brain}-${input.screen}-${input.element ?? input.observation.slice(0, 40)}`,
    goals: {},
    source: 'rules',
    businessOutcome: OUTCOME_UNKNOWN,
    validation: input.validation ?? DEFAULT_VALIDATION[input.severity],
    highlight: input.highlight ?? quotesIn(input.observation),
    ...input,
  }
}

/** The “quoted” strings in a sentence. */
export function quotesIn(text: string): string[] {
  return [...text.matchAll(/“([^”]+)”/g)].map((m) => m[1].trim()).filter((q) => q.length >= 3)
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Whether `text` contains `word` as a whole word, case-insensitively. */
export function hasWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}])`, 'iu').test(text)
}

export function amountsIn(text: string): number[] {
  return [...text.matchAll(/(\d[\d,]*\.?\d*)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n))
}

export function datesIn(text: string): string[] {
  return [...text.matchAll(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g)].map((m) => m[0])
}

export function looksLikePlaceholder(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/lorem ipsum|placeholder|tbd|todo|xxx/i.test(t)) return true
  const letters = t.replace(/[^a-z]/gi, '')
  if (letters.length < 8) return false
  const vowels = (letters.match(/[aeiou]/gi) ?? []).length
  return vowels / letters.length < 0.2 && !/\s/.test(t)
}
