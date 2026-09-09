import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, contentEvidence, scienceEvidence } from '../evidence'
import { finding } from '../finding'
import type { Finding } from '../types'
import type { ComponentFact, LandingFacts } from './facts'

/**
 * The specialists, reading a page instead of a flow.
 *
 * Same shape as the journey's brains and held to the same rule: a Fix rests
 * on what the page itself shows, science may recommend but never declare a
 * fault, and every finding names the component it is about so the panel can
 * take you to it.
 *
 * What differs is the subject. A flow is judged on whether somebody can get
 * through it; a page is judged on whether it says something, says it once,
 * and offers a way in.
 *
 * These are the readings a condition cannot express, and they run beside the
 * written-down ones in `rules/landingRules.ts`: counting how many actions
 * compete, weighing a claim against what else is on the page, and holding the
 * page against the goals somebody set for it. Anything that is "this field is
 * empty" or "these two say the same words" belongs over there, where it can
 * be read as a list.
 */

export type LandingBrainFn = (f: LandingFacts, ctx: CoachReviewContext) => Finding[]

/** Every component that offers a way in. */
const withCta = (f: LandingFacts) => f.drawn.filter((c) => c.cta.trim() !== '')

/** A short name for a component, for a sentence to use. */
const name = (c: ComponentFact) => (c.copy ? `${c.label} (copy)` : c.label)

/**
 * Cognitive & clarity: what the page asks a reader to hold, and what it draws
 * blank because nobody wrote it.
 */
export function landingClarityBrain(f: LandingFacts): Finding[] {
  const out: Finding[] = []

  // A question nobody can open is a question that was asked and not answered.
  const unanswered = f.faqs.filter((q) => q.question.trim() !== '' && q.answer === '')
  if (unanswered.length > 0 && f.drawn.some((c) => c.type === 'faq')) {
    out.push(
      finding({
        brain: 'clarity',
        criterion: 'purchase-confidence',
        sciences: ['recognition-over-recall'],
        screen: 'landing',
        element: 'landing:faq:answers',
        observation: `${unanswered.length} of the ${f.faqs.length} questions have no answer written, so they do not open.`,
        evidence: contentEvidence(unanswered[0].question),
        interpretation:
          'A question that will not open reads as a page that raised a doubt and then left it standing.',
        recommendation: 'Answer them, or take the ones with no answer off the page.',
        confidence: 'high',
        severity: 'fix',
        highlight: unanswered.slice(0, 3).map((q) => q.question),
      }),
    )
  }

  return out
}

/**
 * Journey and choice: the order things arrive in, and whether the page ever
 * offers a way in.
 */
export function landingJourneyBrain(f: LandingFacts): Finding[] {
  const out: Finding[] = []
  const ctas = withCta(f)

  if (ctas.length === 0) {
    out.push(
      finding({
        brain: 'journey',
        criterion: 'completion',
        sciences: ['information-scent'],
        screen: 'landing',
        element: 'landing:no-cta',
        observation: 'No component on the page offers a way in.',
        evidence: contentEvidence('every component on the page is words or pictures alone'),
        interpretation: 'A reader who is persuaded has nowhere to go.',
        recommendation: 'Put a component with a button on the page, or switch one back on.',
        confidence: 'high',
        severity: 'fix',
      }),
    )
  } else if (ctas[0].position > 3) {
    out.push(
      finding({
        brain: 'journey',
        criterion: 'completion',
        sciences: ['information-scent', 'search-costs'],
        screen: 'landing',
        element: 'landing:cta-depth',
        observation: `The first way in is ${name(ctas[0])}, the ${ctas[0].position}th component down the page.`,
        evidence: scienceEvidence('information-scent', 'search-costs'),
        interpretation:
          'A reader who is ready early has to keep scrolling to act, and scrolling is where readers are lost.',
        recommendation: 'Consider moving a component with a button nearer the top.',
        confidence: confidenceFromScience('information-scent'),
        severity: 'check',
      }),
    )
  }

  // Two of a kind next to each other: the second says the same thing again.
  for (let i = 1; i < f.drawn.length; i += 1) {
    const before = f.drawn[i - 1]
    const here = f.drawn[i]
    if (before.type !== here.type) continue
    out.push(
      finding({
        brain: 'journey',
        criterion: 'journey-consistency',
        sciences: ['expectation-confirmation'],
        screen: 'landing',
        element: `landing:${here.id}:adjacent`,
        observation: `Two ${here.label} components sit one after the other.`,
        evidence: contentEvidence(`${name(before)} then ${name(here)}`),
        interpretation:
          'One after the other, the second reads as a mistake rather than as a second thing worth saying.',
        recommendation: 'Move one of them, or take it off the page.',
        confidence: 'high',
        severity: 'check',
      }),
    )
  }

  return out
}

/** Trust: what the page promises, and what it leaves out. */
export function landingTrustBrain(f: LandingFacts): Finding[] {
  const out: Finding[] = []

  const footer = f.footer.links.join(' ').toLowerCase()
  const missing = ['privacy', 'terms'].filter((word) => !footer.includes(word))
  if (missing.length > 0) {
    out.push(
      finding({
        brain: 'trust',
        criterion: 'informed-choice',
        sciences: ['perceived-risk'],
        screen: 'landing',
        element: 'landing:footer:legal',
        observation: `The footer has no link mentioning ${missing.join(' or ')}.`,
        evidence: contentEvidence(f.footer.links.join(', ') || 'the footer has no links'),
        interpretation:
          'A page that asks for a subscription without its terms and privacy words in reach is asking to be trusted on nothing.',
        recommendation: `Add the ${missing.join(' and ')} link${missing.length > 1 ? 's' : ''} to the footer.`,
        confidence: 'high',
        severity: 'fix',
      }),
    )
  }

  // Free of charge, next to the plans that charge.
  const free = f.drawn.find((c) => c.words.some((w) => /no subscription required|for free/i.test(w)))
  const sells = f.drawn.some((c) => c.type === 'plans')
  if (free && sells) {
    out.push(
      finding({
        brain: 'trust',
        criterion: 'informed-choice',
        sciences: ['persuasion-knowledge', 'expectation-confirmation'],
        screen: 'landing',
        element: `landing:${free.id}:free-claim`,
        observation: `${name(free)} offers something without a subscription on a page that also sells one.`,
        evidence: contentEvidence(free.words.find((w) => /no subscription required|for free/i.test(w)) ?? ''),
        interpretation:
          'Two offers on one page invite the reader to work out which one they are being sold, and a free one beside a paid one usually wins the attention.',
        recommendation: null,
        confidence: confidenceFromScience('persuasion-knowledge'),
        severity: 'check',
      }),
    )
  }

  return out
}

/** Copy: the same words twice, and words too long to land. */
export function landingCopyBrain(f: LandingFacts): Finding[] {
  const out: Finding[] = []

  // The hero's two buttons, saying one thing.
  if (f.hero.altCtaOn && f.hero.cta.trim().toLowerCase() === f.hero.altCta.trim().toLowerCase()) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'decision-clarity',
        sciences: ['consistency-check'],
        screen: 'landing',
        element: 'landing:hero:buttons',
        observation: `Both hero buttons say “${f.hero.cta}”.`,
        evidence: contentEvidence(f.hero.cta),
        interpretation: 'Two buttons with one label are a choice with nothing to choose between.',
        recommendation: 'Give the second button its own words, or switch it off.',
        confidence: 'high',
        severity: 'fix',
      }),
    )
  }

  return out
}

/** Goal alignment: what the page is for, against what it says. */
export function landingGoalBrain(f: LandingFacts, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const has = (goal: string) => ctx.businessGoals.includes(goal as never)
  const everything = [...f.drawn.flatMap((c) => c.words), f.hero.title, f.hero.body].join(' ').toLowerCase()
  const drawn = (type: string) => f.drawn.some((c) => c.type === type)

  const missing = (element: string, observation: string, recommendation: string, goal: string) =>
    finding({
      brain: 'goal',
      criterion: 'goal-alignment',
      sciences: ['means-end-chain'],
      screen: 'landing',
      element: `landing:goal:${element}`,
      observation,
      evidence: contentEvidence('what the page has on it'),
      interpretation: 'A page cannot serve a goal it never gets to.',
      recommendation,
      confidence: 'high',
      severity: 'check',
      goals: { [goal]: -1 },
    })

  // Things a page carries as much as a journey does.
  const mentions: { goal: string; test: RegExp; what: string }[] = [
    { goal: 'drive-offer', test: /\d|price|month|free|offer|save/, what: 'a price, a saving or an offer' },
    { goal: 'acquire-content', test: /game|match|team|live|highlight|season/, what: 'the games or teams it carries' },
  ]
  for (const m of mentions) {
    if (!has(m.goal) || m.test.test(everything)) continue
    out.push(
      missing(
        m.goal,
        `The page never mentions ${m.what}, and that is one of the goals set for this review.`,
        'Say it somewhere a reader will meet it, or drop the goal from the review.',
        m.goal,
      ),
    )
  }

  // Signing up: one clear way in, not several competing.
  if (has('page-signup')) {
    const ctas = withCta(f)
    const labels = new Set(ctas.map((c) => c.cta.trim().toLowerCase()))
    if (ctas.length === 0) {
      out.push(
        missing(
          'page-signup',
          'The goal is to get people to sign up, and no component on the page offers a way in.',
          'Put a component with a button on the page.',
          'page-signup',
        ),
      )
    } else if (labels.size > 2) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['choice-architecture', 'information-scent'],
          screen: 'landing',
          element: 'landing:goal:signup-competition',
          observation: `The page offers ${labels.size} different actions: ${[...labels].join(', ')}.`,
          evidence: contentEvidence([...labels].join(', ')),
          interpretation:
            'Every extra action is one more thing to weigh before the one the page is for, and weighing is where readers stop.',
          recommendation: 'Consider making the others quieter, or fewer.',
          confidence: confidenceFromScience('choice-architecture'),
          severity: 'check',
          goals: { 'page-signup': -1 },
        }),
      )
    }
  }

  // Saying what a subscription carries.
  if (has('page-explain') && !drawn('features') && !drawn('plans') && !drawn('supported')) {
    out.push(
      missing(
        'page-explain',
        'The goal is to explain what is included, and the page has nothing on it that says what a subscription carries.',
        'Add the features list, the plans, or the supported devices.',
        'page-explain',
      ),
    )
  }

  // Asking where somebody is, while it still matters.
  if (has('page-region') && !drawn('zip')) {
    out.push(
      missing(
        'page-region',
        'The goal is to get the region checked, and the page never asks for a postcode.',
        'Put the postcode component back on the page.',
        'page-region',
      ),
    )
  }

  // Answering what a reader would otherwise leave over.
  if (has('page-answer')) {
    const answered = f.faqs.filter((q) => q.answer !== '').length
    if (!drawn('faq')) {
      out.push(
        missing(
          'page-answer',
          'The goal is to answer the doubts, and the page has no questions on it.',
          'Put the FAQs on the page.',
          'page-answer',
        ),
      )
    } else if (answered === 0) {
      out.push(
        missing(
          'page-answer',
          'The goal is to answer the doubts, and none of the questions on the page has an answer written.',
          'Write the answers, so the questions open.',
          'page-answer',
        ),
      )
    }
  }

  return out
}

export const LANDING_BRAINS: { id: string; run: LandingBrainFn }[] = [
  { id: 'clarity', run: landingClarityBrain },
  { id: 'journey', run: landingJourneyBrain },
  { id: 'trust', run: landingTrustBrain },
  { id: 'copy', run: landingCopyBrain },
  { id: 'goal', run: landingGoalBrain },
]
