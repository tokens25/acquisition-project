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
  highlighted?: boolean
  /** Corner eyebrow copy. Omit for none. */
  eyebrow?: string

  pricing: Omit<PricingProps, 'device'>

  ctaLabel: string
  onCtaClick?: () => void
  discount?: boolean
  discountLabel?: string
  /** Hold the savings eyebrow's room open, because a card beside this one has one. */
  reserveDiscount?: boolean
  /**
   * Whether this is the card being considered.
   *
   * Drawn rather than disabled: the others stay every bit as clickable, they
   * just stop competing for the eye. A set with nothing selected draws every
   * card at full strength, which is the state a printed comparison is in.
   */
  selected?: boolean
  onSelect?: () => void

  logos?: LogoTilesProps
  addOn?: Omit<AddOnProps, 'device'>
  features?: ReactNode

  footerLabel?: string
  onFooterClick?: () => void
  /** Shows the footer control as unavailable rather than absent. */
  footerDisabled?: boolean

  /**
   * Which plan this card draws.
   *
   * Presentation does not use it. It is on the element so that something
   * outside the card can tell which plan a click landed in without the card
   * having to know what that something is for.
   */
  tierId?: string
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
  highlighted = false,
  eyebrow,
  pricing,
  ctaLabel,
  onCtaClick,
  discount = false,
  discountLabel,
  reserveDiscount = false,
  selected,
  onSelect,
  logos,
  addOn,
  features,
  footerLabel,
  onFooterClick,
  footerDisabled = false,
  tierId,
  device = 'desktop',
  className,
}: AcquisitionCardProps) {
  return (
    <article
      className={['acq-card', className].filter(Boolean).join(' ')}
      data-highlighted={highlighted || undefined}
      data-tier-id={tierId}
      data-device={device}
      data-selected={selected || undefined}
      onClick={onSelect}
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
          highlighted={highlighted}
          device={device}
        />

        <hr className="acq-card__divider" />

        <Pricing {...pricing} device={device} />

        <PlanCta
          label={ctaLabel}
          highlighted={highlighted}
          discount={discount}
          discountLabel={discountLabel}
          reserveDiscount={reserveDiscount}
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
