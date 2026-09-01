import type { CadenceOffer, CardSet, Tier } from './content'
import { DIRECT } from './content'
import { defaultFlow } from './flow'

/**
 * A starting set shaped like the real thing: tiers separate from the offers
 * that price them, three cadences, and a partner storefront alongside direct.
 */

const CADENCES = ['Monthly', 'Yearly Instalments', 'Yearly']

const logoCatalog = [
  { id: 'yankees', name: 'New York Yankees', altText: 'New York Yankees logo', blurb: 'Every regular-season game on the network, live and on demand.', status: 'active' as const },
  { id: 'nets', name: 'Brooklyn Nets', altText: 'Brooklyn Nets logo', blurb: 'All 82 games plus pre- and post-game analysis from Barclays Center.', status: 'active' as const },
  { id: 'knicks', name: 'New York Knicks', altText: 'New York Knicks logo', blurb: 'The full season live from Madison Square Garden, home and away.', status: 'active' as const },
  { id: 'rangers', name: 'New York Rangers', altText: 'New York Rangers logo', blurb: 'Every puck drop of the season, with replays available overnight.', status: 'active' as const },
  { id: 'devils', name: 'New Jersey Devils', altText: 'New Jersey Devils logo', blurb: 'All local broadcasts live, from opening night to game 82.', status: 'active' as const },
  { id: 'islanders', name: 'New York Islanders', altText: 'New York Islanders logo', blurb: 'Live coverage of every game from UBS Arena and on the road.', status: 'active' as const },
  { id: 'sabres', name: 'Buffalo Sabres', altText: 'Buffalo Sabres logo', blurb: 'The whole season live, plus classic games on demand all year.', status: 'active' as const },
]

/**
 * The four lines the tiles carry, copied as drawn.
 *
 * Figma: "Preview_standard_tiers" (node 540:30052). "1 locations" included —
 * it is what the design says, and a card is not the place to quietly correct
 * the copy someone signed off.
 */
const featureCatalog = [
  { id: 'benefit-local-games', iconId: 'content', text: 'Get every local game live & on-demand', status: 'active' as const },
  { id: 'benefit-original-shows', iconId: 'video', text: 'Original shows and on demand content', status: 'active' as const },
  { id: 'benefit-devices', iconId: 'devices', text: 'Stream on 2 devices in 1 locations', status: 'active' as const },
  { id: 'benefit-download', iconId: 'download', text: 'Download to watch on the go', status: 'active' as const },
]

const addOnCatalog = [
  { id: 'wc26', title: 'FIFA World Cup 2026', subtitle: 'Covering all 104 matches', price: 19, imageId: 'world-cup' },
]

/** All three tiles draw the same four lines. */
const allBenefits = featureCatalog.map((f) => f.id)

function tier(t: Partial<Tier> & { id: string; planName: string; displayOrder: number }): Tier {
  return {
    description: '',
    features: allBenefits,
    logoTiles: [],
    logoTotal: 0,
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

  /**
   * The three tiles, as drawn.
   *
   * Figma: "Preview_standard_tiers" (node 540:30052) — MSG+, Gotham Bundle,
   * YES, in that order. Anything the tiles do not show is left empty rather
   * than filled with something plausible: no badge text on the two plain
   * plans, no discount, no explainer, no add-on.
   */
  tiers: [
    tier({
      id: 'msg-plus',
      planName: 'MSG+',
      displayOrder: 1,
      description: 'Every local Knicks, Rangers, Devils, Islanders and Sabres game',
      logoTiles: ['knicks', 'rangers', 'devils', 'islanders', 'sabres'],
      logoTotal: 5,
    }),
    tier({
      id: 'gotham-bundle',
      planName: 'Gotham Bundle',
      displayOrder: 2,
      ultimate: true,
      description: 'Everything in MSG+ and YES, all in one plan.',
      logoTiles: ['knicks', 'yankees', 'rangers', 'nets', 'devils', 'islanders', 'sabres'],
      logoTotal: 7,
    }),
    tier({
      id: 'yes',
      planName: 'YES',
      displayOrder: 3,
      description: 'Every local Yankees and Nets game',
      logoTiles: ['yankees', 'nets'],
      logoTotal: 2,
    }),
  ],

  // One price each, at the cadence the tiles are drawn at. No discount: the
  // tiles show a single price with nothing struck through beside it.
  offers: [
    offer({ id: 'msg-plus-monthly', tierId: 'msg-plus', cadence: 'Monthly', standardPrice: 29.99 }),
    offer({ id: 'gotham-bundle-monthly', tierId: 'gotham-bundle', cadence: 'Monthly', standardPrice: 34.99 }),
    offer({ id: 'yes-monthly', tierId: 'yes', cadence: 'Monthly', standardPrice: 19.99 }),
  ],

  // MSG+ is where the work is, so it is where a reset lands. It is also the
  // only market that runs the ZIP check, so the default flow is the whole
  // flow rather than one with a step missing.
  context: { market: 'MSG+', channel: DIRECT, cadence: 'Monthly' },
  journeyId: 'hero-signup',
  featureIcons: 'feature',
  flow: defaultFlow,
  review: 'draft',
  stepId: 'plans',
  // The size the tiles are drawn at: "Preview_standard_tiers" is three cards
  // of 280, which is the component's Device=Mobile — its 20 of padding, its
  // 20px title and 12px copy, and the pricing rule in place of the divider.
  // Previewing at Device=Desktop was rendering a variant the design has not
  // drawn, and stretching the 44px logo tiles off their 49 pitch to do it.
  device: 'mobile',
}
