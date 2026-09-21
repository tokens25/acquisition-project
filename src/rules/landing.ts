import type {
  HeroLabelVariant,
  LandingBadge,
  LandingBundle,
  LandingCard,
  LandingMatch,
  LandingTab,
  LandingPlanCard,
  LandingTeam,
  LandingSubTile,
  LandingTile,
  RailSize,
  LandingFeature,
  LandingLink,
  LandingProvider,
  LandingQuestion,
  LandingScreen,
} from './flow'
import { defaultFlow } from './flow'
import type { LandingDevice } from './flow'
import { DEVICES } from '../components/flow/landingArt'

/**
 * How far the hero picture can be zoomed, as a percentage of the size that
 * fills the frame exactly.
 *
 * 100 is that size, so it is the middle of the idea rather than the bottom of
 * the range: below it the picture is smaller than the frame and the page
 * colour shows around it, which is a thing somebody may well want — and the
 * smaller it is, the further it can be moved before it runs out of frame.
 */
export const HERO_ZOOM_MIN = 25
export const HERO_ZOOM_MAX = 200

/**
 * The hero banner's own fields, which are not words on the page below it.
 *
 * `landingText` resolves every string the page shows and types its result as
 * "all of them, filled in". The hero carries switches, a picture and two
 * pickers as well, so they are named here and left out of that type rather
 * than making it lie about what it returns.
 */
export const HERO_KEYS = [
  'heroPreset',
  'heroImage',
  'heroLabelEnabled',
  'heroLabel',
  'heroLabelVariant',
  'footnoteEnabled',
  'heroPriceEnabled',
  'heroPricePrefix',
  'heroPriceValue',
  'heroPriceSuffix',
  'heroPriceOld',
  'heroFocalX',
  'heroFocalY',
  'heroZoom',
  'heroWash',
  'heroCtaGold',
] as const

export type HeroKey = (typeof HERO_KEYS)[number]

/**
 * The landing fields the Hero banner tab owns.
 *
 * The hero's own controls, and the four strings it shares with the page: the
 * bar's two buttons and the words over the picture are edited there, so they
 * are listed there — in the panel and in the handoff both, which is why this
 * is here rather than written out twice.
 */
const HERO_FIELDS = new Set<string>([
  ...HERO_KEYS,
  'navExplore',
  'navFirstStyle',
  'navSignUp',
  'navSignUpEnabled',
  'title',
  'body',
  'cta',
  'altCta',
  'altCtaEnabled',
  'footnote',
  'titleSource',
  'bodySource',
  'ctaSource',
])

/** Whether a landing field is the hero's, given `landing.navExplore` or `navExplore`. */
export function isHeroField(key: string): boolean {
  const field = key.replace(/^landing\./, '').split(/[.[]/)[0]
  return HERO_FIELDS.has(field)
}

/** The hero banner as the panel and the preview both read it. */
export interface HeroBanner {
  image: string
  labelEnabled: boolean
  label: string
  labelVariant: HeroLabelVariant
  /** Whether the footnote under the buttons is drawn. What it says is `footnote`. */
  helperEnabled: boolean
  priceEnabled: boolean
  pricePrefix: string
  priceValue: string
  priceSuffix: string
  priceOld: string
  focalX: number
  focalY: number
  zoom: number
  wash: 'light' | 'standard' | 'heavy'
  ctaGold: boolean
}

/**
 * What the hero is set to, with the shipped values standing in.
 *
 * Same shape as `landingText` and for the same reason: a page saved before
 * these existed has none of them, and reading that as "off and empty" is
 * exactly right rather than something to guard against at every call site.
 */
export function heroOf(content: LandingScreen): HeroBanner {
  const base = defaultFlow.landing
  const str = (k: HeroKey) => (content[k] ?? base[k] ?? '') as string
  const on = (k: HeroKey) => (content[k] ?? base[k] ?? false) as boolean
  return {
    image: str('heroImage'),
    labelEnabled: on('heroLabelEnabled'),
    label: str('heroLabel'),
    labelVariant: (content.heroLabelVariant ?? base.heroLabelVariant ?? 'standard') as HeroLabelVariant,
    helperEnabled: on('footnoteEnabled'),
    priceEnabled: on('heroPriceEnabled'),
    pricePrefix: str('heroPricePrefix'),
    priceValue: str('heroPriceValue'),
    priceSuffix: str('heroPriceSuffix'),
    priceOld: str('heroPriceOld'),
    focalX: (content.heroFocalX ?? base.heroFocalX ?? 50) as number,
    focalY: (content.heroFocalY ?? base.heroFocalY ?? 50) as number,
    zoom: (content.heroZoom ?? base.heroZoom ?? 100) as number,
    wash: (content.heroWash ?? base.heroWash ?? 'standard') as HeroBanner['wash'],
    ctaGold: on('heroCtaGold'),
  }
}

/**
 * The words on the landing page, with the shipped wording standing in for
 * anything a saved copy does not carry.
 *
 * The page grew a long way past the hero, and content published before it did
 * says nothing about the sections below. Reading those as empty would draw a
 * page of blank headings; reading them as the default draws the page as
 * designed until somebody changes it.
 */
/** Which fields are a choice rather than words on the page. */
type ChoiceKey =
  | 'titleSource'
  | 'bodySource'
  | 'ctaSource'
  | 'altCtaEnabled'
  | 'navFirstStyle'
  | 'navSignUpEnabled'
  | 'imageCtaImage'
  | 'imageCtaImageOff'
  | 'imageCtaLayout'
  | 'multiviewImage'
  | 'multiviewImageOff'
  | 'sections'
  | 'sectionCopy'
  | 'railSize'
  | 'showsRailId'
  | 'zoneImage'
  | 'carouselRailId'
  | 'carouselService'
  | 'expImage'
  | 'expSide'
  | 'railId'
  | 'scheduleRailId'
  | 'spotlightImage'
  | 'spotlightRailId'

export function landingText(content: LandingScreen): Required<
  Omit<
    LandingScreen,
    | 'providers'
    | 'faqs'
    | 'features'
    | 'footerLinks'
    | 'railTiles'
    | 'spotlightTiles'
    | 'imageCtaTiles'
    | 'multiviewFeatures'
    | 'subRailTiles'
    | 'badges'
    | 'bundles'
    | 'matchGames'
    | 'featureCards'
    | 'cityTabs'
    | 'cityTiles'
    | 'planCards'
    | 'teams'
    | 'supportedOff'
    | 'supportedDevices'
    | HeroKey
    | ChoiceKey
  >
> {
  const base = defaultFlow.landing
  const of = <K extends keyof LandingScreen>(key: K) =>
    (content[key] ?? base[key]) as string
  return {
    navExplore: of('navExplore'),
    navSignUp: of('navSignUp'),
    title: of('title'),
    body: of('body'),
    cta: of('cta'),
    altCta: of('altCta'),
    footnote: of('footnote'),
    zipHeading: of('zipHeading'),
    zipNote: of('zipNote'),
    zipCta: of('zipCta'),
    scheduleHeading: of('scheduleHeading'),
    scheduleSubheading: of('scheduleSubheading'),
    plansTitle: of('plansTitle'),
    plansBody: of('plansBody'),
    teamsEyebrow: of('teamsEyebrow'),
    teamsTitle: of('teamsTitle'),
    teamsBody: of('teamsBody'),
    areaTitle: of('areaTitle'),
    areaBody: of('areaBody'),
    areaNotice: of('areaNotice'),
    areaNote: of('areaNote'),
    areaCta: of('areaCta'),
    multiviewEyebrow: of('multiviewEyebrow'),
    multiviewBadge: of('multiviewBadge'),
    multiviewTitle: of('multiviewTitle'),
    multiviewBody: of('multiviewBody'),
    multiviewCta: of('multiviewCta'),
    multiviewCardTitle: of('multiviewCardTitle'),
    multiviewCardBody: of('multiviewCardBody'),
    providersTitle: of('providersTitle'),
    providersBody: of('providersBody'),
    providersHighlight: of('providersHighlight'),
    providersNote: of('providersNote'),
    providersCta: of('providersCta'),
    supportedHeading: of('supportedHeading'),
    supportedHeadingTwo: of('supportedHeadingTwo'),
    supportedBody: of('supportedBody'),
    footerMark: of('footerMark'),
    supportedTitle: of('supportedTitle'),
    supportedNote: of('supportedNote'),
    supportedLink: of('supportedLink'),
    featuresEyebrow: of('featuresEyebrow'),
    featuresTitle: of('featuresTitle'),
    featuresCta: of('featuresCta'),
    railTitle: of('railTitle'),
    ppvLine: of('ppvLine'),
    ppvBadge: of('ppvBadge'),
    ppvCta: of('ppvCta'),
    zoneTitle: of('zoneTitle'),
    zoneBody: of('zoneBody'),
    zoneCta: of('zoneCta'),
    carouselTitle: of('carouselTitle'),
    carouselLabel: of('carouselLabel'),
    carouselFrom: of('carouselFrom'),
    carouselTo: of('carouselTo'),
    showsTitle: of('showsTitle'),
    showsBody: of('showsBody'),
    showsCta: of('showsCta'),
    expOverline: of('expOverline'),
    expTitle: of('expTitle'),
    expBody: of('expBody'),
    expCta: of('expCta'),
    badgesTitle: of('badgesTitle'),
    subRailTitle: of('subRailTitle'),
    subRailBody: of('subRailBody'),
    bundlesTitle: of('bundlesTitle'),
    bundlesBody: of('bundlesBody'),
    matchEyebrow: of('matchEyebrow'),
    matchTitle: of('matchTitle'),
    matchCta: of('matchCta'),
    citiesEyebrow: of('citiesEyebrow'),
    citiesTitle: of('citiesTitle'),
    citiesBody: of('citiesBody'),
    liveTitle: of('liveTitle'),
    liveBody: of('liveBody'),
    liveCta: of('liveCta'),
    spotlightLabel: of('spotlightLabel'),
    spotlightTitle: of('spotlightTitle'),
    spotlightBody: of('spotlightBody'),
    spotlightCta: of('spotlightCta'),
    planPickTitle: of('planPickTitle'),
    planPickMore: of('planPickMore'),
    planPickCta: of('planPickCta'),
    imageCtaTitle: of('imageCtaTitle'),
    imageCtaBody: of('imageCtaBody'),
    imageCtaCta: of('imageCtaCta'),
    faqTitle: of('faqTitle'),
  }
}

/** The TV providers the page lists. */
/**
 * The ten the page shipped with before node 734:27154 replaced the section.
 *
 * The design's list is eleven: it adds DIRECTV stream and Mid-Hudson Fiber,
 * and drops altice.
 */
const SUPERSEDED_PROVIDERS = [
  'Spectrum',
  'DIRECTV',
  'fios',
  'optimum.',
  'optimum.tv',
  'fubo',
  'xfinity',
  'altice',
  'Astound',
  'breezeline',
]

export function providersOf(content: LandingScreen): LandingProvider[] {
  const saved = content.providers
  const shipped = defaultFlow.landing.providers ?? []
  if (!saved) return shipped
  /*
   * A copy saved before the section was rebuilt carries the old ten, and a
   * list cannot gain a tile the way a missing field gains its shipped wording.
   * Matched name for name it is the old shipped list rather than anybody's
   * own, so the current one stands in — which is how a page saved last week
   * shows the logos the design has this week. A list anyone has touched is
   * theirs, and is left exactly as it is.
   */
  const untouched =
    saved.length === SUPERSEDED_PROVIDERS.length &&
    saved.every((p, i) => p.name === SUPERSEDED_PROVIDERS[i])
  return untouched ? shipped : saved
}

/** The words in the footer. */
export function linksOf(content: LandingScreen): LandingLink[] {
  return content.footerLinks ?? defaultFlow.landing.footerLinks ?? []
}

/** A new one, waiting to be named. */
export function blankLink(existing: LandingLink[]): LandingLink {
  return { id: nextId('footer', existing), label: '' }
}

/** The rows of the features list. */
export function featuresOf(content: LandingScreen): LandingFeature[] {
  return content.features ?? defaultFlow.landing.features ?? []
}

/** A new row. Its tag is what picks the icon and the picture, so it is empty. */
export function blankFeature(existing: LandingFeature[]): LandingFeature {
  return { id: nextId('feature', existing), tag: '', title: '', body: '' }
}

/** The three the page asked before node 747:46377 gave it its own. */
const SUPERSEDED_QUESTIONS = [
  'What do I get with the Gotham Bundle?',
  'How to connect your tv provider',
  'What is Multiview?',
]

/**
 * The questions at the foot of the page.
 *
 * A saved copy carrying the old three is carrying the old shipped list rather
 * than anybody's own, and a list cannot grow an answer the way a missing field
 * grows its shipped wording — so the current three stand in, answers and all.
 * A list anyone has touched is theirs and is left alone.
 */
export function questionsOf(content: LandingScreen): LandingQuestion[] {
  const saved = content.faqs
  const shipped = defaultFlow.landing.faqs ?? []
  if (!saved) return shipped
  const untouched =
    saved.length === SUPERSEDED_QUESTIONS.length &&
    saved.every((q, i) => q.question === SUPERSEDED_QUESTIONS[i])
  return untouched ? shipped : saved
}

/**
 * The games on the schedule.
 *
 * A page saved before the schedule could be chosen has no list, which is not
 * the same as an empty one: it means nobody has said which games, so the
 * shipped three stand in. An empty list is a decision — a schedule with
 * nothing on it — and is left as it is.
 */
/** Which rail the schedule draws, or the one it ships with. */
export function scheduleRailIdOf(content: LandingScreen): string {
  return content.scheduleRailId ?? defaultFlow.landing.scheduleRailId ?? ''
}

/** The device logos the wall leaves out, or the ones it ships without. */
export function devicesOffOf(content: LandingScreen): string[] {
  return content.supportedOff ?? defaultFlow.landing.supportedOff ?? []
}

/**
 * The wall this page draws: the market's own where it has one, else the
 * shipped thirteen.
 *
 * A market's own arrives with its logos as URLs on DAZN's proxy. The shipped
 * ones are files this app holds, so they carry no url and the wall falls back
 * to the artwork it has always drawn for that name.
 */
export function devicesOf(content: LandingScreen): LandingDevice[] {
  const mine = content.supportedDevices
  return mine && mine.length > 0 ? mine : DEVICES.map((d) => ({ id: d.name, name: d.name }))
}

/** Which rail the match days come from, or the one it ships with. */
export function carouselRailIdOf(content: LandingScreen): string {
  return content.carouselRailId ?? defaultFlow.landing.carouselRailId ?? ''
}

/** Which service answers with the matches, or the one it ships with. */
export function carouselServiceOf(content: LandingScreen): string {
  return content.carouselService ?? defaultFlow.landing.carouselService ?? ''
}

/** Which rail the shows come from, or the one it ships with. */
export function showsRailIdOf(content: LandingScreen): string {
  return content.showsRailId ?? defaultFlow.landing.showsRailId ?? ''
}

/** Which rail the row of tiles draws, or the one it ships with. */
export function railIdOf(content: LandingScreen): string {
  return content.railId ?? defaultFlow.landing.railId ?? ''
}

/** The teams on the rail, or the ones it ships with. */
export function teamsOf(content: LandingScreen): LandingTeam[] {
  return content.teams ?? defaultFlow.landing.teams ?? []
}

/** A new one. The name is all it needs: the crest and the colour follow it. */
export function blankTeam(existing: LandingTeam[]): LandingTeam {
  return { id: nextId('team', existing), name: '' }
}

/** The tiles in the rail, or the ones it ships with. */
export function tilesOf(content: LandingScreen): LandingTile[] {
  return content.railTiles ?? defaultFlow.landing.railTiles ?? []
}

/** A new tile, waiting for its words. */
export function blankTile(existing: LandingTile[]): LandingTile {
  return { id: nextId('tile', existing), title: '', meta: '' }
}

/** Which size of tile this rail draws. */
export function railSizeOf(content: LandingScreen): RailSize {
  return content.railSize ?? defaultFlow.landing.railSize ?? 'fixture'
}

/** The other subscriptions offered, or the ones it ships with. */
export function subTilesOf(content: LandingScreen): LandingSubTile[] {
  return content.subRailTiles ?? defaultFlow.landing.subRailTiles ?? []
}

/** A new one, with the way in already written: every tile has the same one. */
export function blankSubTile(existing: LandingSubTile[]): LandingSubTile {
  return { id: nextId('sub', existing), line: '', cta: 'Subscribe', logo: true }
}

/** The badges on the carousel, or the ones it ships with. */
export function badgesOf(content: LandingScreen): LandingBadge[] {
  return content.badges ?? defaultFlow.landing.badges ?? []
}

/** A new one. A picture and a line are both optional; the disc is not. */
export function blankBadge(existing: LandingBadge[]): LandingBadge {
  return { id: nextId('badge', existing), line: '' }
}

/** The bundles on offer, or the ones it ships with. */
export function bundlesOf(content: LandingScreen): LandingBundle[] {
  return content.bundles ?? defaultFlow.landing.bundles ?? []
}

/** The matches in the day-by-day list, or the ones it ships with. */
export function matchesOf(content: LandingScreen): LandingMatch[] {
  return content.matchGames ?? defaultFlow.landing.matchGames ?? []
}

/** A new match, on the day the one before it is on: a list runs down a day. */
export function blankMatch(existing: LandingMatch[]): LandingMatch {
  return {
    id: nextId('match', existing),
    day: existing[existing.length - 1]?.day ?? '',
    home: '',
    away: '',
    time: '',
    note: '',
  }
}

/** The cards in the stack, or the ones it ships with. */
export function cardsOf(content: LandingScreen): LandingCard[] {
  return content.featureCards ?? defaultFlow.landing.featureCards ?? []
}

/** A new card. Plain: a number makes it a statistic, a button makes it the lead. */
export function blankCard(existing: LandingCard[]): LandingCard {
  return { id: nextId('card', existing), stat: '', title: '', body: '', cta: '' }
}

/** The tabs over the places, or the ones it ships with. */
export function cityTabsOf(content: LandingScreen): LandingTab[] {
  return content.cityTabs ?? defaultFlow.landing.cityTabs ?? []
}

/** A new tab, waiting to be named. */
export function blankTab(existing: LandingTab[]): LandingTab {
  return { id: nextId('tab', existing), label: '' }
}

/** The places, or the ones it ships with. */
export function cityTilesOf(content: LandingScreen): LandingTile[] {
  return content.cityTiles ?? defaultFlow.landing.cityTiles ?? []
}

/** Which rail the spotlight draws, or the one it ships with. */
export function spotlightRailIdOf(content: LandingScreen): string {
  return content.spotlightRailId ?? defaultFlow.landing.spotlightRailId ?? ''
}

/** The plans a fight can be bought on, or the ones it ships with. */
export function planCardsOf(content: LandingScreen): LandingPlanCard[] {
  return content.planCards ?? defaultFlow.landing.planCards ?? []
}

/** A new question. */
export function blankQuestion(existing: LandingQuestion[]): LandingQuestion {
  return { id: nextId('faq', existing), question: '', answer: '' }
}

function nextId(stem: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}
