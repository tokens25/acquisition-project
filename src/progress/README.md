# The waiting screen: a portable kit

This is the processing screen from the DAZN Hero Banner Studio, extracted so
another product can use the same look and the same timing logic with its own
pipeline. Nothing DAZN-specific is left in it: no Tailwind, no design tokens,
no assets, no copy about banners.

It has been typechecked and run standalone (React 18, Next.js app router) with
a three-lane mock pipeline before shipping to you.

```
progress-screen-kit/
  ProgressScreen.tsx     the screen: visuals + the reveal-gate logic
  progressBus.ts         the event channel your pipeline reports to
  progress-screen.css    all the styling and animation, plain CSS
  example.tsx            a worked example on a made-up document pipeline
  README.md              this file
```

## Install

1. Copy the four files into your project (anywhere; they only import each other).
2. `import "./progress-screen.css"` once, wherever you load global CSS.
3. Peer requirement: React 18+. That is all. No other dependency.

## The 60-second version

Your pipeline reports real events to a bus. You give the screen three
functions: how to turn an event into a sentence (`narrate`), which events mean
a workstream has finished (`isTerminal`), and how to tell whether the job is
actually delivered (`delivered`). The screen does the rest: the live sentence,
the parallel lane strip, the outcome record, the elapsed clock, the fade, the
fail-open watchdog, and the reveal.

```tsx
<ProgressScreen
  bus={myBus}
  lanes={[
    { id: "extract", label: "READ" },
    { id: "draft", label: "DRAFT" },
    { id: "check", label: "CHECK" },
  ]}
  narrate={narrate}
  isTerminal={(e) => TERMINAL.has(e.kind)}
  delivered={() => !!output.trim() && score !== null}
  deliveredSignal={score}
  subject={documentId}
  onCancel={abortEverythingThenNavigate}
/>
```

`example.tsx` is the same thing filled in end to end. Start there.

## The rules that matter more than the code

The visual part took an afternoon. These rules took weeks of user reports, and
they are why the screen is trusted rather than tolerated. If your colleague
keeps the CSS and drops these, they have copied the wrong half.

**1. Every line narrates a real event.** No synthetic steps, no percentage
driven by a timer, no "almost there". When a grader or a provider gives a
reason, show that reason verbatim: it is evidence, and paraphrasing it makes
the screen less honest. Setbacks are stated plainly, including failures.

**2. Completion is a fact you state, never a vibe you infer.** We first
inferred "this lane is finished" from the message's tone. Two mid-flight events
carried a calm tone (a provisional draft; a rejection that is followed by
another attempt) and both retired their lane early, so the screen left while
the work was still running and the user landed on half-written output. Tone is
presentation. `isTerminal` is the fact. And a failure IS an ending: include
your error events, or a failed lane hangs until the watchdog.

**3. "Done" is checked against your state, not the event stream.** The stream
cannot express it. "No lane is working" is ambiguous, because a lane that has
not started looks identical to one that has finished; and a lane can settle
with a non-result ("nothing for me to do yet"), which is terminal but is not
the promise being kept. So the events decide *when* to check and `delivered()`
decides *whether* it is done: is the output really in the field, is the score
really on the dial. This one cost us a full day of confused bug reports.

**4. Hold, then reveal.** Every lane must stay settled for a short hold before
the screen leaves; any lane going back to work cancels it. And if anything
downstream of your pipeline is debounced, the hold must outlast that debounce,
or the screen opens and then visibly starts working again in front of the user.

**5. A result can arrive as state with no event at all** (a cached answer).
That is what `deliveredSignal` is for. Without it, such a run sits on the
waiting screen until the watchdog while the finished screen waits behind it.

**6. Never trap the user.** Two guarantees. The fail-open watchdog dissolves
the screen after a long silence, so a hung pipeline cannot lock the app. And
Cancel *stops the work* rather than hiding it: abort the in-flight calls in
`onCancel` so nothing keeps running and nothing keeps billing, then navigate
while the overlay is still opaque so there is no flash of the unfinished screen.

**7. A question holds everything.** When the pipeline needs an answer, the
screen stays up behind the question and the watchdog pauses. User thinking time
must never be counted as a stalled pipeline.

**8. Silence is the enemy.** If a step can take more than a couple of seconds,
emit an event when it starts and when it ends, on every path out, including the
error path and the "superseded by a newer request" path. Where a step is really
two calls, emit something between them: it turns the watchdog's unit of silence
from two calls into one, which is what lets you set an honest (long) timeout
without a two-minute blind wait.

**9. Leave the diagnostics on.** One console line per decision, naming which
lane moved and whether the gate armed. It is how you tell a *stuck* lane
(missing terminal event) from a *flapping* one (keeps cancelling the hold).
Those have opposite fixes and look identical from the outside.

## Tuning the timings

Defaults are in `DEFAULT_TIMINGS`. Derive yours from your own budgets rather
than copying ours:

| Setting | Ours | What it must satisfy |
| --- | --- | --- |
| `armWindowMs` | 8s | How long a run may take to emit its first event. |
| `quietDissolveMs` | 108s | Longer than one call's worst honest silence (retries and backoff included). |
| `allSettledHoldMs` | 1.7s | Longer than any debounce downstream of the pipeline. |
| `fadeMs` | 420ms | Must match the CSS transition. |

## Restyling

Change the four accent variables at the top of `progress-screen.css`
(`--ps-accent-1..4`) and everything follows: the aurora, the halo, the edge
line, the hairline sweep. The colour budget is deliberately tiny — an aurora
wash, the mark's halo, the edge — and everything else is monochrome type and
hairlines. That restraint is the look; adding more colour is what makes these
screens feel cheap.

The mark defaults to a CSS-only orb so the kit needs no assets. Pass your
product's own avatar as `mark` when you have one: a familiar face working beats
a generic loader handing over to one.

`prefers-reduced-motion` is handled: the washes freeze but stay visible, and
the sweep stops. Do not delete that block.

## One deliberate omission

Ours also pre-warms the next views in the background after the reveal, and
persists "this run was already shown" per project. The session-key behaviour is
here (`sessionKey`); the pre-warming is not, because it is entirely specific to
what our product does next.
