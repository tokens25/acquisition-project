import type { Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { planJourney } from '../rules/journey'

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
  // Every step with its decision, not only the ones that render. A screen the
  // entry already knows the answer to is absent for a reason, and the reason is
  // the thing worth reading — J-9. Numbers count only what renders, so a
  // skipped step does not consume a position in the flow.
  const planned = planJourney(journey, context)
  // Positions are assigned before render rather than counted during it: only
  // steps that render take a number, so a skipped one does not consume a
  // position in the flow.
  const rows = planned.map((entry, i) => ({
    ...entry,
    position: entry.skipped ? null : planned.slice(0, i + 1).filter((e) => !e.skipped).length,
  }))



  return (
    <ol className="ed-steps">
      {rows.map(({ step, skipped, position }) => {
        const why =
          skipped === 'seeded'
            ? 'Skipped — the entry already carries this answer'
            : skipped === 'not-applicable'
              ? 'Not run in this market'
              : undefined
        return (
          <li key={step.id}>
            <button
              type="button"
              className="ed-step"
              data-on={step.id === selectedId || undefined}
              data-editable={step.renderer === 'plans' || undefined}
              data-proposed={step.proposed || undefined}
              data-skipped={skipped ?? undefined}
              disabled={Boolean(skipped)}
              title={why ?? (step.proposed ? 'Agreed here — not yet drawn in Figma' : undefined)}
              onClick={() => onSelect(step.id)}
              aria-current={step.id === selectedId ? 'step' : undefined}
            >
              <span className="ed-step__num">{position ?? '—'}</span>
              <span className="ed-step__name">{step.shortName ?? step.name}</span>
              {step.proposed && !skipped && <span className="ed-step__tag">proposed</span>}
              {skipped === 'seeded' && <span className="ed-step__tag">seeded</span>}
              {skipped === 'not-applicable' && <span className="ed-step__tag">not here</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
