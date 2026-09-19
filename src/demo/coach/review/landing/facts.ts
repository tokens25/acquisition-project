import type { CardSet } from '../../../../rules/content'
import { resolveFlow } from '../../../../rules/layers'
import type { LandingScreen } from '../../../../rules/flow'
import {
  badgesOf,
  bundlesOf,
  cardsOf,
  cityTabsOf,
  cityTilesOf,
  matchesOf,
  planCardsOf,
  featuresOf,
  heroOf,
  landingText,
  linksOf,
  providersOf,
  questionsOf,
  subTilesOf,
  teamsOf,
  tilesOf,
} from '../../../../rules/landing'
import { SECTION_LABEL, copyOf, isFirst, sectionsOf, type SectionType } from '../../../../rules/sections'

/**
 * The landing page as plain facts.
 *
 * The same idea as the journey snapshot next door, for a page rather than a
 * flow: what it is made of, in what order, saying what. Nothing here judges
 * anything — that is the brains' job — and nothing is invented: every string
 * is read through the same rules the page renders through, so an observation
 * about a heading is an observation about a heading somebody will see.
 */

export interface ComponentFact {
  /** The instance, which is the type for the first of its kind. */
  id: string
  type: SectionType
  label: string
  /** Where it sits among the components that draw, 1-based. Zero if it does not. */
  position: number
  on: boolean
  /** A second (or third) of its kind, with words of its own. */
  copy: boolean
  /** Its heading, where it has one. */
  heading: string
  /** Every string it draws, in reading order. */
  words: string[]
  /** What its button says, where it has one. */
  cta: string
  /** Whether it draws a picture, and where that picture came from. */
  picture: 'none' | 'shipped' | 'own' | null
}

export interface LandingFacts {
  /** Every component on the page, drawn or not, in the page's own order. */
  components: ComponentFact[]
  /** The ones that draw, in order. */
  drawn: ComponentFact[]
  hero: {
    title: string
    body: string
    cta: string
    altCta: string
    altCtaOn: boolean
    navSignUpOn: boolean
    label: string
    labelOn: boolean
    goldCta: boolean
  }
  faqs: { question: string; answer: string }[]
  footer: { links: string[]; mark: string }
  /** How many rows the features list has, and how many name a tag. */
  features: { total: number; tagged: number }
  providers: number
}

/** Which component types draw a picture at all. */
const PICTURED: SectionType[] = ['features', 'imageCta', 'multiview']

/** What a component says, in the order it says it. */
function wordsOf(type: SectionType, t: ReturnType<typeof landingText>, l: LandingScreen): { heading: string; words: string[]; cta: string } {
  switch (type) {
    case 'zip':
      return { heading: t.zipHeading, words: [t.zipHeading, t.zipNote, t.zipCta], cta: t.zipCta }
    case 'schedule':
      return { heading: t.scheduleHeading, words: [t.scheduleHeading], cta: '' }
    case 'shows':
      return {
        heading: t.showsTitle,
        words: [t.showsTitle, t.showsBody, t.showsCta],
        cta: t.showsCta,
      }
    case 'experience':
      return {
        heading: t.expTitle,
        words: [t.expOverline, t.expTitle, t.expBody, t.expCta],
        cta: t.expCta,
      }
    case 'badges':
      return {
        heading: t.badgesTitle,
        words: [t.badgesTitle, ...badgesOf(l).map((one) => one.line)],
        cta: '',
      }
    case 'plans':
      return { heading: t.plansTitle, words: [t.plansTitle, t.plansBody], cta: '' }
    case 'teams':
      return {
        heading: t.teamsTitle,
        words: [t.teamsEyebrow, t.teamsTitle, t.teamsBody, ...teamsOf(l).map((one) => one.name)],
        cta: '',
      }
    case 'area':
      return {
        heading: t.areaTitle,
        words: [t.areaTitle, t.areaBody, t.areaNotice, t.areaNote, t.areaCta],
        cta: t.areaCta,
      }
    case 'multiview':
      return {
        heading: t.multiviewTitle,
        words: [t.multiviewEyebrow, t.multiviewBadge, t.multiviewTitle, t.multiviewBody, t.multiviewCta],
        cta: t.multiviewCta,
      }
    case 'providers':
      return {
        heading: t.providersTitle,
        words: [t.providersTitle, t.providersBody, t.providersHighlight, t.providersNote, t.providersCta],
        cta: t.providersCta,
      }
    case 'devices':
      return { heading: t.devicesTitle, words: [t.devicesTitle, t.devicesTitleTwo, t.devicesBody], cta: '' }
    case 'faq':
      return { heading: t.faqTitle, words: [t.faqTitle, ...questionsOf(l).map((q) => q.question)], cta: '' }
    case 'imageCta':
      return {
        heading: t.imageCtaTitle,
        words: [t.imageCtaTitle, t.imageCtaBody, t.imageCtaCta],
        cta: t.imageCtaCta,
      }
    case 'features':
      return {
        heading: t.featuresTitle,
        words: [
          t.featuresEyebrow,
          t.featuresTitle,
          ...featuresOf(l).flatMap((one) => [one.tag, one.title, one.body]),
          t.featuresCta,
        ],
        cta: t.featuresCta,
      }
    case 'supported':
      return { heading: t.supportedTitle, words: [t.supportedTitle, t.supportedNote, t.supportedLink], cta: '' }
    case 'rail':
      return {
        heading: t.railTitle,
        words: [t.railTitle, ...tilesOf(l).flatMap((one) => [one.title, one.meta])],
        cta: '',
      }
    case 'subRail':
      return {
        heading: t.subRailTitle,
        words: [t.subRailTitle, t.subRailBody, ...subTilesOf(l).flatMap((one) => [one.line, one.cta])],
        /* Every tile carries the same way in, so the first one is the
           component's call to action rather than one of many. */
        cta: subTilesOf(l)[0]?.cta ?? '',
      }
    case 'bundles':
      return {
        heading: t.bundlesTitle,
        words: [
          t.bundlesTitle,
          t.bundlesBody,
          ...bundlesOf(l).flatMap((one) => [one.name, one.note, one.term, one.cta]),
        ],
        cta: bundlesOf(l)[0]?.cta ?? '',
      }
    case 'matchList':
      return {
        heading: t.matchTitle,
        words: [
          t.matchEyebrow,
          t.matchTitle,
          t.matchCta,
          ...matchesOf(l).flatMap((one) => [one.day, one.note]),
        ],
        cta: t.matchCta,
      }
    case 'cardStack':
      return {
        /* The lead card's heading is the stack's: the ones under it are
           statistics, and a number is not what this block is called. */
        heading: cardsOf(l)[0]?.title ?? '',
        words: cardsOf(l).flatMap((one) => [one.title, one.body, one.cta]),
        cta: cardsOf(l).find((one) => one.cta.trim() !== '')?.cta ?? '',
      }
    case 'cities':
      return {
        heading: t.citiesTitle,
        words: [
          t.citiesEyebrow,
          t.citiesTitle,
          t.citiesBody,
          ...cityTabsOf(l).map((one) => one.label),
          ...cityTilesOf(l).flatMap((one) => [one.title, one.meta]),
        ],
        cta: '',
      }
    case 'live':
      return {
        heading: t.liveTitle,
        words: [
          t.liveTitle,
          t.liveBody,
          t.liveCta,
        ],
        cta: t.liveCta,
      }
    case 'spotlight':
      return {
        heading: t.spotlightTitle,
        words: [
          t.spotlightLabel,
          t.spotlightTitle,
          t.spotlightBody,
        ],
        cta: '',
      }
    case 'fightPlan':
      return {
        heading: t.planPickTitle,
        words: [
          t.planPickTitle,
          ...planCardsOf(l).flatMap((one) => [one.name, one.note, one.notice, one.offerName]),
          t.planPickMore,
          t.planPickCta,
        ],
        cta: t.planPickCta,
      }
  }
}

/** Where a component's picture comes from, for the ones that draw one. */
function pictureOf(type: SectionType, l: LandingScreen): ComponentFact['picture'] {
  if (!PICTURED.includes(type)) return null
  if (type === 'imageCta') return l.imageCtaImageOff ? 'none' : l.imageCtaImage ? 'own' : 'shipped'
  if (type === 'multiview') return l.multiviewImageOff ? 'none' : l.multiviewImage ? 'own' : 'shipped'
  const rows = featuresOf(l)
  if (rows.every((r) => r.imageOff)) return 'none'
  return rows.some((r) => r.image) ? 'own' : 'shipped'
}

export function landingFacts(set: CardSet): LandingFacts {
  const l = resolveFlow(set).landing
  const text = landingText(l)
  const hero = heroOf(l)
  const list = sectionsOf(l)

  let drawnSoFar = 0
  const components = list.map((section) => {
    const own = copyOf(text, l, section)
    const { heading, words, cta } = wordsOf(section.type, own, l)
    if (section.on) drawnSoFar += 1
    return {
      id: section.id,
      type: section.type,
      label: SECTION_LABEL[section.type],
      position: section.on ? drawnSoFar : 0,
      on: section.on,
      copy: !isFirst(section),
      heading,
      words: words.filter((w) => typeof w === 'string'),
      cta,
      picture: pictureOf(section.type, l),
    }
  })

  return {
    components,
    drawn: components.filter((c) => c.on),
    hero: {
      title: text.title,
      body: text.body,
      cta: text.cta,
      altCta: text.altCta,
      altCtaOn: l.altCtaEnabled ?? true,
      navSignUpOn: l.navSignUpEnabled ?? true,
      label: hero.label,
      labelOn: hero.labelEnabled,
      goldCta: hero.ctaGold,
    },
    faqs: questionsOf(l).map((q) => ({ question: q.question, answer: (q.answer ?? '').trim() })),
    footer: { links: linksOf(l).map((one) => one.label), mark: text.footerMark },
    features: {
      total: featuresOf(l).length,
      tagged: featuresOf(l).filter((one) => one.tag.trim() !== '').length,
    },
    providers: providersOf(l).filter((p) => p.name.trim() !== '').length,
  }
}
