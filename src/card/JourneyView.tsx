import './journey.css'

import type { CardSet, Context } from '../rules/content'
import type { Journey, Step } from '../rules/journey'
import { excludedSteps, resolveJourney } from '../rules/journey'
import { CardSetView } from './CardSetView'

/**
 * The journey as it resolves for a context — which steps appear, in order.
 *
 * Only `plans` renders a real component; the rest are stubs carrying their
 * Figma frame, their states and the runtime conditions they depend on. That
 * keeps the journey model testable before the components exist.
 */
export function JourneyView({
  journey,
  set,
  context,
}: {
  journey: Journey
  set: CardSet
  context: Context
}) {
  const steps = resolveJourney(journey, context)
  const excluded = excludedSteps(journey, context)

  return (
    <div className="jy">
      <ol className="jy__steps">
        {steps.map((step, i) => (
          <li className="jy__step" key={step.id} data-renderer={step.renderer}>
            <div className="jy__head">
              <span className="jy__index">{i + 1}</span>
              <span className="jy__name">{step.name}</span>
            </div>
            {step.renderer === 'plans' ? (
              <div className="jy__live">
                <CardSetView set={set} context={context} />
              </div>
            ) : (
              <StepStub step={step} />
            )}
          </li>
        ))}
      </ol>

      {excluded.length > 0 && (
        <p className="jy__excluded">
          Not in this context: {excluded.map((s) => s.name).join(', ')}
        </p>
      )}
    </div>
  )
}

function StepStub({ step }: { step: Step }) {
  return (
    <div className="jy__stub">
      {step.figmaFrame && <p className="jy__frame">{step.figmaFrame}</p>}
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
    </div>
  )
}
