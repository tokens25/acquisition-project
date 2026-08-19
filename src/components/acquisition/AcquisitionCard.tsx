import './acquisition.css'

import type { ReactNode } from 'react'
import chevronRightIcon from '../../assets/icons/nav-chevron-right-md.svg?raw'
import valueIcon from '../../assets/icons/value.svg?raw'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { AddOn, type AddOnProps } from './AddOn'
import { CardHeader } from './CardHeader'
import { LogoTiles, type LogoTilesProps } from './LogoTiles'
import { PlanCta } from './PlanCta'
import { Pricing, type PricingProps } from './Pricing'
import type { Device } from './types'

export interface AcquisitionCardProps {
  /** Plan name, e.g. "Ultimate". */
  title: string
  description: string
  /** Reveals the rest of the truncated description. */
  onMore?: () => void

  /**
   * Figma `Ultimate` — the flagship treatment: gold border, gold gradient title
   * and a gold gradient CTA.
   */
  ultimate?: boolean
  /** Corner eyebrow copy. Omit for no eyebrow. Figma `Show Label/Eyebrow`. */
  eyebrow?: string

  /** Pricing block. `device` is inherited from the card. */
  pricing: Omit<PricingProps, 'device'>

  /** CTA copy, e.g. "Get Ultimate". */
  ctaLabel: string
  onCtaClick?: () => void
  /** Shows the green savings eyebrow above the CTA. Figma `Discount`. */
  discount?: boolean
  discountLabel?: string

  /** Competition / team badges. Omit to hide the grid. */
  logos?: Omit<LogoTilesProps, 'device'>

  /** Promoted add-on. Omit for plans that don't carry one. */
  addOn?: Omit<AddOnProps, 'device'>

  /** `Feature` rows — pass `<Feature>` children. */
  features?: ReactNode

  /** Footer link copy. Omit to drop the footer. */
  footerLabel?: string
  onFooterClick?: () => void

  device?: Device
  className?: string
}

/**
 * AcquisitionCard — the plan card users pick from on the Acquisition page.
 *
 * Composes the section's small components (CardHeader, Pricing, PlanCta,
 * LogoTiles, AddOn, FeaturesList) into the four Figma variants:
 *   1. Ultimate + discount + add-on   2. Standard + discount + add-on
 *   3. Standard, no discount          4. Ultimate, no discount
 */
export function AcquisitionCard({
  title,
  description,
  onMore,
  ultimate = false,
  eyebrow,
  pricing,
  ctaLabel,
  onCtaClick,
  discount = false,
  discountLabel,
  logos,
  addOn,
  features,
  footerLabel = 'All features & content',
  onFooterClick,
  device = 'desktop',
  className,
}: AcquisitionCardProps) {
  return (
    <article
      className={['acq-card', className].filter(Boolean).join(' ')}
      data-ultimate={ultimate || undefined}
      data-device={device}
    >
      {eyebrow && (
        <p className="acq-card__eyebrow">
          <Icon svg={valueIcon} size={16} />
          <span>{eyebrow}</span>
        </p>
      )}

      <div className="acq-card__body">
        <CardHeader
          title={title}
          description={description}
          onMore={onMore}
          ultimate={ultimate}
          device={device}
        />

        <hr className="acq-card__divider" />

        <Pricing {...pricing} device={device} />

        <PlanCta
          label={ctaLabel}
          ultimate={ultimate}
          discount={discount}
          discountLabel={discountLabel}
          device={device}
          onClick={onCtaClick}
        />

        {logos && <LogoTiles {...logos} />}

        {addOn && <AddOn {...addOn} device={device} />}

        {features}
      </div>

      {footerLabel && (
        <footer className="acq-card__footer">
          <Button
            appearance="tertiary"
            size="md"
            block
            onClick={onFooterClick}
            iconAfter={<Icon svg={chevronRightIcon} size={20} />}
          >
            {footerLabel}
          </Button>
        </footer>
      )}
    </article>
  )
}
