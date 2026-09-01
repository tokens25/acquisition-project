import type { CadenceOffer, CardSet, Tier } from './content'
import { DIRECT } from './content'

/**
 * A starting set shaped like the real thing: tiers separate from the offers
 * that price them, three cadences, and a partner storefront alongside direct.
 */

const CADENCES = ['Monthly Flex', 'Instalments Annual', 'Annual Upfront']

const logoCatalog = [
  { id: 'yankees', name: 'New York Yankees', altText: 'New York Yankees logo', status: 'active' as const },
  { id: 'nets', name: 'Brooklyn Nets', altText: 'Brooklyn Nets logo', status: 'active' as const },
  { id: 'knicks', name: 'New York Knicks', altText: 'New York Knicks logo', status: 'active' as const },
  { id: 'rangers', name: 'New York Rangers', altText: 'New York Rangers logo', status: 'active' as const },
  { id: 'devils', name: 'New Jersey Devils', altText: 'New Jersey Devils logo', status: 'active' as const },
  { id: 'islanders', name: 'New York Islanders', altText: 'New York Islanders logo', status: 'active' as const },
  { id: 'sabres', name: 'Buffalo Sabres', altText: 'Buffalo Sabres logo', status: 'active' as const },
]

const featureCatalog = [
  { id: 'feature-multiview', iconId: 'multiview', text: 'Watch up to 4 matches at once with multiview', status: 'active' as const },
  { id: 'feature-multicam', iconId: 'multicam', text: 'Choose the action you want with Multi camera', status: 'active' as const },
  { id: 'feature-hdr', iconId: 'hdr', text: 'Enjoy HDR and Dolby 5.1 surround sound', status: 'active' as const },
  { id: 'feature-devices', iconId: 'devices', text: 'Stream on 2 devices in 1 location', status: 'active' as const },
  { id: 'feature-download', iconId: 'download', text: 'Download to watch on the go', status: 'active' as const },
  { id: 'feature-included', iconId: 'check', text: 'Included with your subscription', status: 'active' as const },
  { id: 'feature-annual-saving', iconId: 'discount', text: 'Save with an annual plan', status: 'active' as const },
]

const addOnCatalog = [
  { id: 'wc26', title: 'FIFA World Cup 2026', subtitle: 'Covering all 104 matches', price: 19, imageId: 'world-cup' },
]

const allLogos = logoCatalog.map((l) => l.id)

function tier(t: Partial<Tier> & { id: string; planName: string; displayOrder: number }): Tier {
  return {
    description:
      'Every game from the Premier League, Serie A and LaLiga, plus every round of the Champions League, live and on demand wherever you are.',
    features: [
      'feature-multiview',
      'feature-multicam',
      'feature-hdr',
      'feature-devices',
      'feature-download',
    ],
    logoTiles: allLogos,
    logoTotal: 9,
    ultimate: false,
    status: 'live',
    channel: DIRECT,
    visibleToPartners: true,
    overrides: [],
    ...t,
  }
}

function offer(o: Partial<CadenceOffer> & { id: string; tierId: string; cadence: string; standardPrice: number }): CadenceOffer {
  return {
    discount: false,
    introPrice: null,
    introMonths: 3,
    addOnId: null,
    addOnPurchaseType: null,
    addOnDiscountPercent: null,
    includedAddOnIds: [],
    ...o,
  }
}

export const defaultSet: CardSet = {
  markets: [
    { code: 'IE', label: 'Ireland', locale: 'en-IE', currency: 'EUR' },
    { code: 'DE', label: 'Germany', locale: 'de-DE', currency: 'EUR' },
    { code: 'ES', label: 'Spain', locale: 'es-ES', currency: 'EUR' },
    { code: 'GB', label: 'United Kingdom', locale: 'en-GB', currency: 'GBP' },
    { code: 'US', label: 'United States', locale: 'en-US', currency: 'USD' },
    // The regional sports network sits alongside the countries rather than
    // inside one: it is sold as its own market, and the ZIP check runs here for
    // the same reason it runs in the US — regional blackouts.
    { code: 'MSG+', label: 'MSG+', locale: 'en-US', currency: 'USD' },
  ],
  campaigns: [{ code: 'wc26', label: 'World Cup 2026' }],
  channels: [
    { code: DIRECT, label: 'Direct' },
    { code: 'movistar', label: 'Movistar', markets: ['ES'] },
  ],
  cadences: CADENCES,

  logoCatalog,
  featureCatalog,
  addOnCatalog,

  tiers: [
    tier({
      id: 'ultimate',
      planName: 'Ultimate',
      displayOrder: 1,
      ultimate: true,
      overrides: [{ id: 'ultimate-es', when: { market: 'ES' }, patch: { planName: 'Total' } }],
    }),
    tier({ id: 'standard', planName: 'Standard', displayOrder: 2 }),
    tier({
      id: 'flex',
      planName: 'Flex',
      displayOrder: 3,
      logoTiles: allLogos,
      logoTotal: 14,
    }),
    // Closed to new direct customers, but Movistar still sells it — the case
    // the engineering schema exists to express.
    tier({
      id: 'la-liga-legacy',
      planName: 'La Liga',
      displayOrder: 4,
      status: 'legacy',
      visibleToPartners: true,
      logoTotal: 12,
    }),
  ],

  offers: [
    // Ultimate — sold every way.
    offer({ id: 'ultimate-monthly', tierId: 'ultimate', cadence: 'Monthly Flex', standardPrice: 34.99, discount: true, introPrice: 25.99, addOnId: 'wc26', addOnPurchaseType: 'one_time_payment' }),
    offer({ id: 'ultimate-instal', tierId: 'ultimate', cadence: 'Instalments Annual', standardPrice: 29.99, discount: true, introPrice: 24.99, includedAddOnIds: ['wc26'] }),
    offer({ id: 'ultimate-upfront', tierId: 'ultimate', cadence: 'Annual Upfront', standardPrice: 279.99, includedAddOnIds: ['wc26'] }),
    offer({ id: 'ultimate-monthly-de', tierId: 'ultimate', cadence: 'Monthly Flex', market: 'DE', standardPrice: 39.99, discount: true, introPrice: 29.99, addOnId: 'wc26', addOnPurchaseType: 'one_time_payment' }),
    offer({ id: 'ultimate-monthly-gb', tierId: 'ultimate', cadence: 'Monthly Flex', market: 'GB', standardPrice: 29.99, discount: true, introPrice: 22.99, addOnId: 'wc26', addOnPurchaseType: 'one_time_payment' }),

    // Standard — no annual upfront anywhere. A missing row, not a false flag.
    offer({ id: 'standard-monthly', tierId: 'standard', cadence: 'Monthly Flex', standardPrice: 24.99, discount: true, introPrice: 19.99, addOnId: 'wc26', addOnPurchaseType: 'discount_code', addOnDiscountPercent: 15 }),
    offer({ id: 'standard-instal', tierId: 'standard', cadence: 'Instalments Annual', standardPrice: 21.99 }),

    // Flex — monthly only.
    offer({ id: 'flex-monthly', tierId: 'flex', cadence: 'Monthly Flex', standardPrice: 19.99 }),

    // The legacy tier is still sold by the partner, monthly.
    offer({ id: 'laliga-monthly', tierId: 'la-liga-legacy', cadence: 'Monthly Flex', standardPrice: 14.99 }),
  ],

  context: { market: 'IE', channel: DIRECT, cadence: 'Monthly Flex' },
  journeyId: 'hero-signup',
  featureIcons: 'feature',
  stepId: 'plans',
  device: 'desktop',
}
