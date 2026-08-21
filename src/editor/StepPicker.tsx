import type { Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { resolveJourney } from '../rules/journey'

/**
 * The steps this journey actually runs, for this market.
 *
 * Dynamic on both axes: a seeded step never appears, and neither does one whose
 * selector excludes the market. Selecting a step is what decides both the edit
 * fields below and the preview beside them.
 */
export function StepPicker({
  journey,
  context,
  selectedId,
  onSelect,
}: {
  journey: Journey
  context: Context
  selectedId: string
  onSelect: (id: string) => void
}) {
  const steps = resolveJourney(journey, context)

  return (
    <ol className="ed-steps">
      {steps.map((step, i) => (
        <li key={step.id}>
          <button
            type="button"
            className="ed-step"
            data-on={step.id === selectedId || undefined}
            data-editable={step.renderer === 'plans' || undefined}
            data-proposed={step.proposed || undefined}
            title={step.proposed ? 'Agreed here — not yet drawn in Figma' : undefined}
            onClick={() => onSelect(step.id)}
            aria-current={step.id === selectedId ? 'step' : undefined}
          >
            <span className="ed-step__num">{i + 1}</span>
            <span className="ed-step__name">{step.shortName ?? step.name}</span>
            {step.proposed && <span className="ed-step__tag">proposed</span>}
          </button>
        </li>
      ))}
    </ol>
  )
}
