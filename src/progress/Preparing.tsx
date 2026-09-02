import './progress-screen.css'
import './preparing.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressScreen, type Narration } from './ProgressScreen'
import { createProgressBus, type ProgressEvent } from './progressBus'
import { prepare, type Job, type Prepared } from './prepare'
import { go } from '../navigate'
import { announceArrival } from './arrival'

/**
 * The wait between answering the questions and the tool opening on them.
 *
 * It narrates the three things that genuinely happen in that gap — the copy is
 * fetched, the answers are resolved into a journey, the rules are run over
 * every context — and reports the numbers the tool itself will show. Nothing
 * here is a timer wearing a step's clothes.
 *
 * It lives above the routes rather than inside the front door, so the route can
 * change underneath it: the tool is already mounted behind the screen before
 * the screen fades, which is what stops the fade revealing the form you just
 * left rather than the thing you asked for.
 */

/** Which events end a lane. A failure ends one too. */
const TERMINAL = new Set([
  'copy:done',
  'copy:failed',
  'journey:done',
  'checks:done',
  // Both endings for the Coach: the model answered, or it could not be asked.
  'coach:done',
  'coach:quiet',
])

const LANES = [
  { id: 'copy', label: 'COPY', idleStatus: 'waiting' },
  { id: 'journey', label: 'JOURNEY', idleStatus: 'waiting' },
  { id: 'checks', label: 'CHECKS', idleStatus: 'waiting' },
  { id: 'coach', label: 'COACH', idleStatus: 'waiting' },
]

/** One place turns an event into words, so the words cannot drift from it. */
function narrate(event: ProgressEvent): Narration | null {
  switch (event.kind) {
    case 'copy:start':
      return { lane: 'copy', text: 'Reading the shared copy', laneStatus: 'reading', tone: 'working' }
    case 'copy:done':
      return {
        lane: 'copy',
        text: `Content is coming from ${event.where}`,
        record: `Content from ${event.where}`,
        laneStatus: String(event.where),
        tone: 'ok',
      }
    case 'copy:failed':
      return {
        lane: 'copy',
        // The reason verbatim: it is evidence, and rewording it would make the
        // screen less honest about what went wrong.
        text: `Could not reach the shared copy — ${event.reason}`,
        record: `Shared copy unreachable: ${event.reason}`,
        laneStatus: 'unreachable',
        tone: 'retry',
      }
    case 'journey:start':
      return { lane: 'journey', text: 'Working out the journey', laneStatus: 'resolving', tone: 'working' }
    case 'journey:done':
      return {
        lane: 'journey',
        text: `${event.name} — ${event.screens} screens across ${event.steps} steps`,
        record: `${event.name}: ${event.screens} screens, ${event.steps} steps`,
        laneStatus: `${event.steps} steps`,
        tone: 'ok',
      }
    case 'checks:start':
      return { lane: 'checks', text: 'Running the rules over every context', laneStatus: 'checking', tone: 'working' }
    case 'checks:done': {
      const failing = Number(event.failing)
      return {
        lane: 'checks',
        text: failing
          ? `${failing} of ${event.contexts} contexts are failing`
          : `${event.contexts} contexts checked, all passing`,
        record: failing
          ? `${failing} of ${event.contexts} contexts failing: ${(event.labels as string[]).slice(0, 3).join(', ')}`
          : `${event.contexts} contexts checked`,
        laneStatus: failing ? `${failing} failing` : 'all passing',
        tone: failing ? 'retry' : 'ok',
      }
    }
    case 'coach:start':
      return { lane: 'coach', text: 'Asking the Coach to read the journey', laneStatus: 'reading', tone: 'working' }
    case 'coach:read': {
      const findings = Number(event.findings)
      return {
        lane: 'coach',
        text: findings
          ? `${findings} thing${findings === 1 ? '' : 's'} to look at across ${event.screens} screens`
          : `Nothing to raise across ${event.screens} screens`,
        record: `Baseline review: ${findings} to look at, health ${event.health}`,
        detail: `health ${event.health}`,
        laneStatus: 'asking the model',
        tone: 'working',
      }
    }
    case 'coach:done': {
      const added = Number(event.added)
      return {
        lane: 'coach',
        text: added
          ? `The model added ${added} more to look at`
          : 'The model had nothing to add',
        record: `Model answered: ${added} added to ${event.findings}`,
        laneStatus: added ? `${added} more` : 'nothing to add',
        tone: 'ok',
      }
    }
    case 'coach:quiet':
      return {
        lane: 'coach',
        // The Coach's own words for why, not a paraphrase of them.
        text: String(event.note),
        record: `Model not asked: ${event.note}`,
        laneStatus: 'baseline only',
        tone: 'retry',
      }
    default:
      return null
  }
}

export function Preparing({ job, onDone }: { job: Job; onDone: () => void }) {
  // One bus per run: a second Create is a second job, not a continuation.
  const bus = useMemo(() => createProgressBus(), [])
  const [result, setResult] = useState<Prepared | null>(null)
  const cancelled = useRef(false)

  const started = useRef(false)

  useEffect(() => {
    // Cleared before the guard below, not after it. The effect is invoked
    // twice in development — mount, tear down, mount — and the tear-down sets
    // this. Clearing it after an early return would leave it set for the run
    // that is already in flight, and its result would be thrown away.
    cancelled.current = false

    // Once per run, not once per effect: the work is a one-shot side effect
    // rather than a subscription, and running it twice narrates every line
    // twice into the record.
    if (started.current) return
    started.current = true
    // A rejection is still an outcome. Without this the screen would wait on
    // a promise that is never going to answer, and only the watchdog would
    // free it — which is the trap the screen exists not to be.
    prepare(bus, job).catch(() => null).then((prepared) => {
      if (cancelled.current) return
      setResult(prepared ?? ({} as Prepared))
      // The route changes while the screen is still opaque, so what the fade
      // uncovers is the tool rather than the questions behind it.
      go('/demo')
    })
    return () => {
      cancelled.current = true
    }
  }, [bus, job])

  return (
    <ProgressScreen
      bus={bus}
      lanes={LANES}
      narrate={narrate}
      isTerminal={(event) => TERMINAL.has(event.kind)}
      // Checked against what is in hand, not against the stream: a lane can
      // settle without the job being done.
      delivered={() => result !== null}
      deliveredSignal={result}
      openingText="Opening the tool on your answers…"
      subject={job.journey.id}
      cancelLabel="Cancel and go back"
      onCancel={() => {
        cancelled.current = true
        onDone()
      }}
      onLeave={() => {
        // The tool has been behind this for a while; this is the first moment
        // anyone can see it.
        announceArrival()
        onDone()
      }}
      timings={{
        // One fetch, no retries behind it — a silence longer than this is a
        // fault rather than patience. Comfortably past the hold below, so the
        // watchdog cannot fire while the screen is deliberately waiting.
        quietDissolveMs: 30_000,
        armWindowMs: 5_000,
        /*
         * Back to what a hold is for, now that the wait is real.
         *
         * It was ten seconds while the work took under one, so that the screen
         * could be read at all. The Coach put real work in that gap — it asks
         * a model, which is a call over the wire — so the screen now lasts as
         * long as the asking does, and the hold goes back to covering what it
         * is meant to: one lane settling a moment before another.
         *
         * Nothing downstream of this is debounced, so a few hundred
         * milliseconds is the whole of it.
         */
        allSettledHoldMs: 700,
      }}
    />
  )
}
