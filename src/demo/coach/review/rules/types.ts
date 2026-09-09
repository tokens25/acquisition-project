import type { CriterionId } from '../doctrine'
import type { Brain, Confidence, Severity } from '../types'
import type { SectionType } from '../../../../rules/sections'

/**
 * A rule, written down rather than written out.
 *
 * Most of what the Coach knows about a page is one of six shapes: something
 * is empty, something still reads as placeholder, something runs too long,
 * something is missing, something is in the wrong order, or two things say
 * the same words. Those don't need a function each — they need saying once
 * and filling in.
 *
 * What a rule cannot express, it does not pretend to: the judgement calls
 * (a free offer beside plans that charge, a goal the page never gets to)
 * stay as code in the same set, and the set is the two together.
 */

/** What a finding says, once the rule knows what it is about. */
export interface Say {
  observation: string
  interpretation: string
  recommendation: string | null
}

/** Where a rule looks. */
export type Look =
  /** Every component the page draws, at one of the things it says. */
  | { at: 'each-component'; field: 'heading' | 'cta' | 'words' }
  /** One kind of component, whether it is on the page or not. */
  | { at: 'component'; type: SectionType }
  /** One named thing, wherever it lives. */
  | { at: 'field'; name: string }

/** What makes it worth saying. */
export type When =
  | { is: 'empty' }
  | { is: 'placeholder' }
  | { is: 'longer-than'; words: number }
  | { is: 'absent' }
  | { is: 'after'; type: SectionType }
  | { is: 'repeated' }

export interface ContentRule {
  id: string
  brain: Brain
  criterion: CriterionId
  sciences: string[]
  severity: Severity
  /** Where the evidence stands. Content rules quote the page and may be sure. */
  confidence?: Confidence
  look: Look
  when: When
  /** What has to be on the page before this rule is worth applying at all. */
  given?: { component: SectionType; on: boolean }
  /**
   * What to say about it. `what` is the thing found — a component's name, or
   * the words themselves; `text` is what it says; `count` is how many, where
   * the rule counted.
   */
  say: (about: { what: string; text: string; count: number }) => Say
}
