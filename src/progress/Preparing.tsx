import './progress-screen.css'
import './preparing.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressScreen, type Narration } from './ProgressScreen'
import { createProgressBus, type ProgressEvent } from './progressBus'
import { prepare, type Job, type Prepared } from './prepare'
import { CoachOrb } from '../demo/coach/CoachOrb'
import { go } from '../navigate'
import { announceArrival } from './arrival'

/**
 * The wait between answering the questions and the tool opening on them.
 *
 * It narrates the four things that genuinely happen in that gap: the words are
 * fetched, the answers are resolved into a journey, the rules are run over
 * every market and way to pay, and the Coach reads the result. It reports the
 * numbers the tool itself will show. Nothing here is a timer wearing a step's
 * clothes.
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
  { id: 'copy', label: 'WORDS', idleStatus: 'waiting' },
  { id: 'journey', label: 'JOURNEY', idleStatus: 'waiting' },
  { id: 'checks', label: 'CHECKS', idleStatus: 'waiting' },
  { id: 'coach', label: 'COACH', idleStatus: 'waiting' },
]

/**
 * Where the words on the screens came from, said plainly.
 *
 * The lane reports which of the three it was; the sentence and the short lane
 * status are both written here, so they cannot drift from each other.
 */
const SOURCE: Record<string, { sentence: string; short: string }> = {
  published: { sentence: 'the words your team published', short: "team's words" },
  file: { sentence: 'the words saved with the project', short: 'project words' },
  unreachable: { sentence: 'the words saved on this computer', short: 'this computer' },
}

/**
 * The technical reason, turned into something a market user can act on.
 *
 * The reason itself is never thrown away: it goes in the record below, where
 * whoever needs it can read it. What changes is the big sentence, which is for
 * the person waiting rather than for the person who wrote the code.
 */
function plainReason(note: string): string {
  if (/API key is invalid/i.test(note)) return 'The Anthropic key is not valid, so the Coach read the journey on its own'
  if (/ANTHROPIC_API_KEY|no key|not set|not configured/i.test(note)) return 'No Anthropic key here, so the Coach read the journey on its own'
  if (/did not answer within|timeout|timed out/i.test(note)) return 'Anthropic took too long, so the Coach went with its own reading'
  if (/401|auth|expired|sign in|login|logged in/i.test(note)) return 'The claude command is signed out, so the Coach read the journey on its own'
  if (/network|fetch|failed to load|502|503/i.test(note)) return 'Anthropic could not be reached, so the Coach read the journey on its own'
  return 'Anthropic did not answer, so the Coach went with its own reading'
}

/** One place turns an event into words, so the words cannot drift from it. */
function narrate(event: ProgressEvent): Narration | null {
  switch (event.kind) {
    case 'copy:start':
      return { lane: 'copy', text: 'Fetching the latest words for your screens', laneStatus: 'fetching', tone: 'working' }
    case 'copy:done': {
      const source = SOURCE[String(event.source)] ?? SOURCE.file
      return {
        lane: 'copy',
        text: `Your screens will show ${source.sentence}`,
        record: `Words from ${source.sentence}`,
        laneStatus: source.short,
        tone: 'ok',
      }
    }
    case 'copy:failed':
      return {
        lane: 'copy',
        text: 'Could not fetch the shared words, so your screens will show the ones saved on this computer',
        // The reason verbatim, in the record: it is evidence, and rewording it
        // would make the screen less honest about what went wrong.
        record: `Shared words unreachable: ${event.reason}`,
        laneStatus: 'this computer',
        tone: 'retry',
      }
    case 'journey:start':
      return { lane: 'journey', text: 'Building the journey your answers describe', laneStatus: 'building', tone: 'working' }
    case 'journey:done':
      return {
        lane: 'journey',
        text: `Your journey has ${event.screens} screens across ${event.steps} steps`,
        record: `${event.name}: ${event.screens} screens, ${event.steps} steps`,
        laneStatus: `${event.steps} steps`,
        tone: 'ok',
      }
    case 'checks:start':
      return { lane: 'checks', text: 'Checking the content in every market and way to pay', laneStatus: 'checking', tone: 'working' }
    case 'checks:done': {
      const failing = Number(event.failing)
      const total = Number(event.contexts)
      return {
        lane: 'checks',
        text: failing
          ? `${failing} of the ${total} market and payment combinations have a problem`
          : `Checked all ${total} market and payment combinations. Nothing wrong`,
        record: failing
          ? `${failing} of ${total} combinations failing: ${(event.labels as string[]).slice(0, 3).join(', ')}`
          : `${total} combinations checked, all fine`,
        laneStatus: failing ? `${failing} with problems` : 'all fine',
        tone: failing ? 'retry' : 'ok',
      }
    }
    case 'coach:start':
      return { lane: 'coach', text: 'The Coach is reading your journey', laneStatus: 'reading', tone: 'working' }
    case 'coach:read': {
      const findings = Number(event.findings)
      return {
        lane: 'coach',
        text: findings
          ? `The Coach found ${findings} thing${findings === 1 ? '' : 's'} to look at, and is asking the AI too`
          : 'The Coach found nothing to raise, and is asking the AI too',
        record: `The Coach found ${findings} to look at. Journey health ${event.health} out of 100`,
        detail: `health ${event.health}`,
        laneStatus: 'asking the AI',
        tone: 'working',
      }
    }
    case 'coach:done': {
      const added = Number(event.added)
      return {
        lane: 'coach',
        text: added
          ? `The AI added ${added} more thing${added === 1 ? '' : 's'} to look at`
          : 'The AI had nothing to add',
        record: added ? `The AI added ${added} to the Coach's ${event.findings}` : 'The AI had nothing to add',
        laneStatus: added ? `${added} more` : 'nothing to add',
        tone: 'ok',
      }
    }
    case 'coach:quiet':
      return {
        lane: 'coach',
        text: plainReason(String(event.note)),
        // The exact reason stays on screen, one line down, for whoever needs it.
        record: `The AI was not used: ${event.note}`,
        laneStatus: 'the Coach only',
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
      // The Coach's own face rather than the kit's generic orb: the slow lane
      // on this screen is the Coach, and it is the same face the tool shows.
      // 36 is what the CSS orb stood at, so the halo behind it still fits.
      mark={<CoachOrb size={36} />}
      narrate={narrate}
      isTerminal={(event) => TERMINAL.has(event.kind)}
      // Checked against what is in hand, not against the stream: a lane can
      // settle without the job being done.
      delivered={() => result !== null}
      deliveredSignal={result}
      openingText="Opening your journey…"
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
