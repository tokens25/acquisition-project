import type { AuthoredCard, CardSet } from './content'

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

const addOnBase = {
  enabled: false,
  type: 'included' as const,
  title: 'FIFA World Cup 2026',
  subtitle: 'Covering all 104 matches',
  imageId: 'world-cup',
  imageSrc: '',
  price: 19,
  code: 'SUMMER25',
  discountPercent: 15,
}

function card(overrides: Partial<AuthoredCard> & { id: string; planName: string }): AuthoredCard {
  return {
    description:
      'Every game from the Premier League, Serie A and LaLiga, plus every round of the Champions League, live and on demand wherever you are.',
    ultimate: false,
    discount: false,
    standardPrice: 34.99,
    introPrice: 25.99,
    introMonths: 3,
    installment: 'month',
    logos,
    logoTotal: 9,
    addOn: { ...addOnBase },
    features: [
      'Watch up to 4 matches at once with multiview',
      'Choose the action you want with Multi camera',
      'Enjoy HDR and Dolby 5.1 surround sound',
      'Stream on 2 devices in 1 location',
      'Download to watch on the go',
    ],
    overrides: [],
    ...overrides,
  }
}

/**
 * A valid starting set: exactly one Ultimate card, per S-1.
 *
 * The overrides below are deliberately sparse — a market states only what it
 * differs on, so a change to the base description reaches every market at once.
 */
export const defaultSet: CardSet = {
  markets: [
    { code: 'IE', label: 'Ireland', locale: 'en-IE', currency: 'EUR' },
    { code: 'DE', label: 'Germany', locale: 'de-DE', currency: 'EUR' },
    { code: 'IT', label: 'Italy', locale: 'it-IT', currency: 'EUR' },
    { code: 'GB', label: 'United Kingdom', locale: 'en-GB', currency: 'GBP' },
    { code: 'US', label: 'United States', locale: 'en-US', currency: 'USD' },
  ],
  campaigns: [{ code: 'wc26', label: 'World Cup 2026' }],
  context: { market: 'IE' },
  journeyId: 'hero-signup',
  device: 'desktop',
  cards: [
    card({
      id: 'ultimate',
      planName: 'Ultimate',
      ultimate: true,
      discount: true,
      addOn: { ...addOnBase, enabled: true, type: 'included' },
      logoTotal: 9,
      overrides: [
        // Germany runs the same plan at a different price point.
        { id: 'ultimate-de', when: { market: 'DE' }, patch: { standardPrice: 39.99, introPrice: 29.99 } },
        // The UK is priced in GBP — the currency comes from the market.
        { id: 'ultimate-gb', when: { market: 'GB' }, patch: { standardPrice: 29.99, introPrice: 22.99 } },
        // A campaign stacks on top of whatever the market resolved to.
        { id: 'ultimate-us', when: { market: 'US' }, patch: { standardPrice: 34.99, introPrice: 29.99, planName: 'MSG+' } },
        { id: 'ultimate-wc26', when: { campaign: 'wc26' }, patch: { introMonths: 6 } },
        { id: 'ultimate-de-wc26', when: { market: 'DE', campaign: 'wc26' }, patch: { introPrice: 24.99 } },
      ],
    }),
    card({
      id: 'standard',
      planName: 'Standard',
      discount: true,
      standardPrice: 24.99,
      introPrice: 19.99,
      addOn: { ...addOnBase, enabled: true, type: 'included' },
      logoTotal: 9,
      overrides: [
        { id: 'standard-gb', when: { market: 'GB' }, patch: { standardPrice: 21.99, introPrice: 17.99 } },
      ],
    }),
    card({
      id: 'flex',
      planName: 'Flex',
      standardPrice: 19.99,
      introPrice: 19.99,
      logos: [...logos, logos[0], logos[1]],
      logoTotal: 14,
      overrides: [
        { id: 'flex-gb', when: { market: 'GB' }, patch: { standardPrice: 16.99, introPrice: 16.99 } },
      ],
    }),
  ],
}
