import type { Journey } from './journey'

/**
 * Drafted from Figma "Landing page journeys" (node 2350:75321) — four sections
 * that share the name "New logged out user - Zip Code auto detected" and differ
 * only in how many Plans and Zipcode frames they draw.
 *
 * Those repeated frames are states of one step, not separate steps, so they are
 * folded into `states` here. See JOURNEY-RULES.md for the reasoning and the
 * open questions this draft still carries.
 */
export const signUpJourney: Journey = {
  id: 'new-user-signup',
  name: 'New logged out user — sign up',
  audience: 'anonymous',
  steps: [
    {
      id: 'landing',
      name: 'Landing',
      figmaFrame: 'MSG+ - Landing page - Mobile',
      renderer: 'stub',
      order: 10,
      requires: ['auth.signedOut'],
      note: 'Hero, sign-up entry and the TV-provider alternative. Carries ZIP entry in the US.',
    },
    {
      id: 'plans',
      name: 'Choose your subscription',
      figmaFrame: 'Plans',
      renderer: 'plans',
      order: 20,
      states: ['default', 'alternate plan selected'],
      note: 'The Acquisition card set. Standard / Ultimate tabs above it.',
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
      id: 'auth',
      name: 'Log in or sign up',
      figmaFrame: 'Create',
      renderer: 'stub',
      order: 40,
      requires: ['auth.signedOut'],
      note: 'Email plus Apple / Google / Facebook. Skipped entirely when already signed in.',
    },
    {
      id: 'account',
      name: 'Finish signing up',
      figmaFrame: 'Complete Account',
      renderer: 'stub',
      order: 50,
      states: ['empty', 'filled', 'confirmed'],
      requires: ['form.valid'],
      note: 'Name, email, password and consent. The three frames are form states, not steps.',
    },
    {
      id: 'zip',
      name: 'Confirm your ZIP code',
      figmaFrame: 'Zipcode',
      renderer: 'stub',
      order: 60,
      when: { market: 'US' },
      states: ['empty', 'entered', 'teams resolved'],
      requires: ['geo.zipKnown'],
      note: 'US only — regional blackout and team availability depend on it.',
    },
    {
      id: 'checkout',
      name: 'Checkout and payment',
      figmaFrame: 'Checkout',
      renderer: 'stub',
      order: 70,
      states: ['summary', 'card entered', 'processing', 'paid'],
      note: 'Order summary plus payment. Owned by the payments system, not this CMS.',
    },
    {
      id: 'ready',
      name: 'Ready to watch',
      figmaFrame: 'Credit card - zip code verified',
      renderer: 'stub',
      order: 80,
      requires: ['payment.succeeded'],
      note: 'Confirmation, with the teams the ZIP code unlocked.',
    },
    {
      id: 'home',
      name: 'Home',
      figmaFrame: 'mobile-hero-native',
      renderer: 'stub',
      order: 90,
      note: 'The product itself — outside the acquisition journey. Included for context.',
    },
  ],
}

export const journeys: Journey[] = [signUpJourney]
