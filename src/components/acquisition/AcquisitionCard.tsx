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
  /** Plan Name, already resolved. */
  title: string
  description: string
  /** Shared line budget for the set (S-2). */
  descriptionLines?: 1 | 2
  onMore?: () => void

  /** Gold border, gold gradient title and gold CTA. */
  ultimate?: boolean
  /** Corner eyebrow copy. Omit for none. */
  eyebrow?: string

  pricing: Omit<PricingProps, 'device'>

  ctaLabel: string
  onCtaClick?: () => void
  discount?: boolean
  discountLabel?: string

  logos?: LogoTilesProps
  addOn?: Omit<AddOnProps, 'device'>
  features?: ReactNode

  footerLabel?: string
  onFooterClick?: () => void
  /** Shows the footer control as unavailable rather than absent. */
  footerDisabled?: boolean

  device?: Device
  className?: string
}

/**
 * AcquisitionCard — the plan card users pick from.
 *
 * Presentation only. Every value here arrives already decided: which price is
 * primary, whether a badge shows, what the CTA says. The rules that produce
 * them live above this component, in `src/rules`, because several of them
 * depend on the other cards in the set and none of them belong to a single card.
 */
export function AcquisitionCard({
  title,
  description,
  descriptionLines = 1,
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
  footerLabel,
  onFooterClick,
  footerDisabled = false,
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
          descriptionLines={descriptionLines}
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
          {/* Asked for explicitly rather than inferred from the handler: a card
              rendered as a picture has no handler either, and should not look
              like a control someone has switched off. */}
          <Button
            appearance="tertiary"
            size="md"
            block
            disabled={footerDisabled}
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
