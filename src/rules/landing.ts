import type {
  HeroLabelVariant,
  HeroLogoSize,
  LandingFeature,
  LandingLink,
  LandingProvider,
  LandingQuestion,
  LandingScreen,
} from './flow'
import { defaultFlow } from './flow'

/**
 * The hero banner's own fields, which are not words on the page below it.
 *
 * `landingText` resolves every string the page shows and types its result as
 * "all of them, filled in". The hero carries switches, a picture and two
 * pickers as well, so they are named here and left out of that type rather
 * than making it lie about what it returns.
 */
export const HERO_KEYS = [
  'heroImage',
  'heroLabelEnabled',
  'heroLabel',
  'heroLabelVariant',
  'heroHelperEnabled',
  'heroHelper',
  'heroPriceEnabled',
  'heroPricePrefix',
  'heroPriceValue',
  'heroPriceSuffix',
  'heroPriceOld',
  'heroCtaGold',
  'heroLogoEnabled',
  'heroLogoSize',
] as const

export type HeroKey = (typeof HERO_KEYS)[number]

/** The hero banner as the panel and the preview both read it. */
export interface HeroBanner {
  image: string
  labelEnabled: boolean
  label: string
  labelVariant: HeroLabelVariant
  helperEnabled: boolean
  helper: string
  priceEnabled: boolean
  pricePrefix: string
  priceValue: string
  priceSuffix: string
  priceOld: string
  ctaGold: boolean
  logoEnabled: boolean
  logoSize: HeroLogoSize
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
    helperEnabled: on('heroHelperEnabled'),
    helper: str('heroHelper'),
    priceEnabled: on('heroPriceEnabled'),
    pricePrefix: str('heroPricePrefix'),
    priceValue: str('heroPriceValue'),
    priceSuffix: str('heroPriceSuffix'),
    priceOld: str('heroPriceOld'),
    ctaGold: on('heroCtaGold'),
    logoEnabled: on('heroLogoEnabled'),
    logoSize: (content.heroLogoSize ?? base.heroLogoSize ?? 'medium') as HeroLogoSize,
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
  | 'navSignUpEnabled'
  | 'sections'
  | 'sectionCopy'

export function landingText(content: LandingScreen): Required<
  Omit<LandingScreen, 'providers' | 'faqs' | 'features' | 'footerLinks' | HeroKey | ChoiceKey>
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
    zipLabel: of('zipLabel'),
    zipValue: of('zipValue'),
    zipCta: of('zipCta'),
    scheduleHeading: of('scheduleHeading'),
    plansTitle: of('plansTitle'),
    plansBody: of('plansBody'),
    teamsEyebrow: of('teamsEyebrow'),
    teamsTitle: of('teamsTitle'),
    teamsBody: of('teamsBody'),
    areaTitle: of('areaTitle'),
    areaBody: of('areaBody'),
    areaFieldLabel: of('areaFieldLabel'),
    areaFieldValue: of('areaFieldValue'),
    areaNotice: of('areaNotice'),
    areaNote: of('areaNote'),
    areaCta: of('areaCta'),
    multiviewEyebrow: of('multiviewEyebrow'),
    multiviewBadge: of('multiviewBadge'),
    multiviewTitle: of('multiviewTitle'),
    multiviewBody: of('multiviewBody'),
    multiviewCta: of('multiviewCta'),
    providersTitle: of('providersTitle'),
    providersBody: of('providersBody'),
    providersHighlight: of('providersHighlight'),
    providersNote: of('providersNote'),
    providersCta: of('providersCta'),
    devicesTitle: of('devicesTitle'),
    devicesTitleTwo: of('devicesTitleTwo'),
    devicesBody: of('devicesBody'),
    footerMark: of('footerMark'),
    supportedTitle: of('supportedTitle'),
    supportedNote: of('supportedNote'),
    supportedLink: of('supportedLink'),
    featuresEyebrow: of('featuresEyebrow'),
    featuresTitle: of('featuresTitle'),
    featuresCta: of('featuresCta'),
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

/** A new provider tile. Named blank, because the name picks the logo. */
export function blankProvider(existing: LandingProvider[]): LandingProvider {
  return { id: nextId('provider', existing), name: '' }
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

/** A new question. */
export function blankQuestion(existing: LandingQuestion[]): LandingQuestion {
  return { id: nextId('faq', existing), question: '', answer: '' }
}

function nextId(stem: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}
