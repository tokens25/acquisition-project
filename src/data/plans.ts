import addOnImage from '../assets/addon-world-cup-2026.png'
import devilsLogo from '../assets/logos/team-devils.png'
import islandersLogo from '../assets/logos/team-islanders.png'
import knicksLogo from '../assets/logos/team-knicks.png'
import netsLogo from '../assets/logos/team-nets.png'
import rangersLogo from '../assets/logos/team-rangers.png'
import sabresLogo from '../assets/logos/team-sabres.png'
import yankeesLogo from '../assets/logos/team-yankees.png'
import type { PlanLogo } from '../components/acquisition'

export const teamLogos: PlanLogo[] = [
  { src: yankeesLogo, alt: 'New York Yankees' },
  { src: netsLogo, alt: 'Brooklyn Nets' },
  { src: knicksLogo, alt: 'New York Knicks' },
  { src: rangersLogo, alt: 'New York Rangers' },
  { src: devilsLogo, alt: 'New Jersey Devils' },
  { src: islandersLogo, alt: 'New York Islanders' },
  { src: sabresLogo, alt: 'Buffalo Sabres' },
]

export const worldCupAddOn = {
  imageSrc: addOnImage,
  title: 'FIFA World Cup 2026',
  subtitle: 'Covering all 104 matches',
}

export const planDescription =
  '{Plan_description} - more than 100 characters- This plan is for true football fans …'

/** The five feature rows every plan advertises, keyed to their DS icon. */
export const featureCopy = [
  'Watch up to 4 matches at once with multiview',
  'Choose the action you want with Multi camera',
  'Enjoy HDR and Dolby 5.1 surround sound',
  'Stream on 2 devices in 1 locations',
  'Download to watch on the go',
] as const

/**
 * A longer roster for the two-row layout — the design fills nine tiles before
 * the "+N" overflow, so the seven New York badges cycle to make up the count.
 */
export const extendedTeamLogos: PlanLogo[] = [
  ...teamLogos,
  ...teamLogos.slice(0, 3),
]
