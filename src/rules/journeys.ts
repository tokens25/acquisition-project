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
      figmaFrame: 'MSG+ - Landing page - Mobile',
      renderer: 'stub',
      order: 10,
      requires: ['auth.signedOut'],
      note: 'The entry point. Which CTA is pressed here decides the journey.',
    },
    {
      id: 'plans',
      name: 'Choose your subscription',
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
      figmaFrame: 'Plans (payment-options)',
      renderer: 'stub',
      order: 30,
      states: ['pay now', 'pay monthly'],
      note: 'Billing cadence — annual up-front versus monthly.',
    },
    {
      id: 'connect-tv',
      name: 'Connect TV — dual screen',
      figmaFrame: 'Connect TV- dual screen-option',
      renderer: 'stub',
      order: 35,
      note: 'TV pairing. Found in the RSN-tile and logged-in journeys, not in the landing four.',
    },
    {
      id: 'auth',
      name: 'Log in or sign up',
      figmaFrame: 'Create',
      renderer: 'stub',
      order: 40,
      requires: ['auth.signedOut'],
      note: 'Skipped entirely when already signed in — confirmed by the logged-in families, which drop it.',
    },
    {
      id: 'account',
      name: 'Finish signing up',
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
      figmaFrame: 'Credit card - zip code verified',
      renderer: 'stub',
      order: 80,
      requires: ['payment.succeeded'],
      note: 'Confirmation, with the teams the ZIP unlocked.',
    },
    {
      id: 'home',
      name: 'Home',
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

export const signUpJourney = journeys[0]
