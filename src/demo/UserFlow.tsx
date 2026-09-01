import type { ReactNode } from 'react'
import { iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { ResolvedStep } from '../rules/journey'

/**
 * The journey as a list in the panel, mirroring the tiles in the preview.
 *
 * Two views of one thing, so they share a selection: opening a step here is the
 * same act as opening its tile. What differs is the job — this is the compact
 * index you navigate by, the tiles are the shape you read.
 *
 * The check marks a step with real fields behind it. Today that is Subscription
 * and nothing else, which the list says plainly rather than implying nine
 * editable screens and disappointing eight times.
 */
export function UserFlow({
  planned,
  selectedId,
  onOpen,
  marker,
  footnote,
}: {
  planned: ResolvedStep[]
  selectedId: string
  onOpen: (stepId: string) => void
  /** Drawn after a step's name — its handoff status, when it has one. */
  marker?: (stepId: string) => ReactNode
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
                {marker?.(step.id)}

                {skipped && (
                  <span className="uf__tag">{skipped === 'seeded' ? 'seeded' : 'not here'}</span>
                )}

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
