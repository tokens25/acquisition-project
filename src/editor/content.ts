import addOnImage from '../assets/addon-world-cup-2026.png'
import devilsLogo from '../assets/logos/team-devils.png'
import islandersLogo from '../assets/logos/team-islanders.png'
import knicksLogo from '../assets/logos/team-knicks.png'
import netsLogo from '../assets/logos/team-nets.png'
import rangersLogo from '../assets/logos/team-rangers.png'
import sabresLogo from '../assets/logos/team-sabres.png'
import yankeesLogo from '../assets/logos/team-yankees.png'
import type { Device, PlanLogo } from '../components/acquisition'
import type { AddOnType } from '../components/acquisition'

/**
 * Bundled artwork, addressed by a stable id.
 *
 * Saved content stores the id, never the URL: Vite fingerprints asset URLs at
 * build time, so a stored URL would break on the next deploy.
 */
export const logoCatalog: Record<string, PlanLogo> = {
  yankees: { src: yankeesLogo, alt: 'New York Yankees' },
  nets: { src: netsLogo, alt: 'Brooklyn Nets' },
  knicks: { src: knicksLogo, alt: 'New York Knicks' },
  rangers: { src: rangersLogo, alt: 'New York Rangers' },
  devils: { src: devilsLogo, alt: 'New Jersey Devils' },
  islanders: { src: islandersLogo, alt: 'New York Islanders' },
  sabres: { src: sabresLogo, alt: 'Buffalo Sabres' },
}

export const imageCatalog: Record<string, string> = {
  'world-cup': addOnImage,
}

/** A logo is either one of the bundled badges (`id`) or an external `src`. */
export interface LogoRef {
  id?: string
  src?: string
  alt: string
}

export interface CardContent {
  title: string
  description: string
  moreLabel: string

  ultimate: boolean
  eyebrow: string

  pricing: {
    caption: string
    price: string
    crossedPrice: string
    installment: string
    extraInfo: string
  }

  ctaLabel: string
  discount: boolean
  discountLabel: string

  logos: {
    items: LogoRef[]
    rows: 'one' | 'two'
    /** Empty string means "use the logo count". */
    total: string
  }

  addOn: {
    enabled: boolean
    type: AddOnType
    imageId: string
    imageSrc: string
    title: string
    subtitle: string
    planName: string
    price: string
    codeLabel: string
  }

  features: string[]
  footerLabel: string
  device: Device
}

/** Starting point — Figma variant 1, the Ultimate discounted plan. */
export const defaultContent: CardContent = {
  title: '{PlanTitle}',
  description:
    '{Plan_description} - more than 100 characters- This plan is for true football fans …',
  moreLabel: 'more',

  ultimate: true,
  eyebrow: 'Best experience',

  pricing: {
    caption: 'Starts at',
    price: '€25.99',
    crossedPrice: '€34.99',
    installment: 'month',
    extraInfo: 'For the first 3 months, then €34.99/month',
  },

  ctaLabel: 'Get {planName}',
  discount: true,
  discountLabel: 'Save up to €{xx} /year',

  logos: {
    items: [
      { id: 'yankees', alt: 'New York Yankees' },
      { id: 'nets', alt: 'Brooklyn Nets' },
      { id: 'knicks', alt: 'New York Knicks' },
      { id: 'rangers', alt: 'New York Rangers' },
    ],
    rows: 'one',
    total: '9',
  },

  addOn: {
    enabled: true,
    type: 'included',
    imageId: 'world-cup',
    imageSrc: '',
    title: 'FIFA World Cup 2026',
    subtitle: 'Covering all 104 matches',
    planName: '{plan name}',
    price: '€19.00',
    codeLabel: '{CODE} applied -15% OFF',
  },

  features: [
    'Watch up to 4 matches at once with multiview',
    'Choose the action you want with Multi camera',
    'Enjoy HDR and Dolby 5.1 surround sound',
    'Stream on 2 devices in 1 locations',
    'Download to watch on the go',
  ],

  footerLabel: 'All features & content',
  device: 'desktop',
}

/** Resolves a stored logo reference to something the component can render. */
export function resolveLogo(ref: LogoRef): PlanLogo | null {
  if (ref.id) {
    const bundled = logoCatalog[ref.id]
    return bundled ? { src: bundled.src, alt: ref.alt || bundled.alt } : null
  }
  return ref.src ? { src: ref.src, alt: ref.alt } : null
}

export function resolveAddOnImage(content: CardContent): string {
  return imageCatalog[content.addOn.imageId] ?? content.addOn.imageSrc
}
