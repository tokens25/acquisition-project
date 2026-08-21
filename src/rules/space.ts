import type { RuntimeCondition } from './journey'

/**
 * The journey space, read from Figma file G636wazyXWJgDtBb0MWDza.
 *
 * The landing-page CTAs are one axis among several. Mobile Web alone carries
 * five journey families; Desktop mirrors most of them, and there are seven
 * platform pages in total. Drawn out, that is well over a hundred flows — which
 * is precisely why they must be configured, not built.
 */

export type Platform =
  | 'mobile-web'
  | 'tablet'
  | 'desktop'
  | 'tv-html5'
  | 'tv-android'
  | 'tv-tvos'
  | 'tv-roku'

/** Who the user is when the journey starts. The dominant axis. */
export type UserState =
  | 'anonymous'
  | 'registered-free'
  | 'paying-dazn'
  | 'rsn-lower-tier'
  | 'migrating'

/** Where the journey was entered from — not only landing-page CTAs. */
export type EntrySurface =
  | 'landing-cta'
  | 'open-browse-hero'
  | 'rsn-tile'
  | 'msg-tile'
  | 'tv-provider'
  | 'crm-email'
  | 'starlink'

/** How the user authenticates, which changes the auth and account steps. */
export type AuthPath = 'regular' | 'tve-adobe' | 'starlink'

export interface JourneyFamily {
  id: string
  name: string
  figmaSection: string
  userState: UserState
  /** Journey names as drawn in Figma, for traceability. */
  variants: string[]
  note: string
}

/** The five families on 📱 Mobile [Web]. Desktop mirrors most of them. */
export const families: JourneyFamily[] = [
  {
    id: 'landing',
    name: 'Landing page journeys',
    figmaSection: '2350:75321',
    userState: 'anonymous',
    variants: ['Sign up', 'Check Your Market', 'Get Ultimate', 'Get MSG+'],
    note: 'Four entry CTAs on the landing page. Modelled in journeys.ts.',
  },
  {
    id: 'logged-out',
    name: 'Logged out new users',
    figmaSection: '2362:179952',
    userState: 'anonymous',
    variants: [
      'Regular signup from open browse hero CTA',
      'Starlink',
      'Regular signup from an RSN tile',
      'Starlink (second variant)',
    ],
    note:
      'Same user state as landing, different entry surface — browse hero, RSN tile, Starlink. Modelled in journeys.ts; screen counts reconcile at 15/16/15/12.',
  },
  {
    id: 'logged-in',
    name: 'Logged in DAZN customer',
    figmaSection: '2362:250798',
    userState: 'paying-dazn',
    variants: [
      'Logged in free registered user — signup from an RSN tile',
      'Logged in paying DAZN user — signup from an RSN tile',
      'Existing RSN lower tier — upgrading to the bundle',
    ],
    note:
      'Auth is already satisfied, so those steps are seeded away. Upgrade is a different question from purchase. Modelled in journeys.ts; screen counts reconcile at 12/12/9.',
  },
  {
    id: 'migration',
    name: 'Migration journeys',
    figmaSection: '2398:41587',
    userState: 'migrating',
    variants: ['No payment method', 'From CRM', 'TVE', 'Organic'],
    note:
      'Existing subscribers being moved. Confirmed not a purchase journey: the section has no Plans, Zipcode, Create or Checkout frame at all. Modelled in journeys.ts; screen counts reconcile at 9/9/10/8.',
  },
  {
    id: 'tve',
    name: 'Adobe TVE',
    figmaSection: '2518:495931',
    userState: 'anonymous',
    variants: [
      'Existing user with MSG+ purchasing YES',
      'New user — Sign in with your TV provider',
      'Existing user with TVE',
      'New user — clicking on MSG+ tile',
    ],
    note: 'A different auth path. Entitlement comes from the TV provider, not a purchase.',
  },
]

/**
 * Not journeys.
 *
 * These sections hold loose frames with no sub-sections, because they are
 * states that can interrupt any journey — not steps within one. Modelling them
 * as journeys would be a category error, and would multiply the space again for
 * no benefit.
 */
export interface Interrupt {
  id: string
  name: string
  figmaSection: string
  requires: RuntimeCondition[]
  note: string
}

export const interrupts: Interrupt[] = [
  {
    id: 'rsn-geo',
    name: 'RSN geolocation',
    figmaSection: '2518:854436',
    requires: ['geo.zipUnknown'],
    note: 'Regional availability could not be resolved. 11 frames on mobile, 13 on desktop.',
  },
  {
    id: 'streaming-limit',
    name: 'Streaming limit',
    figmaSection: '2539:882106',
    requires: [],
    note: 'Concurrent stream cap reached.',
  },
  {
    id: 'travelling',
    name: 'New session blocked while travelling',
    figmaSection: '2539:882580',
    requires: [],
    note: 'Out-of-region playback attempt.',
  },
]

/**
 * Platform does NOT change the steps — only the page layout (answered Q11).
 * So the seven platform pages are seven renderings of the same journeys, and
 * platform drops out of the journey model entirely. It stays where it already
 * lived: a rendering concern, alongside the card's mobile/desktop/xl device.
 */
export const platforms: Platform[] = [
  'mobile-web',
  'tablet',
  'desktop',
  'tv-html5',
  'tv-android',
  'tv-tvos',
  'tv-roku',
]

export const drawnJourneyCount = families.reduce((n, f) => n + f.variants.length, 0)
