import type {
  HeroLabelVariant,
  HeroLogoSize,
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
export function landingText(content: LandingScreen): Required<
  Omit<LandingScreen, 'providers' | 'faqs' | HeroKey>
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
    devicesNote: of('devicesNote'),
    freeTitle: of('freeTitle'),
    freeBody: of('freeBody'),
    freeCta: of('freeCta'),
    faqTitle: of('faqTitle'),
  }
}

/** The TV providers the page lists. */
export function providersOf(content: LandingScreen): LandingProvider[] {
  return content.providers ?? defaultFlow.landing.providers ?? []
}

/** A new provider tile. Named blank, because the name picks the logo. */
export function blankProvider(existing: LandingProvider[]): LandingProvider {
  return { id: nextId('provider', existing), name: '' }
}

/** The questions at the foot of the page. */
export function questionsOf(content: LandingScreen): LandingQuestion[] {
  return content.faqs ?? defaultFlow.landing.faqs ?? []
}

/** A new question. */
export function blankQuestion(existing: LandingQuestion[]): LandingQuestion {
  return { id: nextId('faq', existing), question: '' }
}

function nextId(stem: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${stem}-${n}`)) n += 1
  return `${stem}-${n}`
}
