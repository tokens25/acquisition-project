import './journey.css'

import type { CardSet, Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { knownAt, resolveJourney } from '../rules/journey'
import { CardSetView } from './CardSetView'

/**
 * Preview of the one step being edited, not the whole journey.
 *
 * Only the subscription step renders a real component. The rest show what is
 * known about them — their Figma frame, the values arriving from earlier steps,
 * their states and their runtime gates — so the journey stays legible before
 * those screens exist.
 */
export function StepPreview({
  journey,
  set,
  context,
}: {
  journey: Journey
  set: CardSet
  context: Context
}) {
  const steps = resolveJourney(journey, context)
  const step = steps.find((s) => s.id === set.stepId) ?? steps[0]
  if (!step) return <p className="jy__note">This journey has no steps in this market.</p>

  const position = steps.indexOf(step) + 1
  const inbound = knownAt(journey, context, step.id)

  return (
    <div className="jy">
      {/* Lead with the step's own name. The entry CTA is quoted and labelled
          because a journey can enter from "Sign up" while a later step is also
          called Sign up — without that, the line reads as the wrong step. */}
      <p className="jy__entry">
        <strong className="jy__step-name">{step.shortName ?? step.name}</strong>
        <span className="jy__meta">
          step {position} of {steps.length} · entered from “{journey.entry.cta}”
        </span>
        {inbound.length > 0 && <span className="jy__seeds">inbound: {inbound.join(', ')}</span>}
      </p>

      {step.renderer === 'plans' ? (
        <CardSetView set={set} context={context} />
      ) : (
        <div className="jy__stub jy__stub--solo">
          <p className="jy__frame">{step.figmaFrame}</p>
          {step.states && (
            <p className="jy__states">
              {step.states.length} states: {step.states.join(' → ')}
            </p>
          )}
          {step.requires && (
            <ul className="jy__requires">
              {step.requires.map((r) => (
                <li key={r}>
                  <code>{r}</code>
                </li>
              ))}
            </ul>
          )}
          {step.note && <p className="jy__note">{step.note}</p>}
          <p className="jy__todo">Placeholder — this screen isn’t built yet.</p>
        </div>
      )}
    </div>
  )
}
