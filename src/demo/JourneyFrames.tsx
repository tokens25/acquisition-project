import type { ResolvedStep } from '../rules/journey'

/**
 * The whole journey, one tile per screen, scrolling sideways.
 *
 * Per screen rather than per step, so a step drawn as three states shows as
 * three tiles — the count then matches the number reconciled against the Figma
 * section, and the row becomes that reconciliation made visible rather than a
 * summary of it.
 *
 * Grouped by step so three states do not read as three unrelated screens. A
 * step that does not run gets a single greyed tile whatever its state count: it
 * renders nothing, and three greyed copies of nothing would misstate the flow.
 */
export function JourneyFrames({
  planned,
  selectedId,
  onOpen,
}: {
  planned: ResolvedStep[]
  selectedId: string
  onOpen: (stepId: string) => void
}) {
  // Numbering is assigned before render rather than counted during it: only
  // screens that render take a number, so a skipped step consumes none and the
  // last tile's number equals the journey's declared screen count.
  const statesOf = (entry: ResolvedStep) =>
    entry.skipped ? [null] : (entry.step.states ?? [null])

  // Each screen's number is how many render at or before it — derived from the
  // list rather than counted during render, so a skipped step consumes none and
  // the last tile's number equals the journey's declared screen count.
  const before = (index: number) =>
    planned.slice(0, index).reduce((n, e) => n + (e.skipped ? 0 : statesOf(e).length), 0)

  const groups = planned.map((entry, index) => ({
    step: entry.step,
    skipped: entry.skipped,
    tiles: statesOf(entry).map((state, i) => ({
      state,
      number: entry.skipped ? null : before(index) + i + 1,
    })),
  }))
  const screens = before(planned.length)
  const running = groups.filter((g) => !g.skipped).length

  return (
    <div className="jf">
      <p className="jf__caption">
        {screens} screens across {running} steps
      </p>

      <div className="jf__row">
        {groups.map(({ step, skipped, tiles }) => (
          <section className="jf__step" key={step.id} data-skipped={skipped ?? undefined}>
            <h3 className="jf__step-name">
              {step.shortName ?? step.name}
              {!skipped && tiles.length > 1 && (
                <span className="jf__states"> · {tiles.length} states</span>
              )}
              {skipped === 'seeded' && <span className="jf__tag">seeded</span>}
              {skipped === 'not-applicable' && <span className="jf__tag">not here</span>}
            </h3>

            <div className="jf__tiles">
              {tiles.map(({ state, number }, i) => (
                <button
                  type="button"
                  className="jf__tile"
                  key={i}
                  data-on={step.id === selectedId || undefined}
                  data-editable={step.renderer === 'plans' || undefined}
                  disabled={Boolean(skipped)}
                  onClick={() => onOpen(step.id)}
                >
                  <span className="jf__num">{number ?? '—'}</span>
                  <span className="jf__frame">{step.figmaFrame ?? step.name}</span>
                  {state && <span className="jf__state">{state}</span>}
                  {step.renderer === 'plans' && !skipped && (
                    <span className="jf__live">renders</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
