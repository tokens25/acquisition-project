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
  device = 'desktop',
  onClick,
}: PlanCtaProps) {
  return (
    <div className="acq-plan-cta" data-device={device}>
      <div className="acq-plan-cta__stack" data-discount={discount || undefined}>
        {discount && (
          <p className="acq-plan-cta__eyebrow">
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
