import type { AuthoredCard, CardSet } from './content'

const EUR = 'EUR'

/** Only seven distinct badges exist, so two-row cards repeat them to fill nine slots. */
const logos = [
  { id: 'yankees', alt: 'New York Yankees' },
  { id: 'nets', alt: 'Brooklyn Nets' },
  { id: 'knicks', alt: 'New York Knicks' },
  { id: 'rangers', alt: 'New York Rangers' },
  { id: 'devils', alt: 'New Jersey Devils' },
  { id: 'islanders', alt: 'New York Islanders' },
  { id: 'sabres', alt: 'Buffalo Sabres' },
]

const addOnOff = {
  enabled: false,
  type: 'included' as const,
  title: 'FIFA World Cup 2026',
  subtitle: 'Covering all 104 matches',
  imageId: 'world-cup',
  imageSrc: '',
  price: { amount: 19, currency: EUR },
  code: 'SUMMER25',
  discountPercent: 15,
}

function card(overrides: Partial<AuthoredCard> & { id: string; planName: string }): AuthoredCard {
  return {
    description:
      'Every game from the Premier League, Serie A and LaLiga, plus every round of the Champions League, live and on demand wherever you are.',
    ultimate: false,
    discount: false,
    standardPrice: { amount: 34.99, currency: EUR },
    introPrice: { amount: 25.99, currency: EUR },
    introMonths: 3,
    installment: 'month',
    logos,
    logoTotal: 9,
    addOn: { ...addOnOff },
    features: [
      'Watch up to 4 matches at once with multiview',
      'Choose the action you want with Multi camera',
      'Enjoy HDR and Dolby 5.1 surround sound',
      'Stream on 2 devices in 1 location',
      'Download to watch on the go',
    ],
    ...overrides,
  }
}

/**
 * A valid starting set: exactly one Ultimate card, per S-1.
 *
 * Note the Figma component set holds four variants of which two are Ultimate —
 * fine as a variant sheet, but publishing those four as a set would fail S-1.
 * Toggling Ultimate on a second card here demonstrates the rule firing.
 */
export const defaultSet: CardSet = {
  locale: 'en-IE',
  device: 'desktop',
  cards: [
    card({
      id: 'ultimate',
      planName: 'Ultimate',
      ultimate: true,
      discount: true,
      addOn: { ...addOnOff, enabled: true, type: 'included' },
      logoTotal: 9,
    }),
    card({
      id: 'standard',
      planName: 'Standard',
      discount: true,
      standardPrice: { amount: 24.99, currency: EUR },
      introPrice: { amount: 19.99, currency: EUR },
      addOn: { ...addOnOff, enabled: true, type: 'included' },
      logoTotal: 9,
    }),
    card({
      id: 'flex',
      planName: 'Flex',
      logos: [...logos, logos[0], logos[1]],
    }),
  ],
}
