import downloadIcon from '../../assets/icons/actions-download.svg?raw'
import hdrIcon from '../../assets/icons/features-hdr.svg?raw'
import devicesIcon from '../../assets/icons/action-device-switch.svg?raw'
import multiCamIcon from '../../assets/icons/actions-multi-cam.svg?raw'
import multiviewIcon from '../../assets/icons/features-multiview.svg?raw'
import { Feature, FeaturesList } from './Features'
import type { Device } from './types'

/** The icon each of the five standard plan features is paired with in Figma. */
const featureIcons = [multiviewIcon, multiCamIcon, hdrIcon, devicesIcon, downloadIcon]

export interface PlanFeaturesProps {
  /** Feature copy, in the order the icons above are assigned. */
  features: readonly string[]
  device?: Device
}

/** Convenience wrapper that pairs plan feature copy with its DS icon. */
export function PlanFeatures({ features, device = 'desktop' }: PlanFeaturesProps) {
  return (
    <FeaturesList device={device}>
      {features.map((text, i) => (
        <Feature key={text} icon={featureIcons[i % featureIcons.length]} device={device}>
          {text}
        </Feature>
      ))}
    </FeaturesList>
  )
}
