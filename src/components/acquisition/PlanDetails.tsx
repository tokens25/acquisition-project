import './acquisition.css'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import closeIcon from '../../assets/icons/action-close-md.svg?raw'
import { Button } from '../Button'
import { Icon } from '../Icon'

export interface PlanDetailsCompetition {
  id: string
  /** Competition or team name. */
  name: string
  /** One line about what it gives you. Absent for most entries. */
  blurb?: string | null
  src: string
  alt: string
}

export interface PlanDetailsFeature {
  id: string
  /** Raw SVG markup, already chosen by the set's house style. */
  icon?: string
  text: string
}

export interface PlanDetailsProps {
  /** Plan Name — the same string the card's header carries. */
  title: string
  /** The authored description in full, with no "… more" applied. */
  description: string
  /** The card's own CTA copy, so the two cannot disagree. */
  ctaLabel: string
  ultimate?: boolean
  competitions: PlanDetailsCompetition[]
  features: PlanDetailsFeature[]
  /**
   * The card this was opened from, looked up when the dialog needs to place
   * itself. A function rather than the element, because the row scrolls and
   * re-renders underneath — asking each time is cheaper than keeping a
   * reference that can go stale.
   */
  anchor?: () => HTMLElement | null
  onClose: () => void
}

/**
 * Keeps the dialog inside a band when its card runs past the end of it.
 *
 * No margin: the dialog is narrower than the card and `max-` caps it to the
 * preview, so a card fully on screen always centres exactly. A margin here
 * would push the first card's dialog off its own centre, which is the one
 * thing this placement exists to get right. `min` wins the tie, so a band
 * shorter than the dialog pins it to the near edge rather than the far one.
 */
function fit(start: number, size: number, min: number, max: number) {
  return Math.max(min, Math.min(start, max - size))
}

/**
 * The part of the overlay that is actually on screen.
 *
 * A card is 695 tall and the preview pane scrolls, so on a short window most
 * of a card can be below the fold — and a dialog centred on the card would
 * then open off screen. Every clipping ancestor is intersected in, so the
 * dialog is placed against what you can see rather than against the row's
 * full height. Returned in the overlay's own coordinates.
 */
function visibleBand(root: HTMLElement) {
  const host = root.getBoundingClientRect()
  let top = host.top
  let bottom = host.bottom
  let left = host.left
  let right = host.right
  for (let el = root.parentElement; el; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el)
    if (overflowX === 'visible' && overflowY === 'visible') continue
    const b = el.getBoundingClientRect()
    top = Math.max(top, b.top)
    bottom = Math.min(bottom, b.bottom)
    left = Math.max(left, b.left)
    right = Math.min(right, b.right)
  }
  return {
    host,
    top: top - host.top,
    bottom: bottom - host.top,
    left: left - host.left,
    right: right - host.left,
  }
}

/**
 * PlanDetails — the "All features & content" dialog.
 * Figma: [DEV] Acquisition Journeys (WC26) → `Whats included` (node 8734:278317).
 *
 * Everything on it belongs to the card behind it: title, description, CTA, the
 * competitions and the feature lines all arrive as props from the same derived
 * card the tile renders from. The dialog's job is to show what the card had to
 * cut — the untruncated description and the competitions hiding behind "+N" —
 * not to say anything the card does not.
 *
 * It sizes itself to the preview it overlays rather than to the browser: at
 * 343 × 600 inside a 375 frame, that is the design's own geometry, and a card
 * set previewed at phone scale is the only place the dialog appears.
 *
 * And it opens over its own card. Three cards are on screen at once, so a
 * dialog centred on the row would leave you working out which one you clicked.
 */
export function PlanDetails({
  title,
  description,
  ctaLabel,
  ultimate = false,
  competitions,
  features,
  anchor,
  onClose,
}: PlanDetailsProps) {
  const [tab, setTab] = useState<'content' | 'features'>('content')
  const headingId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  /**
   * Where the dialog goes once the card has been measured, relative to the
   * overlay's top-left. The card's own rectangle goes to CSS as custom
   * properties instead — the dim and the dialog's width are both drawn from it.
   */
  const [box, setBox] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const dialog = dialogRef.current
    if (!root || !dialog || !anchor) return

    const place = () => {
      const card = anchor()
      if (!card) return
      const band = visibleBand(root)
      const c = card.getBoundingClientRect()
      // Physical left/top, not logical: the overlay is pinned to all four
      // edges, so its origin is the top-left corner in either direction, and
      // the rectangles being measured are physical too.
      const frame = {
        left: c.left - band.host.left,
        top: c.top - band.host.top,
        width: c.width,
        height: c.height,
      }
      // Written straight to the element and read back, not routed through
      // state: these decide the size the placement below is about to centre,
      // and a React round trip would place this pass against the last pass's
      // size. The card rectangle is here too so the dim and the width come
      // from one write rather than half from each side.
      const vars: Record<string, number> = {
        '--acq-details-card-left': frame.left,
        '--acq-details-card-top': frame.top,
        '--acq-details-card-width': frame.width,
        '--acq-details-card-height': frame.height,
        '--acq-details-band-inline': band.right - band.left,
        '--acq-details-band-block': band.bottom - band.top,
      }
      for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, `${value}px`)
      }
      const { offsetWidth: w, offsetHeight: h } = dialog

      // Centred on the card, then held inside what is on screen — so a card
      // whose middle is below the fold still opens where you can read it.
      const next = {
        left: fit(frame.left + (c.width - w) / 2, w, band.left, band.right),
        top: fit(frame.top + (c.height - h) / 2, h, band.top, band.bottom),
      }
      setBox((prev) =>
        prev && prev.left === next.left && prev.top === next.top ? prev : next,
      )
    }

    place()
    // Captured on the document: scroll does not bubble, and both the row under
    // the dialog and the pane around it can move the card it is pinned to.
    document.addEventListener('scroll', place, { capture: true, passive: true })
    const observer = new ResizeObserver(place)
    observer.observe(root)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('scroll', place, { capture: true })
      observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [anchor])

  // Escape closes it. Bound to the document because the dialog opens without
  // focus having moved into it yet, and a keydown on the card behind should
  // still dismiss what that card just opened.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="acq-details" ref={rootRef}>
      {/* The scrim is the dismiss target as well as the dim: clicking beside a
          dialog closes it everywhere else, and a bare div would not say so.
          It stays full size for that; the dim itself is drawn over the card. */}
      <button
        type="button"
        className="acq-details__scrim"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className="acq-details__dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        // Until the card is measured it centres on the overlay, which is where
        // it belongs when there is no card to open from.
        data-anchored={box ? '' : undefined}
        style={box ? { left: box.left, top: box.top } : undefined}
      >
        <button
          type="button"
          className="acq-details__close"
          onClick={onClose}
          ref={closeRef}
          aria-label="Close"
        >
          <Icon svg={closeIcon} size={16} />
        </button>

        <div className="acq-details__scroll">
          <div className="acq-details__intro">
            <h2 className="acq-details__title" id={headingId}>
              {title}
            </h2>
            {/* In full. The card measures and trims; this is the place the whole
                thing is meant to be readable. */}
            <p className="acq-details__description">{description}</p>
          </div>

          <div className="acq-details__tabs" role="tablist" aria-label="Plan details">
            <button
              type="button"
              className="acq-details__tab"
              role="tab"
              aria-selected={tab === 'content'}
              data-on={tab === 'content' || undefined}
              onClick={() => setTab('content')}
            >
              Content
            </button>
            <button
              type="button"
              className="acq-details__tab"
              role="tab"
              aria-selected={tab === 'features'}
              data-on={tab === 'features' || undefined}
              onClick={() => setTab('features')}
            >
              Features
            </button>
          </div>

          {tab === 'content' ? (
            <ul className="acq-details__list">
              {competitions.map((c) => (
                <li className="acq-details__row" key={c.id}>
                  <span className="acq-details__logo">
                    {c.src ? <img src={c.src} alt={c.alt} /> : null}
                  </span>
                  <span className="acq-details__copy">
                    <span className="acq-details__row-title">{c.name}</span>
                    {c.blurb && <span className="acq-details__row-blurb">{c.blurb}</span>}
                  </span>
                </li>
              ))}
              {competitions.length === 0 && (
                <li className="acq-details__empty">No competitions on this plan yet.</li>
              )}
            </ul>
          ) : (
            <ul className="acq-details__list acq-details__list--features">
              {features.map((f) => (
                <li className="acq-details__feature" key={f.id}>
                  {f.icon && <Icon svg={f.icon} size={20} />}
                  <span className="acq-details__feature-text">{f.text}</span>
                </li>
              ))}
              {features.length === 0 && (
                <li className="acq-details__empty">No feature lines on this plan yet.</li>
              )}
            </ul>
          )}
        </div>

        <footer className="acq-details__footer">
          <Button appearance={ultimate ? 'subscribe' : 'primary'} size="lg" block>
            {ctaLabel}
          </Button>
        </footer>
      </div>
    </div>
  )
}
