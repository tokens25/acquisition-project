import { useState } from 'react'
import { CardSetView } from '../card/CardSetView'
import { artworkFor } from '../card/flowArtwork'
import { Icon } from '../components/Icon'
import { iconArtwork } from '../card/assets'
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

  // A tile is one screen at the shape the design file draws it — 375 x 788 —
  // shown at 280 wide. The height is derived rather than written down twice,
  // so narrowing the tile cannot silently change the proportion. The card set
  // still renders at its real 375 and is scaled into the box, which is what
  // keeps the live tile and an exported frame the same size beside each other.
  const FRAME = { width: 375, height: 788 }
  const TILE_WIDTH = 280
  const TILE = {
    width: TILE_WIDTH,
    height: Math.round((TILE_WIDTH * FRAME.height) / FRAME.width),
  }
  const frame = { box: { width: TILE.width, height: TILE.height }, viewport: FRAME.width }
  const thumbScale = frame.box.width / frame.viewport

  /**
   * The tile is a phone, so the card set renders as one.
   *
   * Every other screen in the row is a 375 x 788 phone frame exported from
   * Figma. Letting Subscription follow the set's own device put a 1100-wide
   * desktop row in a phone-shaped tile — three cards squeezed to a quarter
   * size with most of the tile left empty, and the one live screen looking
   * nothing like the twelve beside it. The edit view still honours the set's
   * device; this is the frames row, and the frames row is a phone flow.
   */
  const phoneSet = set.device === 'mobile' ? set : { ...set, device: 'mobile' as const }



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
              {tiles.map(({ state, number }, i) => {
                const art = artworkFor(step.id, state)
                return (
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

                  {/* Three cases, and the difference between them is the
                      point. Subscription renders live, so it moves when the
                      content moves. The others show their Figma frame, which
                      does not move — that is what marks a screen as still to
                      be built. A step with neither falls back to its name.

                      The live render takes its width from the tile rather than
                      from the box, so it lines up with an exported frame beside
                      it instead of overhanging by the border. */}
                  <span className="jf__screen">
                    {step.renderer === 'plans' && !skipped ? (
                      <span className="jf__thumb" aria-hidden="true">
                        {/* zoom, not transform: a transform shrinks what is
                            drawn but not the box it occupies, so the tile
                            reserved the card set's full unscaled height and
                            left a few hundred pixels of nothing below it. */}
                        <span
                          className="jf__thumb-scale"
                          style={{ inlineSize: frame.viewport, zoom: thumbScale }}
                        >
                          <CardSetView set={phoneSet} context={context} />
                        </span>
                      </span>
                    ) : art ? (
                      // The picture keeps its own chrome at the bottom, so the
                      // page is clipped to everything above it. Height is the
                      // frame's, less that bar, at the tile's scale.
                      <span
                        className="jf__page"
                        style={{
                          blockSize: Math.round((art.height - art.chrome) * thumbScale),
                        }}
                      >
                        <img className="jf__art" src={art.src} alt="" loading="lazy" draggable={false} />
                      </span>
                    ) : (
                      <span className="jf__frame">{step.figmaFrame ?? step.name}</span>
                    )}
                  </span>

                  {/* The address bar, at the foot where iOS puts it and where
                      every frame in the section draws it. Pinned rather than
                      left in the picture, so it stays put while the page
                      scrolls behind it — which is what the real browser does
                      and what the flat export cannot. */}
                  <span className="jf__chrome" aria-hidden="true">
                    <Icon svg={iconArtwork['chevron-left']} size={16} />
                    <span className="jf__url">dazn.com</span>
                    <span className="jf__dots">•••</span>
                  </span>

                  {state && <span className="jf__state">{state}</span>}
                </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
