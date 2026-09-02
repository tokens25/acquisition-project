import type { CoachReviewContext } from '../brief'
import { BASELINE, type CriterionId } from './doctrine'
import { finding } from './finding'
import { SCIENCE_BY_ID } from './sciences'
import type { JourneySnapshot } from './snapshot'
import { approveCopy } from './approve'
import type { Brain, CopySuggestion, Finding, ScreenId } from './types'

/**
 * Asks /api/coach for the readings that need judgement, and turns what comes
 * back into findings the Coach can merge. Nothing here is trusted: every
 * field is checked against the vocabulary, every screen against the journey,
 * and the result is stamped as AI inference, the guard does the rest.
 */
export type AiResult =
  | { status: 'done'; findings: Finding[]; model: string }
  | { status: 'unavailable'; note: string }
  | { status: 'failed'; note: string }

const BRAINS: Brain[] = ['decision', 'choice', 'clarity', 'trust', 'journey', 'goal', 'copy']
const CRITERIA = new Set<string>(BASELINE.map((c) => c.id))

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export async function askCoachAi(snapshot: JourneySnapshot, ctx: CoachReviewContext, already: Finding[]): Promise<AiResult> {
  try {
    const probe = await fetch('/api/coach', { headers: { accept: 'application/json' } })
    if (!probe.ok) return { status: 'unavailable', note: 'The Coach route did not answer.' }
    const status = (await probe.json()) as { configured?: boolean; reason?: string }
    if (!status.configured) return { status: 'unavailable', note: status.reason ?? 'No key is set.' }

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        snapshot: {
          market: snapshot.market.label,
          cadence: snapshot.cadence,
          journey: snapshot.journey,
          screens: snapshot.rendered.map((r) => ({ id: r.id, name: r.name, position: r.position, states: r.states })),
          plans: snapshot.plans,
          flow: snapshot.flow,
        },
        context: ctx,
        already: already.map((f) => f.observation),
      }),
    })
    const body = (await res.json()) as { findings?: unknown[]; error?: string; model?: string }
    if (!res.ok || body.error) return { status: 'failed', note: body.error ?? `The route returned ${res.status}.` }

    const screens = new Set<string>(['journey', ...snapshot.rendered.map((r) => r.id)])
    const findings: Finding[] = []
    for (const raw of body.findings ?? []) {
      if (!raw || typeof raw !== 'object') continue
      const r = raw as Record<string, unknown>
      const brain = oneOf(r.brain, BRAINS)
      const screen = typeof r.screen === 'string' && screens.has(r.screen) ? (r.screen as ScreenId) : null
      const criterion = typeof r.criterion === 'string' && CRITERIA.has(r.criterion) ? (r.criterion as CriterionId) : null
      const sciences = Array.isArray(r.sciences) ? r.sciences.filter((s): s is string => typeof s === 'string' && s in SCIENCE_BY_ID) : []
      if (!brain || !screen || !criterion || sciences.length === 0) continue
      if (typeof r.observation !== 'string' || typeof r.interpretation !== 'string') continue
      const goals: Finding['goals'] = {}
      if (r.goals && typeof r.goals === 'object') {
        for (const [g, v] of Object.entries(r.goals as Record<string, unknown>)) {
          if (ctx.businessGoals.includes(g as never) && (v === 1 || v === -1)) goals[g as keyof Finding['goals']] = v
        }
      }
      findings.push({
        ...finding({
          brain,
          criterion,
          sciences,
          screen,
          element: typeof r.element === 'string' ? `ai:${r.element}` : undefined,
          observation: r.observation,
          evidence: [{ kind: 'ai', source: `Model judgement, reading ${sciences.map((s) => SCIENCE_BY_ID[s].name).join(', ')}` }],
          interpretation: r.interpretation,
          recommendation: typeof r.recommendation === 'string' ? r.recommendation : null,
          nextStep: typeof r.nextStep === 'string' ? r.nextStep : undefined,
          confidence: oneOf(r.confidence, ['low', 'medium'] as const) ?? 'low',
          severity: oneOf(r.severity, ['check', 'note'] as const) ?? 'note',
          validation: 'dazn-data',
          goals,
        }),
        source: 'ai',
      })
    }
    return { status: 'done', findings, model: body.model ?? 'model' }
  } catch (error) {
    return { status: 'failed', note: error instanceof Error ? error.message : String(error) }
  }
}

export type SuggestResult =
  | { status: 'done'; suggestions: Record<string, CopySuggestion> }
  | { status: 'unavailable'; note: string }
  | { status: 'failed'; note: string }

/**
 * Asks the Copy brain to write the copy each finding's recommendation calls
 * for, then puts every answer through the Coach's approval. Only what passes
 * is shown as a fix; what fails is shown with the reason.
 */
export async function askCopySuggestions(snapshot: JourneySnapshot, ctx: CoachReviewContext, findings: Finding[]): Promise<SuggestResult> {
  const asks = findings.filter((f) => f.copyTarget && !f.suggestion && f.recommendation)
  if (asks.length === 0) return { status: 'done', suggestions: {} }
  try {
    const probe = await fetch('/api/coach', { headers: { accept: 'application/json' } })
    const status = (await probe.json()) as { configured?: boolean; reason?: string }
    if (!probe.ok || !status.configured) return { status: 'unavailable', note: status.reason ?? 'No key is set.' }

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        mode: 'suggest',
        snapshot: { plans: snapshot.plans, flow: snapshot.flow, teams: Object.values(snapshot.teamNames) },
        context: ctx,
        asks: asks.map((f) => ({
          id: f.id,
          label: f.copyTarget!.label,
          current: f.copyTarget!.current,
          recommendation: f.recommendation,
          allowedTerms: f.copyTarget!.allowedTerms,
          maxLength: f.copyTarget!.maxLength,
        })),
      }),
    })
    const body = (await res.json()) as { suggestions?: unknown[]; error?: string }
    if (!res.ok || body.error) return { status: 'failed', note: body.error ?? `The route returned ${res.status}.` }

    const out: Record<string, CopySuggestion> = {}
    for (const raw of body.suggestions ?? []) {
      if (!raw || typeof raw !== 'object') continue
      const r = raw as Record<string, unknown>
      const f = typeof r.id === 'string' ? asks.find((x) => x.id === r.id) : undefined
      if (!f || typeof r.after !== 'string') continue
      out[f.id] = approveCopy(f.copyTarget!, r.after, snapshot, 'ai')
    }
    return { status: 'done', suggestions: out }
  } catch (error) {
    return { status: 'failed', note: error instanceof Error ? error.message : String(error) }
  }
}
