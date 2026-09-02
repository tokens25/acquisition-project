import type { ReactNode } from 'react'
import { useState } from 'react'
import { CardSetView } from '../card/CardSetView'
import { FlowStep } from '../card/FlowStep'
import { artworkFor, flowArtwork } from '../card/flowArtwork'
import { Icon } from '../components/Icon'
import { iconArtwork } from '../card/assets'
import reloadIcon from '../assets/browser/reload.svg'
import siteSettingsIcon from '../assets/browser/site-settings.svg'
import cellularIcon from '../assets/browser/status-cellular.svg'
import wifiIcon from '../assets/browser/status-wifi.svg'
import batteryIcon from '../assets/browser/status-battery.svg'
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
  marker,
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
  /** Drawn after a step's name — its handoff status, when it has one. */
  marker?: (stepId: string) => ReactNode
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)

  const ids = planned.map((p) => p.step.id)

  // A tile is one screen at the shape the design file draws it — 375 x 788 —
  // shown at 280 wide. The height is derived rather than written down twice,
  // so narrowing the tile cannot silently change the proportion. The card set
  // still renders at its real 375 and is scaled into the box, which is what
  // keeps the live tile and an exported frame the same size beside each other.
  const FRAME = { width: 375 }
  const TILE_WIDTH = 280
  const thumbScale = TILE_WIDTH / FRAME.width

  /**
   * Tall enough that a screen is a screen.
   *
   * The tile replaces each frame's own chrome with one status bar and one
   * address bar, and those are not the heights the frames reserved — a 54-tall
   * Safari bar becomes a 90-tall one. Sizing the tile off a frame's total
   * height therefore left every single-screen design a few dozen pixels short,
   * so Cadence and Confirmation scrolled to show their last 20px. That is not
   * scrolling, it is a tile that does not fit its own contents.
   *
   * So the height is derived from the tallest page among the frames that are
   * one screen rather than a long form. Account setup and Checkout are longer
   * than a phone screen by design and still scroll, which is the distinction
   * worth keeping.
   */
  const ONE_SCREEN = 812
  const pages = Object.values(flowArtwork)
    .filter((f) => f.height <= ONE_SCREEN)
    .map((f) => (f.height - f.status - f.chrome) * thumbScale)
  const CHROME = { status: 50 * thumbScale, address: 90 * thumbScale }
  const TILE = {
    width: TILE_WIDTH,
    height: Math.ceil(CHROME.status + Math.max(...pages, 0) + CHROME.address) + 2,
  }
  const frame = { box: { width: TILE.width, height: TILE.height }, viewport: FRAME.width }

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

  /** "5" for one screen, "5–7" for a step drawn three ways, "—" for a skip. */
  const numbering = (tiles: { number: number | null }[]) => {
    const ns = tiles.map((t) => t.number).filter((n): n is number => n !== null)
    if (ns.length === 0) return '—'
    const first = ns[0]
    const last = ns[ns.length - 1]
    return first === last ? String(first) : `${first}–${last}`
  }

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
              {/* The step's position in the flow, beside its name rather than
                  over each screen. A step drawn in three states occupies three
                  numbers, so it shows the span — the last number in the row
                  still equals the journey's screen count. */}
              <span className="jf__num">{numbering(tiles)}</span>
              {step.shortName ?? step.name}
              {!skipped && marker?.(step.id)}
              {!skipped && tiles.length > 1 && (
                <span className="jf__states"> · {tiles.length} states</span>
              )}
              {skipped === 'seeded' && <span className="jf__tag">seeded</span>}
              {skipped === 'not-applicable' && <span className="jf__tag">not here</span>}
            </h3>

            <div className="jf__tiles">
              {tiles.map(({ state }, i) => {
                const art = artworkFor(step.id, state)
                return (
                <div className="jf__cell" key={i}>
                <button
                  type="button"
                  className="jf__tile"
                  style={{ blockSize: TILE.height }}
                  data-on={step.id === selectedId || undefined}
                  data-editable={step.renderer === 'plans' || undefined}
                  disabled={Boolean(skipped)}
                  onClick={() => onOpen(step.id)}
                >
                  {/* iOS/android — node 586:26748, at the tile's scale. Static
                      at the top the way the address bar is static at the foot,
                      so both hold still while the page scrolls between them.
                      Each frame's own status bar is clipped off the export. */}
                  <span className="jf__status" style={{ zoom: thumbScale }} aria-hidden="true">
                    <span className="jf__status-time">9:41</span>
                    <span className="jf__status-island" />
                    <span className="jf__status-levels">
                      <img className="jf__status-cell" src={cellularIcon} alt="" />
                      <img className="jf__status-wifi" src={wifiIcon} alt="" />
                      <img className="jf__status-battery" src={batteryIcon} alt="" />
                    </span>
                  </span>

                  {/* The design first, then the live render, then the name.
                      A step with an exported frame shows it, so the row reads
                      as the flow as drawn — including Subscription, whose new
                      design is not what the card component renders yet. The
                      live render is still the whole point of the tool, and it
                      is still what the edit view shows; the row is the flow,
                      the edit view is the thing being built.

                      The live render takes its width from the tile rather than
                      from the box, so it lines up with an exported frame beside
                      it instead of overhanging by the border. */}
                  <span className="jf__screen">
                    {step.renderer !== 'stub' && !skipped && !art ? (
                      <span className="jf__thumb" aria-hidden="true">
                        {/* zoom, not transform: a transform shrinks what is
                            drawn but not the box it occupies, so the tile
                            reserved the card set's full unscaled height and
                            left a few hundred pixels of nothing below it. */}
                        <span
                          className="jf__thumb-scale"
                          style={{ inlineSize: frame.viewport, zoom: thumbScale }}
                        >
                          {step.renderer === 'plans' ? (
                            <CardSetView set={phoneSet} context={context} interactive={false} />
                          ) : (
                            <FlowStep step={step} state={state ?? 'default'} set={set} />
                          )}
                        </span>
                      </span>
                    ) : art ? (
                      // The picture keeps its own chrome at the bottom, so the
                      // page is clipped to everything above it. Height is the
                      // frame's, less that bar, at the tile's scale.
                      <span
                        className="jf__page"
                        style={{
                          blockSize: Math.round(
                            (art.height - art.status - art.chrome) * thumbScale,
                          ),
                        }}
                      >
                        <img
                          className="jf__art"
                          style={{ marginBlockStart: -Math.round(art.status * thumbScale) }}
                          src={art.src}
                          alt=""
                          loading="lazy"
                          draggable={false}
                        />
                      </span>
                    ) : (
                      <span className="jf__frame">{step.figmaFrame ?? step.name}</span>
                    )}
                  </span>

                  {/* .Safari, iOS — node 583:23478, drawn at the tile's scale
                      so it is the component's own 375-wide geometry rather
                      than an approximation of it. At the foot where iOS puts
                      it and where every frame in the section draws it, and
                      pinned rather than left in the picture, so it holds still
                      while the page scrolls behind it. */}
                  <span className="jf__chrome" style={{ zoom: thumbScale }} aria-hidden="true">
                    <span className="jf__chrome-btn">
                      <Icon svg={iconArtwork['chevron-left']} size={20} />
                    </span>
                    <span className="jf__url">
                      <img className="jf__url-icon" src={siteSettingsIcon} alt="" />
                      <span className="jf__url-text">dazn.com</span>
                      <img className="jf__url-reload" src={reloadIcon} alt="" />
                    </span>
                    <span className="jf__chrome-btn jf__dots">•••</span>
                  </span>

                </button>

                {/* Under the tile, not over the screen. A caption naming which
                    version this is belongs beside the picture rather than on
                    top of it, where it covered the design it was labelling. */}
                {state && <span className="jf__state">{state}</span>}
                </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
