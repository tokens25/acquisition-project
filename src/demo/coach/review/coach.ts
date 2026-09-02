import type { CoachReviewContext } from '../brief'
import { BRAINS } from './brains'
import type { JourneySnapshot } from './snapshot'
import { scoreReview } from './score'
import { FIX_EVIDENCE, type Confidence, type Finding, type Review, type Severity } from './types'

/**
 * The Coach, above the specialists. It merges two brains reading the same
 * element, resolves the cases where they disagree, and holds every finding
 * to the evidence rule: a Fix needs content or DAZN evidence; science alone
 * can recommend and can propose a test, but cannot declare something wrong
 * or claim a business outcome. AI inference can never be Certain.
 */

const SEVERITY_RANK: Record<Severity, number> = { fix: 4, test: 3, check: 2, note: 1 }
const CONFIDENCE_RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 }

function merge(findings: Finding[]): Finding[] {
  const byKey = new Map<string, Finding>()
  for (const f of findings) {
    const key = f.element ? `${f.screen}|${f.element}` : f.id
    const prior = byKey.get(key)
    if (!prior) {
      byKey.set(key, f)
      continue
    }
    const agree = (prior.recommendation === null) === (f.recommendation === null)
    byKey.set(key, {
      ...prior,
      sciences: [...new Set([...prior.sciences, ...f.sciences])],
      alsoOn: [...new Set([...(prior.alsoOn ?? []), ...(f.alsoOn ?? [])])],
      evidence: [...prior.evidence, ...f.evidence.filter((e) => !prior.evidence.some((p) => p.source === e.source))],
      interpretation: prior.interpretation === f.interpretation ? prior.interpretation : `${prior.interpretation} ${f.interpretation}`,
      severity: SEVERITY_RANK[f.severity] > SEVERITY_RANK[prior.severity] ? f.severity : prior.severity,
      // Two brains disagreeing on whether to recommend anything is itself a
      // reason to go and get evidence: the cautious side wins and says so.
      recommendation: agree ? prior.recommendation : null,
      confidence: agree ? (CONFIDENCE_RANK[f.confidence] > CONFIDENCE_RANK[prior.confidence] ? f.confidence : prior.confidence) : 'low',
      conflict: agree ? prior.conflict : `Two of my readings disagree here, so I am not recommending a change until there is evidence.`,
      test: prior.test ?? f.test,
      goals: { ...prior.goals, ...f.goals },
    })
  }
  return [...byKey.values()]
}

/**
 * The evidence guard. A Fix must rest on content or DAZN evidence. One that
 * does not is held at Check (or Test, if it carries a test), and marked as
 * such. Science-only findings are never Certain. AI findings are never
 * Certain and never a Fix. The guard never touches the recommendation:
 * science may recommend; it may not declare wrong or promise an outcome.
 */
export function evidenceGuard(findings: Finding[]): { findings: Finding[]; guarded: number } {
  let guarded = 0
  const out = findings.map((f) => {
    const proven = f.evidence.some((e) => FIX_EVIDENCE.includes(e.kind))
    let g = f
    if (g.severity === 'fix' && (!proven || g.source === 'ai')) {
      guarded += 1
      g = {
        ...g,
        severity: g.test ? 'test' : 'check',
        validation: g.test ? 'experiment' : 'dazn-data',
        conflict: `${g.conflict ? `${g.conflict} ` : ''}Only science supports this, so it is a question to settle, not a fault to fix.`,
      }
    }
    if (g.confidence === 'high' && (!proven || g.source === 'ai')) {
      guarded += 1
      g = { ...g, confidence: 'medium' }
    }
    return g
  })
  return { findings: out, guarded }
}

const rank = (f: Finding) => SEVERITY_RANK[f.severity] * 10 + CONFIDENCE_RANK[f.confidence]

export function runCoach(snapshot: JourneySnapshot, context: CoachReviewContext, extra: Finding[] = []): Review {
  const raw = [...BRAINS.flatMap((b) => b.run(snapshot, context)), ...extra]
  const merged = merge(raw)
  const { findings, guarded } = evidenceGuard(merged)
  findings.sort((a, b) => rank(b) - rank(a))
  const scores = scoreReview(findings, context, snapshot)
  return {
    at: new Date().toISOString(),
    context,
    journey: { id: snapshot.journey.id, name: snapshot.journey.name, entryCta: snapshot.journey.entryCta, market: snapshot.market.label },
    screensReviewed: snapshot.rendered.reduce((n, r) => n + r.states, 0),
    findings,
    ...scores,
    reliability: { guarded, total: findings.length },
    ai: 'pending',
  }
}
