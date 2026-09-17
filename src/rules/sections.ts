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
  | 'bundles'
  | 'matchList'
  | 'dayRail'
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
  'bundles',
  'matchList',
  'dayRail',
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
  railTiles: 'rail',
  subRailTitle: 'subRail',
  subRailBody: 'subRail',
  subRailTiles: 'subRail',
  bundlesTitle: 'bundles',
  bundlesBody: 'bundles',
  bundles: 'bundles',
  matchEyebrow: 'matchList',
  matchTitle: 'matchList',
  matchCta: 'matchList',
  matchGames: 'matchList',
  dayLabel: 'dayRail',
  dayDate: 'dayRail',
  dayMonth: 'dayRail',
  dayTiles: 'dayRail',
  featureCards: 'cardStack',
  citiesEyebrow: 'cities',
  citiesTitle: 'cities',
  citiesBody: 'cities',
  cityTabs: 'cities',
  cityTiles: 'cities',
  liveTitle: 'live',
  liveBody: 'live',
  liveFieldLabel: 'live',
  liveFieldValue: 'live',
  liveCta: 'live',
  liveTeams: 'live',
  spotlightImage: 'spotlight',
  spotlightLabel: 'spotlight',
  spotlightTitle: 'spotlight',
  spotlightBody: 'spotlight',
  spotlightTiles: 'spotlight',
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
  supported: 'Heading, note, link',
  rail: 'Title and a row of tiles',
  subRail: 'Heading, a line under it, and the subscriptions',
  bundles: 'Heading, a line under it, and the bundles',
  matchList: 'Eyebrow, heading, button, and the matches by day',
  dayRail: 'A date, and the games on it',
  cardStack: 'A stack of cards',
  cities: 'Eyebrow, heading, a line, tabs, and the places',
  live: 'Heading, field, the teams, button',
  spotlight: 'Picture, label, heading, a line, and the games',
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
  bundles: [60, 100, 100],
  matchList: [45, 70, 100],
  dayRail: [25, 100, 100],
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

/** What each block is called, in the words the page uses for it. */
export const SECTION_LABEL: Record<SectionType, string> = {
  zip: 'Postcode',
  schedule: 'Games schedule',
  plans: 'Subscription plans',
  teams: 'Meet the teams',
  area: 'Outside the area',
  /* Named for what it is rather than what it happens to be about: a still,
     a line about it, and a way in — node 708:174095. */
  multiview: 'Article CTA',
  providers: 'TV providers',
  /* The type keeps its name because saved pages are arranged by it; what it
     is called is "Text block", which is what the design calls the component
     and what it now is — words, and nothing device-shaped about it. */
  devices: 'Text block',
  faq: 'FAQs',
  imageCta: 'Image CTA',
  features: 'Features list',
  supported: 'Supported devices',
  rail: 'Rail',
  subRail: 'More subscriptions',
  bundles: 'Bundles',
  matchList: 'Match list',
  dayRail: 'Day schedule',
  cardStack: 'Feature cards',
  cities: 'Places',
  live: "What's live",
  spotlight: 'Spotlight',
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
