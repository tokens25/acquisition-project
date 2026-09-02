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
const TERMINAL = new Set(['copy:done', 'copy:failed', 'journey:done', 'checks:done'])

const LANES = [
  { id: 'copy', label: 'COPY', idleStatus: 'waiting' },
  { id: 'journey', label: 'JOURNEY', idleStatus: 'waiting' },
  { id: 'checks', label: 'CHECKS', idleStatus: 'waiting' },
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
    prepare(bus, job).then((prepared) => {
      if (cancelled.current) return
      setResult(prepared)
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
         * Ten seconds and change, where the work needs under one.
         *
         * The hold is meant to cover a lane settling a moment before another
         * one does, and nothing downstream here is debounced, so a few hundred
         * milliseconds is all it needs. The rest is asked for: the screen is
         * being shown to people, and the real pipeline settles too fast to be
         * read.
         *
         * It is a hold and not a story — no step is invented to fill it, and
         * every line in the record still narrates something that happened.
         * What it does mean is that a settled screen sits there looking busy,
         * which is the honest cost of the request: shorten this the moment
         * the wait is real.
         */
        allSettledHoldMs: 10_700,
      }}
    />
  )
}
