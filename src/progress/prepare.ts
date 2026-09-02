import type { ProgressBus } from './progressBus'
import type { CardSet, Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { loadRemote } from '../editor/remote'
import { buildSnapshot } from '../demo/coach/review/snapshot'
import { runCoach } from '../demo/coach/review/coach'
import { askCoachAi } from '../demo/coach/review/ai'
import type { CoachReviewContext } from '../demo/coach/brief'

/**
 * What opening the tool actually costs, narrated while it happens.
 *
 * Three things run between answering the questions and the tool appearing, and
 * all three are real: the shared copy is fetched over the network, the answers
 * are resolved into a journey and its screens, and the rules are run over every
 * market and storefront the set covers. The screen says those and only those —
 * no step here exists to fill time, and every number it reports is one the tool
 * will show you on the other side.
 *
 * They run together because they are independent: the checks read the set that
 * is already in hand, so they do not wait on the fetch.
 *
 * The Coach is the fourth and the only slow one. It asks its own questions of
 * the journey and then asks a model, which is a real call over the wire — the
 * other three finish in tens of milliseconds between them.
 */

/**
 * The Coach with nothing asserted on its behalf.
 *
 * Its goals, targets and constraints are things a person states in its own
 * dialog, and inventing them here would have it grade the journey against
 * ambitions nobody holds. Left empty it still runs its baseline questions,
 * which is what a review means before anyone has said what they are after.
 */
/**
 * How long the model gets before the lane stops waiting on it.
 *
 * It has to end somehow. Asking a model is one call over the wire and it can
 * hang outright — signed in to a CLI locally it did, for longer than the
 * watchdog was willing to wait, which left the whole screen hostage to it.
 * Giving up is an ending like any other and it is said plainly; the review
 * that was already read still stands. Comfortably under the watchdog, so the
 * lane settles on its own terms rather than the screen dissolving under it.
 */
const COACH_BUDGET_MS = 20_000

const NO_GOALS_STATED: CoachReviewContext = {
  businessGoals: [],
  targets: {},
  prioritisedTiers: [],
  constraints: [],
  evidence: [],
}

export interface Job {
  set: CardSet
  context: Context
  journey: Journey
}

export interface Prepared {
  /** How the Coach's baseline review came out. */
  findings: number
  health: number
  /** Where the copy came from, in the words the store uses. */
  copy: string
  screens: number
  steps: number
  contexts: number
  failing: number
}

export async function prepare(bus: ProgressBus, job: Job): Promise<Prepared> {
  const copy = (async () => {
    bus.report({ kind: 'copy:start' })
    try {
      const state = await loadRemote()
      const where =
        state.kind === 'published'
          ? 'the shared copy'
          : state.kind === 'file'
            ? 'the copy in the repository'
            : 'this browser only'
      bus.report({ kind: 'copy:done', where, reachable: state.kind !== 'unreachable' })
      return where
    } catch (error) {
      // A failure is an ending: said plainly, and the lane settles on it
      // rather than hanging until the watchdog.
      bus.report({ kind: 'copy:failed', reason: error instanceof Error ? error.message : String(error) })
      return 'this browser only'
    }
  })()

  // Worked out once: the journey lane reports it and the Coach reads it.
  const planned = planJourney(job.journey, job.context)

  const journey = (async () => {
    bus.report({ kind: 'journey:start', name: job.journey.name })
    const running = planned.filter((p) => !p.skipped)
    const screens = running.reduce((n, p) => n + (p.step.states?.length ?? 1), 0)
    bus.report({ kind: 'journey:done', name: job.journey.name, steps: running.length, screens })
    return { steps: running.length, screens }
  })()

  const checks = (async () => {
    bus.report({ kind: 'checks:start' })
    const summary = summarise(validateAll(job.set))
    bus.report({
      kind: 'checks:done',
      contexts: summary.total,
      failing: summary.failing.length,
      labels: summary.failingLabels,
    })
    return { contexts: summary.total, failing: summary.failing.length }
  })()

  const coach = (async () => {
    bus.report({ kind: 'coach:start' })
    try {
      const snapshot = buildSnapshot(job.set, job.journey, job.context, planned)
      const review = runCoach(snapshot, NO_GOALS_STATED)
      bus.report({
        kind: 'coach:read',
        findings: review.findings.length,
        health: review.health.overall,
        screens: review.screensReviewed,
      })

      // The one call on this screen that can honestly take seconds — and the
      // one that can fail to come back at all, so it is raced against a clock.
      const ai = await Promise.race([
        askCoachAi(snapshot, NO_GOALS_STATED, review.findings),
        new Promise<{ status: 'timeout' }>((resolve) =>
          setTimeout(() => resolve({ status: 'timeout' }), COACH_BUDGET_MS),
        ),
      ])

      if (ai.status === 'done') {
        bus.report({ kind: 'coach:done', added: ai.findings.length, findings: review.findings.length })
      } else if (ai.status === 'timeout') {
        bus.report({
          kind: 'coach:quiet',
          note: `The model did not answer within ${COACH_BUDGET_MS / 1000}s.`,
        })
      } else {
        // The Coach's own words for why, not a paraphrase: it is the evidence.
        bus.report({ kind: 'coach:quiet', note: ai.note ?? 'The Coach did not answer.' })
      }
      return { findings: review.findings.length, health: review.health.overall }
    } catch (error) {
      // A failure is an ending too, or the lane sits working until the
      // watchdog takes the screen away underneath it.
      bus.report({
        kind: 'coach:quiet',
        note: error instanceof Error ? error.message : String(error),
      })
      return { findings: 0, health: 0 }
    }
  })()

  const [where, j, c, k] = await Promise.all([copy, journey, checks, coach])
  return {
    copy: where,
    screens: j.screens,
    steps: j.steps,
    contexts: c.contexts,
    failing: c.failing,
    findings: k.findings,
    health: k.health,
  }
}
