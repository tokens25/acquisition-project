import './acquisition.css'

import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import type { Device } from './types'

export interface FeatureProps {
  /** Raw SVG markup for the leading icon — import the DS icon with `?raw`.
   *  Omitted renders the line with no icon at all; the row simply closes up. */
  icon?: string
  children: ReactNode
  device?: Device
}

/** Feature — one icon + copy row in a plan's feature list. Figma: `Feature` (Device). */
export function Feature({ icon, children, device = 'desktop' }: FeatureProps) {
  return (
    <li className="acq-feature" data-device={device}>
      {icon && <Icon svg={icon} size={16} />}
      <span className="acq-feature__text">{children}</span>
    </li>
  )
}

export interface FeaturesListProps {
  children: ReactNode
  device?: Device
}

/** FeaturesList — the stack of `Feature` rows. Figma: `FeaturesList` (Device). */
export function FeaturesList({ children, device = 'desktop' }: FeaturesListProps) {
  return (
    <ul className="acq-features" data-device={device}>
      {children}
    </ul>
  )
}
