import { useState } from 'react'
import { CardSetView } from '../card/CardSetView'
import type { CardSet, Context } from '../rules/content'
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
  set,
  context,
  onReorder,
  reordered,
  onResetOrder,
}: {
  planned: ResolvedStep[]
  selectedId: string
  onOpen: (stepId: string) => void
  /** For the thumbnails — the steps that have a component render it for real. */
  set: CardSet
  context: Context
  /** Called with the full step order after a move. */
  onReorder?: (stepIds: string[]) => void
  reordered?: boolean
  onResetOrder?: () => void
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)

  const ids = planned.map((p) => p.step.id)

  /**
   * The thumbnail is the screen it depicts, at the device's own proportions —
   * not the desktop row squeezed into a phone-shaped box. Both the frame's
   * aspect and the viewport the cards lay out in follow the device, so the
   * mobile tile shows one card in a portrait frame and the desktop tile shows
   * the row.
   */
  const frame =
    set.device === 'mobile'
      ? // A phone: portrait, so height binds and the box is narrower than the
        // tile. 375 is the viewport the cards lay out in.
        { box: { width: 100, height: 178 }, viewport: 375 }
      : // A desktop window: width binds, 16:10.
        { box: { width: 152, height: 95 }, viewport: 1100 }
  const thumbScale = frame.box.width / frame.viewport



  /** Move `id` to sit before or after `target`, and hand back the new order. */
  const move = (id: string, target: string, after: boolean) => {
    if (!onReorder || id === target) return
    const rest = ids.filter((s) => s !== id)
    const at = rest.indexOf(target)
    if (at < 0) return
    rest.splice(after ? at + 1 : at, 0, id)
    onReorder(rest)
  }

  /** Alt + arrow nudges a step one place, so this works without a pointer. */
  const nudge = (id: string, delta: number) => {
    if (!onReorder) return
    const from = ids.indexOf(id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= ids.length) return
    const next = ids.slice()
    next.splice(to, 0, next.splice(from, 1)[0])
    onReorder(next)
  }
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
        {onReorder && <span className="jf__hint"> · drag a step to reorder, or alt + ← →</span>}
        {reordered && (
          <>
            <span className="jf__reordered">reordered</span>
            <button type="button" className="jf__reset" onClick={onResetOrder}>
              Reset to the Figma order
            </button>
          </>
        )}
      </p>

      <div className="jf__row">
        {groups.map(({ step, skipped, tiles }) => (
          <section
            className="jf__step"
            key={step.id}
            data-skipped={skipped ?? undefined}
            data-dragging={dragging === step.id || undefined}
            data-drop={over?.id === step.id ? (over.after ? 'after' : 'before') : undefined}
            draggable={Boolean(onReorder)}
            tabIndex={onReorder ? 0 : undefined}
            onDragStart={(e) => {
              setDragging(step.id)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', step.id)
            }}
            onDragEnd={() => {
              setDragging(null)
              setOver(null)
            }}
            onDragOver={(e) => {
              if (!dragging || dragging === step.id) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              // Which half of the target the pointer is over decides which side
              // it lands on — the same gesture reads as insert-before on the
              // left and insert-after on the right.
              const box = e.currentTarget.getBoundingClientRect()
              setOver({ id: step.id, after: e.clientX > box.left + box.width / 2 })
            }}
            onDragLeave={() => setOver((o) => (o?.id === step.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain') || dragging
              if (id) move(id, step.id, over?.after ?? false)
              setDragging(null)
              setOver(null)
            }}
            onKeyDown={(e) => {
              if (!e.altKey) return
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                nudge(step.id, -1)
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                nudge(step.id, 1)
              }
            }}
          >
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

                  {/* Only the plans step has a component, so only it can show
                      the real thing. The rest name their Figma frame — a
                      drawn thumbnail would be a picture of a screen this app
                      cannot actually produce. */}
                  {step.renderer === 'plans' && !skipped ? (
                    <span
                      className="jf__thumb"
                      style={{ inlineSize: frame.box.width, blockSize: frame.box.height }}
                      aria-hidden="true"
                    >
                      <span
                        className="jf__thumb-scale"
                        style={{
                          inlineSize: frame.viewport,
                          transform: 'scale(' + thumbScale + ')',
                        }}
                      >
                        <CardSetView set={set} context={context} />
                      </span>

                    </span>
                  ) : (
                    <span className="jf__frame">{step.figmaFrame ?? step.name}</span>
                  )}

                  {state && <span className="jf__state">{state}</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
