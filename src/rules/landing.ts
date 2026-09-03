import type { LandingProvider, LandingQuestion, LandingScreen } from './flow'
import { defaultFlow } from './flow'

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
  Omit<LandingScreen, 'providers' | 'faqs'>
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
