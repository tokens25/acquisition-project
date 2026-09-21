import type { LandingScreen, NavFirstStyle } from './flow'
import { defaultFlow } from './flow'

/**
 * The landing page as a list of components rather than a fixed run of
 * sections.
 *
 * The page was ten blocks in the order they were written, and a market could
 * change their words but not which of them it showed or in what order. This
 * makes each block a thing on a list: it can move, it can be switched off, and
 * it can be copied so the page carries two of it.
 *
 * The list is content like everything else, so it forks per market — a market
 * that hides the schedule hides it for itself and for nobody else.
 *
 * A page that has never been arranged has no list at all, which is what keeps
 * every page published before today rendering exactly as it did: the shipped
 * order below stands in, every block on, one of each.
 */

export type SectionType =
  | 'zip'
  | 'schedule'
  | 'plans'
  | 'teams'
  | 'area'
  | 'multiview'
  | 'article'
  | 'providers'
  | 'faq'
  | 'imageCta'
  | 'features'
  | 'supported'
  | 'rail'
  | 'subRail'
  | 'badges'
  | 'experience'
  | 'shows'
  | 'ppv'
  | 'zone'
  | 'schedCarousel'
  | 'bundles'
  | 'matchList'
  | 'cardStack'
  | 'cities'
  | 'live'
  | 'spotlight'
  | 'fightPlan'

export interface PageSection {
  /**
   * Which instance this is.
   *
   * The first of a type is named after the type, and that is not a
   * convenience: it is how a page written before this existed is recognised,
   * and how that instance keeps writing the fields it always wrote.
   */
  id: string
  type: SectionType
  /** Drawn, or kept in the list and not drawn. */
  on: boolean
}

/**
 * Every kind of block the page can draw.
 *
 * Longer than the shipped page: a kind can exist for the palette to offer
 * without the page having one — node 747:46379 is drawn nowhere in
 * 708:173735, and is added to a page by whoever wants it.
 */
export const SECTION_TYPES: SectionType[] = [
  'zip',
  'schedule',
  'plans',
  'teams',
  'area',
  'multiview',
  'article',
  'providers',
  'faq',
  'imageCta',
  'features',
  'supported',
  'rail',
  'subRail',
  'badges',
  'experience',
  'shows',
  'ppv',
  'zone',
  'schedCarousel',
  'bundles',
  'matchList',
  'cardStack',
  'cities',
  'live',
  'spotlight',
  'fightPlan',
]

/**
 * Which component owns which field of the landing content.
 *
 * The panel groups by it, the handoff groups by it, and anything else that
 * needs to say where a string lives asks here rather than guessing from the
 * name. Fields the hero owns are not listed: the hero is not a component of
 * the page, it is the page's own top.
 */
export const FIELD_COMPONENT: Record<string, SectionType> = {
  zipHeading: 'zip',
  zipNote: 'zip',
  zipCta: 'zip',
  scheduleHeading: 'schedule',
  scheduleSubheading: 'schedule',
  scheduleRailId: 'schedule',
  plansTitle: 'plans',
  plansBody: 'plans',
  teamsEyebrow: 'teams',
  teamsTitle: 'teams',
  teamsBody: 'teams',
  teams: 'teams',
  areaTitle: 'area',
  areaBody: 'area',
  areaNotice: 'area',
  areaNote: 'area',
  areaCta: 'area',
  articleEyebrow: 'article',
  articleBadge: 'article',
  articleTitle: 'article',
  articleBody: 'article',
  articleCta: 'article',
  articleLines: 'article',
  multiviewEyebrow: 'multiview',
  multiviewBadge: 'multiview',
  multiviewTitle: 'multiview',
  multiviewBody: 'multiview',
  multiviewCta: 'multiview',
  multiviewCardTitle: 'multiview',
  multiviewCardBody: 'multiview',
  multiviewFeatures: 'multiview',
  multiviewNote: 'multiview',
  multiviewPrice: 'multiview',
  multiviewPriceNote: 'multiview',
  providersTitle: 'providers',
  providersBody: 'providers',
  providersHighlight: 'providers',
  providersNote: 'providers',
  providersCta: 'providers',
  providers: 'providers',
  supportedHeading: 'supported',
  supportedHeadingTwo: 'supported',
  supportedBody: 'supported',
  supportedTitle: 'supported',
  supportedNote: 'supported',
  supportedLink: 'supported',
  supportedOff: 'supported',
  featuresEyebrow: 'features',
  featuresTitle: 'features',
  featuresCta: 'features',
  features: 'features',
  imageCtaTitle: 'imageCta',
  imageCtaBody: 'imageCta',
  imageCtaCta: 'imageCta',
  imageCtaLines: 'imageCta',
  faqTitle: 'faq',
  faqs: 'faq',
  railTitle: 'rail',
  railSize: 'rail',
  railId: 'rail',
  railTiles: 'rail',
  subRailTitle: 'subRail',
  subRailBody: 'subRail',
  subRailTiles: 'subRail',
  badgesTitle: 'badges',
  badges: 'badges',
  expOverline: 'experience',
  expTitle: 'experience',
  expBody: 'experience',
  expCta: 'experience',
  expImage: 'experience',
  expSide: 'experience',
  showsTitle: 'shows',
  showsBody: 'shows',
  showsCta: 'shows',
  showsRailId: 'shows',
  ppvLine: 'ppv',
  ppvBadge: 'ppv',
  ppvCta: 'ppv',
  zoneTitle: 'zone',
  zoneBody: 'zone',
  zoneCta: 'zone',
  zoneImage: 'zone',
  carouselTitle: 'schedCarousel',
  carouselLabel: 'schedCarousel',
  carouselFrom: 'schedCarousel',
  carouselTo: 'schedCarousel',
  carouselRailId: 'schedCarousel',
  carouselService: 'schedCarousel',
  bundlesTitle: 'bundles',
  bundlesBody: 'bundles',
  bundles: 'bundles',
  matchEyebrow: 'matchList',
  matchTitle: 'matchList',
  matchCta: 'matchList',
  matchGames: 'matchList',
  featureCards: 'cardStack',
  citiesEyebrow: 'cities',
  citiesTitle: 'cities',
  citiesBody: 'cities',
  cityTabs: 'cities',
  cityTiles: 'cities',
  liveTitle: 'live',
  liveBody: 'live',
  liveCta: 'live',
  spotlightImage: 'spotlight',
  spotlightCta: 'spotlight',
  spotlightLabel: 'spotlight',
  spotlightTitle: 'spotlight',
  spotlightBody: 'spotlight',
  spotlightRailId: 'spotlight',
  planPickTitle: 'fightPlan',
  planPickMore: 'fightPlan',
  planPickCta: 'fightPlan',
  planCards: 'fightPlan',
}

/**
 * The blocks a page can only carry one of.
 *
 * Not a style rule. Each of these is the page's answer to a question it only
 * asks once — what is on, what it costs, what happens if you are outside the
 * area — and a page that answers one of them twice is a page that contradicts
 * itself. Everything else is a block of words or pictures, and a page can have
 * as many of those as it wants.
 */
export const ONCE_ONLY: SectionType[] = ['schedule', 'plans', 'area']

export const isOnceOnly = (type: SectionType) => ONCE_ONLY.includes(type)

/**
 * What each block is made of, in one line.
 *
 * The panel lists the page as a run of names, and a name alone does not say
 * whether "Text block" is a heading or four paragraphs. This is the fields
 * `SectionFields` actually renders for that type, said as a reader would say
 * them — so the list can be read without opening anything.
 */
export const SECTION_CONTENTS: Record<SectionType, string> = {
  zip: 'Heading, note, button',
  schedule: 'Heading, a line under it, and the rail',
  plans: 'Heading and a line under it',
  teams: 'Eyebrow, heading, body, and the teams',
  area: 'Heading, a line under it, notice, button',
  multiview: 'Words above a card, or the card alone',
  article: 'Still, eyebrow, heading, button',
  providers: 'Heading, a line under it, a note, button',
  faq: 'Heading and five questions',
  imageCta: 'Picture, heading, body, button',
  features: 'Eyebrow, heading, rows, button',
  supported: 'Two headings, a body, the logos, note, link',
  rail: 'Title, what kind of tiles, and the rail',
  subRail: 'Heading, a line under it, and the subscriptions',
  badges: 'Heading and the badges',
  experience: 'A picture, a heading, a line under it, and a button',
  shows: 'Heading, a line under it, the rail, and a button',
  ppv: 'A line, a badge and a button',
  zone: 'A picture, a heading, a line under it, and a button',
  schedCarousel: 'Heading, label, the days, and where they come from',
  bundles: 'Heading, a line under it, and the bundles',
  matchList: 'Eyebrow, heading, button, and the matches by day',
  cardStack: 'A stack of cards',
  cities: 'Eyebrow, heading, a line, tabs, and the places',
  live: 'Heading, a line under it, button',
  spotlight: 'Picture, label, heading, a line, and the rail',
  fightPlan: 'Heading, the plans, and the button',
}

/**
 * The shape each block draws, as three bars.
 *
 * Not an illustration of the component — a reading of its proportions: a wide
 * bar is a full-width thing, a short one is a heading or a button. Enough for
 * the eye to find the block it is looking for before it has read the name.
 * Percentages of the tile's own width.
 */
export const SECTION_BARS: Record<SectionType, [number, number, number]> = {
  zip: [80, 55, 100],
  schedule: [70, 100, 100],
  plans: [60, 45, 100],
  teams: [40, 85, 100],
  area: [75, 100, 60],
  multiview: [100, 60, 45],
  article: [100, 60, 45],
  providers: [65, 100, 100],
  faq: [55, 100, 100],
  imageCta: [100, 55, 45],
  features: [45, 100, 100],
  supported: [70, 100, 45],
  rail: [50, 100, 100],
  subRail: [70, 100, 100],
  badges: [60, 100, 100],
  experience: [100, 55, 80],
  shows: [70, 100, 100],
  ppv: [100, 40, 0],
  zone: [100, 60, 70],
  schedCarousel: [60, 100, 100],
  bundles: [60, 100, 100],
  matchList: [45, 70, 100],
  cardStack: [100, 60, 100],
  cities: [40, 85, 100],
  live: [80, 100, 60],
  spotlight: [100, 70, 100],
  fightPlan: [85, 100, 100],
}

/** The page as it ships, in the order node 708:173735 has it. */
export const SHIPPED_ORDER: SectionType[] = [
  'zip',
  'schedule',
  'plans',
  'teams',
  'area',
  'article',
  'providers',
  'faq',
]

/**
 * What each block is called.
 *
 * The production `componentType` where the live page has one — see
 * LANDING-API.md, read off eight markets' welcome pages. A name somebody has
 * to translate on the way to implementing it is a name that costs something
 * every time, and this is the vocabulary the handoff lands in: these strings
 * group the strings a developer is given.
 *
 * Fifteen carry one. Six do not — Outside the area, Text block, Bundles,
 * Match list, Feature cards and Choose the plan — and they keep the name the
 * design gives them, which is the only name they have.
 *
 * Read the welcome pages alone and that list looked far longer, because this
 * palette was never built against a welcome page. It was built against the
 * RSN one: `ZipCodeCheck`, `TeamsRail` and `SubscriptionProviders` are drawn
 * on `msgplusyes` and on `zipcode`, and on no welcome page in any market. A
 * block with no counterpart on the page you happen to be reading is not a
 * block with no counterpart.
 *
 * Three names were held back until somebody read what the component actually
 * carried, rather than matching it on its type and its place in the order —
 * which was worth doing, since two of those three guesses were wrong.
 * `ComingUpRail` was Games schedule and took the name. `IntroductionBanner`
 * was never Text block, and went to Article CTA, which is the right family and
 * short of it in three ways: not full-bleed, does not rotate, and nothing here
 * binds a price to an entitlement. `CompetitionCarousel` was never the
 * places block, and for a while it was this one — until `TeamsRail` turned up
 * on the RSN page with `preTitle` over `title`, a picture and zone tags, which
 * is this block field for field and is the name it carries now. The places
 * block found its own name later: `ShowcaseSquareRail`, whose overline,
 * heading and line under it are word for word ours.
 *
 * Which is the reason for holding them: two of those three guesses were wrong,
 * and a guess written into the palette is a guess everybody downstream
 * inherits.
 */
export const SECTION_LABEL: Record<SectionType, string> = {
  zip: 'ZipCodeAutoFill',
  schedule: 'ComingUpRail',
  plans: 'ContentTiers',
  teams: 'TeamsRail',
  area: 'Outside the area',
  /* Was Article CTA, named for what it is rather than what it happens to be
     about — a still, a line about it, and a way in, node 708:174095. It takes
     the live page's name for the same band, and is short of it in three ways
     worth remembering: ours is not full-bleed, it does not rotate, and nothing
     here binds a price to an entitlement and fills it in at render. */
  multiview: 'IntroductionBanner',
  /* The design's own banner, node 708:174095, kept as a block of its own when
     the one above it was rebuilt to production's shape. Production has no
     component by this name — it is the design's, and the design calls it a
     feature. Short of the live banner in three ways worth remembering: ours is
     not full-bleed, it does not rotate, and nothing here binds a price to an
     entitlement and fills it in at render. */
  article: 'Feature',
  providers: 'SubscriptionProviders',
  /* The type keeps its name because saved pages are arranged by it; what it
     is called is "Text block", which is what the design calls the component
     and what it now is — words, and nothing device-shaped about it. */
  faq: 'FAQs',
  imageCta: 'FreemiumBanner',
  features: 'SectionFeatures',
  supported: 'SupportedDevices',
  rail: 'StandardRail',
  subRail: 'SubscriptionsRail',
  badges: 'CompetitionCarousel',
  experience: 'ExperienceFeature',
  shows: 'ShowsRail',
  ppv: 'StickyPpvHeader',
  zone: 'ZipCodeBreather',
  schedCarousel: 'LPScheduleCarousel',
  bundles: 'Bundles',
  matchList: 'Match list',
  cardStack: 'Feature cards',
  cities: 'ShowcaseSquareRail',
  live: 'ZipCodeCheck',
  spotlight: 'SpotlightRail',
  fightPlan: 'Choose the plan',
}

/** The list this page is arranged into, or the one it has always had. */
export function sectionsOf(content: LandingScreen): PageSection[] {
  const saved = content.sections
  if (saved && saved.length > 0) {
    /*
     * A page arranged before a kind was retired still has it on the list.
     * Nothing draws it and nothing can name it, so it goes here rather than
     * leaving a nameless card in the panel and a hole in the page.
     */
    return saved.filter((s) => SECTION_TYPES.includes(s.type))
  }
  return SHIPPED_ORDER.map((type) => ({ id: type, type, on: true }))
}

/**
 * What a page starts as, for a market and a product.
 *
 * Read off the live pages rather than decided here — the order is theirs, and
 * so are the repeats: an NFL page really is five feature bands in a row. The
 * hero and the footer are left out because neither is a section, and a block a
 * market draws twice that can only exist once is taken once.
 *
 * What each market DRAWS, not what it lists. A block served by a rail that has
 * run out draws nothing, so it is not here — which is why Britain has two
 * spotlight rails where its page names four. The same rule the live reading
 * uses, so the two agree whichever answers.
 *
 * Which makes this a photograph of a moving thing. A rail refills and a market
 * grows a block back; this was taken on 2026-09-20 and is only consulted when
 * the live page cannot be reached.
 *
 * A combination nobody has read falls back to `SHIPPED_ORDER`, which is the
 * page the design shipped and a fair answer for a market we know nothing
 * about.
 *
 * A starting point, not a mirror. Once somebody has arranged the page it is
 * theirs, and changing market leaves it alone — see `isUntouched`.
 */
export const PAGE_DEFAULTS: Record<string, SectionType[]> = {
  'GB|dazn': ['subRail', 'subRail', 'spotlight', 'spotlight', 'imageCta', 'supported', 'faq'],
  'US|dazn': ['subRail', 'subRail', 'imageCta', 'zone', 'supported', 'faq'],
  'CA|dazn': ['subRail', 'plans', 'features', 'subRail', 'spotlight', 'imageCta', 'supported', 'faq'],
  'JP|dazn': ['plans', 'multiview', 'features', 'imageCta', 'badges', 'subRail', 'faq'],
  'DE|dazn': ['plans', 'rail', 'multiview', 'badges', 'multiview', 'imageCta', 'subRail', 'supported', 'faq'],
  'ES|dazn': ['ppv', 'plans', 'features', 'imageCta', 'badges', 'faq'],
  'IT|dazn': ['multiview', 'plans', 'multiview', 'supported', 'faq'],
  'FR|dazn': ['plans', 'multiview', 'imageCta', 'badges', 'subRail', 'faq'],
  'US|msg': ['zip', 'plans', 'live', 'teams', 'providers', 'features', 'imageCta', 'supported', 'faq'],
  'US|nfl': ['features', 'supported', 'faq'],
  'GB|nfl': ['plans', 'rail', 'experience', 'experience', 'experience', 'experience', 'experience', 'features', 'supported', 'spotlight', 'shows', 'faq'],
  'DE|nfl': ['plans', 'rail', 'experience', 'experience', 'experience', 'experience', 'experience', 'features', 'supported', 'spotlight', 'shows', 'faq'],
  'GB|nhl': ['plans', 'experience', 'features', 'imageCta', 'supported', 'supported', 'faq'],
  'DE|nhl': ['plans', 'experience', 'features', 'imageCta', 'supported', 'supported', 'faq'],
}

/**
 * The top bar's first button, market by market, as production draws it.
 *
 * A table rather than a reading, because this one button is the only thing on
 * the page that the content service does not answer for. The bar is DAZN's own
 * shell rather than a component of the landing config — `exploreButton`, drawn
 * by the app around whatever the CMS hands it — so there is nothing in the
 * config to read, and the only way to know what a market draws is to look at
 * the market.
 *
 * Which is the catch: the bar follows the connection, not the locale. Asking
 * for `/en-GB/welcome` from Milan answers `/en-IT/welcome`, so a row here can
 * only be written from inside the market it is about. Hence the dates — each
 * row says when somebody was there.
 *
 * Keyed by market alone. The bar is the site's and not the page's: NFL and NHL
 * draw the same one DAZN does.
 *
 * A market with no row falls through to `neutral` and whatever the first
 * button already says, which is the bar as this tool shipped. That is a gap
 * and not an answer — a row is only here once somebody has been there.
 */
export const NAV_DEFAULTS: Record<string, { first: string; style: NavFirstStyle; second: string }> = {
  // Read on 2026-09-20 from Milan: gold, `exploreButton-module__subscribeStyle`,
  // over `--new-gold`. Nothing to browse here before paying, so the first
  // button asks for the money and the second is the way back in.
  IT: { first: 'Subscribe', style: 'subscribe', second: 'Log in' },
  // Reported 2026-09-20 by somebody in the market, not read from here — the
  // bar follows the connection, so Germany cannot be looked at from Milan.
  // One button: an empty first draws none at all, which is the third thing
  // this slot does besides Explore and Subscribe.
  DE: { first: '', style: 'neutral', second: 'Log in' },
}

/**
 * What the top bar draws in a market, or the shipped bar where nobody has been
 * there to see.
 *
 * Answers for all three fields either way, never `{}`. These live on one page
 * shared by every market, and a patch that says nothing leaves the last
 * market's bar standing: pick Italy, then Britain, and Britain drew Italy's
 * gold Subscribe. Saying "the shipped one" out loud is what stops that.
 */
export const navFromProduction = (market?: string | null): Partial<LandingScreen> => {
  const row = NAV_DEFAULTS[(market ?? '').toUpperCase()]
  const base = defaultFlow.landing
  if (!row) return { navExplore: base.navExplore, navFirstStyle: 'neutral', navSignUp: base.navSignUp }
  return { navExplore: row.first, navFirstStyle: row.style, navSignUp: row.second }
}

/**
 * Production names that are on the live page and cannot be cards on ours.
 *
 * Not blocks we lack. The hero is a tab of its own because it is authored in
 * the hero studio, and the footer sits under the palette rather than in the
 * run — so a page that draws every component a market has still has two fewer
 * rows than the market lists, and always will.
 */
const NOT_A_CARD = new Set(['Banners', 'BoxedHeroBanners', 'Footer'])

/** A later renderer of a component is that component. */
const SAME_BLOCK: Record<string, string> = { StandardRailV2: 'StandardRail' }

const TYPE_BY_NAME: Record<string, SectionType> = Object.fromEntries(
  (Object.entries(SECTION_LABEL) as [SectionType, string][]).map(([type, name]) => [name, type]),
)

/**
 * Whether a production name is a thing the page holds as a card at all.
 *
 * False for the hero and the footer, which is not the same as not having
 * them: they are elsewhere in the tool rather than missing from it. Counting
 * them would put a difference in every comparison that no amount of building
 * could ever close, so they are left out of the counting entirely.
 */
export const isCard = (name: string): boolean => !NOT_A_CARD.has(SAME_BLOCK[name] ?? name)

/**
 * The card a production name is, or null where it is not one of ours.
 *
 * The rename is what makes this a lookup rather than a table somebody keeps in
 * step: production's name for a block is our name for it, so the only entries
 * needed are the two kinds of exception above. A name we do not know answers
 * null rather than a guess — a block we have not built is not a block the page
 * can hold.
 */
export const cardFor = (name: string): SectionType | null =>
  isCard(name) ? (TYPE_BY_NAME[SAME_BLOCK[name] ?? name] ?? null) : null

/** A live page's components as our types, in the order the market draws them. */
export function typesFromLive(names: string[]): SectionType[] {
  const out: SectionType[] = []
  for (const name of names) {
    const type = cardFor(name)
    if (type) out.push(type)
  }
  return out
}

const pageKey = (market?: string | null, product?: string | null) =>
  `${(market ?? '').toUpperCase()}|${(product ?? '').toLowerCase()}`

/**
 * What each market was last seen to draw.
 *
 * Kept here, beside the table it stands in front of, rather than in a store:
 * every reader of a default wants the same answer, and a default that changed
 * depending on which component asked would be worse than a stale one. It is
 * filled in as the panel reads a market, so a market nobody has looked at yet
 * falls back to the table below, which is the same list as of the day it was
 * written.
 */
const seenLive = new Map<string, LiveBlock[]>()

/** One block of a market's live page, as much of it as a default can use. */
export interface LiveBlock {
  /** The production `componentType`. */
  type: string
  title: string | null
  description: string | null
  overLine?: string | null
  features?: { line: string; icon: string | null }[]
  railId: string | null
  rail?: {
    title: string | null
    count: number
    tiles: {
      title: string
      meta: string
      live: boolean
      start: string | null
      image: string | null
      locked: boolean
    }[]
  } | null
  entries?: LiveEntry[]
}

/* Every word of them, entries included: a rail whose heading is unchanged and
   whose tiles are not is still a page that has moved. */
const sameBlocks = (a: LiveBlock[], b: LiveBlock[]) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Whether the live page draws this block, as against listing it.
 *
 * A component served by a rail draws nothing when that rail is empty — a
 * tournament that is over, a fight night with nothing booked — so a market
 * can be configured with ten blocks and show eight. Canada is: three
 * spotlight rails, one of which is serving.
 *
 * The page a market opens on is what it draws. What it merely lists is in the
 * fold, where the empty ones are named and the reason given.
 */
export const drawsHere = (block: { railId?: string | null; rail?: { count: number } | null }) =>
  !block.rail || block.rail.count > 0

/** Remembers a market's live page. True when this is news. */
export function rememberLive(
  market: string | null | undefined,
  product: string | null | undefined,
  blocks: LiveBlock[],
): boolean {
  const key = pageKey(market, product)
  const cards = blocks.filter((b) => cardFor(b.type) && drawsHere(b))
  const had = seenLive.get(key)
  if (had && sameBlocks(had, cards)) return false
  seenLive.set(key, cards)
  return true
}

/** One thing inside a block — a tile, a feature, a question. */
export interface LiveEntry {
  type: string
  title: string | null
  preTitle: string | null
  badge: string | null
  body: string | null
  cta: string | null
  /** The bold line a card sets over its list — see `multiviewNote`. */
  disclaimer?: string | null
  key?: string | null
  value?: string | null
  image?: string | null
  mark?: string | null
  ctaIcon?: string | null
}

/**
 * The lists a block draws, where the live page fills them itself.
 *
 * Three of them do. A rail's tiles, a features section's rows and an FAQ's
 * questions are entries in the CMS beside the block, so they come across with
 * its heading. The rest of the lists on this page are not there to be had: a
 * spotlight's items are served from the rail its id names, and a supported
 * devices list is a table of logos rather than words.
 *
 * Which field carries a tile's line depends on the rail. Canada's events rail
 * puts it in the title — "Cruz vs. Bravo" — and its products rail in the
 * description — "Every race from the WRC and ERC season". Both are the line
 * under the picture, so either answers.
 *
 * An FAQ arrives unanswered. Production's questions link out to a help article
 * rather than carrying an answer, and pairing them with the shipped answers by
 * position would put "your subscription moves across to DAZN" under "What's
 * included in each plan?" — a plausible-looking pair that is simply wrong. An
 * empty answer is visibly somebody's to write; a mismatched one is a lie that
 * reads fine.
 */
function listFromLive(type: SectionType, kids: LiveEntry[], block?: LiveBlock): unknown {
  const items = kids.filter((k) => k.type === 'LPContentItem')
  if (type === 'rail' || type === 'spotlight' || type === 'imageCta') {
    // A standard rail authors nothing inside it: what it shows is whatever the
    // rail its id names is serving, which is why its tiles come from there and
    // not from its entries.
    const serving = block?.rail?.tiles ?? []
    const rows = serving.map((t, i) => ({
      id: `tile-${i + 1}`,
      title: plain(t.title),
      meta: plain(t.meta),
      ...(t.live ? { live: true } : {}),
      ...(t.start ? { start: t.start } : {}),
      ...(t.image ? { image: t.image } : {}),
      ...(t.locked ? { locked: true } : {}),
    }))
    return rows
  }
  if (type === 'subRail') {
    const tiles = items.map((k, i) => ({
      id: `sub-${i + 1}`,
      line: plain(k.title ?? k.body ?? ''),
      cta: plain(k.cta ?? ''),
      badge: plain(k.badge ?? ''),
      ...(k.image ? { background: k.image } : {}),
      // Its own lockup where the tile has one. Where it has neither that nor
      // the mark, the DAZN one is left off: it is there to stand in for
      // artwork, not to sit on a photograph that names itself.
      ...(k.mark ? { logoImage: k.mark } : { logo: false }),
    }))
    return tiles
  }
  if (type === 'features') {
    // The tag is the row's button, not its badge. The live page draws that
    // label as the pill over the heading — Follow, FanZone, Downloads — and
    // uses it as the tab for the row besides; the badge is a different thing,
    // an entitlement note reading "Ultimate only", which one row in four has.
    //
    // And the picture is the row's own rather than one the tag brings. Ours
    // are looked up from a bundled map by tag, which answers for the tags
    // this tool shipped and nothing for a market's.
    // A row with no picture is a row the live page does not draw. Canada is
    // configured with four and shows three, and the one it leaves out is the
    // only row in any market without a background — the same arithmetic as a
    // spotlight whose rail has run out.
    const rows = items
      .filter((k) => k.image)
      .map((k, i) => ({
        id: `feature-${i + 1}`,
        tag: plain(k.cta ?? k.preTitle ?? k.badge ?? ''),
        title: plain(k.title ?? ''),
        body: plain(k.body ?? ''),
        image: k.image as string,
        ...(k.ctaIcon ? { icon: k.ctaIcon } : {}),
      }))
    return rows
  }
  if (type === 'supported') {
    // Every logo on the wall, named and with its own artwork. A market names
    // its own — Canada fourteen, and not the same fourteen as Germany — so the
    // shipped thirteen are a stand-in rather than the list.
    // A device is a logo and a name and nothing else, so its picture is the
    // lockup rather than a background — the one field a tile keeps separately.
    const wall = items.filter((k) => k.title && (k.mark ?? k.image))
    const rows = wall.map((k, i) => ({
      id: `device-${i + 1}`,
      name: plain(k.title ?? ''),
      logo: k.mark ?? k.image ?? undefined,
    }))
    return rows
  }
  if (type === 'badges') {
    // A competition badge is a circular logo and, on the live page, nothing
    // else: Germany draws eleven discs at 42 and not a word under any of them.
    // The description on each is long — "Alle Spiele der Ligue 1, wahlweise mit
    // Originalkommentar" — and is not a label; it is what the logo is for,
    // written down, and the page does not show it. So the line takes a title
    // where an entry has one, which few do, and is otherwise empty.
    const rounds = kids.filter((k) => k.type === 'CommonSpoloCircularLogo')
    const rows = rounds.map((k, i) => ({
      id: `badge-${i + 1}`,
      line: plain(k.title ?? ''),
      ...(k.image ? { image: k.image } : {}),
    }))
    return rows
  }
  if (type === 'teams') {
    // The city over the club, which is how the rail sets a team: "New York"
    // small, "Knicks" under it.
    const rows = items.map((k, i) => ({
      id: `team-${i + 1}`,
      city: plain(k.preTitle ?? ''),
      name: plain(k.title ?? ''),
      ...(k.image ? { logo: k.image } : {}),
    }))
    return rows
  }
  if (type === 'providers') {
    const rows = items.map((k, i) => ({ id: `provider-${i + 1}`, name: plain(k.title ?? '') }))
    return rows
  }
  if (type === 'faq') {
    const asked = kids.filter((k) => k.type === 'LPFaqArticle' && k.title)
    const rows = asked.map((k, i) => ({
      id: `faq-${i + 1}`,
      question: plain(k.title ?? ''),
      answer: '',
    }))
    return rows
  }
  return []
}

/**
 * The supported-devices strip, whose strings are not where the others are.
 *
 * Every other block keeps its heading on the component. This one keeps two
 * loose strings beside the logos — `supportedDeviceHeader` over them and
 * `supportedDeviceFooter` under — because the component's own title and
 * description are a different thing: the two-line heading and the paragraph
 * that stand above the whole section. This tool draws the strip and has no
 * field for that heading, so taking the component's title for the strip's put
 * "Watch on your favourite devices." where "Our leading supported devices"
 * belongs.
 *
 * The footer is one string with a link inside it, and this tool holds the
 * words and the link apart, so it is split where the anchor opens.
 */
function supportedFromLive(kids: LiveEntry[]): Record<string, string> {
  const at = (key: string) => kids.find((k) => k.key === key)?.value ?? null
  const footer = at('supportedDeviceFooter')
  const split = footer ? /^([\s\S]*?)<a[^>]*>([\s\S]*?)<\/a>/.exec(footer) : null
  return {
    supportedTitle: plain(at('supportedDeviceHeader') ?? ''),
    supportedNote: split ? plain(split[1]) : footer ? plain(footer) : '',
    supportedLink: split ? plain(split[2]) : '',
  }
}

/**
 * The heading over the strip, which the component keeps as one string.
 *
 * Production writes it as two lines with a blank one between them, and marks
 * the second for emphasis — "Watch on your favourite devices.\n\n##Anytime.
 * Anywhere.##" — because that is one field in their CMS. The design sets the
 * two lines differently, so this tool has always held them apart, and the
 * break is where they part.
 */
function headingFromLive(title: string | null, body: string | null): Record<string, string> {
  const [first, ...rest] = (title ?? '').split(/\n+/)
  return {
    supportedHeading: plain(first ?? ''),
    supportedHeadingTwo: rest.length ? plain(rest.join(' ')) : '',
    supportedBody: body ? plain(body) : '',
  }
}

/**
 * Where each block's words are, and which of ours they fill.
 *
 * One table for all of it, because the shapes repeat and the exceptions are
 * the point. Read off every market's live page rather than guessed: the census
 * in this session covered fourteen market-and-product pages and twenty-two
 * component types, and what it showed is that a component is not reliably the
 * thing that carries its own words.
 *
 * `from` names the child content type that does, where it is not the
 * component. Five blocks are like this — a freemium banner, an introduction
 * banner, an experience feature, a zip breather and a zip check all keep their
 * heading and body on the `LPContentItem` inside them, and the tier group
 * keeps the plan picker's heading. Read off the component, those five come
 * back empty, which is what they were doing.
 *
 * `eyebrow` comes from the component's `overLine` or the child's
 * `preTitle` — two names for the small line above a heading, and a block
 * uses whichever its shape gives it.
 *
 * `cta` is the component's own button, which is an `LPButton` among its
 * entries, and is not the button on a tile: a rail of tiles has one of each.
 */
interface LiveSpec {
  /** The child content type carrying the words, where the component does not. */
  from?: string
  title?: string
  body?: string
  eyebrow?: string
  cta?: string
  rail?: string
  image?: string
  /** The field holding this block's repeated part. */
  list?: string
}

/** Nothing, in the shape the field holds. */
const blankFor = (field: string): unknown =>
  LIST_FIELDS.has(field) ? [] : field === 'imageCtaLayout' ? undefined : ''

/** Which of them hold a list rather than a string. */
const LIST_FIELDS = new Set<string>()

/**
 * Every field on the landing screen that a live page can answer for.
 *
 * Read off the table rather than listed beside it, so a block gaining a field
 * gains it here too and cannot be left carrying the last market's words.
 */
function liveFieldNames(): string[] {
  const out = new Set<string>()
  for (const spec of Object.values(LIVE_SPEC)) {
    for (const field of [spec.title, spec.body, spec.eyebrow, spec.cta, spec.rail, spec.image])
      if (field) out.add(field)
    if (spec.list) {
      out.add(spec.list)
      LIST_FIELDS.add(spec.list)
    }
  }
  // The devices strip's own strings and the heading over it, which are read by
  // their own two functions rather than through the table.
  for (const field of ['supportedTitle', 'supportedNote', 'supportedLink', 'supportedHeading', 'supportedHeadingTwo', 'supportedBody'])
    out.add(field)
  // Set per market rather than through the table, and cleared with the rest so
  // a market that draws no banner does not keep the last one's arrangement.
  out.add('imageCtaLayout')
  // The introduction banner's own, all of them read by hand rather than
  // through the table — the two halves of it want opposite answers when one
  // is empty, which the table has no way to say.
  for (const field of [
    'multiviewBadge',
    'multiviewEyebrow',
    'multiviewTitle',
    'multiviewBody',
    'multiviewCardTitle',
    'multiviewCardBody',
    'multiviewCta',
    'multiviewNote',
    'multiviewPrice',
    'multiviewPriceNote',
    'multiviewFeatures',
    // The freemium banner's, which is the same list on the same card.
    'imageCtaLines',
  ])
    out.add(field)
  LIST_FIELDS.add('imageCtaLines')
  // The same again on the sticky bar. Spain's carries a line and a button and
  // no badge, so "HELP" was this tool's own over a Spanish phone number.
  out.add('ppvBadge')
  LIST_FIELDS.add('multiviewFeatures')
  return [...out]
}

const LIVE_SPEC: Partial<Record<SectionType, LiveSpec>> = {
  subRail: { title: 'subRailTitle', body: 'subRailBody', list: 'subRailTiles' },
  spotlight: {
    title: 'spotlightTitle',
    body: 'spotlightBody',
    rail: 'spotlightRailId',
    // No market's spotlight carries an overLine, so this empties the shipped
    // "Exclusive" everywhere — which is right: the live page draws no label
    // over any of them.
    eyebrow: 'spotlightLabel',
    image: 'spotlightImage',
    cta: 'spotlightCta',
    list: 'spotlightTiles',
  },
  plans: { from: 'CommonContentTierGroup', title: 'plansTitle', body: 'plansBody' },
  features: { title: 'featuresTitle', eyebrow: 'featuresEyebrow', cta: 'featuresCta', list: 'features' },
  faq: { title: 'faqTitle', list: 'faqs' },
  // Its heading and its two loose strings are read by their own functions —
  // the strip keeps them in a place no other block does — and the wall itself
  // is a list like any other.
  supported: { list: 'supportedDevices' },
  imageCta: {
    from: 'LPContentItem',
    title: 'imageCtaTitle',
    body: 'imageCtaBody',
    cta: 'imageCtaCta',
    image: 'imageCtaImage',
    list: 'imageCtaTiles',
  },
  // Everything but the picture is read by hand below. The shared resolver
  // falls back from the component to the card it holds, and this is the one
  // block where that fallback is wrong: the component's words are the block
  // above the card and the card's are the card, so letting one stand in for
  // the other draws the bundle banner's heading twice — once on the page and
  // again inside it.
  multiview: { from: 'LPContentItem', image: 'multiviewImage' },
  experience: { from: 'LPContentItem', title: 'expTitle', body: 'expBody', eyebrow: 'expOverline', cta: 'expCta', image: 'expImage' },
  zone: { from: 'LPContentItem', title: 'zoneTitle', body: 'zoneBody', cta: 'zoneCta', image: 'zoneImage' },
  live: { from: 'LPContentItem', title: 'liveTitle', body: 'liveBody', cta: 'liveCta' },
  ppv: { from: 'LPContentItem', title: 'ppvLine', cta: 'ppvCta' },
  rail: { title: 'railTitle', rail: 'railId', list: 'railTiles' },
  schedule: { title: 'scheduleHeading', body: 'scheduleSubheading', rail: 'scheduleRailId' },
  shows: { title: 'showsTitle', body: 'showsBody', cta: 'showsCta', rail: 'showsRailId' },
  badges: { title: 'badgesTitle', list: 'badges' },
  teams: { title: 'teamsTitle', body: 'teamsBody', eyebrow: 'teamsEyebrow', list: 'teams' },
  providers: { title: 'providersTitle', body: 'providersBody', cta: 'providersCta', list: 'providers' },
  zip: { title: 'zipHeading', body: 'zipNote', cta: 'zipCta' },
  schedCarousel: { from: 'LPScheduleCarousel', title: 'carouselTitle', eyebrow: 'carouselLabel', rail: 'carouselRailId' },
  area: { title: 'areaTitle', body: 'areaBody' },
  bundles: { title: 'bundlesTitle', body: 'bundlesBody' },
  cities: { title: 'citiesTitle', body: 'citiesBody' },
}

/**
 * The picture a block draws, from whichever of its entries carries one.
 *
 * A spotlight's is an `AdaptiveImage` entry standing on its own, a banner's
 * hangs off the tile inside it, an experience feature's is the still of the
 * video it plays. The route has already resolved all three to one URL at the
 * phone's breakpoint, so the only question left is which entry to ask, and
 * the answer is the first that has one.
 *
 * The URL is DAZN's asset proxy — the same host the live page loads from —
 * rather than anything this tool holds. A picture that arrives this way is
 * borrowed, not owned: it is here so the page can be compared against the one
 * that is up, and Replace puts something of ours in its place.
 */
const pictureFromLive = (kids: LiveEntry[]): string | null =>
  kids.map((k) => k.image).find((url) => typeof url === 'string' && url) ?? null

/**
 * A live string as this tool can draw it.
 *
 * DAZN's renderer reads `##like this##` as emphasis. Ours does not, so left
 * alone the markers arrive on screen as themselves. The words are the words
 * either way; only the marks go.
 */
const plain = (text: string) => text.replace(/##/g, '').trim()

/**
 * The price line a banner carries, split into the two things it is drawn as.
 *
 * The CMS keeps it as one `offerLabel` string with the amount in bold —
 * `<b>€9.99</b> /month – cancel anytime with 30 days' notice`. The live page
 * draws the bold part at 18 in the bright ink and the rest at 16 in grey, so
 * the two come apart here rather than at render.
 *
 * `{price}` is not a price. Most markets leave the amount as that placeholder
 * and production fills it from the offers service; nothing on this branch can
 * reach that service, so the amount is left empty and the terms come across
 * on their own. A field somebody has to clear before typing into is worse
 * than a field that is already empty.
 */
/** A block's ticked lines, each with the icon the CMS named against it. */
const linesFromLive = (features: { line: string; icon: string | null }[] | undefined) =>
  (features ?? [])
    .map((one) => ({ line: plain(one.line), ...(one.icon ? { icon: one.icon } : {}) }))
    .filter((one) => one.line !== '')

function priceFromLive(entries: LiveEntry[]): { price: string; note: string } {
  const label = entries.find((k) => k.key === 'offerLabel')?.value
  if (!label) return { price: '', note: '' }
  const strip = (s: string) =>
    s
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const bold = /<b>([\s\S]*?)<\/b>/i.exec(label)
  if (!bold) return { price: '', note: strip(label) }
  const amount = strip(bold[1])
  // The sentence with the amount's place kept rather than its text. Italy says
  // "From €34.99 /month" and Germany "€9.99 /month – cancel anytime": the
  // amount is in the middle of one and at the front of the other, so a note
  // that only held what came after it would put Italy's "From" behind its own
  // price. `{price}` is the CMS's own marker, which is what it already writes
  // in the markets that fill the amount at render.
  const note = strip(label.replace(bold[0], ' {price} '))
  return { price: amount === '{price}' ? '' : amount, note }
}

/**
 * The types a market and a product start with.
 *
 * What the market draws now where that has been read, what it drew when the
 * table was written where it has not, and the shipped run for a combination
 * production has no page for.
 */
export const defaultTypesFor = (market?: string | null, product?: string | null): SectionType[] => {
  const live = seenLive.get(pageKey(market, product))
  if (live) return typesFromLive(live.map((b) => b.type))
  return PAGE_DEFAULTS[pageKey(market, product)] ?? SHIPPED_ORDER
}

/**
 * What each block of a market's page says, where the market has been read.
 *
 * The arrangement was the easy half. A page that draws three spotlight rails
 * and says the same thing in all three is not the page: Canada's three are a
 * club world cup, a fight night and a soccer rail, and the only thing they
 * have in common is the shape. So the words come across with the order.
 *
 * The first block of a kind writes the page's own fields, where its words have
 * always lived, and every one after it writes under its own id — the same
 * division the handoff now names them by.
 *
 * A field the live page leaves empty is empty here. It was falling back to
 * the words this tool shipped, on the grounds that those are words somebody
 * wrote — but they are words somebody wrote for a different block. Canada's
 * events rail carries no line under its heading, and the shipped line belongs
 * to the products rail, so "Don't miss live on DAZN" arrived over "Add
 * additional sports from around the world to your DAZN plan". The page draws
 * nothing there; so does this.
 *
 * Only the fields the live page answers for are touched at all, so this empties
 * what production leaves empty rather than emptying what it never carries.
 */
export function wordsFromLive(market?: string | null, product?: string | null): Partial<LandingScreen> {
  const live = seenLive.get(pageKey(market, product))
  if (!live) return {}
  /*
   * Every field the live page can speak to, emptied, before a word of the
   * market's is written over it.
   *
   * Emptied and not set to what this tool ships. A page opens on what the
   * market draws, and what this tool ships is not what any market draws — it
   * is a design's example. Where the market has a block, its words go in
   * below; where it has none, the field belongs to whoever adds that block
   * and is theirs to write.
   *
   * Clearing first also stops the last market's words standing in for this
   * one's: these live on one page shared by every market, and a market only
   * writes the blocks it draws. Britain's page has no plan picker, so its
   * heading was once whatever the last market left there — after Germany,
   * "Wähle deine Mitgliedschaft" under an English page.
   */
  const own: Record<string, unknown> = Object.fromEntries(liveFieldNames().map((field) => [field, blankFor(field)]))
  const copies: Record<string, Partial<LandingScreen>> = {}
  const list: PageSection[] = []
  for (const block of live) {
    const type = cardFor(block.type)
    if (!type) continue
    const taken = list.some((s) => s.id === type)
    const id = taken ? freeId(list, type) : type
    list.push({ id, type, on: true })
    const mine: Record<string, unknown> = {}
    const said = (field: string | undefined, live: string | null) => {
      if (!field) return
      mine[field] = live ? plain(live) : ''
    }
    const spec = LIVE_SPEC[type]
    if (spec) {
      const kids = block.entries ?? []
      // The entry that carries the words where the component does not. Named
      // rather than taken as the first, so a rail cannot have the name of the
      // tile that happens to lead it read as the rail's own.
      //
      // The component first, and the holder only where it is quiet. Which way
      // round matters: Italy draws two introduction banners and they are built
      // differently — the first keeps its heading, its line and its overline on
      // the component and only the button on the card inside it, the second
      // keeps everything on the card. Always reading the card threw the first
      // one's words away.
      const holder = spec.from ? kids.find((k) => k.type === spec.from) : undefined
      said(spec.title, block.title ?? holder?.title ?? null)
      said(spec.body, block.description ?? holder?.body ?? null)
      // Two names for the small line over a heading, and a block uses whichever
      // its shape gives it: the component's overLine, or the holder's preTitle.
      said(spec.eyebrow, block.overLine ?? holder?.preTitle ?? null)
      // The block's own button, which is an entry of its own — not the button
      // on a tile, which a rail of tiles has one of per tile.
      said(spec.cta, kids.find((k) => k.type === 'LPButton')?.cta ?? holder?.cta ?? null)
      said(spec.rail, block.railId)
      said(spec.image, pictureFromLive(kids))
      if (spec.list) mine[spec.list] = listFromLive(type, kids, block)
    }
    /*
     * The introduction banner, whose two halves come from two places.
     *
     * The component's own words are the block above the card — production
     * calls it `mainContent`, and draws the overLine there as a gold pill
     * rather than as an overline. The card's words are the card. Neither
     * stands in for the other: Italy draws the mobile banner with both halves
     * and the bundle banner with the top half left empty, and a fallback in
     * either direction turns one of those two pages into the other.
     *
     * So an empty half is written as empty. That is the whole point of the
     * pair — "filled in and not filled in" is the difference between Italy's
     * two banners, and the only thing that tells them apart.
     */
    if (type === 'multiview') {
      const card = (block.entries ?? []).find((k) => k.type === 'LPContentItem')
      mine.multiviewBadge = plain(block.overLine ?? '')
      mine.multiviewTitle = plain(block.title ?? '')
      mine.multiviewBody = plain(block.description ?? '')
      // No market draws the icon-and-word row the design puts over this
      // banner, so it stays empty where a market has been read.
      mine.multiviewEyebrow = ''
      mine.multiviewCardTitle = plain(card?.title ?? '')
      mine.multiviewCardBody = plain(card?.body ?? '')
      mine.multiviewCta = plain(card?.cta ?? '')
      mine.multiviewNote = plain(card?.disclaimer ?? '')
      mine.multiviewFeatures = linesFromLive(block.features)
      const money = priceFromLive(block.entries ?? [])
      mine.multiviewPrice = money.price
      mine.multiviewPriceNote = money.note
    }
    // The freemium banner is the introduction banner under another name —
    // production gives it its own component and then builds it out of the same
    // picture, heading, button and ticked lines. So its lines come across the
    // same way.
    if (type === 'imageCta') mine.imageCtaLines = linesFromLive(block.features)
    // Every market stacks this banner — the picture, then the words under it
    // — so a page opened on a market is stacked. The design's other
    // arrangement stays available in the panel.
    if (type === 'imageCta') mine.imageCtaLayout = 'top'
    if (type === 'supported') {
      Object.assign(mine, supportedFromLive(block.entries ?? []))
      Object.assign(mine, headingFromLive(block.title, block.description))
    }
    if (Object.keys(mine).length === 0) continue
    if (id === type) Object.assign(own, mine)
    else copies[id] = mine as Partial<LandingScreen>
  }
  const out = own as Partial<LandingScreen>
  return Object.keys(copies).length > 0 ? { ...out, sectionCopy: copies } : out
}

/**
 * Those types as a page, ids and all.
 *
 * Ids the way `withAdded` makes them, so a page that starts with four
 * spotlight rails is numbered the way one that grew to four would be.
 */
export function defaultSectionsFor(market?: string | null, product?: string | null): PageSection[] {
  const list: PageSection[] = []
  for (const type of defaultTypesFor(market, product)) {
    const taken = list.some((s) => s.id === type)
    list.push({ id: taken ? freeId(list, type) : type, type, on: true })
  }
  return list
}

/**
 * An arrangement, exactly — every instance, its kind, and whether it draws.
 *
 * Enough to tell one arrangement from another and no more: two pages with the
 * same blocks in the same order with the same ones switched on are the same
 * arrangement, whatever their words say.
 */
export const sectionsFingerprint = (list: PageSection[]): string =>
  list.map((s) => `${s.id}:${s.type}:${s.on ? 1 : 0}`).join('|')

/**
 * Whether the page is still the one the tool gave it.
 *
 * The test for whether a default may be replaced by another, and it is a
 * memory where there is one: the set records the arrangement it was handed,
 * and a page that still matches that record is one nobody has arranged.
 *
 * The old test — does this match what this market would produce now — is kept
 * for a page saved before the set started remembering. It was only ever right
 * while the two could not drift apart, and reading the defaults from the live
 * page is exactly what lets them: a market that changes what it draws changes
 * the answer under a page nobody touched. Such a page would read as somebody's
 * work from then on and never be updated again. One market switch replaces the
 * guess with a record, so a set is only exposed to it once.
 */
export function isUntouched(
  content: LandingScreen,
  market?: string | null,
  product?: string | null,
  given?: string,
): boolean {
  const saved = content.sections
  if (!saved || saved.length === 0) return true
  if (given !== undefined) return sectionsFingerprint(saved) === given
  const want = defaultSectionsFor(market, product)
  return (
    saved.length === want.length &&
    saved.every((s, at) => s.type === want[at].type && s.id === want[at].id && s.on === want[at].on)
  )
}

/** Whether this instance is the original — the one that owns the page's own fields. */
export const isFirst = (section: PageSection) => section.id === section.type

/**
 * What one instance says.
 *
 * The original reads the page's own fields, which is where its words have
 * always been. A copy reads those too, and then its own on top: a duplicate
 * starts as the thing it was copied from and diverges as it is edited.
 */
export function copyOf<T extends Record<string, unknown>>(
  text: T,
  content: LandingScreen,
  section: PageSection,
): T {
  const own = content.sectionCopy?.[section.id]
  return own ? { ...text, ...own } : text
}

/** An id nothing else on the page is using. */
function freeId(list: PageSection[], type: SectionType): string {
  let n = 2
  while (list.some((s) => s.id === `${type}-${n}`)) n += 1
  return `${type}-${n}`
}

/** The list with one instance moved by a step, or unchanged at either end. */
export function withMoved(list: PageSection[], id: string, delta: number): PageSection[] {
  const from = list.findIndex((s) => s.id === id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= list.length) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * The list with one thing dropped before or after another.
 *
 * Written for the page's own components and kept for anything else with an
 * id: the teams on the rail are dragged the same way, and two copies of this
 * would be two chances to get it subtly different.
 */
export function withDropped<T extends { id: string }>(
  list: T[],
  id: string,
  onto: string,
  after: boolean,
): T[] {
  if (id === onto) return list
  const from = list.findIndex((one) => one.id === id)
  if (from < 0) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  const target = next.findIndex((one) => one.id === onto)
  if (target < 0) return list
  next.splice(after ? target + 1 : target, 0, moved)
  return next
}

export function withToggled(list: PageSection[], id: string, on: boolean): PageSection[] {
  return list.map((s) => (s.id === id ? { ...s, on } : s))
}

/**
 * The list with a copy of one instance under it, and the id it was given.
 *
 * The copy is a new instance of the same type, on whether or not the thing it
 * came from is: copying something to leave it hidden is not what anybody
 * means by it.
 */
export function withDuplicated(
  list: PageSection[],
  id: string,
): { list: PageSection[]; id: string } {
  const at = list.findIndex((s) => s.id === id)
  if (at < 0) return { list, id }
  const source = list[at]
  const made: PageSection = { id: freeId(list, source.type), type: source.type, on: true }
  const next = [...list]
  next.splice(at + 1, 0, made)
  return { list: next, id: made.id }
}

/**
 * The list with one more block of a type, at the end.
 *
 * A type that is not on the page takes the plain id again, which is how a
 * block that was deleted comes back to the words it always had: those live in
 * the page's own fields, and the plain id is what reads them.
 */
export function withAdded(list: PageSection[], type: SectionType): PageSection[] {
  const taken = list.some((s) => s.id === type)
  return [...list, { id: taken ? freeId(list, type) : type, type, on: true }]
}

/**
 * The list without one instance.
 *
 * Any of them, including a type's original: what it said is in the page's own
 * fields and stays there, so adding that type back brings its words with it.
 */
export function withRemoved(list: PageSection[], id: string): PageSection[] {
  return list.filter((s) => s.id !== id)
}
