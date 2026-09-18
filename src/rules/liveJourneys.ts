/**
 * The journey every market walks unless somebody has drawn a different one.
 *
 * DAZN's direct signup is the same shape in every country: land, choose a
 * plan, choose how to pay, sign in, set the account up, pay, done. What
 * differs is the plans and the prices — and those come from the catalogue.
 * So a market has a journey the moment it has live plans, and a league
 * product sold there has one of its own, without anyone setting it up.
 *
 * Every step is `proposed`: decided here, not drawn in Figma, so it never
 * counts towards what the design file draws. A journey written into
 * `journeyConfig` for the same market and product comes first in the list
 * and wins, exactly as before.
 */
import type { CardSet } from './content'
import type { Journey, Step } from './journey'
import { channelById, marketById } from './catalogue'
import { configuredJourneys } from './journeyConfig'

export const DIRECT_STEPS: Step[] = [
  {
    id: 'landing',
    name: 'Landing',
    shortName: 'Landing',
    renderer: 'landing',
    order: 10,
    proposed: true,
    requires: ['auth.signedOut'],
    note: 'Where a direct signup starts.',
  },
  {
    id: 'plans',
    name: 'Choose your subscription',
    shortName: 'Subscription',
    renderer: 'plans',
    order: 20,
    captures: 'plan',
    proposed: true,
    note: "The plans DAZN sells here today, from the catalogue.",
  },
  {
    id: 'cadence',
    name: 'Choose how to pay',
    shortName: 'Cadence',
    renderer: 'cadence',
    order: 30,
    proposed: true,
    note: 'The ways the chosen plan is priced here: monthly, yearly, or yearly in instalments.',
  },
  {
    id: 'auth',
    name: 'Login',
    shortName: 'Login',
    renderer: 'auth',
    order: 40,
    captures: 'auth',
    proposed: true,
    requires: ['auth.signedOut'],
  },
  {
    id: 'account',
    name: 'Account setup',
    shortName: 'Account setup',
    renderer: 'account',
    order: 50,
    captures: 'account',
    proposed: true,
    requires: ['form.valid'],
  },
  {
    id: 'checkout',
    name: 'Checkout',
    shortName: 'Checkout',
    renderer: 'checkout',
    order: 60,
    proposed: true,
    note: 'The chosen plan at the chosen cadence, with its own terms.',
  },
  {
    id: 'ready',
    name: 'Confirmation screen',
    shortName: 'Confirmation',
    renderer: 'ready',
    order: 70,
    proposed: true,
    requires: ['payment.succeeded'],
  },
]

export const directJourneyId = (market: string, channel?: string) =>
  channel ? `direct-${market}-${channel}` : `direct-${market}`

/** Market → the products with a priced plan there ('' is DAZN itself). */
export function soldByMarket(set: CardSet): Map<string, Set<string>> {
  const sold = new Map<string, Set<string>>()
  const tierById = new Map(set.tiers.map((t) => [t.id, t]))
  for (const o of set.offers) {
    const tier = tierById.get(o.tierId)
    if (!tier || !o.market) continue
    const channels = sold.get(o.market) ?? new Set<string>()
    for (const c of tier.subscriptions?.length ? tier.subscriptions : ['']) channels.add(c)
    sold.set(o.market, channels)
  }
  return sold
}

/**
 * The products actually on sale in a market, in the catalogue's order — what
 * a Channel filter should offer. The catalogue says where a product may be
 * sold; the offers say where it is. A market with nothing but DAZN's own
 * plans has no channel to choose, and the question is not asked.
 */
export function channelsSold(set: CardSet, market: string): string[] {
  const here = soldByMarket(set).get(market) ?? new Set<string>()
  // The RSNs have no offers in the catalogue; their drawn journeys say they sell.
  for (const j of configuredJourneys) if (j.when?.market === market && j.when.subscription) here.add(j.when.subscription)
  return [...here]
}

/** One direct journey per market with plans, and per league product sold there. */
export function directJourneys(set: CardSet): Journey[] {
  const sold = soldByMarket(set)
  const out: Journey[] = []
  // Product journeys before market ones, so a product context finds its own
  // first — a market journey leaves `subscription` open and matches there too.
  const market: Journey[] = []
  for (const [code, channels] of sold) {
    const where = marketById(code)?.label ?? set.markets.find((m) => m.code === code)?.label ?? code.toUpperCase()
    for (const channel of channels) {
      // RSNs have their own drawn journeys; a DAZN-shaped one would be wrong.
      if (channel === 'rsns') continue
      const what = channel ? (channelById(channel)?.label ?? channel) : 'DAZN'
      const journey: Journey = {
        id: directJourneyId(code, channel || undefined),
        name: `${where} · ${what} · direct signup`,
        audience: 'logged-out-new',
        when: channel ? { market: code, subscription: channel } : { market: code },
        entry: { cta: 'Landing page', section: 'Landing page', figmaFrame: '—', figmaSection: '—' },
        seeds: [],
        steps: DIRECT_STEPS,
      }
      ;(channel ? out : market).push(journey)
    }
  }
  return [...out, ...market]
}

/** Journeys the app knows about: the ones written down, then the ones the catalogue implies. */
export const allJourneys = (set: CardSet): Journey[] => [...configuredJourneys, ...directJourneys(set)]
