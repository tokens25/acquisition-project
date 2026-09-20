import type { LandingScreen } from './flow'

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
  | 'providers'
  | 'devices'
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
  'providers',
  'devices',
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
  multiviewEyebrow: 'multiview',
  multiviewBadge: 'multiview',
  multiviewTitle: 'multiview',
  multiviewBody: 'multiview',
  multiviewCta: 'multiview',
  providersTitle: 'providers',
  providersBody: 'providers',
  providersHighlight: 'providers',
  providersNote: 'providers',
  providersCta: 'providers',
  providers: 'providers',
  devicesTitle: 'devices',
  devicesTitleTwo: 'devices',
  devicesBody: 'devices',
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
  multiview: 'Still, eyebrow, heading, button',
  providers: 'Heading, a line under it, a note, button',
  devices: 'Two headings and a body',
  faq: 'Heading and five questions',
  imageCta: 'Picture, heading, body, button',
  features: 'Eyebrow, heading, rows, button',
  supported: 'Heading, the logos, note, link',
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
  providers: [65, 100, 100],
  devices: [90, 70, 50],
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
  'multiview',
  'providers',
  'devices',
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
  providers: 'SubscriptionProviders',
  /* The type keeps its name because saved pages are arranged by it; what it
     is called is "Text block", which is what the design calls the component
     and what it now is — words, and nothing device-shaped about it. */
  devices: 'Text block',
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
 * so are the repeats: GB's DAZN page really is four spotlight rails, and an
 * NFL page really is five feature bands in a row. The hero and the footer are
 * left out because neither is a section, and a block a market draws twice that
 * can only exist once is taken once.
 *
 * A combination nobody has read falls back to `SHIPPED_ORDER`, which is the
 * page the design shipped and a fair answer for a market we know nothing
 * about.
 *
 * A starting point, not a mirror. Once somebody has arranged the page it is
 * theirs, and changing market leaves it alone — see `isUntouched`.
 */
export const PAGE_DEFAULTS: Record<string, SectionType[]> = {
  'GB|dazn': ['subRail', 'subRail', 'spotlight', 'spotlight', 'spotlight', 'spotlight', 'imageCta', 'supported', 'faq'],
  'US|dazn': ['subRail', 'subRail', 'spotlight', 'imageCta', 'zone', 'supported', 'faq'],
  'CA|dazn': ['subRail', 'plans', 'features', 'subRail', 'spotlight', 'spotlight', 'spotlight', 'imageCta', 'supported', 'faq'],
  'JP|dazn': ['plans', 'multiview', 'rail', 'features', 'imageCta', 'spotlight', 'rail', 'badges', 'subRail', 'faq'],
  'DE|dazn': ['plans', 'rail', 'multiview', 'badges', 'multiview', 'imageCta', 'subRail', 'schedule', 'supported', 'faq'],
  'ES|dazn': ['ppv', 'plans', 'features', 'imageCta', 'spotlight', 'badges', 'spotlight', 'faq'],
  'IT|dazn': ['multiview', 'plans', 'multiview', 'spotlight', 'supported', 'faq'],
  'FR|dazn': ['plans', 'multiview', 'imageCta', 'badges', 'subRail', 'faq'],
  'US|msg': ['zip', 'rail', 'plans', 'live', 'teams', 'providers', 'features', 'imageCta', 'spotlight', 'supported', 'faq'],
  'US|nfl': ['features', 'supported', 'faq'],
  'GB|nfl': ['plans', 'rail', 'experience', 'experience', 'experience', 'experience', 'experience', 'features', 'supported', 'spotlight', 'shows', 'faq'],
  'DE|nfl': ['plans', 'rail', 'experience', 'experience', 'experience', 'experience', 'experience', 'features', 'supported', 'spotlight', 'shows', 'faq'],
  'GB|nhl': ['schedCarousel', 'plans', 'experience', 'features', 'imageCta', 'supported', 'supported', 'faq'],
  'DE|nhl': ['schedCarousel', 'plans', 'experience', 'features', 'imageCta', 'supported', 'supported', 'faq'],
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
const seenLive = new Map<string, SectionType[]>()

/** Remembers a market's live page. True when this is news. */
export function rememberLive(
  market: string | null | undefined,
  product: string | null | undefined,
  names: string[],
): boolean {
  const key = pageKey(market, product)
  const types = typesFromLive(names)
  const had = seenLive.get(key)
  if (had && had.length === types.length && had.every((t, i) => t === types[i])) return false
  seenLive.set(key, types)
  return true
}

/**
 * The types a market and a product start with.
 *
 * What the market draws now where that has been read, what it drew when the
 * table was written where it has not, and the shipped run for a combination
 * production has no page for.
 */
export const defaultTypesFor = (market?: string | null, product?: string | null): SectionType[] =>
  seenLive.get(pageKey(market, product)) ?? PAGE_DEFAULTS[pageKey(market, product)] ?? SHIPPED_ORDER

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
