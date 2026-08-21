import type { Journey, Seed, Step } from './journey'
import { driftFromFigma } from './journey'

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
      captures: 'auth',
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
      captures: 'account',
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
      'Content behind an entitlement the user does not have. Its position carries the meaning: last in a journey it is a dead end, second it is the trigger that starts one.',
  },
]

/** Screens that appear only in the migration family. */
const MIGRATION_STEPS: Step[] = [
  {
    id: 'email-start',
    name: 'Subscription start confirmation',
    shortName: 'Email',
    figmaFrame: 'Subscription start confirmation (.email-Template)',
    renderer: 'stub',
    order: 0,
    note:
      'An email, not a screen. Three of the four migration journeys begin here — the user is told their subscription moved, and the link is what starts the flow.',
  },
  {
    id: 'reset-password',
    name: 'Reset your password',
    shortName: 'Reset password',
    figmaFrame: 'desktop - Reset your password',
    renderer: 'stub',
    order: 0,
    note: 'Drawn on desktop in an otherwise mobile section.',
  },
  {
    id: 'add-payment',
    name: 'Add a payment method',
    shortName: 'Payment',
    figmaFrame: 'Payment',
    renderer: 'stub',
    order: 0,
    note: 'For a migrated subscriber who arrives without one on file.',
  },
  {
    id: 'change-payment',
    name: 'Change payment method',
    shortName: 'Change payment',
    figmaFrame: 'change payment method',
    renderer: 'stub',
    order: 0,
    states: ['current', 'replaced'],
    note: 'A method exists and is being replaced — a different screen from adding one.',
  },
  {
    id: 'tv-provider-login',
    name: 'TV provider login',
    shortName: 'Provider login',
    figmaFrame: 'Connect TV Provider – Login',
    renderer: 'stub',
    order: 0,
    note: 'Entitlement is proved by the TV provider. The Adobe TVE family is built on this screen.',
  },
]

/** The product home, as an entry rather than an ending. */

const HOME_ENTRY: Step = {
  id: 'home-entry',
  name: 'Home — inside the product',
  shortName: 'Home',
  figmaFrame: 'mobile-hero-native',
  renderer: 'stub',
  order: 0,
  requires: ['auth.signedIn'],
  note:
    'Where a logged-in journey starts. Deliberately not the same step as `home`: the same frame appears at both ends of these journeys, once without an entitlement and once with, and one id cannot be in two places.',
}

const STEP_BY_ID = new Map(
  [...steps(), ...EXTRA_STEPS, ...MIGRATION_STEPS, HOME_ENTRY].map((s) => [s.id, s]),
)


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

/**
 * Figma "Logged in DAZN customer" (node 2362:250798) — three journeys.
 *
 * The family that proves the seed model. Being signed in is not a variant of
 * the anonymous flow with different copy: two screens stop existing. `Create`
 * and `Complete Account` appear nowhere in this section, and the counts confirm
 * it — 12, 12 and 9 against the anonymous 15–16.
 *
 * They are still listed as steps, seeded rather than deleted, so the reason a
 * screen is absent is readable. Deleting them would leave the same rendering
 * and lose the fact.
 *
 * Note the first two journeys have identical step lists. They are drawn twice
 * because a free registered user and a paying DAZN user see different prices
 * and different upgrade framing — a content difference, not a flow difference,
 * which is exactly what market overrides already handle for the card.
 */

function loggedIn(
  id: string,
  name: string,
  audience: string,
  entry: Journey['entry'],
  stepIds: string[],
  seeds: Seed[],
  patches?: Record<string, Partial<Step>>,
): Journey {
  return { id, name, audience, entry, seeds, steps: pick(stepIds, patches) }
}

// Identity is settled before any of these journeys begin.
const SIGNED_IN: Seed[] = ['auth', 'account']

journeys.push(
  loggedIn(
    'logged-in-free-rsn',
    'Logged in free — RSN tile',
    'registered-free',
    {
      cta: 'Team tile',
      section: 'Logged in DAZN customer',
      figmaFrame: '2582:1332014',
      figmaSection: '2362:250799',
    },
    // Paywall is second here, not last: pressing a team tile hits the
    // entitlement wall, and that is what starts the purchase.
    ['home-entry', 'paywall', 'connect-tv', 'plans', 'auth', 'account', 'zip', 'checkout', 'ready', 'home'],
    SIGNED_IN,
    {
      paywall: { note: 'The trigger. A free registered user presses an RSN tile and is stopped here.' },
      'connect-tv': { figmaFrame: 'Connect TV- dual screen-option 32' },
      plans: { states: ['default', 'alternate plan selected'] },
      zip: { states: ['entry'] },
    },
  ),
  loggedIn(
    'logged-in-paying-rsn',
    'Logged in paying — RSN tile',
    'paying-dazn',
    {
      cta: 'Team tile',
      section: 'Logged in DAZN customer',
      figmaFrame: '2582:1332602',
      figmaSection: '2362:261053',
    },
    ['home-entry', 'paywall', 'connect-tv', 'plans', 'auth', 'account', 'zip', 'checkout', 'ready', 'home'],
    SIGNED_IN,
    {
      paywall: { note: 'The trigger. An existing DAZN subscription does not cover the RSN.' },
      'connect-tv': { figmaFrame: 'Connect TV- dual screen-option 33' },
      plans: { states: ['default', 'alternate plan selected'] },
      zip: { states: ['entry'] },
    },
  ),
  loggedIn(
    'rsn-upgrade-bundle',
    'RSN lower tier — upgrade to the bundle',
    'rsn-lower-tier',
    {
      cta: 'Upgrade',
      section: 'Logged in DAZN customer',
      figmaFrame: '2582:1333190',
      figmaSection: '2362:271095',
    },
    // No Paywall and no Connect TV: this subscriber already has both. The ZIP
    // is seeded too — an existing RSN subscriber was geo-verified to buy the
    // tier they are upgrading from.
    ['home-entry', 'landing', 'plans', 'auth', 'account', 'zip', 'checkout', 'ready', 'home'],
    [...SIGNED_IN, 'zip'],
    {
      landing: {
        figmaFrame: 'Anonymous (.sheet-homepage)',
        note: 'The same marketing sheet the anonymous journeys open on, used here as the bundle upsell.',
      },
      plans: { states: undefined },
    },
  ),
)

/**
 * Figma "Migration journeys" (node 2398:41587) — four journeys.
 *
 * These are not purchase journeys, and the evidence is an absence rather than
 * an argument: the section contains no `Plans`, no `Zipcode`, no `Create` and
 * no `Checkout` frame at all. The Acquisition card never renders here. What is
 * being migrated is an existing subscription, so the plan, the tier and the ZIP
 * arrive already decided — seeded by the migration itself.
 *
 * Three of the four start in an **email**, not in the product. That is a real
 * entry surface, and it means the first thing a migrating subscriber sees is
 * content nobody in this tool can currently edit.
 */

journeys.push(
  loggedIn(
    'migration-no-payment',
    'Migration — no payment method',
    'migrating',
    {
      cta: 'Subscription start confirmation email',
      section: 'Migration journeys',
      figmaFrame: '2041:43097',
      figmaSection: '2033:14750',
    },
    ['email-start', 'auth', 'plans', 'account', 'reset-password', 'add-payment', 'zip', 'ready', 'home'],
    // The email link settles identity; the migration settles what they are on.
    ['auth', 'plan', 'tier', 'zip'],
    { account: { states: ['empty', 'filled', 'consent', 'confirmed'] } },
  ),
  loggedIn(
    'migration-crm',
    'Migration — from CRM',
    'migrating',
    {
      cta: 'Subscription start confirmation email',
      section: 'Migration journeys',
      figmaFrame: '2033:14315',
      figmaSection: '2033:14289',
    },
    ['email-start', 'auth', 'plans', 'account', 'change-payment', 'zip', 'ready', 'home'],
    ['auth', 'plan', 'tier', 'zip'],
    { account: { states: ['empty', 'filled', 'consent', 'confirmed'] } },
  ),
  loggedIn(
    'migration-tve',
    'Migration — TVE',
    'migrating',
    {
      cta: 'Subscription start confirmation email',
      section: 'Migration journeys',
      figmaFrame: '2041:44720',
      figmaSection: '2041:44084',
    },
    ['email-start', 'auth', 'plans', 'account', 'connect-tv', 'tv-provider-login', 'zip', 'ready', 'home'],
    ['auth', 'plan', 'tier', 'zip'],
    {
      account: { states: ['empty', 'filled', 'consent', 'confirmed'] },
      'connect-tv': { states: ['option 35', 'option 15'] },
    },
  ),
  loggedIn(
    'migration-organic',
    'Migration — organic',
    'migrating',
    {
      cta: 'Sign in',
      section: 'Migration journeys',
      figmaFrame: '2033:15206',
      figmaSection: '2033:15205',
    },
    // The only one that does not start in an email, so the only one that signs
    // in for real. It also ends at Home with no confirmation screen.
    ['auth', 'reset-password', 'email-start', 'plans', 'account', 'zip', 'home'],
    ['plan', 'tier', 'zip'],
    {
      auth: { shortName: 'Sign in', figmaFrame: 'desktop-sign in or sign up page' },
      account: { states: ['empty', 'filled', 'consent', 'confirmed'] },
    },
  ),
)

/**
 * Figma "Adobe TVE" (node 2518:495931) — four journeys.
 *
 * A different way of becoming entitled. Three of the four contain no `Plans`
 * and no `Checkout` frame: the user proves a TV-provider subscription and the
 * entitlement follows, so there is nothing to choose and nothing to pay. The
 * Acquisition card renders in exactly one of these four.
 *
 * That makes TVE the family where `auth` and `account` had to be two separate
 * seeds. A returning TVE user is authenticated by their provider and has an
 * account already; a new one authenticates the same way but must still build a
 * DAZN account, which is why `Create` and `Complete Account` appear in the two
 * "new user" journeys and nowhere else.
 */

journeys.push(
  loggedIn(
    'tve-msg-tile',
    'TVE — new user, MSG+ tile',
    'anonymous',
    {
      cta: 'MSG+ tile',
      section: 'Adobe TVE',
      figmaFrame: '2518:497117',
      figmaSection: '2518:497116',
    },
    ['landing', 'paywall', 'auth', 'account', 'connect-tv', 'tv-provider-login', 'plans', 'zip', 'ready', 'home'],
    ['plan', 'tier', 'zip'],
    {
      paywall: { note: 'The trigger — the tile is behind an entitlement the user cannot yet prove.' },
      account: { states: ['empty', 'filled', 'confirmed'] },
      'connect-tv': { states: ['option 36', 'option 25'] },
    },
  ),
  loggedIn(
    'tve-provider-signin',
    'TVE — new user, sign in with TV provider',
    'anonymous',
    {
      cta: 'Sign in with your TV provider',
      section: 'Adobe TVE',
      figmaFrame: '2518:498057',
      figmaSection: '2518:498056',
    },
    // No Paywall: this entry names the intent outright, so nothing blocks first.
    ['landing', 'auth', 'account', 'connect-tv', 'tv-provider-login', 'plans', 'zip', 'ready', 'home'],
    ['plan', 'tier', 'zip'],
    {
      account: { states: ['empty', 'filled', 'confirmed'] },
      'connect-tv': { states: ['option 37', 'option 12'] },
    },
  ),
  loggedIn(
    'tve-existing',
    'TVE — existing user',
    'tve-entitled',
    {
      cta: 'MSG+ tile',
      section: 'Adobe TVE',
      figmaFrame: '2518:498775',
      figmaSection: '2518:498774',
    },
    ['landing', 'paywall', 'auth', 'account', 'connect-tv', 'tv-provider-login', 'plans', 'zip', 'ready', 'home'],
    ['auth', 'account', 'plan', 'tier', 'zip'],
    {
      paywall: { note: 'The trigger. The provider link has lapsed or was never made on this device.' },
      'connect-tv': { states: ['option 38', 'option 27'] },
    },
  ),
  loggedIn(
    'tve-msg-purchase',
    'TVE — existing MSG+ user purchasing YES',
    'paying-msg',
    {
      cta: 'YES Network',
      section: 'Adobe TVE',
      figmaFrame: '2518:499495',
      figmaSection: '2518:499494',
    },
    // The only TVE journey with a real purchase — and the only place in this
    // family the Acquisition card renders. Cadence precedes plans here, which
    // is backwards from every other journey; see the note on `landing`.
    ['landing', 'auth', 'account', 'cadence', 'plans', 'zip', 'checkout', 'home'],
    ['auth', 'account', 'zip'],
    {
      landing: {
        states: ['tall crop', 'short crop'],
        note:
          'Two consecutive Anonymous frames, identical but for height. Read as one screen in two crops rather than two steps — this journey is the thinnest in the file and looks unfinished.',
      },
      cadence: { figmaFrame: 'choose payment compact', states: undefined },
      plans: { states: undefined },
      checkout: { figmaFrame: '03 – Checkout & Payment', states: undefined },
    },
  ),
)

/**
 * What each Figma section actually draws, reconciled by hand.
 *
 * Applied here rather than inline so the numbers sit in one column and can be
 * re-checked against the file in one pass.
 */
const FIGMA_SCREENS: Record<string, number> = {
  'browse-hero-signup': 15,
  'hero-signup': 19,
  'logged-in-free-rsn': 12,
  'logged-in-paying-rsn': 12,
  'market-check': 16,
  'migration-crm': 9,
  'migration-no-payment': 9,
  'migration-organic': 8,
  'migration-tve': 10,
  'plans-section': 14,
  'rsn-tile-signup': 16,
  'rsn-upgrade-bundle': 9,
  'starlink-signup': 15,
  'starlink-skip-payment': 12,
  'tve-existing': 7,
  'tve-msg-purchase': 6,
  'tve-msg-tile': 11,
  'tve-provider-signin': 10,
  'ultimate-feature': 16,
}

for (const j of journeys) {
  const declared = FIGMA_SCREENS[j.id]
  if (declared !== undefined) j.figmaScreens = declared
}

// Fails the dev boot rather than rendering a plausible-looking wrong journey.
if (import.meta.env.DEV) {
  const drift = driftFromFigma(journeys)
  if (drift.length > 0) {
    throw new Error(
      'Journey model has drifted from Figma: ' +
        drift.map((d) => `${d.id} declares ${d.declared}, models ${d.actual}`).join('; '),
    )
  }
}
