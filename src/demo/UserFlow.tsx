import type { ReactNode } from 'react'
import { iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { ResolvedStep } from '../rules/journey'

/**
 * The journey as a list: one row per step, in order, with the way into each.
 *
 * The rows also carry the handoff — `trailing` draws each step's status chip
 * (or the button that marks it ready), so the whole journey's standing with
 * dev is readable from here without opening a screen.
 */
export function UserFlow({
  planned,
  selectedId,
  onOpen,
  trailing,
  footnote,
}: {
  planned: ResolvedStep[]
  selectedId: string
  onOpen: (stepId: string) => void
  /** Drawn between the step's name and its edit button. */
  trailing?: (stepId: string) => ReactNode
  /** One muted line under the list, for what the list is not showing. */
  footnote?: ReactNode
}) {
  return (
    <section className="uf">
      <h2 className="uf__title">User flow:</h2>

      <ol className="uf__list">
        {planned.map(({ step, skipped }, i) => {
          const editable = step.renderer !== 'stub' && !skipped
          return (
            <li className="uf__item" key={step.id}>
              {i > 0 && <span className="uf__link" aria-hidden="true" />}
              <div
                className="uf__row"
                data-on={step.id === selectedId || undefined}
                data-skipped={skipped ?? undefined}
              >
                <span className="uf__dot" data-done={editable || undefined} aria-hidden="true">
                  {editable && <Icon svg={iconArtwork.checkmark} size={16} />}
                </span>

                <span className="uf__name">{step.shortName ?? step.name}</span>

                {skipped && (
                  <span className="uf__tag">{skipped === 'seeded' ? 'seeded' : 'not here'}</span>
                )}

                {editable && trailing?.(step.id)}

                {editable && (
                  <button
                    type="button"
                    className="uf__edit"
                    onClick={() => onOpen(step.id)}
                    aria-label={`Edit ${step.shortName ?? step.name}`}
                  >
                    <Icon svg={iconArtwork.edit} size={20} />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {footnote && <p className="pl-hidden-note">{footnote}</p>}
    </section>
  )
}
