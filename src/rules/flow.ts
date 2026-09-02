/**
 * Authored copy for the screens after the plan picker.
 *
 * Figma: 🚀 Acquisition for ai → "Flow" (node 583:23442). Six groups, thirteen
 * screens: Cadence, Login, Account setup ×3, ZIP ×3, Checkout ×4, Confirmation.
 *
 * Kept apart from `CardSet`'s tiers and offers because it is a different kind
 * of content — the words on a screen rather than what a plan costs — and
 * apart from the components because a screen is a thing someone writes, not a
 * thing someone codes. Every string here is on screen somewhere; nothing is
 * derived, and nothing is a setting.
 *
 * Values shown in fields (a name, an email, a ZIP) are authored too. They are
 * what the design draws, and a preview of a filled form has to show something.
 */

export interface CadenceOption {
  id: string
  /** "Pay now" — the bold line. */
  title: string
  /** The grey line under it. */
  note: string
  price: string
  /** What follows the slash: "year", "month". */
  unit: string
  /** The corner ribbon. Empty for no ribbon. */
  badge: string
}

export interface CadenceScreen {
  navTitle: string
  options: CadenceOption[]
  /** Which option's radio is filled. */
  selected: string
  /**
   * How the yearly card states what it saves — as money, or as a share of the
   * year's cost. The saving itself is not written anywhere: it is the
   * difference between the yearly price and twelve monthly ones, so it follows
   * both of them rather than being kept in step with them by hand.
   */
  savingAs?: 'amount' | 'percent'
  cta: string
  footnote: string
}

export interface AuthScreen {
  navTitle: string
  title: string
  subtitle: string
  noticeTitle: string
  noticeBody: string
  emailLabel: string
  emailValue: string
  cta: string
  dividerLabel: string
  /** In order, each drawn with the provider's own mark. */
  providers: { id: 'apple' | 'google' | 'facebook'; label: string }[]
}

export interface Consent {
  id: string
  /** What is being asked. */
  body: string
  /** The grey line under the group. Empty for none. */
  note: string
  /** Whether the switch starts on. */
  on: boolean
}

export interface AccountScreen {
  navTitle: string
  nameHeading: string
  firstNameLabel: string
  firstNameValue: string
  lastNameLabel: string
  lastNameValue: string
  emailHeading: string
  emailLabel: string
  emailValue: string
  passwordHeading: string
  passwordLabel: string
  passwordValue: string
  rulesTitle: string
  rules: string[]
  notifyHeading: string
  /**
   * The permissions asked for, each with its own switch.
   *
   * Optional so that content published before there were several still draws:
   * a copy carrying the single body and note below is read as one consent
   * rather than as none. Write to this and the pair stops being read.
   */
  consents?: Consent[]
  /** The one consent this screen used to have. Read only when the list is absent. */
  consentBody?: string
  consentNote?: string
  cta: string
  /** What the button says while the account is being made. */
  workingCta: string
}

export interface ZipScreen {
  navTitle: string
  heading: string
  body: string
  fieldLabel: string
  fieldValue: string
  cta: string
  dividerLabel: string
  altCta: string
  /** Heading over the teams the ZIP resolves to. */
  resultsLabel: string
}

export interface CheckoutLine {
  label: string
  value: string
  /** Rendered after the value, behind a slash: "/month". */
  unit?: string
  /** Draws the calendar mark before the label. */
  schedule?: boolean
}

export interface CheckoutScreen {
  navTitle: string
  note: string
  summaryTitle: string
  changeCta: string
  lines: CheckoutLine[]
  renewalNote: string
  cardsLabel: string
  /** The "+4" chip after the card marks. */
  cardsOverflow: string
  cardNumberLabel: string
  expiryLabel: string
  cvcLabel: string
  nameOnCardLabel: string
  legal: string
  payCta: string
  secureCta: string
  googlePayLabel: string
  paypalLabel: string
  promoLabel: string
}

export interface ReadyScreen {
  navTitle: string
  title: string
  body: string
  cta: string
  altCta: string
  /** Catalogue ids, drawn as the circle graphic. */
  logos: string[]
}

export interface LandingScreen {
  /** The two buttons in the bar at the top. */
  navExplore: string
  navSignUp: string
  title: string
  body: string
  /** The gold one. */
  cta: string
  /** The white one under it. */
  altCta: string
}

export interface FlowContent {
  landing: LandingScreen
  cadence: CadenceScreen
  auth: AuthScreen
  account: AccountScreen
  zip: ZipScreen
  checkout: CheckoutScreen
  ready: ReadyScreen
}

/** Copied from the node, including the placeholder Figma itself carries. */
export const defaultFlow: FlowContent = {
  landing: {
    // The first button and the second. The names are what they were when the
    // first drawing had them the other way round; the panel calls them by
    // position, which is what they are.
    navExplore: 'Log in',
    navSignUp: 'Explore',
    title: 'MSG+ on DAZN',
    body: 'Stream MSG and YES only on DAZN and watch every local Knicks, Yankees, Nets, Rangers, Devils, Islanders and Sabres game live or on demand. ',
    cta: 'Sign up',
    altCta: 'Sign in with your TV provider',
  },

  cadence: {
    navTitle: 'Choose your subscription',
    options: [
      {
        id: 'upfront',
        title: 'Pay now',
        note: 'One upfront payment. Renews annually.',
        price: '$279.99',
        unit: 'year',
        badge: 'MOST Popular',
      },
      {
        id: 'monthly',
        title: 'Pay monthly',
        note: 'Auto renews each month. Cancel any time. ',
        price: '$29.99',
        unit: 'month',
        badge: '',
      },
    ],
    selected: 'upfront',
    cta: 'Continue',
    footnote: 'Available across the New York and Buffalo DMAs.',
  },

  auth: {
    navTitle: 'Choose your subscription',
    title: 'Log in or sign up for free',
    subtitle:
      'Get access to live sports, highlights, shows, News, Scores and much more. ',
    noticeTitle: 'Current or previous Gotham subscriber? ',
    noticeBody: 'You can sign up with the same email address',
    emailLabel: 'Email address',
    emailValue: '',
    cta: 'Confirm and continue',
    dividerLabel: 'or',
    providers: [
      { id: 'apple', label: 'Continue with Apple' },
      { id: 'google', label: 'Continue with Google' },
      { id: 'facebook', label: 'Continue with Facebook' },
    ],
  },

  account: {
    navTitle: 'Finish signing up',
    nameHeading: 'Your name',
    firstNameLabel: 'First name',
    firstNameValue: 'John',
    lastNameLabel: 'Last name',
    lastNameValue: 'Doe',
    emailHeading: 'Email',
    emailLabel: 'Email address',
    emailValue: 'John.doe@email.com',
    passwordHeading: 'Password',
    passwordLabel: 'Password',
    passwordValue: 'Dazn1234',
    rulesTitle: 'Your password must contain',
    rules: [
      'Upper and lower case letters',
      'At least one number',
      'At least 6 characters (8 for stronger password)',
    ],
    notifyHeading: 'Get notified',
    consents: [
      {
        id: 'marketing',
        body:
          'I would like to receive news, offers and information about DAZN products and ' +
          'services by email.',
        note: 'You can adjust these settings later in My account',
        on: false,
      },
    ],
    cta: 'Confirm and continue',
    workingCta: 'Creating your account',
  },

  zip: {
    navTitle: 'Confirm your ZIP Code',
    heading: 'Check everything looks right',
    body: "We use your ZIP Code to work out which local teams and games you can watch. If it's not right, change it here and we'll update what's available.",
    fieldLabel: 'Enter ZIP Code',
    fieldValue: '01001',
    cta: 'Confirm and continue',
    dividerLabel: 'or',
    altCta: 'Log in with TV provider',
    // The design carries a placeholder here rather than copy. Left as drawn —
    // it is a field waiting to be written, and inventing a heading would hide
    // that it still needs one.
    resultsLabel: 'djsnsjndsajnn',
  },

  checkout: {
    navTitle: 'Choose your subscription',
    note: 'Your payment is encrypted and you can change how you pay at any time.',
    summaryTitle: 'MSG+',
    changeCta: 'Change',
    lines: [
      { label: 'Pay now', value: '$279.99', unit: 'month' },
      { label: 'Today you pay', value: '$279.99' },
      { label: 'Next payment on 11/01/2026', value: '$279.99', schedule: true },
    ],
    renewalNote:
      'Your plan will automatically renew on 01/10/2027 unless you turn off auto-renew in My Account.',
    cardsLabel: 'Credit & Debit Cards',
    cardsOverflow: '+4',
    cardNumberLabel: 'Card number',
    expiryLabel: 'Expiry date',
    cvcLabel: 'CVC',
    nameOnCardLabel: 'Name on card',
    legal:
      "By signing up you agree that your subscription starts immediately and that you have read and agree to our Terms of Use, Privacy Policy and Cookie Notice. Your subscription auto-renews unless you cancel before the end of the minimum term by selecting 'Cancel Subscription' in MyAccount.",
    payCta: 'Pay now',
    secureCta: 'Secure checkout',
    googlePayLabel: 'Google Pay',
    paypalLabel: 'Paypal',
    promoLabel: 'Redeem promo code',
  },

  ready: {
    navTitle: 'Choose your subscription',
    title: 'You’re ready to watch MSG+ on DAZN.',
    body: 'Watch Knicks, Rangers, Islanders, Devils, Sabres and more. all in one place.',
    cta: 'Open DAZN app',
    altCta: 'Continue in browser',
    logos: ['knicks', 'rangers', 'islanders', 'devils', 'sabres'],
  },
}

/** The screens, in the order the Figma section lays them out. */
export const FLOW_STEPS = ['landing', 'cadence', 'auth', 'account', 'zip', 'checkout', 'ready'] as const
export type FlowStepId = (typeof FLOW_STEPS)[number]

/** Whether a step id is one of the flow screens this file describes. */
export function isFlowStep(id: string): id is FlowStepId {
  return (FLOW_STEPS as readonly string[]).includes(id)
}
