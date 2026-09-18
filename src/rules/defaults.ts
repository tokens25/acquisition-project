import type { CadenceOffer, CardSet, Tier } from './content'
import { DIRECT } from './content'
import { RSN_FLOW_PATCH, defaultFlow } from './flow'

/**
 * A starting set shaped like the real thing: tiers separate from the offers
 * that price them, three cadences, and a partner storefront alongside direct.
 */

const CADENCES = ['Weekly', 'Monthly', '5 Instalments', 'Yearly Instalments', '2-Year Instalments', 'Yearly', 'Seasonal']

/**
 * The channel the New York plans are sold on.
 *
 * The RSNs, and nothing else. They used to be listed against every product on
 * the front door, which is how NFL in Japan came to offer a Knicks package.
 */
const RSN_PRODUCTS = ['rsns']

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

  /**
   * FIBA's lines, as its cards draw them.
   *
   * Two of the five are cut off in the Figma frame itself — the design shows
   * "Watch live and on demand action fr…" and "Watch legendary games, player
   * pro…" with the info mark beside them, which is the truncation working, not
   * the string. They are left out rather than guessed at: a line invented here
   * would read as signed-off copy, and §7 keeps authored values authored.
   */
  { id: 'fiba-hdr', iconId: 'hdr', text: 'Enjoy HDR and Dolby 5.1 surround sound', status: 'active' as const },
  { id: 'fiba-multiview', iconId: 'multiview', text: 'Multiview - watch up to 4 games at once', status: 'active' as const },
  { id: 'fiba-devices-5', iconId: 'devices', text: 'Stream on 5 devices in 2 locations', status: 'active' as const },
  { id: 'fiba-devices-2', iconId: 'devices', text: 'Stream on 2 devices in 1 location', status: 'active' as const },
  { id: 'fiba-download', iconId: 'download', text: 'Download to watch on the go', status: 'active' as const },
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
    highlighted: false,
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
  // The leagues sit alongside the countries rather than inside one: each is
  // sold as its own market. MSG+ used to be here and is now a product — what
  // is sold and where it is sold are two questions, and the front door asks
  // them separately.
  // The twenty markets, with the formatting each renders its prices in. The
  // list of which markets exist lives in catalogue.ts; this is what a market
  // needs in order to draw money, which is content and belongs with content.
  markets: [
    { code: 'be', label: 'Belgium', locale: 'nl-BE', currency: 'EUR' },
    { code: 'at', label: 'Austria', locale: 'de-AT', currency: 'EUR' },
    { code: 'de', label: 'Germany', locale: 'de-DE', currency: 'EUR' },
    { code: 'li', label: 'Liechtenstein', locale: 'de-LI', currency: 'CHF' },
    { code: 'lu', label: 'Luxembourg', locale: 'fr-LU', currency: 'EUR' },
    { code: 'ch', label: 'Switzerland', locale: 'de-CH', currency: 'CHF' },
    { code: 'fr', label: 'France', locale: 'fr-FR', currency: 'EUR' },
    { code: 'it', label: 'Italy', locale: 'it-IT', currency: 'EUR' },
    { code: 'jp', label: 'Japan', locale: 'ja-JP', currency: 'JPY' },
    { code: 'pt', label: 'Portugal', locale: 'pt-PT', currency: 'EUR' },
    { code: 'es', label: 'Spain', locale: 'es-ES', currency: 'EUR' },
    { code: 'tw', label: 'Taiwan', locale: 'zh-TW', currency: 'TWD' },
    { code: 'ca', label: 'Canada', locale: 'en-CA', currency: 'CAD' },
    { code: 'au', label: 'Australia', locale: 'en-AU', currency: 'AUD' },
    { code: 'br', label: 'Brazil', locale: 'pt-BR', currency: 'BRL' },
    { code: 'ie', label: 'Ireland', locale: 'en-IE', currency: 'EUR' },
    { code: 'mx', label: 'Mexico', locale: 'es-MX', currency: 'MXN' },
    { code: 'nl', label: 'Netherlands', locale: 'nl-NL', currency: 'EUR' },
    { code: 'pl', label: 'Poland', locale: 'pl-PL', currency: 'PLN' },
    { code: 'gb', label: 'United Kingdom', locale: 'en-GB', currency: 'GBP' },
    { code: 'us', label: 'United States', locale: 'en-US', currency: 'USD' },
  ],
  campaigns: [{ code: 'wc26', label: 'World Cup 2026' }],
  channels: [
    { code: DIRECT, label: 'Direct' },
    { code: 'movistar', label: 'Movistar', markets: ['es'] },
  ],
  cadences: CADENCES,

  /*
   * The one layer the tool ships with.
   *
   * MSG+'s copy, scoped to MSG+, rather than standing as the words every other
   * product starts from. A market or product that writes nothing now opens on
   * DAZN's own words instead of on one American regional network's.
   */
  flowLayers: [
    {
      id: 'rsns',
      when: { subscription: 'rsns' },
      patch: RSN_FLOW_PATCH,
    },
  ],

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
      subscriptions: RSN_PRODUCTS,
      displayOrder: 1,
      description: 'Every local Knicks, Rangers, Devils, Islanders and Sabres game',
      logoTiles: ['knicks', 'rangers', 'devils', 'islanders', 'sabres'],
      logoTotal: 5,
    }),
    tier({
      id: 'gotham-bundle',
      planName: 'Gotham Bundle',
      subscriptions: RSN_PRODUCTS,
      displayOrder: 2,
      highlighted: true,
      description: 'Everything in MSG+ and YES, all in one plan.',
      logoTiles: ['knicks', 'yankees', 'rangers', 'nets', 'devils', 'islanders', 'sabres'],
      logoTotal: 7,
    }),
    tier({
      id: 'yes',
      planName: 'YES',
      subscriptions: RSN_PRODUCTS,
      displayOrder: 3,
      description: 'Every local Yankees and Nets game',
      logoTiles: ['yankees', 'nets'],
      logoTotal: 2,
    }),

    /**
     * FIBA — two plans, not three, and no competition tiles.
     *
     * Figma: "FIBA – Full Flow - New / Logged out user" → Tiers. The cards
     * carry a plan name and a feature list and nothing between them, so the
     * description is empty rather than filled with something plausible.
     */
    tier({
      id: 'fiba-ultimate',
      planName: 'Ultimate',
      subscriptions: ['fiba'],
      displayOrder: 1,
      highlighted: true,
      badge: 'BEST EXPERIENCE',
      features: ['fiba-hdr', 'fiba-multiview', 'fiba-devices-5', 'fiba-download'],
    }),
    tier({
      id: 'fiba-standard',
      planName: 'Standard',
      subscriptions: ['fiba'],
      displayOrder: 2,
      features: ['fiba-devices-2', 'fiba-devices-5', 'fiba-download'],
    }),
  ],

  // One price each, at the cadence the tiles are drawn at. No discount: the
  // tiles show a single price with nothing struck through beside it.
  offers: [
    offer({ id: 'msg-plus-monthly', tierId: 'msg-plus', cadence: 'Monthly', standardPrice: 29.99 }),
    offer({ id: 'gotham-bundle-monthly', tierId: 'gotham-bundle', cadence: 'Monthly', standardPrice: 34.99 }),
    offer({ id: 'yes-monthly', tierId: 'yes', cadence: 'Monthly', standardPrice: 19.99 }),

    // FIBA is sold two ways in the design — "Monthly flex" and "Pay Upfront" —
    // read here as the cadences that already exist. The third tab, "Pay
    // monthly", is drawn as a copy of Pay Upfront with the same yearly prices,
    // so there is no third price to write and no row is invented for it.
    offer({
      id: 'fiba-ultimate-monthly',
      tierId: 'fiba-ultimate',
      cadence: 'Monthly',
      standardPrice: 13.99,
      explainer: "Monthly subscription. Cancel with 30 days' notice.",
    }),
    offer({
      id: 'fiba-standard-monthly',
      tierId: 'fiba-standard',
      cadence: 'Monthly',
      standardPrice: 11.99,
      explainer: "Monthly subscription. Cancel with 30 days' notice.",
    }),
    offer({
      id: 'fiba-ultimate-yearly',
      tierId: 'fiba-ultimate',
      cadence: 'Yearly',
      standardPrice: 49.99,
      explainer:
        'Access to Courtside 1891 for a year. 12-month contract. Your subscription auto-renews unless you cancel before the end of the minimum term.',
    }),
    offer({
      id: 'fiba-standard-yearly',
      tierId: 'fiba-standard',
      cadence: 'Yearly',
      standardPrice: 44.99,
      explainer:
        'Access to Courtside 1891 for a year. 12-month contract. Your subscription auto-renews unless you cancel before the end of the minimum term.',
    }),
  ],

  // MSG+ is where the work is, so it is where a reset lands. It is also the
  // only market that runs the ZIP check, so the default flow is the whole
  // flow rather than one with a step missing.
  // The one situation with a journey written for it. Opening anywhere else
  // would open on the unconfigured state, which is true but is not a useful
  // place for the tool to start.
  context: { market: 'us', subscription: 'rsns', channel: DIRECT, cadence: 'Monthly' },
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
