import './acquisition.css'

import { useEffect, useRef, useState } from 'react'
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

/**
 * CardHeader — Plan Name + description.
 * Figma: `CardHeader` (Device × Ultimate).
 *
 * The trailing "… more" is a control, not copy: it appears only when the
 * description actually overflows the shared line budget, measured after render.
 */
export function CardHeader({
  title,
  description,
  descriptionLines = 1,
  onMore,
  ultimate = false,
  device = 'desktop',
}: CardHeaderProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [description, descriptionLines, device])

  return (
    <header className="acq-card-header" data-device={device}>
      <h3 className="acq-card-header__title" data-ultimate={ultimate || undefined}>
        {title}
      </h3>
      <p className="acq-card-header__description">
        <span
          className="acq-card-header__text"
          ref={textRef}
          style={{ WebkitLineClamp: descriptionLines }}
        >
          {description}
        </span>
        {overflowing &&
          (onMore ? (
            <button type="button" className="acq-card-header__more" onClick={onMore}>
              … more
            </button>
          ) : (
            <span className="acq-card-header__more">… more</span>
          ))}
      </p>
    </header>
  )
}
