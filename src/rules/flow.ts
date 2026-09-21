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

import type { PageSection } from './sections'

/** One word in the footer. It goes nowhere; it is a name on a page. */
export interface LandingLink {
  id: string
  label: string
  /**
   * Whether this one starts a line.
   *
   * The design groups the words — the languages, then the privacy line on its
   * own, then the three about the business — and left to wrap they would fall
   * differently. So where a line starts is authored rather than whatever the
   * width happens to allow.
   */
  breaks?: boolean
}

/**
 * One row of the features list.
 *
 * The tag is the row's key as well as its label: it picks the icon beside it
 * and the picture at its left, the way a provider's name picks its logo.
 */
export interface LandingFeature {
  id: string
  tag: string
  title: string
  body: string
  /** A picture of its own, instead of the one the tag brings. */
  image?: string
  /**
   * The icon in the pill, instead of the one the tag brings.
   *
   * The live page puts it on the button the pill is made from, so a market's
   * rows wear the market's icons rather than whichever of ours its tag
   * happens to name.
   */
  icon?: string
  /** Drawn without a picture at all. */
  imageOff?: boolean
}

/**
 * How big the tiles in a rail are, and therefore what a rail is for.
 *
 * The design draws five rails and they differ in one thing: the tile. A wide
 * short tile is a promotion, a 16:9 one with its words under it is a fixture,
 * a tall one is a story, a square one is a place. So the size is the
 * component's one real choice rather than five components repeating each
 * other — and it is named for what it holds, because "322 by 120" tells
 * nobody which rail to reach for.
 */
export type RailSize = 'wide' | 'fixture' | 'story' | 'square'

/** One tile in a rail. The picture is the shipped artwork; these are the words. */
export interface LandingTile {
  id: string
  title: string
  /** The quieter line: a competition, a city and a capacity, a date. */
  meta: string
  /** Playing now, which the stamp says instead of an hour. */
  live?: boolean
  /** When it starts, ISO. The stamp is read from it in the reader's hours. */
  start?: string
  /** The rail's own picture for it, where the rail has been read. */
  image?: string
  /** Watching it takes a subscription, which the tile wears as a padlock. */
  locked?: boolean
}

/** One subscription offered beside this one — node 1084:55909. */
export interface LandingSubTile {
  id: string
  /** What it is, in the line the tile carries under the logo. */
  line: string
  cta: string
  /**
   * When it is, over the line — "SEP 19".
   *
   * An events rail has one on every tile and a products rail on none, which is
   * why it is a tile's rather than the rail's. Empty draws nothing.
   */
  badge?: string
  /**
   * The picture behind it, where one was chosen. A data URL.
   *
   * Absent is not blank: the tile draws the shipped picture for its place in
   * the rail. This is only what somebody put there instead.
   */
  background?: string
/**
   * The lockup over the picture, where this tile has one of its own.
   *
   * A products rail puts the product's logo there and an events rail the
   * event's — the fight night lockup over the fight's photograph. Absent falls
   * back to the DAZN mark, which is the setting below.
   */
  logoImage?: string
  /**
   * Whether the DAZN mark is drawn over the line at the foot.
   *
   * Absent means drawn. Every tile in the design has it, so a tile written
   * before this was a setting is a tile that wants it — and off has to be
   * said rather than assumed from a missing field.
   */
  logo?: boolean
}

/**
 * One badge on the competition carousel.
 *
 * A picture and a line, which is all the live one carries: its entries hold an
 * image and a description and nothing else — no name, no link, no price. Japan
 * draws the row with no lines at all, so a badge with nothing written under it
 * is a badge and not an unfinished one.
 */
/** How the freemium banner is put together — the picture over or above. */
export type ImageCtaLayout = 'fill' | 'top'

/**
 * The two faces the top bar's first button is drawn with.
 *
 * Named for what they say rather than for what they look like: `subscribe` is
 * the gold one that asks for money, `neutral` the grey one that offers a look
 * around first.
 */
export type NavFirstStyle = 'subscribe' | 'neutral'

/** One line of what an offer includes, and the icon set against it. */
export interface LandingBannerLine {
  line: string
  /** A picture of the market's own; absent draws the shipped tick. */
  icon?: string
}

/**
 * The banner's list, however it is being held.
 *
 * It was a list of sentences before the icons came across, and a page saved
 * then still holds one — so a bare string is read as a line with no icon of
 * its own rather than as a page that cannot be opened.
 */
export const bannerLinesOf = (
  lines: (LandingBannerLine | string)[] | undefined,
): LandingBannerLine[] =>
  (lines ?? []).map((one) => (typeof one === 'string' ? { line: one } : one)).filter((one) => one.line.trim() !== '')

/** One logo on the wall of supported devices. */
export interface LandingDevice {
  id: string
  name: string
  /** Where the logo is, when it came from the live page rather than the app. */
  logo?: string
}

export interface LandingBadge {
  id: string
  /** The line under the disc. Empty draws none, which Japan's row does. */
  line: string
  /** The picture inside the disc, masked round by the page. A data URL. */
  image?: string
}

/** One fight inside a bundle, as the bundle card lists it. */
export interface LandingBundleFight {
  id: string
  name: string
  when: string
}

/**
 * One pre-made combination of events, sold as a unit — node 1093:55175.
 *
 * A different kind of subscription from the plans: a plan is a tier of the
 * service, and this is a basket of nights priced against what those nights
 * would cost separately. Which is why the saving is a field rather than a
 * decoration — the offer *is* the difference between the two numbers.
 */
export interface LandingBundle {
  id: string
  name: string
  /** The line under the name, saying what is in it. */
  note: string
  price: string
  /** What it would have cost. Empty draws no strike-through and no saving. */
  was: string
  /** "Save 15%", in the words the market uses for it. */
  save: string
  /** "2-fight bundle" — what kind of bundle this is, under the price. */
  term: string
  /** "BEST VALUE", across the top corner. Empty draws none. */
  badge: string
  cta: string
  fights: LandingBundleFight[]
}

/**
 * One match in a day-by-day list — node 1093:51934.
 *
 * The day is on the match rather than the list being a list of days. Matches
 * that share a day are drawn under one heading, so moving a match to another
 * day is editing one field instead of moving it between two lists — and a
 * day with nothing left in it stops existing on its own.
 */
export interface LandingMatch {
  id: string
  /** The heading it falls under — "Thursday 11 June 2026". */
  day: string
  /** The two sides, as the card abbreviates them: MEX, RSA. */
  home: string
  away: string
  /**
   * The flag beside each code, where one was chosen. A data URL.
   *
   * Absent is not flagless: the code brings its own, the way a team's name
   * brings its crest. This is only what somebody put there instead.
   */
  homeFlag?: string
  awayFlag?: string
  time: string
  /** The line under the rule — stage, group, stadium and city. */
  note: string
}

/** One fight inside a plan card: a still, what it is, and when it is. */
export interface LandingPlanFight {
  id: string
  name: string
  when: string
  /** What this one costs on its own. Empty where the offer above prices it. */
  price: string
  /** Struck through beside the price. Empty draws neither this nor the saving. */
  was: string
  /** What follows the price — "/fight". */
  unit: string
  save: string
}

/** One poster in the rail a yearly card shows its year with. */
export interface LandingPoster {
  id: string
  /** The date printed under the artwork. */
  when: string
}

/** One line under a plan card's prices: a tick, or a note with an i. */
export interface LandingPerk {
  id: string
  text: string
  /** An i rather than a tick: something to know, not something you get. */
  info: boolean
}

/**
 * One card in the fight plan picker — node 1102:53279.
 *
 * The design's Variation section draws this card eight times, and every one of
 * them is this shape with different words in it: no offer, a free trial, a
 * discount, a month free, and the same four again with a bundle instead of a
 * single fight. So there is one card here and not eight — what varies is what
 * is written on it, which is what a market changes anyway.
 */
export interface LandingPlanCard {
  id: string
  name: string
  /** Under the name: how it is billed, or what offer is on it. */
  note: string
  price: string
  /** What follows the price — "/month", "/year". */
  priceUnit: string
  /** The boxed message under the price. Empty draws none. */
  notice: string
  /** A bundle's name over the fights. Empty means the card sells one fight. */
  offerName: string
  offerPrice: string
  offerWas: string
  offerUnit: string
  offerSave: string
  fights: LandingPlanFight[]
  /** The line over the posters. Empty draws neither it nor them. */
  postersLine: string
  posters: LandingPoster[]
  perks: LandingPerk[]
  /** Drawn in gold — the year's card, which is the one being sold hardest. */
  gold: boolean
  /** Which card the radio is filled on. */
  chosen: boolean
}

/**
 * One team on the "Meet the teams" rail.
 *
 * The name is the tile's key as well as its label, the way a provider's name
 * picks its logo: write "New York Knicks" and the crest and the colour
 * follow. A name with no artwork draws the tile's own template, which is what
 * the design leaves standing for a team it has not filled in.
 */
export interface LandingTeam {
  id: string
  /**
   * The small line over the name — the city, as the design has it.
   *
   * Written rather than worked out. It used to be taken off the front of the
   * name by matching the artwork's city, which is a guess that is right for
   * the three teams the tool knows and silent about every other.
   */
  city?: string
  /** The large line: the team. */
  name: string
  /** A logo of its own, instead of the one the name brings. A data URL. */
  logo?: string
  /**
   * What the tile is coloured behind it.
   *
   * Absent means the colour the name brings — a shipped team keeps its club's
   * own until somebody chooses otherwise, and a team the tool has never heard
   * of has whatever is picked here rather than the page's black.
   */
  ground?: string
}

/** One tab over a carousel — a country, a competition, a month. */
export interface LandingTab {
  id: string
  label: string
}

/**
 * One card in a stack of them — node 1093:55225.
 *
 * Four shapes in the design and one here, because they differ only in which
 * parts they carry: a number makes it a statistic, a button makes it the lead
 * card, and neither makes it a plain one. A card that had to declare which of
 * the four it was would be a card that could declare the wrong one.
 */
export interface LandingCard {
  id: string
  /** The big gold number over the title. Empty draws none. */
  stat: string
  /** The card's heading. A new line is a second line, as the design draws it. */
  title: string
  body: string
  /** A button at the foot. Empty draws none. */
  cta: string
}

export interface LandingQuestion {
  id: string
  question: string
  /**
   * What opening it says.
   *
   * Optional, and empty by default: the design gives the questions and not the
   * answers, and a row with nothing to say does not open.
   */
  answer?: string
}

export interface LandingScreen {
  /** The two buttons in the bar at the top. */
  navExplore: string
  navSignUp: string
  /**
   * Which face the first button wears.
   *
   * Production draws one component in that slot — DAZN's own `exploreButton` —
   * and gives it either face depending on the market. Italy's says Subscribe
   * on the gold gradient, because there is nothing to browse before paying;
   * where there is, it says Explore on grey and the way in is the button
   * beside it.
   *
   * Absent means `neutral`, which is how the bar was drawn before this was a
   * choice. A page must not change shape because a setting appeared under it.
   */
  navFirstStyle?: NavFirstStyle
  /**
   * Whether the bar has that second button at all. Absent means it does, for
   * the same reason the hero's does: the page shipped with both.
   */
  navSignUpEnabled?: boolean
  title: string
  body: string
  /** The gold one. */
  cta: string
  /** The white one under it. */
  altCta: string
  /**
   * Whether the hero has that second button at all.
   *
   * Absent means it does: the shipped page has always drawn two, and content
   * written before this could be turned off is content that wants both.
   */
  altCtaEnabled?: boolean
  /** The small line under the buttons, laid over them by the design's grid. */
  footnote?: string

  /**
   * Who writes the hero's three pieces of copy.
   *
   * The same choice the plan cards offer over their description: the
   * assistant, or a person. Absent means custom, which is what every page
   * written before this existed was.
   */
  titleSource?: 'ai' | 'custom'
  bodySource?: 'ai' | 'custom'
  ctaSource?: 'ai' | 'custom'

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
  zipCta?: string

  /**
   * How the page below the hero is arranged: which blocks, in what order, and
   * which of them are drawn. Absent means the shipped page — see
   * `rules/sections.ts`, which owns the vocabulary.
   */
  sections?: PageSection[]
  /**
   * What a duplicated block says, where it differs from the page's own fields.
   * Keyed by the instance's id; the original of a type has no entry, because
   * its words are the fields themselves.
   */
  sectionCopy?: Record<string, Partial<LandingScreen>>

  /** The heading over the fixtures DAZN is showing. */
  scheduleHeading?: string
  scheduleSubheading?: string
  /**
   * Which rail the schedule draws, by the name whatever serves it knows.
   *
   * One id rather than a list of game ids: a rail is the thing that decides
   * what is in it — what is on, in what order, for how long — and a page that
   * listed the games would be a second answer to a question the rail has
   * already answered, going stale the moment the fixtures move.
   */
  scheduleRailId?: string

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
  /** Which teams, in the order the rail shows them. */
  teams?: LandingTeam[]

  /**
   * The card that answers a postcode outside the broadcast region: what was
   * typed, what is not available there, and where to go instead.
   */
  areaTitle?: string
  areaBody?: string
  areaNotice?: string
  areaNote?: string
  areaCta?: string

  /** The Multiview pitch, and the plan it belongs to. */
  multiviewEyebrow?: string
  multiviewBadge?: string
  multiviewTitle?: string
  multiviewBody?: string
  multiviewCta?: string
  /**
   * The card inside the banner, which has words of its own.
   *
   * The banner is two things stacked: a badge, a heading and a line that say
   * what the offer is, sitting on the page above the card, and under them the
   * card that says what you get and carries the button. Italy draws both —
   * "All DAZN sport, on your smartphone." over "Always with you. Every
   * competition." — so one heading would have had to stand in for two.
   *
   * Production calls the halves `mainContent` and `backgroundSection`, and the
   * first is the half a market can leave out: Italy's bundle banner sets no
   * title, description or overLine on the component at all, so it draws the
   * card alone.
   */
  multiviewCardTitle?: string
  multiviewCardBody?: string
  /**
   * The bold line over the list, where the offer is built on another one.
   *
   * "Everything from the DAZN Unlimited subscription, plus:" — without it the
   * four lines under it read as the whole offer rather than as what this one
   * adds. The CMS keeps it on the card as `disclaimer`.
   */
  multiviewNote?: string
  /**
   * What the offer includes, a line each against an icon.
   *
   * The icon is the market's, not ours: the CMS names one per line and the
   * name is the file. Italy's two banners use three between them — a plain
   * tick down the mobile one, a gold tick down the bundle one, and a gold
   * camera on its line about NFL games. A line with none falls back to the
   * tick this tool draws.
   *
   * Reads as `string[]` too, which is what it was and what a page saved
   * before this still holds — see `bannerLinesOf`.
   */
  multiviewFeatures?: (LandingBannerLine | string)[]
  /** The still: one of its own, and whether it is drawn with one at all. */
  multiviewImage?: string
  multiviewImageOff?: boolean

  /** "How to connect your TV Subscription" and the grid of providers. */
  providersTitle?: string
  providersBody?: string
  /** The gold half of the sentence above. */
  providersHighlight?: string
  providersNote?: string
  providersCta?: string
  providers?: LandingProvider[]

  /**
   * The heading above the wall of logos — "Watch on your favourite devices."
   *
   * The live page keeps it on the SupportedDevices component itself, over the
   * strip's own two strings, so it belongs to that block here too. It used to
   * be a component of its own called Text block, which was a block this tool
   * had and the page did not.
   */
  supportedHeading?: string
  /** The second line, which the design sets on its own. */
  supportedHeadingTwo?: string
  supportedBody?: string

  /* The footer — node 741:29473. The words under everything, and the mark
     under those. It is not one of the page's components: it does not move and
     it cannot be taken off, because a page without a footer is not a page. */
  footerLinks?: LandingLink[]
  footerMark?: string

  /** The heading over the wall of device logos — node 853:58657. */
  supportedTitle?: string
  /** The line under the wall, and the words in it that are a link. */
  supportedNote?: string
  supportedLink?: string
  /**
   * The logos the wall leaves out, by name.
   *
   * The ones left out rather than the ones kept, so a market that supports
   * everything stores nothing and a logo added to the wall later is on
   * everywhere until somebody says otherwise. Absent leaves out none.
   */
  supportedOff?: string[]
  /**
   * The wall this market actually shows, where it has been read from the live
   * page.
   *
   * The shipped wall is thirteen logos this tool holds the artwork for, and
   * every market drew those thirteen whatever it really shows. Production
   * names its own — Canada lists fourteen, and not the same fourteen — so a
   * market that has been read draws its own and the shipped wall stands in for
   * the ones that have not.
   *
   * Switched on and off by name either way, which is what `supportedOff` has
   * always held.
   */
  supportedDevices?: LandingDevice[]

  /* The features list — node 852:58100. A run of rows, each a picture, a
     tag, a heading and a line, with a way in under them. */
  featuresEyebrow?: string
  featuresTitle?: string
  featuresCta?: string
  features?: LandingFeature[]

  /* A rail — a title and a row of tiles that scrolls sideways. One component
     for all five the design draws, because what separates them is the tile.
     Nodes 1084:56990, 1084:57405, 1084:57115 and 1093:55236. */
  railTitle?: string
  railSize?: RailSize
  /**
   * Which rail, rather than what is in it.
   *
   * A row of tiles is served, the way the schedule and the spotlight are: the
   * pictures, the names and the order come from whatever serves it. What is
   * drawn against an id here stands in for that.
   */
  railId?: string
  railTiles?: LandingTile[]

  /* The other subscriptions, sold beside this one — node 1084:55909. Tall
     tiles, each with a line of its own and its own way in. */
  subRailTitle?: string
  subRailBody?: string
  subRailTiles?: LandingSubTile[]

  /* A bar pinned above everything — the live page's StickyPpvHeader, which
     Spain uses to offer help subscribing rather than to sell a fight. A line,
     a badge and a way in; no picture anywhere on it. */
  ppvLine?: string
  ppvBadge?: string
  ppvCta?: string

  /* The invitation to set a zone — the live page's ZipCodeBreather, the US
     welcome page's announcement. A picture, two lines and a button, and no
     input: the code is typed on the step after this one. */
  zoneTitle?: string
  zoneBody?: string
  zoneCta?: string
  zoneImage?: string

  /* A run of match days — the live page's LPScheduleCarousel. Served twice
     over: a rail id for the row and a service dictionary for the fixtures,
     between a start and an end. */
  carouselTitle?: string
  carouselLabel?: string
  carouselFrom?: string
  carouselTo?: string
  carouselRailId?: string
  /** Which sports-data service answers with the matches. */
  carouselService?: string

  /* The shows a subscription carries, as a rail somebody else fills — the
     live page's ShowsRail. A heading, a line under it, the rail it names, and
     a way in. Its own entries are that one button; the tiles are the rail's. */
  showsTitle?: string
  showsBody?: string
  showsCta?: string
  /** Which rail the shows come from. An address, not words. */
  showsRailId?: string

  /* A feature told with a picture beside it — the live page's
     ExperienceFeature, five of them on one NFL page, alternating which side
     the media sits. Its own entries are a video with a poster still and a
     block of words; we draw the still, which is the frame the video opens on
     anyway. */
  expOverline?: string
  expTitle?: string
  expBody?: string
  expCta?: string
  /**
   * The picture. A data URL; absent draws the empty frame.
   */
  expImage?: string
  /**
   * Which side the picture sits, as the live page's `videoAlignment` says it.
   *
   * Left and right on a wide screen. This page is drawn at a phone's width,
   * where a band beside its picture is a band nobody can read, so the two come
   * out as the picture above the words or below them — which is what left and
   * right amount to once a row has stacked.
   */
  expSide?: 'left' | 'right'

  /* The sports a market carries, as a row of round badges. The live page's
     CompetitionCarousel — drawn by Germany, Spain, France and Japan, and by no
     market that draws the teams rail. A heading, then a picture and a line
     each. */
  badgesTitle?: string
  badges?: LandingBadge[]

  /* Bundles — node 1093:55175. Nights sold together for less than the sum of
     them, side by side so the two prices can be compared. */
  bundlesTitle?: string
  bundlesBody?: string
  bundles?: LandingBundle[]

  /* A day-by-day list of matches — node 1093:51934. An eyebrow, a heading and
     a way in, then the fixtures under the day they fall on. */
  matchEyebrow?: string
  matchTitle?: string
  matchCta?: string
  matchGames?: LandingMatch[]

  /* A stack of cards — node 1093:55225. What the subscription gives you, said
     as a number, an icon or a sentence. */
  featureCards?: LandingCard[]

  /* Places, with tabs over them — node 1093:55226. The tabs choose which set
     of places is shown; here the first is the one drawn. */
  citiesEyebrow?: string
  citiesTitle?: string
  citiesBody?: string
  cityTabs?: LandingTab[]
  cityTiles?: LandingTile[]

  /* What a postcode turns out to reach — node 1084:56752. The same question
     the out-of-area block asks and the opposite answer: there, what you
     cannot watch; here, the teams you can. */
  liveTitle?: string
  liveBody?: string
  liveCta?: string

  /* A spotlight — node 1084:56109. One thing, sold with a picture the width of
     the screen, and then the fixtures that make it up. */
  /** The picture behind the top of it. Empty means the shipped one. */
  spotlightImage?: string
  /**
   * What the rail under it is serving.
   *
   * A spotlight is a picture and a pitch over a row of what it is pitching, and
   * the row is the rail its id names — the same arrangement as a standard rail,
   * under different words. Canada's soccer spotlight is served seventy-nine
   * fixtures; three of them fit.
   */
  spotlightTiles?: LandingTile[]
  /** The way into the rail — "See more" on the live page. */
  spotlightCta?: string
  spotlightLabel?: string
  spotlightTitle?: string
  spotlightBody?: string
  /**
   * Which rail the spotlight's games come from.
   *
   * One id rather than a list of games, the same as the schedule: a rail is
   * the thing that decides what is in it, and a page that listed them would
   * be a second answer going stale the moment the fixtures moved.
   */
  spotlightRailId?: string

  /* Buying the fight — node 1102:53279. A heading, the plans it can be bought
     on, a way to see the rest, and the button under them. */
  planPickTitle?: string
  planPickMore?: string
  planPickCta?: string
  planCards?: LandingPlanCard[]

  /* The image card — node 747:46379. A picture with a heading, a line and a
     button laid over the foot of it. */
  imageCtaTitle?: string
  imageCtaBody?: string
  imageCtaCta?: string
  /** A picture of its own, and whether it is drawn with one at all. */
  imageCtaImage?: string
  /**
   * What the rail under it is serving, where the banner is served one.
   *
   * The NHL pages' banner is: "Try NHL.TV for free" over a row of the clips
   * that are free to watch — Top Goals of the Stanley Cup Final and the rest.
   * The banner is the offer and the row is what the offer gets you, so the two
   * are one component on the live page and one here.
   */
  imageCtaTiles?: LandingTile[]
  /**
   * How the card is put together.
   *
   * `top` stacks it — the picture, then the words and the button under it on
   * the card's own ground, which is how every market draws this banner. `fill`
   * is the design's, node 747:46379: one picture the height of the card with
   * the words laid over its foot.
   *
   * Absent means `fill`, because that is what every page written before this
   * was a choice was drawn as, and a page must not change shape because a
   * setting appeared under it.
   */
  imageCtaLayout?: ImageCtaLayout
  imageCtaImageOff?: boolean

  /** The questions at the foot of the page. */
  faqTitle?: string
  faqs?: LandingQuestion[]

  /* ── The hero banner ──────────────────────────────────────
     The controls the hero banner tool authors a banner with, brought over
     from that project so the same picture is composed the same way here.

     The heading, the line under it and the gold button are NOT repeated:
     `title`, `body` and `cta` above are the hero's, and the Hero banner tab
     writes those same fields. Two copies of one string is how a preview and
     a panel come to disagree.

     Everything below is what the hero tool has and this page did not.
     Optional throughout, so a saved page from before they existed still
     loads and simply has none of them on. */

  /**
   * The picture behind the hero. Empty means the shipped one.
   *
   * A data URL when somebody uploaded it here, and the bundled URL of an
   * exported file when it came from a hero preset. Both are only ever used as
   * an `src`, so nothing downstream needs to know which it is.
   */
  heroImage?: string
  /** The small line above the heading, and what kind of line it is. */
  heroLabelEnabled?: boolean
  heroLabel?: string
  heroLabelVariant?: HeroLabelVariant
  /**
   * Which hero this page started from — see `heroes.ts`.
   *
   * Kept so the panel can say both which one it was and whether the page still
   * says what it says. The words are the page's own once picked, so this is a
   * provenance rather than a link: losing it would only lose the sentence
   * "from MSG+", not anything the page draws.
   */
  heroPreset?: string
  /**
   * Whether the fine print under the buttons is drawn.
   *
   * What it says is `footnote`, which is where that line has always lived and
   * where the handoff and every market's fork still read it. The hero owns
   * only the switch.
   *
   * It is named for the line rather than for the field, which is not tidiness:
   * there was a `heroHelperEnabled` before it, and what that governed was
   * whether the panel showed a box nothing on the page read. Pages saved while
   * that was so carry it as false, and reading that as "hide the footnote"
   * would take a line off every page that has ever been saved. A switch over
   * something drawn is a different switch, so it has a different name and its
   * own default.
   */
  footnoteEnabled?: boolean
  /** The price, in the four parts the hero tool writes it in. */
  heroPriceEnabled?: boolean
  heroPricePrefix?: string
  heroPriceValue?: string
  heroPriceSuffix?: string
  heroPriceOld?: string
  /** The DAZN mark over the picture. */
  /**
   * Where the hero's picture is cropped from, as percentages.
   *
   * The idea is the studio's: a picture cropped to its middle loses whatever
   * was not in the middle, and the thing worth keeping is rarely centred.
   */
  heroFocalX?: number
  heroFocalY?: number
  /**
   * How far in, as a percentage. 100 is the picture filling the frame and no
   * more, which is where a crop has slack in one direction at most; above it,
   * the picture is larger than the frame both ways and can be moved either.
   */
  heroZoom?: number
  /**
   * How hard the wash over the picture works.
   *
   * Also theirs: they read a picture for brightness and busyness and suggest a
   * treatment; this is the treatment being suggested.
   */
  heroWash?: 'light' | 'standard' | 'heavy'
  /** Whether the hero's main button takes the gold the article card uses. */
  heroCtaGold?: boolean
}

/**
 * The three kinds of eyebrow the hero tool writes.
 *
 * Standard and gold are dates; discount is free text. Carried over as the
 * same three words that project uses, so a banner authored in either place
 * means the same thing.
 */
export type HeroLabelVariant = 'standard' | 'discount' | 'gold'


/**
 * How long each hero string is allowed to be.
 *
 * These are the hero banner tool's own numbers, from its `copyLimits`, not
 * numbers chosen here: soft is the recommended maximum and hard is the point
 * past which the copy will not fit the picture. Kept together so the counter
 * beside a field and the tool that drew the design agree.
 */
export const HERO_LIMITS = {
  title: { soft: 48, hard: 58, note: 'About 48 characters, two lines at most.' },
  body: { soft: 60, hard: 80, note: 'Supports the heading. About 60 characters, two lines at most.' },
  label: { soft: 24, hard: 32, note: 'Keep a date on one line.' },
  cta: { soft: 18, hard: 26, note: 'Action led. One to three words.' },
  helper: { soft: 72, hard: 96, note: 'Optional fine print.' },
} as const

/**
 * The words on the plan screen that are not a plan's own copy.
 *
 * They were written into the components and into the derived card, which made
 * them invisible to everything that works on content: they could not be
 * translated for a market and the Coach never read them. A market cannot
 * change what they mean, only what they say, which is exactly what copy is.
 *
 * `ctaVerb` is the word before a plan's name on its button: "Get MSG+".
 */


export interface FlowContent {
  plans: PlansScreen
  landing: LandingScreen
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
  /** Above the price: "Starts at". */
  priceCaption: string
  /** The button, before the plan's name. */
  ctaVerb: string
  /** The row at the foot of a card. */
  footer: string
  /** The ribbon on the Ultimate card, when a plan does not write its own. */
  badge: string
}

export const defaultFlow: FlowContent = {
  landing: {
    // The first button and the second. The names are what they were when the
    // first drawing had them the other way round; the panel calls them by
    // position, which is what they are.
    navExplore: 'Explore',
    /* What the live page says, in every market read so far. The tool's own
       reviewer prefers "Sign in" and the platforms it cites do too, but this
       is a picture of a page rather than a page: it says what the page says. */
    navSignUp: 'Log in',
    title: 'MSG+ on DAZN',
    body: 'Stream MSG and YES only on DAZN and watch every local Knicks, Yankees, Nets, Rangers, Devils, Islanders and Sabres game live or on demand. ',
    cta: 'Sign Up',
    altCta: 'Sign in with your TV provider',
    footnote: 'Nationally broadcast games will not be available on DAZN',
    // The hero controls start off, so the page looks exactly as it does now
    // until somebody turns one on. The words are the hero tool's own
    // placeholders, which is what its fields show when empty.
    heroImage: '',
    heroLabelEnabled: false,
    heroLabel: '',
    heroLabelVariant: 'standard',
    // The one hero control that starts on: the line it draws is the page's
    // own footnote, which the page has always shown.
    footnoteEnabled: true,
    heroPriceEnabled: false,
    heroPricePrefix: 'From',
    heroPriceValue: '',
    heroPriceSuffix: '/ month',
    heroPriceOld: '',
    heroFocalX: 50,
    heroFocalY: 50,
    heroZoom: 100,
    heroWash: 'standard',
    heroCtaGold: false,

    // Read off node 708:173735 rather than rewritten, down to the full stop
    // the design puts after "devices." and the one it leaves off "Anywhere".
    zipHeading: 'Your home ZIP code unlocks your teams',
    zipNote: "Check it's right before you continue — it decides which games you get.",
    zipCta: 'Sign Up',

    scheduleHeading: 'Live and Upcoming Games Schedule',
    scheduleSubheading: 'Every game, live and on demand',
    scheduleRailId: 'schedule_2345id',

    plansTitle: "Choose the plan that's\nright for you",
    plansBody: 'The best of NY sports, streaming all in one place.',

    teamsEyebrow: 'Meet the teams',
    teamsTitle: 'Your teams, one home',
    teamsBody: 'Here are the teams available in your area',
    /* The three the design fills in. The five it leaves as the tile's own
       template are drawn after them, however many are written here. */
    teams: [
      { id: 'team-1', city: 'New York', name: 'Knicks' },
      { id: 'team-2', city: 'New York', name: 'Rangers' },
      { id: 'team-3', city: 'New York', name: 'Islanders' },
    ],

    areaTitle: "See what's live in your area",
    areaBody: 'Enter your ZIP Code to see which teams you can watch',
    areaNotice: "MSG+ and YES aren't available in 43316",
    areaNote:
      "Your area is outside the MSG+ and YES broadcast region. DAZN's national plans are available everywhere in the US, and other regional networks may cover your teams.",
    areaCta: 'See Dazn plans',

    multiviewEyebrow: 'Multiview',
    multiviewBadge: 'Ultimate only',
    multiviewTitle: 'Feel 4 times the action with Multiview',
    multiviewBody:
      'Build your perfect gameday with Multiview. Watch up to 4 live game feeds at once.',
    multiviewCta: 'Get Ultimate',
    /* Empty, because the shipped banner is the arrangement without a card:
       the words and a button, and nothing under them. A market that draws one
       fills these. */
    multiviewCardTitle: '',
    multiviewCardBody: '',
    multiviewNote: '',

    providersTitle: 'How to connect your\nTV Subscription',
    providersBody:
      'Once you sign up to DAZN, select your TV provider to get full access to MSG+',
    providersHighlight: 'at no extra cost.',
    providersNote: 'See the full list of TV providers after you log in to DAZN',
    providersCta: 'Sign in with your TV provider',
    providers: [
      { id: 'provider-1', name: 'Spectrum' },
      { id: 'provider-2', name: 'optimum.' },
      { id: 'provider-3', name: 'optimum.tv' },
      { id: 'provider-4', name: 'fios' },
      { id: 'provider-5', name: 'DIRECTV' },
      { id: 'provider-6', name: 'DIRECTV stream' },
      { id: 'provider-7', name: 'fubo' },
      { id: 'provider-8', name: 'Astound' },
      { id: 'provider-9', name: 'xfinity' },
      { id: 'provider-10', name: 'breezeline' },
      { id: 'provider-11', name: 'Mid-Hudson Fiber' },
    ],

    supportedHeading: 'Watch on your favourite devices.',
    supportedHeadingTwo: 'Anytime. Anywhere.',
    supportedBody:
      'Whether you are at home or on the go, NHL TV is available on a wide range of mobile and connected devices including Smart TVs, Chromecast, Playstation, Xbox and more.',

    footerLinks: [
      { id: 'footer-1', label: 'español' },
      { id: 'footer-2', label: 'Français' },
      { id: 'footer-3', label: 'Help' },
      { id: 'footer-4', label: 'privacy policy and cookie notice', breaks: true },
      { id: 'footer-5', label: 'Terms of use', breaks: true },
      { id: 'footer-6', label: 'Redeem' },
      { id: 'footer-7', label: 'Dazn for business' },
    ],
    footerMark: 'DAZN',

    supportedTitle: 'Our leading supported devices',
    supportedNote: 'For more information see our full list of',
    supportedLink: 'supported devices',

    featuresEyebrow: 'Experience more with DAZN',
    featuresTitle: 'All the features every fan needs',
    /* A fixture rail, which is the one of the four a page is most likely to
       want — node 1084:57405 draws it under a competition's name. */
    railTitle: 'Pirelli British Grand Prix 2026',
    railSize: 'fixture',
    railId: 'rail_2345id',
    railTiles: [
      { id: 'tile-1', title: 'The World Championship takes a turn at Silverstone', meta: 'Código F1' },
      { id: 'tile-2', title: 'Race | Pirelli British Grand Prix', meta: 'F1' },
      { id: 'tile-3', title: 'Qualifying | Pirelli British Grand Prix', meta: 'F1' },
      { id: 'tile-4', title: 'Practice 3 | Pirelli British Grand Prix', meta: 'F1' },
    ],

    ppvLine: 'Need a hand choosing? Call 0800 000 000',
    ppvBadge: 'Help',
    ppvCta: "I'm already a customer",

    zoneTitle: 'Watch the teams closest to home',
    zoneBody: 'Set up your zone in two steps and we will show you what you get.',
    zoneCta: 'Set up my zone',

    carouselTitle: 'Every game, day by day',
    carouselLabel: 'This week',
    carouselFrom: '2026-09-18',
    carouselTo: '2026-09-25',
    carouselRailId: 'carousel_2345id',
    carouselService: 'SportsDataMatchesCompetition_V1',

    showsTitle: 'Originals',
    showsBody: 'Go behind the season with the people who live it.',
    showsCta: 'Browse the shows',
    showsRailId: 'shows_2345id',

    expOverline: 'Alternate feeds',
    expTitle: 'Watch it your way',
    expBody:
      'Pick the camera, the commentary and the stats you want, and switch between them without missing a play.',
    expCta: 'See how it works',
    expSide: 'right',

    badgesTitle: 'All the sport you love',
    badges: [
      { id: 'badge-1', line: 'Every matchday, live and on demand.' },
      { id: 'badge-2', line: 'The whole season, wherever you are.' },
      { id: 'badge-3', line: 'Every race weekend from lights out.' },
      { id: 'badge-4', line: 'Fight nights as they happen.' },
    ],

    subRailTitle: 'More subscriptions you might like',
    subRailBody: 'Add additional sports from around the world to your DAZN plan',
    subRailTiles: [
      { id: 'sub-1', line: '185+ blockbuster fights a year plus every Lega Serie A match', cta: 'Subscribe' },
      { id: 'sub-2', line: 'Every game. Every team. All in one place.', cta: 'Subscribe' },
      { id: 'sub-3', line: 'Every game. Every team. All in one place.', cta: 'Subscribe' },
    ],

    bundlesTitle: 'Save with a fight bundle',
    bundlesBody: 'Pre-made combinations — grab a bundle and save.',
    bundles: [
      {
        id: 'bundle-1',
        name: 'Heavyweight Double',
        note: 'Two heavyweight showdowns, one price',
        price: '$161.98',
        was: '$179.98',
        save: 'Save 10%',
        term: '2-fight bundle',
        badge: '',
        cta: 'Get Started',
        fights: [
          { id: 'fight-1', name: 'Chisora vs. Wilder', when: '21 Feb at 6:00 PM' },
          { id: 'fight-2', name: 'Wardley vs. Dubois', when: '21 Feb at 6:00 PM' },
        ],
      },
      {
        id: 'bundle-2',
        name: 'Spring Triple Header',
        note: 'Three fights across April and May',
        price: '$229.47',
        was: '$269.97',
        save: 'Save 15%',
        term: '3-fight bundle',
        badge: 'Best value',
        cta: 'Get Started',
        fights: [
          { id: 'fight-1', name: 'Itauma vs. Franklin', when: '21 Feb at 6:00 PM' },
          { id: 'fight-2', name: 'Chisora vs. Wilder', when: '21 Feb at 6:00 PM' },
          { id: 'fight-3', name: 'Chisora vs. Wilder', when: '21 Feb at 6:00 PM' },
        ],
      },
    ],

    planPickTitle: "To watch your fight, you'll need a DAZN plan.",
    planPickMore: 'See more options to buy',
    planPickCta: 'Get Standard',
    planCards: [
      {
        id: 'plan-standard',
        name: 'DAZN Standard',
        note: "Billed monthly. Cancel with 30 days' notice.",
        price: '£30.99',
        priceUnit: '/month',
        notice: '',
        offerName: '',
        offerPrice: '',
        offerWas: '',
        offerUnit: '',
        offerSave: '',
        fights: [
          { id: 'pf-1', name: 'Ring V: Inoue vs Picasso', when: '21 Feb at 6:00 PM', price: '£89.99', was: '', unit: '/fight', save: '' },
        ],
        postersLine: '',
        posters: [],
        perks: [
          { id: 'perk-1', text: '185+ fights a year from the best promoters', info: false },
          { id: 'perk-2', text: 'Additional pay-per-views purchased separately', info: true },
        ],
        gold: false,
        chosen: true,
      },
      {
        id: 'plan-ultimate',
        name: 'DAZN Ultimate',
        note: '',
        price: '£449.99',
        priceUnit: '/year',
        notice: 'At this time, annual upfront payment is the only option available for this plan.',
        offerName: '',
        offerPrice: '',
        offerWas: '',
        offerUnit: '',
        offerSave: '',
        fights: [],
        postersLine: 'All these fights and more this year one price.',
        posters: [
          { id: 'po-1', when: 'April 4' },
          { id: 'po-2', when: 'March 28' },
          { id: 'po-3', when: 'May 2' },
          { id: 'po-4', when: 'May 23' },
        ],
        perks: [
          { id: 'perk-1', text: 'Over 12 unmissable PPVs a year', info: false },
          { id: 'perk-2', text: 'HDR and Dolby 5.1 surround sound', info: false },
          { id: 'perk-3', text: '185+ fights a year from the best promoters', info: false },
        ],
        gold: true,
        chosen: false,
      },
    ],

    liveTitle: "See what's live in your area",
    liveBody: 'Enter your zip code to see which teams you have access to.',
    liveCta: 'Sign Up',

    spotlightLabel: 'Exclusive',
    spotlightTitle: 'Serie A on DAZN until 2029',
    spotlightBody:
      'Serie A, Coppa Italia and Supercoppa Italiana — every match shown in full and available exclusively on DAZN.',
    spotlightRailId: 'serie-a-2029',

    matchEyebrow: 'Watch every game',
    matchTitle: '39 days. 104 unmissable matches.',
    matchCta: 'Get started',
    matchGames: [
      { id: 'match-1', day: 'Thursday 11 June 2026', home: 'MEX', away: 'RSA', time: '23:00', note: 'First stage • Group A • Mexico City Stadium (Mexico City)' },
      { id: 'match-2', day: 'Friday 12 June 2026', home: 'KOR', away: 'DEN/MNE', time: '06:00', note: 'First stage • Group A • Guadalajara Stadium (Guadalajara)' },
      { id: 'match-3', day: 'Friday 12 June 2026', home: 'CAN', away: 'ITA/NIR', time: '06:00', note: 'First stage • Group A • Toronto Stadium (Toronto)' },
    ],

    featureCards: [
      { id: 'card-1', stat: '', title: 'One subscription.\nEvery fight.', body: 'No more one-off payments. No more missing the big fights. DAZN Ultimate gives you unlimited access to every world-class boxing night of the year.', cta: 'Subscribe to Ultimate' },
      { id: 'card-2', stat: '12+', title: 'World-class PPVs', body: "Every year. All included.\nThat's over $720 in value.", cta: '' },
      { id: 'card-3', stat: '185+', title: 'Fight Nights', body: 'Live boxing every week.\nNever miss a punch.', cta: '' },
      { id: 'card-4', stat: '', title: 'HDR\nDolby Atmos', body: 'Cinema-quality picture and sound.\nFeel every moment.', cta: '' },
      { id: 'card-5', stat: '', title: 'Full archive access', body: 'Cinema-quality picture and sound.\nFeel every moment.', cta: '' },
    ],

    citiesEyebrow: 'Get to know the place',
    citiesTitle: 'Hosting Cities',
    citiesBody: 'From New York City to Mexico City to Toronto — see where football takes over a continent.',
    cityTabs: [
      { id: 'tab-1', label: 'Canada' },
      { id: 'tab-2', label: 'United States' },
      { id: 'tab-3', label: 'Mexico' },
    ],
    cityTiles: [
      { id: 'city-1', title: 'Shell Energy Stadium', meta: 'Boston • Capacity 85,000' },
      { id: 'city-2', title: 'Boston Stadium', meta: 'Boston • Capacity 65,000' },
      { id: 'city-3', title: 'Toronto Stadium', meta: 'Toronto • Capacity 45,000' },
      { id: 'city-4', title: 'Vancouver Stadium', meta: 'Vancouver • Capacity 54,000' },
    ],

    featuresCta: 'Get started',
    features: [
      {
        id: 'feature-1',
        tag: 'Downloads',
        title: 'Watch on the go',
        body: 'Download full replays, highlights and original shows straight to your device.',
      },
      {
        id: 'feature-2',
        tag: 'Portability',
        title: 'Portability',
        body: 'Get access to your subscription for 30 days from outside your home region.',
      },
      {
        id: 'feature-3',
        tag: 'Original content',
        title: 'With premium VOD there are no off-days on DAZN',
        body: 'Watch on-demand shows and original series.',
      },
      {
        id: 'feature-4',
        tag: 'Highlights',
        title: 'Highlights from every game',
        body: 'Catch up on all the New York sports action the way you want with short highlights and condensed games.',
      },
    ],

    imageCtaTitle: 'Watch the New York sports for free',
    imageCtaBody:
      'Sign up to on-demand content and game highlights from MSG+ and YES. No subscription required',
    imageCtaCta: 'Get started',

    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        id: 'faq-1',
        question: 'I have a Gotham Sports App subscription. Will I need to get a new subscription?',
        answer:
          'No. Your subscription moves across to DAZN — sign in with the same details and your MSG+ and YES access comes with it. You will not be charged twice.',
      },
      {
        id: 'faq-2',
        question: 'How long is the Gotham App still going to be available?',
        answer:
          'It stays open while subscriptions are moving across. You will hear from us in the app before it closes, with time to move yours over.',
      },
      {
        id: 'faq-3',
        question: 'What do I get with my subscription on DAZN?',
        answer:
          'Every MSG+ and YES game your area gets, live, plus highlights, replays and original shows on demand. Multiview comes with Ultimate.',
      },
    ],
  },

  // As drawn: the section's own nav title, and the standing strings on a card.
  // The tabs are not here; they are authored as tabs.
  plans: {
    navTitle: 'Choose your subscription',
    priceCaption: 'Starts at',
    ctaVerb: 'Get',
    footer: 'All features & content',
    badge: 'BEST EXPERIENCE',
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
    navTitle: 'Choose how you pay',
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
    navTitle: 'Your subscription is active',
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
