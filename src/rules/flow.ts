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
  /** Absent on lines written before they had one; see `linesOf`. */
  id?: string
  label: string
  value: string
  /** Rendered after the value, behind a slash: "/month". */
  unit?: string
  /** Draws the calendar mark before the label. */
  schedule?: boolean
  /**
   * Draws the line as an offer rather than as a plain amount — a discount, a
   * free month, anything the summary announces rather than just totals.
   */
  offer?: boolean
}

/**
 * Which artwork sits at the right of a payment option.
 *
 * A named set rather than a list of marks: the artwork ships with the tool, so
 * what an option can show is a choice between the sets that exist, not a field
 * someone types into.
 */
export type PayMarks = 'cards' | 'gpay' | 'paypal' | 'none'

/** One way to pay, in the list the checkout screen offers. */
export interface PaymentMethod {
  id: string
  label: string
  marks: PayMarks
  /** The chip after the marks, as in "+4". Empty draws none. */
  overflow?: string
  /** Whether choosing this option opens the card form under it. */
  card?: boolean
}

export interface CheckoutScreen {
  navTitle: string
  note: string
  summaryTitle: string
  changeCta: string
  lines: CheckoutLine[]
  renewalNote: string
  /** The ways to pay, in the order they are offered. */
  methods?: PaymentMethod[]
  /** Which one is chosen when the screen opens. */
  chosen?: string
  /** Superseded by `methods`; still read from content saved before it. */
  cardsLabel?: string
  /** The "+4" chip after the card marks. Superseded by `methods`. */
  cardsOverflow?: string
  cardNumberLabel: string
  expiryLabel: string
  cvcLabel: string
  nameOnCardLabel: string
  legal: string
  payCta: string
  secureCta: string
  /** Superseded by `methods`. */
  googlePayLabel?: string
  /** Superseded by `methods`. */
  paypalLabel?: string
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

/** One TV provider tile in the "How to connect" grid. */
export interface LandingProvider {
  id: string
  name: string
}

/** One question in the landing page's FAQ. */
export interface LandingQuestion {
  id: string
  question: string
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
  /** The small line under the buttons, laid over them by the design's grid. */
  footnote?: string

  /* ── The rest of the page, below the hero ──────────────────
     Figma: 🚀 Acquisition for ai → "MSG+ - Landing page - Mobile"
     (node 708:173735). The sections whose words a market writes; the
     schedule, the scores, the news and the fan chat are drawn from what
     DAZN is showing rather than from anything authored here. Every field
     is optional so that content saved before the page had them still
     loads — the screen falls back to the shipped wording. */

  /** Under the hero: the postcode that decides which teams you are shown. */
  zipHeading?: string
  /** The line under it — what the design calls out about getting it right. */
  zipNote?: string
  zipLabel?: string
  zipValue?: string
  zipCta?: string

  /** The heading over the fixtures DAZN is showing. */
  scheduleHeading?: string

  /**
   * Over the plan picker. The design breaks the heading itself rather than
   * letting it wrap, so the break is part of what is written.
   */
  plansTitle?: string
  plansBody?: string

  /** "Meet the teams" — the tiles of what you get in your area. */
  teamsEyebrow?: string
  teamsTitle?: string
  teamsBody?: string

  /**
   * The card that answers a postcode outside the broadcast region: what was
   * typed, what is not available there, and where to go instead.
   */
  areaTitle?: string
  areaBody?: string
  areaFieldLabel?: string
  areaFieldValue?: string
  areaNotice?: string
  areaNote?: string
  areaCta?: string

  /** The Multiview pitch, and the plan it belongs to. */
  multiviewEyebrow?: string
  multiviewBadge?: string
  multiviewTitle?: string
  multiviewBody?: string
  multiviewCta?: string

  /** "How to connect your TV Subscription" and the grid of providers. */
  providersTitle?: string
  providersBody?: string
  /** The gold half of the sentence above. */
  providersHighlight?: string
  providersNote?: string
  providersCta?: string
  providers?: LandingProvider[]

  /** "Watch on your favourite devices." */
  devicesTitle?: string
  /** The second line, which the design sets on its own. */
  devicesTitleTwo?: string
  devicesBody?: string
  devicesNote?: string

  /** The free games offer. */
  freeTitle?: string
  freeBody?: string
  freeCta?: string

  /** The questions at the foot of the page. */
  faqTitle?: string
  faqs?: LandingQuestion[]
}

export interface FlowContent {
  landing: LandingScreen
  plans: PlansScreen
  cadence: CadenceScreen
  auth: AuthScreen
  account: AccountScreen
  zip: ZipScreen
  checkout: CheckoutScreen
  ready: ReadyScreen
}

/** Copied from the node, including the placeholder Figma itself carries. */
/**
 * The plan picker's own chrome.
 *
 * Only the title, because everything else on that screen is the cards and the
 * tabs, and both are authored elsewhere. It lives here rather than beside them
 * so the line in the header is written and layered like every other line in
 * the flow, instead of being the one screen with its title in the markup.
 */
export interface PlansScreen {
  navTitle: string
}

export const defaultFlow: FlowContent = {
  landing: {
    // The first button and the second. The names are what they were when the
    // first drawing had them the other way round; the panel calls them by
    // position, which is what they are.
    navExplore: 'Explore',
    navSignUp: 'Sign in',
    title: 'MSG+ on DAZN',
    body: 'Stream MSG and YES only on DAZN and watch every local Knicks, Yankees, Nets, Rangers, Devils, Islanders and Sabres game live or on demand. ',
    cta: 'Sign Up',
    altCta: 'Sign in with your TV provider',
    footnote: 'Nationally broadcast games will not be available on DAZN',

    // Read off node 708:173735 rather than rewritten, down to the full stop
    // the design puts after "devices." and the one it leaves off "Anywhere".
    zipHeading: 'Your home ZIP code unlocks your teams',
    zipNote: "Check it's right before you continue — it decides which games you get.",
    zipLabel: 'Zip Code:',
    zipValue: '10001',
    zipCta: 'Sign Up',

    scheduleHeading: 'Live and Upcoming Games Schedule',

    plansTitle: "Choose the plan that's\nright for you",
    plansBody: 'The best of NY sports, streaming all in one place.',

    teamsEyebrow: 'Meet the teams',
    teamsTitle: 'Your teams, one home',
    teamsBody: 'Here are the teams available in your area',

    areaTitle: "See what's live in your area",
    areaBody: 'Enter your ZIP Code to see which teams you can watch.',
    areaFieldLabel: 'Enter ZIP Code',
    areaFieldValue: '43316',
    areaNotice: "MSG+ and YES aren't available in 43316",
    areaNote:
      "Your area is outside the MSG+ and YES broadcast region. DAZN's national plans are available everywhere in the US, and other regional networks may cover your teams.",
    areaCta: 'See DAZN plans',

    multiviewEyebrow: 'Multiview',
    multiviewBadge: 'Ultimate only',
    multiviewTitle: 'Feel 4 times the action with Multiview',
    multiviewBody:
      'Build your perfect gameday with Multiview. Watch up to 4 live game feeds at once.',
    multiviewCta: 'Get Ultimate',

    providersTitle: 'How to connect your TV Subscription',
    providersBody:
      'Once you sign up to DAZN, select your TV provider to get full access to MSG+',
    providersHighlight: 'at no extra cost.',
    providersNote: 'Find the full list of TV providers after you log in to DAZN',
    providersCta: 'Sign in with your TV provider',
    providers: [
      { id: 'provider-1', name: 'Spectrum' },
      { id: 'provider-2', name: 'DIRECTV' },
      { id: 'provider-3', name: 'fios' },
      { id: 'provider-4', name: 'optimum.' },
      { id: 'provider-5', name: 'optimum.tv' },
      { id: 'provider-6', name: 'fubo' },
      { id: 'provider-7', name: 'xfinity' },
      { id: 'provider-8', name: 'altice' },
      { id: 'provider-9', name: 'Astound' },
      { id: 'provider-10', name: 'breezeline' },
    ],

    devicesTitle: 'Watch on your favourite devices.',
    devicesTitleTwo: 'Anywhere.',
    devicesBody:
      'Whether you are at home or on the go, NHL TV is available on a wide range of mobile and connected devices including Smart TVs, Chromecast, Playstation, Xbox and more.',
    devicesNote: 'Our leading supported devices',

    freeTitle: 'Watch the New York sports for free',
    freeBody:
      'Watch all of the FIFA Club World Cup games live and other selected events and highlights',
    freeCta: 'Get started',

    faqTitle: 'FAQ',
    faqs: [
      { id: 'faq-1', question: 'What do I get with the Gotham Bundle?' },
      { id: 'faq-2', question: 'How to connect your tv provider' },
      { id: 'faq-3', question: 'What is Multiview?' },
    ],
  },

  plans: { navTitle: 'Choose your subscription' },
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
      { id: 'line-1', label: 'Pay now', value: '$279.99', unit: 'month' },
      { id: 'line-2', label: 'Today you pay', value: '$279.99' },
      { id: 'line-3', label: 'Next payment on 11/01/2026', value: '$279.99', schedule: true },
    ],
    renewalNote:
      'Your plan will automatically renew on 01/10/2027 unless you turn off auto-renew in My Account.',
    methods: [
      { id: 'method-1', label: 'Credit & Debit Cards', marks: 'cards', overflow: '+4', card: true },
      { id: 'method-2', label: 'Google Pay', marks: 'gpay' },
      { id: 'method-3', label: 'Paypal', marks: 'paypal' },
    ],
    chosen: 'method-1',
    cardNumberLabel: 'Card number',
    expiryLabel: 'Expiry date',
    cvcLabel: 'CVC',
    nameOnCardLabel: 'Name on card',
    legal:
      "By signing up you agree that your subscription starts immediately and that you have read and agree to our Terms of Use, Privacy Policy and Cookie Notice. Your subscription auto-renews unless you cancel before the end of the minimum term by selecting 'Cancel Subscription' in MyAccount.",
    payCta: 'Pay now',
    secureCta: 'Secure checkout',
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
