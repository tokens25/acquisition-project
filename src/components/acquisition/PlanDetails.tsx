import './acquisition.css'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import closeIcon from '../../assets/icons/action-close-md.svg?raw'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { visibleBand } from './viewport'

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

      /*
       * How many device pixels one of this element's own pixels covers.
       *
       * Rectangles come back in device pixels; everything they feed is in the
       * element's own — CSS custom properties, and the dialog's offsetWidth
       * below. Those are the same thing right up until an ancestor scales,
       * which the prototype does to fit an 812-tall phone onto a shorter
       * display. Writing a measurement straight back would then scale it a
       * second time, and the dialog would come out the square of the zoom too
       * small. Every use where nothing scales divides by 1 and is unchanged.
       */
      const z = root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1

      // Physical left/top, not logical: the overlay is pinned to all four
      // edges, so its origin is the top-left corner in either direction, and
      // the rectangles being measured are physical too.
      const frame = {
        left: (c.left - band.host.left) / z,
        top: (c.top - band.host.top) / z,
        width: c.width / z,
        height: c.height / z,
      }
      // The band in the same units, so the clamp below and the width above are
      // measured in one system rather than two.
      const view = {
        left: band.left / z,
        right: band.right / z,
        top: band.top / z,
        bottom: band.bottom / z,
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
        '--acq-details-band-inline': view.right - view.left,
        '--acq-details-band-block': view.bottom - view.top,
      }
      for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, `${value}px`)
      }
      const { offsetWidth: w, offsetHeight: h } = dialog

      // Centred on the card, then held inside what is on screen — so a card
      // whose middle is below the fold still opens where you can read it.
      const next = {
        left: fit(frame.left + (frame.width - w) / 2, w, view.left, view.right),
        top: fit(frame.top + (frame.height - h) / 2, h, view.top, view.bottom),
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
          {/* At the icon's own size. The DS glyph is drawn with a wide margin
              inside its 24 box, so scaling the box down leaves a cross too
              small for the button it sits in. */}
          <Icon svg={closeIcon} size={24} />
        </button>

        <div className="acq-details__body">
          <div className="acq-details__head">
            <div className="acq-details__intro">
              <h2 className="acq-details__title" id={headingId}>
                {title}
              </h2>
              {/* In full. The card measures and trims; this is the place the
                  whole thing is meant to be readable. */}
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
          </div>

          {/* The list is the only thing that scrolls — the plan's name, its
              description and the tabs stay put, and the list runs under the
              pinned button exactly as the design draws it. */}
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
