import './journey.css'

import type { CardSet, Context } from '../rules/content'
import type { Journey, ResolvedStep, Step } from '../rules/journey'
import { excludedSteps, knownAt, planJourney } from '../rules/journey'
import { CardSetView } from './CardSetView'

/**
 * The journey as it resolves for a context — which steps appear, in order, and
 * which dropped out and why.
 *
 * The two skip reasons are not the same thing. `not-applicable` means the value
 * never exists here; `seeded` means the entry CTA already carried it, so the
 * step is skipped but its value still flows to later screens.
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
  const plan = planJourney(journey, context)
  const included = plan.filter((r) => r.skipped === null)
  const excluded = excludedSteps(journey, context)

  return (
    <div className="jy">
      <p className="jy__entry">
        Entry: <strong>{journey.entry.cta}</strong> · {journey.entry.section}
        {journey.seeds.length > 0 && (
          <span className="jy__seeds"> — arrives knowing {journey.seeds.join(', ')}</span>
        )}
      </p>

      <ol className="jy__steps">
        {included.map(({ step, narrowed }, i) => (
          <li className="jy__step" key={step.id} data-renderer={step.renderer}>
            <div className="jy__head">
              <span className="jy__index">{i + 1}</span>
              <span className="jy__name">{step.name}</span>
              {narrowed && <span className="jy__narrowed">narrowed by {step.narrowedBy}</span>}
            </div>
            {step.renderer === 'plans' ? (
              <div className="jy__live">
                <CardSetView set={set} context={context} />
              </div>
            ) : (
              <StepStub step={step} known={knownAt(journey, context, step.id)} />
            )}
          </li>
        ))}
      </ol>

      {excluded.length > 0 && (
        <ul className="jy__excluded">
          {excluded.map(({ step, skipped }: ResolvedStep) => (
            <li key={step.id} data-reason={skipped ?? undefined}>
              <strong>{step.name}</strong>{' '}
              {skipped === 'seeded'
                ? `— skipped, the entry already carries ${step.captures}`
                : '— not applicable in this market'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StepStub({ step, known }: { step: Step; known: string[] }) {
  return (
    <div className="jy__stub">
      {step.figmaFrame && <p className="jy__frame">{step.figmaFrame}</p>}
      {known.length > 0 && <p className="jy__known">Inbound: {known.join(', ')}</p>}
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
