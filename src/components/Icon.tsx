import './icon.css'

import type { CSSProperties } from 'react'

/** Icon sizes used across the Acquisition section (Figma "Size=" variants). */
export type IconSize = 16 | 20 | 24

export interface IconProps {
  /** Raw SVG markup — import with `?raw`. Every DS icon paints with currentColor. */
  svg: string
  size?: IconSize
  className?: string
  style?: CSSProperties
}

/**
 * Renders a design-system SVG inline so it inherits `color`, which is how the
 * DS icons are authored (fill="currentColor"). The svg's own width/height are
 * overridden by CSS in `.dazn-icon > svg`.
 */
export function Icon({ svg, size = 16, className, style }: IconProps) {
  return (
    <span
      className={['dazn-icon', className].filter(Boolean).join(' ')}
      style={{ '--icon-size': `${size}px`, ...style } as CSSProperties}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
