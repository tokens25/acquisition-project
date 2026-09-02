import type { ProgressBus } from './progressBus'
import type { CardSet, Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { loadRemote } from '../editor/remote'

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
 */

export interface Job {
  set: CardSet
  context: Context
  journey: Journey
}

export interface Prepared {
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

  const journey = (async () => {
    bus.report({ kind: 'journey:start', name: job.journey.name })
    const planned = planJourney(job.journey, job.context)
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

  const [where, j, c] = await Promise.all([copy, journey, checks])
  return { copy: where, screens: j.screens, steps: j.steps, contexts: c.contexts, failing: c.failing }
}
