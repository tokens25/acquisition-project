import type { CoachReviewContext, EvidenceSourceId } from '../brief'
import { science } from './sciences'
import type { Confidence, Evidence } from './types'

/**
 * Evidence beats opinion, read carefully: science can support a
 * recommendation about clarity, comprehension, consistency, trust or choice
 * architecture. What it cannot support is a claim that a change will move a
 * DAZN business outcome. That needs DAZN causal evidence, and until it
 * exists the outcome is unknown.
 */

/** A science or practice principle, as evidence for a mechanism. */
export function scienceEvidence(...ids: string[]): Evidence[] {
  return ids.map((id) => {
    const s = science(id)
    return { kind: s.kind === 'system' ? 'content' : s.id === 'progressive-disclosure' ? 'practice' : 'science', source: s.name }
  })
}

/** What the content itself shows: the strings that contradict or fall short. */
export function contentEvidence(...quotes: string[]): Evidence[] {
  return [{ kind: 'content', source: quotes.map((q) => `“${q}”`).join(' vs ') }]
}

/** Diagnosis confidence from science alone: strong earns Likely, contested earns Possible. Never Certain. */
export function confidenceFromScience(...ids: string[]): Confidence {
  return ids.every((id) => science(id).strength === 'strong') ? 'medium' : 'low'
}

/**
 * How to settle a question about behaviour, given what the team has. The
 * panel no longer asks about evidence, so this reads as the standing answer:
 * look at DAZN data if it exists, otherwise a controlled test.
 */
export function nextStepFor(ctx: CoachReviewContext, what: string): string {
  const has = (id: EvidenceSourceId) => ctx.evidence.includes(id)
  if (has('dazn-experiments')) return `Check whether a DAZN experiment already covers ${what} before changing anything.`
  if (has('dazn-analytics')) return `Look at ${what} in DAZN analytics first. Analytics show what happens, not why; a test settles cause.`
  return `DAZN analytics would show ${what}. Only a controlled test would show whether a change causes a difference.`
}
