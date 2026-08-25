import './button.css'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * CTA button used by the Acquisition card.
 * Mirrors the DS `Button/CTA` appearances the section needs:
 * `subscribe` (gold gradient, Ultimate plans), `primary` (white) and
 * `tertiary` (transparent, used for the card footer link).
 */
export type ButtonAppearance = 'primary' | 'secondary' | 'subscribe' | 'tertiary'
export type ButtonSize = 'lg' | 'md'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  appearance?: ButtonAppearance
  /** lg = 48px, md = 40px. */
  size?: ButtonSize
  /** Stretch to the full width of the container. */
  block?: boolean
  iconAfter?: ReactNode
  /** Leading icon — the toolbar buttons put theirs before the label. */
  iconBefore?: ReactNode
  children?: ReactNode
}

export function Button({
  appearance = 'primary',
  size = 'lg',
  block = false,
  iconAfter,
  iconBefore,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'dazn-btn',
    `dazn-btn--${appearance}`,
    `dazn-btn--${size}`,
    block && 'dazn-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={cls} {...rest}>
      {iconBefore}
      <span className="dazn-btn__label">{children}</span>
      {iconAfter}
    </button>
  )
}
