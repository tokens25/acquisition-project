import './acquisition.css'

import discountIcon from '../../assets/icons/action-discount.svg?raw'
import { Button } from '../Button'
import { Icon } from '../Icon'
import type { Device } from './types'

export interface PlanCtaProps {
  /** CTA copy, e.g. "Get Ultimate". */
  label: string
  /** Figma `Ultimate` — gold gradient CTA instead of the white one. */
  ultimate?: boolean
  /** Figma `Discount` — shows the green savings eyebrow above the button. */
  discount?: boolean
  /** Eyebrow copy, only rendered when `discount` is set. */
  discountLabel?: string
  /**
   * Keep the eyebrow's room even though this card has nothing to put in it.
   *
   * Set by the row when any card in it carries a saving. A card without one
   * does not grow a label — it grows the space the label would take, so every
   * button in the row sits on the same line. Height rather than a measurement:
   * the reserved element is the real one, hidden, so the two can never round to
   * different numbers.
   */
  reserveDiscount?: boolean
  device?: Device
  onClick?: () => void
}

/**
 * PlanCta — the plan's call to action with an optional savings eyebrow tucked
 * behind its top edge. Figma: `ButtonLabelEyebrow` (Ultimate × Discount × Device).
 */
export function PlanCta({
  label,
  ultimate = false,
  discount = false,
  discountLabel = 'Save up to €{xx} /year',
  reserveDiscount = false,
  device = 'desktop',
  onClick,
}: PlanCtaProps) {
  const reserving = !discount && reserveDiscount
  return (
    <div className="acq-plan-cta" data-device={device}>
      <div className="acq-plan-cta__stack" data-discount={discount || undefined}>
        {(discount || reserving) && (
          <p
            className="acq-plan-cta__eyebrow"
            data-reserved={reserving || undefined}
            aria-hidden={reserving || undefined}
          >
            <Icon svg={discountIcon} size={16} />
            <span>{discountLabel}</span>
          </p>
        )}
        {/* Figma CTA/1 draws the 40 button on the 280 card and the 48 one
            on the wider ones. */}
        <Button
          appearance={ultimate ? 'subscribe' : 'primary'}
          size={device === 'mobile' ? 'md' : 'lg'}
          block
          onClick={onClick}
        >
          {label}
        </Button>
      </div>
    </div>
  )
}
