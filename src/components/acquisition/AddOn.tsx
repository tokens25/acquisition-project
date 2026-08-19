import './acquisition.css'

import checkCircleIcon from '../../assets/icons/action-check-circle.svg?raw'
import giftIcon from '../../assets/icons/settings-gift.svg?raw'
import { Icon } from '../Icon'
import { Toggle } from '../Toggle'
import type { Device } from './types'

export type AddOnType = 'included' | 'one-time-payment' | 'discount-code'

export interface AddOnProps {
  /** Which footer treatment the add-on gets. Figma `Type`. */
  type?: AddOnType
  /** Thumbnail for the promoted content. */
  imageSrc: string
  title: string
  subtitle: string
  /** `included` — the plan the add-on comes free with. */
  planName?: string
  /** `one-time-payment` — formatted price, e.g. "€19.00". */
  price?: string
  /** `discount-code` — the applied code and its saving. */
  codeLabel?: string
  /** `one-time-payment` — whether the add-on is currently selected. */
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  device?: Device
}

/**
 * AddOn — the promoted extra shown inside an Acquisition card (a tournament,
 * a one-off purchase, or an applied discount code).
 * Figma: `Add-On` (Type × Device).
 */
export function AddOn({
  type = 'included',
  imageSrc,
  title,
  subtitle,
  planName = '{plan name}',
  price = '€19.00',
  codeLabel = '{CODE} applied -15% OFF',
  selected = true,
  onSelectedChange,
  device = 'desktop',
}: AddOnProps) {
  return (
    <section className="acq-addon" data-type={type} data-device={device}>
      <div className="acq-addon__content">
        <img className="acq-addon__image" src={imageSrc} alt="" />
        <div className="acq-addon__text">
          <p className="acq-addon__title">{title}</p>
          <p className="acq-addon__subtitle">{subtitle}</p>
        </div>
      </div>

      <hr className="acq-addon__divider" />

      <footer className="acq-addon__footer">
        {type === 'included' && (
          <p className="acq-addon__status acq-addon__status--included">
            <Icon svg={checkCircleIcon} size={16} />
            <span>Included in {planName}</span>
          </p>
        )}

        {type === 'discount-code' && (
          <p className="acq-addon__status acq-addon__status--code">
            <Icon svg={giftIcon} size={16} />
            <span>{codeLabel}</span>
          </p>
        )}

        {type === 'one-time-payment' && (
          <>
            <p className="acq-addon__status acq-addon__status--payment">
              <strong>{price}</strong>
              <span>one time payment</span>
            </p>
            <Toggle
              active={selected}
              onChange={onSelectedChange}
              label={`Add ${title} for ${price}`}
            />
          </>
        )}
      </footer>
    </section>
  )
}
