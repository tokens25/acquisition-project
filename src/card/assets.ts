import checkCircleIcon from '../assets/icons/action-check-circle.svg?raw'
import checkmarkIcon from '../assets/icons/action-checkmark.svg?raw'
import chevronDownIcon from '../assets/icons/nav-chevron-down-md.svg?raw'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import eyeIcon from '../assets/icons/action-password-show.svg?raw'
import panelIcon from '../assets/icons/nav-panel-collapse.svg?raw'
import chevronLeftIcon from '../assets/icons/nav-chevron-left-md.svg?raw'
import chevronRightIcon from '../assets/icons/nav-chevron-right-md.svg?raw'
import settingsIcon from '../assets/icons/nav-settings.svg?raw'
import editIcon from '../assets/icons/action-edit.svg?raw'
import uploadIcon from '../assets/icons/actions-upload.svg?raw'
import devicesIcon from '../assets/icons/action-device-switch.svg?raw'
import discountIcon from '../assets/icons/action-discount.svg?raw'
import downloadIcon from '../assets/icons/actions-download.svg?raw'
import multiCamIcon from '../assets/icons/actions-multi-cam.svg?raw'
import giftIcon from '../assets/icons/settings-gift.svg?raw'
import hdrIcon from '../assets/icons/features-hdr.svg?raw'
import multiviewIcon from '../assets/icons/features-multiview.svg?raw'
import valueIcon from '../assets/icons/value.svg?raw'
import addOnImage from '../assets/addon-world-cup-2026.png'
import devilsLogo from '../assets/logos/team-devils.png'
import islandersLogo from '../assets/logos/team-islanders.png'
import knicksLogo from '../assets/logos/team-knicks.png'
import netsLogo from '../assets/logos/team-nets.png'
import rangersLogo from '../assets/logos/team-rangers.png'
import sabresLogo from '../assets/logos/team-sabres.png'
import yankeesLogo from '../assets/logos/team-yankees.png'

/**
 * Artwork, keyed by catalogue id.
 *
 * The catalogue itself — names, alt text, active/deprecated — lives in the
 * content model. This file only answers "where are the bytes", because Vite
 * fingerprints asset URLs at build time and a stored URL would break on the
 * next deploy.
 */
export const logoArtwork: Record<string, string> = {
  yankees: yankeesLogo,
  nets: netsLogo,
  knicks: knicksLogo,
  rangers: rangersLogo,
  devils: devilsLogo,
  islanders: islandersLogo,
  sabres: sabresLogo,
}

export const imageArtwork: Record<string, string> = {
  'world-cup': addOnImage,
}

export const iconArtwork: Record<string, string> = {
  multiview: multiviewIcon,
  multicam: multiCamIcon,
  hdr: hdrIcon,
  devices: devicesIcon,
  download: downloadIcon,
  check: checkCircleIcon,
  checkmark: checkmarkIcon,
  'chevron-down': chevronDownIcon,
  edit: editIcon,
  'chevron-left': chevronLeftIcon,
  'chevron-right': chevronRightIcon,
  close: closeIcon,
  preview: eyeIcon,
  'panel-collapse': panelIcon,
  settings: settingsIcon,
  upload: uploadIcon,
  discount: discountIcon,
  gift: giftIcon,
  value: valueIcon,
}
