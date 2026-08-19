import './acquisition.css'

import type { Device } from './types'

export interface CardHeaderProps {
  /** Plan name. Painted with the gold gradient when `ultimate` is set. */
  title: string
  /** Long plan description. Truncated by the design at ~100 characters. */
  description: string
  /** Trailing "more" affordance appended to the description. */
  moreLabel?: string
  onMore?: () => void
  /** Figma `Ultimate` — gold gradient title instead of the plain white one. */
  ultimate?: boolean
  device?: Device
}

/**
 * CardHeader — plan title + description block at the top of an Acquisition card.
 * Figma: `CardHeader` (Device × Ultimate).
 */
export function CardHeader({
  title,
  description,
  moreLabel = 'more',
  onMore,
  ultimate = false,
  device = 'desktop',
}: CardHeaderProps) {
  return (
    <header className="acq-card-header" data-device={device}>
      <h3 className="acq-card-header__title" data-ultimate={ultimate || undefined}>
        {title}
      </h3>
      <p className="acq-card-header__description">
        {description}{' '}
        {onMore ? (
          <button type="button" className="acq-card-header__more" onClick={onMore}>
            {moreLabel}
          </button>
        ) : (
          <span className="acq-card-header__more">{moreLabel}</span>
        )}
      </p>
    </header>
  )
}
