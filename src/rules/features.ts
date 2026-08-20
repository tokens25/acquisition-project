/**
 * The feature catalogue.
 *
 * A feature is a product capability, not a line of copy — multiview exists
 * whether the card is Irish or German. So the icon belongs to the feature and
 * is never authored; a market may override the wording, never the pairing.
 *
 * That makes "German card with the download icon on the multiview line"
 * unreachable rather than merely reviewable.
 */
export interface FeatureDefinition {
  id: string
  /** Key into the icon catalogue. */
  icon: string
  /** Copy used unless a context overrides it. */
  defaultLabel: string
}

export const featureCatalogue: FeatureDefinition[] = [
  {
    id: 'multiview',
    icon: 'multiview',
    defaultLabel: 'Watch up to 4 matches at once with multiview',
  },
  {
    id: 'multicam',
    icon: 'multicam',
    defaultLabel: 'Choose the action you want with Multi camera',
  },
  { id: 'hdr', icon: 'hdr', defaultLabel: 'Enjoy HDR and Dolby 5.1 surround sound' },
  { id: 'devices', icon: 'devices', defaultLabel: 'Stream on 2 devices in 1 location' },
  { id: 'download', icon: 'download', defaultLabel: 'Download to watch on the go' },
  { id: 'included', icon: 'check', defaultLabel: 'Included with your subscription' },
  { id: 'offer', icon: 'discount', defaultLabel: 'Save with an annual plan' },
]

/** The escape hatch: a one-off line that picks its own icon. */
export const CUSTOM_FEATURE = 'custom'

export function findFeature(id: string): FeatureDefinition | undefined {
  return featureCatalogue.find((f) => f.id === id)
}

/** Matches legacy free-text features back onto the catalogue where possible. */
export function matchByLabel(label: string): FeatureDefinition | undefined {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  return featureCatalogue.find((f) => norm(f.defaultLabel) === norm(label))
}
