import addOnImage from '../assets/addon-world-cup-2026.png'
import devilsLogo from '../assets/logos/team-devils.png'
import islandersLogo from '../assets/logos/team-islanders.png'
import knicksLogo from '../assets/logos/team-knicks.png'
import netsLogo from '../assets/logos/team-nets.png'
import rangersLogo from '../assets/logos/team-rangers.png'
import sabresLogo from '../assets/logos/team-sabres.png'
import yankeesLogo from '../assets/logos/team-yankees.png'
import type { AuthoredLogo } from '../rules/content'

/** Bundled artwork, addressed by a stable id — Vite fingerprints the URLs. */
export const logoCatalog: Record<string, { src: string; alt: string }> = {
  yankees: { src: yankeesLogo, alt: 'New York Yankees' },
  nets: { src: netsLogo, alt: 'Brooklyn Nets' },
  knicks: { src: knicksLogo, alt: 'New York Knicks' },
  rangers: { src: rangersLogo, alt: 'New York Rangers' },
  devils: { src: devilsLogo, alt: 'New Jersey Devils' },
  islanders: { src: islandersLogo, alt: 'New York Islanders' },
  sabres: { src: sabresLogo, alt: 'Buffalo Sabres' },
}

export const imageCatalog: Record<string, string> = { 'world-cup': addOnImage }

export function resolveLogo(ref: AuthoredLogo): { src: string; alt: string } | null {
  if (ref.id) {
    const bundled = logoCatalog[ref.id]
    return bundled ? { src: bundled.src, alt: ref.alt || bundled.alt } : null
  }
  return ref.src ? { src: ref.src, alt: ref.alt } : null
}
