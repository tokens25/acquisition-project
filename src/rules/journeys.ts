import type { Journey, Seed, Step } from './journey'

/**
 * Four journeys from Figma "Landing page journeys" (node 2350:75321).
 *
 * They are not one journey at four fidelities — each starts from a different
 * CTA on the landing page, and the CTA determines what is already known. The
 * frame counts in the file are the evidence: enter from the market checker and
 * the three Zipcode frames collapse to one confirmation; enter from "Get MSG+"
 * and the three Plans frames collapse to one.
 */

/** Every journey walks the same steps; only the entry seeds differ. */
function steps(): Step[] {
  return [
    {
      id: 'landing',
      name: 'Landing',
      shortName: 'Landing',
      figmaFrame: 'MSG+ - Landing page - Mobile',
      renderer: 'stub',
      order: 10,
      requires: ['auth.signedOut'],
      note: 'The entry point. Which CTA is pressed here decides the journey.',
    },
    {
      id: 'plans',
      name: 'Choose your subscription',
      shortName: 'Subscription',
      figmaFrame: 'Plans',
      renderer: 'plans',
      order: 20,
      captures: 'plan',
      narrowedBy: 'tier',
      states: ['default', 'alternate plan selected'],
      note: 'The Acquisition card set. Skipped when the CTA already named a plan.',
    },
    {
      id: 'cadence',
      name: 'Choose how to pay',
      shortName: 'How to pay',
      figmaFrame: 'Plans (payment-options)',
      renderer: 'stub',
      order: 30,
      states: ['pay now', 'pay monthly'],
      note: 'Billing cadence — annual up-front versus monthly.',
    },
    {
      id: 'connect-tv',
      name: 'Connect TV — dual screen',
      shortName: 'Connect TV',
      figmaFrame: 'Connect TV- dual screen-option',
      renderer: 'stub',
      order: 35,
      note: 'TV pairing. Found in the RSN-tile and logged-in journeys, not in the landing four.',
    },
    {
      id: 'auth',
      name: 'Log in or sign up',
      shortName: 'Sign up',
      figmaFrame: 'Create',
      renderer: 'stub',
      order: 40,
      requires: ['auth.signedOut'],
      note: 'Skipped entirely when already signed in — confirmed by the logged-in families, which drop it.',
    },
    {
      id: 'account',
      name: 'Finish signing up',
      shortName: 'Account',
      figmaFrame: 'Complete Account',
      renderer: 'stub',
      order: 50,
      states: ['empty', 'filled', 'confirmed'],
      requires: ['form.valid'],
      note: 'Name, email, password and consent. Three frames are form states, not steps.',
    },
    {
      id: 'zip',
      name: 'Confirm your ZIP code',
      shortName: 'ZIP code',
      figmaFrame: 'Zipcode',
      renderer: 'stub',
      order: 60,
      when: { market: 'US' },
      captures: 'zip',
      states: ['empty', 'entered', 'teams resolved'],
      requires: ['geo.zipKnown'],
      note: 'US only — regional blackouts and team availability depend on it.',
    },
    {
      id: 'checkout',
      name: 'Checkout and payment',
      shortName: 'Checkout',
      figmaFrame: 'Checkout',
      renderer: 'stub',
      order: 70,
      states: ['summary', 'card entered', 'processing', 'paid'],
      note:
        'Order summary plus payment. Owned in-house (Q8), though the card fields themselves are normally the payment provider embed.',
    },
    {
      id: 'ready',
      name: 'Ready to watch',
      shortName: 'Ready',
      figmaFrame: 'Credit card - zip code verified',
      renderer: 'stub',
      order: 80,
      requires: ['payment.succeeded'],
      note: 'Confirmation, with the teams the ZIP unlocked.',
    },
    {
      id: 'home',
      name: 'Home',
      shortName: 'Home',
      figmaFrame: 'mobile-hero-native',
      renderer: 'stub',
      order: 90,
      note: 'The product itself — outside the acquisition journey.',
    },
  ]
}

function journey(
  id: string,
  name: string,
  entry: Journey['entry'],
  seeds: Seed[],
): Journey {
  return { id, name, audience: 'anonymous', entry, seeds, steps: steps() }
}

export const journeys: Journey[] = [
  journey(
    'hero-signup',
    'Hero — Sign up',
    {
      cta: 'Sign up',
      section: 'Hero',
      figmaFrame: '2350:125152',
      figmaSection: '2350:75322',
    },
    [],
  ),
  journey(
    'market-check',
    'Market checker — Check Your Market',
    {
      cta: 'Check Your Market',
      section: 'Market checker',
      figmaFrame: '2362:148077',
      figmaSection: '2350:80514',
    },
    ['zip'],
  ),
  journey(
    'ultimate-feature',
    'Features — Get Ultimate',
    {
      cta: 'Get Ultimate',
      section: 'Features / Ultimate',
      figmaFrame: '2362:159288',
      figmaSection: '2350:85706',
    },
    ['zip', 'tier'],
  ),
  journey(
    'plans-section',
    'Plans section — Get MSG+',
    {
      cta: 'Get MSG+',
      section: 'Plans / pricing',
      figmaFrame: '2350:135763',
      figmaSection: '2350:90898',
    },
    ['zip', 'plan'],
  ),
]

journeys.push({
  id: 'movistar-partner',
  name: 'Movistar — partner storefront',
  audience: 'anonymous',
  // Scoped by channel, not market: Movistar operates in Spain, so the channel
  // already carries the country. Naming ES here too would let the two drift.
  when: { channel: 'movistar' },
  entry: {
    cta: 'Add DAZN to your plan',
    section: 'Partner storefront',
    figmaFrame: '—',
    figmaSection: '—',
  },
  seeds: ['zip'],
  steps: steps(),
})

export const signUpJourney = journeys[0]


/**
 * Figma "Logged out new users" (node 2362:179952) — four journeys, 58 screens.
 *
 * Same user state as the landing four, so the step vocabulary is reused rather
 * than reinvented. What differs is the **entry surface** and the **order**:
 * Starlink asks for the ZIP before showing plans, everyone else asks after the
 * account is made. That is why a journey owns its step list instead of sharing
 * one — order is a property of the journey, not of the step.
 */

/** Screens that appear only in this family. */
const EXTRA_STEPS: Step[] = [
  {
    id: 'browse',
    name: 'Browse — RSN tile',
    shortName: 'Browse',
    figmaFrame: 'v1',
    renderer: 'stub',
    order: 0,
    note:
      'The catalogue grid a team tile is pressed from. Named "v1" in Figma — worth renaming, since the name is the only thing tying the frame to this step.',
  },
  {
    id: 'unnamed-screen',
    name: 'Untitled screen',
    shortName: 'Untitled',
    figmaFrame: 'Frame 2147228102',
    renderer: 'stub',
    order: 0,
    note:
      'Frame 2362:247895 holds a single title and nothing else. Modelled so the count reconciles, but it needs a name and content before it means anything.',
  },
  {
    id: 'paywall',
    name: 'Paywall',
    shortName: 'Paywall',
    figmaFrame: 'Paywall',
    renderer: 'stub',
    order: 0,
    note:
      'Reached after skipping payment: the account exists, the entitlement does not. It sits after Home, not before — the block happens on play, not on entry.',
  },
]

const STEP_BY_ID = new Map([...steps(), ...EXTRA_STEPS].map((s) => [s.id, s]))

/**
 * Build a journey's steps by naming them in order.
 *
 * `order` is assigned from position, so reordering is done by moving an id
 * rather than by renumbering — the same mistake the feature list used to make.
 */
function pick(ids: string[], patches: Record<string, Partial<Step>> = {}): Step[] {
  return ids.map((id, i) => {
    const base = STEP_BY_ID.get(id)
    if (!base) throw new Error(`Unknown step id: ${id}`)
    return { ...base, ...patches[id], order: (i + 1) * 10 }
  })
}

function loggedOut(
  id: string,
  name: string,
  entry: Journey['entry'],
  stepIds: string[],
  patches?: Record<string, Partial<Step>>,
): Journey {
  // No seeds: none of these entries name a plan or a ZIP. A team tile is not a
  // tier, so even the RSN entry asks the plans question in full.
  return { id, name, audience: 'anonymous', entry, seeds: [], steps: pick(stepIds, patches) }
}

journeys.push(
  loggedOut(
    'browse-hero-signup',
    'Logged out — browse hero CTA',
    {
      cta: 'Sign up',
      section: 'Logged out new users',
      figmaFrame: '2362:231330',
      figmaSection: '2362:179953',
    },
    ['landing', 'plans', 'auth', 'account', 'zip', 'checkout', 'ready', 'home'],
    {
      landing: { figmaFrame: 'Anonymous (.sheet-homepage)' },
      plans: { states: ['default', 'alternate plan selected', 'confirmed'] },
      zip: { states: ['entry'] },
    },
  ),
  loggedOut(
    'rsn-tile-signup',
    'Logged out — RSN tile',
    {
      cta: 'Team tile',
      section: 'Logged out new users',
      figmaFrame: '2362:231926',
      figmaSection: '2362:194636',
    },
    ['landing', 'browse', 'connect-tv', 'plans', 'auth', 'account', 'zip', 'checkout', 'ready', 'home'],
    {
      landing: { figmaFrame: 'Anonymous' },
      plans: { states: ['default', 'alternate plan selected'] },
      zip: { states: ['entry'] },
    },
  ),
  loggedOut(
    'starlink-signup',
    'Logged out — Starlink',
    {
      cta: 'Starlink entry',
      section: 'Logged out new users',
      figmaFrame: '2362:241849',
      figmaSection: '2362:187170',
    },
    // ZIP before plans: the Starlink entry resolves region first, then prices.
    ['landing', 'zip', 'plans', 'auth', 'account', 'checkout', 'ready', 'home'],
    {
      landing: { figmaFrame: 'Home of - MSG+' },
      zip: { states: ['empty', 'teams resolved'] },
      plans: { states: ['default', 'alternate plan selected'] },
    },
  ),
  loggedOut(
    'starlink-skip-payment',
    'Logged out — Starlink, payment skipped',
    {
      cta: 'Starlink entry',
      section: 'Logged out new users',
      figmaFrame: '2362:246030',
      figmaSection: '2362:205037',
    },
    // No Checkout at all, and Paywall sits *after* Home.
    ['landing', 'zip', 'plans', 'auth', 'account', 'unnamed-screen', 'home', 'paywall'],
    {
      landing: { figmaFrame: 'Home of - MSG+' },
      zip: { states: ['empty', 'teams resolved'] },
      plans: { states: ['default', 'alternate plan selected'] },
    },
  ),
)
