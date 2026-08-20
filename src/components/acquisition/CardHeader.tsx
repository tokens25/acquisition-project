import './acquisition.css'

import { useLayoutEffect, useRef, useState } from 'react'
import type { Device } from './types'

export interface CardHeaderProps {
  /** Plan Name. Painted with the gold gradient when `ultimate` is set. */
  title: string
  /** Full description — never pre-truncated by the author. */
  description: string
  /** Lines the set has agreed on (S-2). All cards in a set share one value. */
  descriptionLines?: 1 | 2
  /** Opens the "All features & content" modal. */
  onMore?: () => void
  /** Figma `Ultimate` — gold gradient title instead of the plain white one. */
  ultimate?: boolean
  device?: Device
}

const SUFFIX = ' … more'

/**
 * CardHeader — Plan Name + description.
 * Figma: `CardHeader` (Device × Ultimate).
 *
 * The description is capped at the set's shared line budget and the trailing
 * "… more" sits inline at the end of the last line. That rules out CSS
 * line-clamp, which puts its ellipsis where it likes and leaves any following
 * element on a line of its own — so the string itself is trimmed to the longest
 * prefix that still fits once the control is appended.
 *
 * Per §4 the control is never part of the authored value: it appears only when
 * the text actually overflows, which is a measurement, not content.
 */
export function CardHeader({
  title,
  description,
  descriptionLines = 1,
  onMore,
  ultimate = false,
  device = 'desktop',
}: CardHeaderProps) {
  const boxRef = useRef<HTMLParagraphElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState({ text: description, truncated: false })

  useLayoutEffect(() => {
    const box = boxRef.current
    const probe = probeRef.current
    if (!box || !probe) return

    const compute = () => {
      const width = box.clientWidth
      if (!width) return

      const lineHeight = parseFloat(getComputedStyle(box).lineHeight) || 21
      // Half a line of slack absorbs sub-pixel rounding without admitting a third line.
      const budget = lineHeight * descriptionLines + lineHeight * 0.4
      probe.style.width = `${width}px`

      const fits = (candidate: string) => {
        probe.textContent = candidate
        return probe.scrollHeight <= budget
      }

      let next: { text: string; truncated: boolean }
      if (fits(description)) {
        next = { text: description, truncated: false }
      } else {
        // Longest prefix that still fits once "… more" is on the end.
        let lo = 0
        let hi = description.length
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2)
          if (fits(description.slice(0, mid).trimEnd() + SUFFIX)) lo = mid
          else hi = mid - 1
        }
        next = { text: description.slice(0, lo).trimEnd(), truncated: true }
      }

      // Only commit real changes — the observer watches the element this writes to.
      setShown((prev) =>
        prev.text === next.text && prev.truncated === next.truncated ? prev : next,
      )
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(box)
    return () => observer.disconnect()
  }, [description, descriptionLines, device])

  return (
    <header className="acq-card-header" data-device={device}>
      <h3 className="acq-card-header__title" data-ultimate={ultimate || undefined}>
        {title}
      </h3>
      <p className="acq-card-header__description" ref={boxRef}>
        {shown.text}
        {shown.truncated &&
          (onMore ? (
            <button type="button" className="acq-card-header__more" onClick={onMore}>
              {SUFFIX}
            </button>
          ) : (
            <span className="acq-card-header__more">{SUFFIX}</span>
          ))}
        <span className="acq-card-header__probe" ref={probeRef} aria-hidden="true" />
      </p>
    </header>
  )
}
