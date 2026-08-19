import './acquisition.css'

import type { Device } from './types'

export interface PricingProps {
  /** Caption above the price. Figma copy: "Starts at". */
  caption?: string
  /** Headline price, already formatted for the market (e.g. "€25.99"). */
  price: string
  /** Struck-through full price. Figma `Show crossed price`. */
  crossedPrice?: string
  /** Billing period rendered as "/month". */
  installment?: string
  /** Small print under the price. Figma `Show extra info`. */
  extraInfo?: string
  device?: Device
}

/**
 * Pricing — caption, headline price, optional crossed price and small print.
 * Figma: `Pricing` (Device).
 */
export function Pricing({
  caption = 'Starts at',
  price,
  crossedPrice,
  installment = 'month',
  extraInfo,
  device = 'desktop',
}: PricingProps) {
  return (
    <div className="acq-pricing" data-device={device}>
      {caption && <p className="acq-pricing__caption">{caption}</p>}
      <p className="acq-pricing__row">
        <span className="acq-pricing__price">{price}</span>
        {crossedPrice && <s className="acq-pricing__crossed">{crossedPrice}</s>}
        <span className="acq-pricing__installment">/{installment}</span>
      </p>
      {extraInfo && <p className="acq-pricing__extra">{extraInfo}</p>}
    </div>
  )
}
