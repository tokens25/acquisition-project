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
  /**
   * Keep the small print's line even though this card has none.
   *
   * Set by the row when any card in it explains its price. The explainer is
   * what puts a discounted card's CTA lower than the ones beside it, and a
   * button that sits on its own line reads as a mistake rather than as a card
   * with more to say.
   */
  reserveExtraInfo?: boolean
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
  reserveExtraInfo = false,
  device = 'desktop',
}: PricingProps) {
  const reserving = !extraInfo && reserveExtraInfo
  return (
    <div className="acq-pricing" data-device={device}>
      {caption && <p className="acq-pricing__caption">{caption}</p>}
      <p className="acq-pricing__row">
        <span className="acq-pricing__price">{price}</span>
        {crossedPrice && <s className="acq-pricing__crossed">{crossedPrice}</s>}
        <span className="acq-pricing__installment">/{installment}</span>
      </p>
      {(extraInfo || reserving) && (
        <p
          className="acq-pricing__extra"
          data-reserved={reserving || undefined}
          aria-hidden={reserving || undefined}
        >
          {extraInfo ?? '\u00a0'}
        </p>
      )}
    </div>
  )
}
