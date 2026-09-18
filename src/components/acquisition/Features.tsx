import './acquisition.css'

import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import infoIcon from '../../assets/icons/action-info.svg?raw'
import { Icon } from '../Icon'
import type { Device } from './types'

export interface FeatureProps {
  /** Raw SVG markup for the leading icon — import the DS icon with `?raw`.
   *  Omitted renders the line with no icon at all; the row simply closes up. */
  icon?: string
  children: ReactNode
  /**
   * Opens the full line — the "All features & content" view.
   *
   * Passed rather than assumed, because a row that cannot open anything should
   * not offer a button that does nothing. Without it the mark still appears, so
   * a reader still learns the line has been cut.
   */
  onInfo?: () => void
  device?: Device
}

/**
 * Feature — one icon + copy row in a plan's feature list.
 * Figma: `Feature` (Device).
 *
 * A row is one line and no more: the copy is `nowrap` with a CSS ellipsis, so
 * the browser does the cutting. What CSS cannot express is the consequence —
 * the info mark appears only when the line was actually cut, which is a
 * measurement taken after layout and never an authored flag. That is the rule
 * the description already follows: a line written short in English and long in
 * German is one string, and nothing should be able to ship it pre-marked.
 *
 * The measurement runs against an off-layout probe rather than the visible box,
 * because the mark takes room from that box. Measuring the box would mean a
 * line that only overflows *because the mark is there* keeps the mark that
 * caused it — true the first time, and permanent after.
 */
export function Feature({ icon, children, onInfo, device = 'desktop' }: FeatureProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const markRef = useRef<HTMLElement | null>(null)
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    const text = textRef.current
    const probe = probeRef.current
    if (!text || !probe) return

    const measure = () => {
      const mark = markRef.current
      const gap = parseFloat(getComputedStyle(text.parentElement ?? text).columnGap) || 0
      // The room the line has with nothing marking it: the box it sits in, plus
      // back whatever the mark is currently taking out of that box.
      const room = text.clientWidth + (mark ? mark.offsetWidth + gap : 0)
      if (!room) return
      // A pixel of slack: sub-pixel rounding reports a line that fits exactly
      // as one that overflows, which would mark every full-width row.
      setTruncated(probe.scrollWidth > room + 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(text)
    return () => observer.disconnect()
  }, [children, device])

  const mark = <Icon svg={infoIcon} size={16} />

  return (
    <li className="acq-feature" data-device={device}>
      {icon && <Icon svg={icon} size={16} />}
      <span className="acq-feature__text" ref={textRef}>
        {children}
      </span>
      {truncated &&
        (onInfo ? (
          <button
            type="button"
            className="acq-feature__info"
            onClick={onInfo}
            aria-label="Read this line in full"
            ref={(el) => {
              markRef.current = el
            }}
          >
            {mark}
          </button>
        ) : (
          <span
            className="acq-feature__info"
            aria-hidden="true"
            ref={(el) => {
              markRef.current = el
            }}
          >
            {mark}
          </span>
        ))}
      <span className="acq-feature__probe" aria-hidden="true" ref={probeRef}>
        {children}
      </span>
    </li>
  )
}

export interface FeaturesListProps {
  children: ReactNode
  device?: Device
  /**
   * Rows to keep room for, whatever this card lists.
   *
   * Set by the row to the longest list in it, so every card's footer sits the
   * same 32px under its last line and the cards come out the same height —
   * the space a shorter list leaves is inside the list, not between the list
   * and the footer.
   */
  reserveRows?: number
}

/** FeaturesList — the stack of `Feature` rows. Figma: `FeaturesList` (Device). */
export function FeaturesList({ children, device = 'desktop', reserveRows }: FeaturesListProps) {
  return (
    <ul
      className="acq-features"
      data-device={device}
      style={reserveRows ? ({ '--acq-feature-rows': reserveRows } as CSSProperties) : undefined}
    >
      {children}
    </ul>
  )
}
