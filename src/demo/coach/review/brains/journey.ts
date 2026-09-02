import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, contentEvidence, nextStepFor, scienceEvidence } from '../evidence'
import { finding, hasWord } from '../finding'
import { renders, type JourneySnapshot } from '../snapshot'
import type { Finding } from '../types'

/**
 * Journey / UX Brain: the journey as one connected decision. At each step:
 * what did we promise, what does the reader expect now, what are we showing.
 * Content-to-package match runs here always, because the entitlement data
 * (each plan's team list) establishes what is true.
 */
export function journeyBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const f = s.flow
  const on = (g: string) => (ctx.businessGoals as string[]).includes(g)
  const short = (t: string) => t.split(' ').pop() ?? t

  const landingText = `${f.landing.title} ${f.landing.body}`
  const promised = renders(s, 'landing') ? Object.values(s.teamNames).filter((name) => hasWord(landingText, short(name)) || hasWord(landingText, name)) : []
  const named = renders(s, 'landing') ? (s.plans.find((p) => hasWord(f.landing.title, p.name)) ?? null) : null

  // Message match: the teams the landing page promises, against the plan it is named after.
  if (renders(s, 'plans') && named && promised.length) {
    const missing = promised.filter((t) => !named.teams.includes(t))
    if (missing.length) {
      const carriers = s.plans.filter((p) => missing.every((t) => p.teams.includes(t)))
      out.push(
        finding({
          brain: 'journey',
          criterion: 'journey-consistency',
          sciences: ['expectation-confirmation', 'information-scent'],
          screen: 'landing',
          alsoOn: ['plans'],
          element: 'message-match',
          highlight: missing.map(short),
          observation: `The landing page promises ${missing.map(short).join(' and ')} under the ${named.name} headline. ${named.name} does not include them${carriers.length ? `; ${carriers.map((p) => p.name).join(' and ')} do` : ''}.`,
          evidence: contentEvidence(f.landing.body.trim(), `${named.name}: ${named.teams.join(', ')}`),
          interpretation: `Readers arrive at the plan screen expecting ${named.name} to be what they just read about. It is not quite.`,
          recommendation: `Make the page and the plan agree: name only what ${named.name} includes, or headline the plan that carries every team named.`,
          expectedMechanism: 'What was promised is what is offered, so the first transition holds.',
          confidence: 'high',
          severity: 'fix',
          goals: { 'acquire-content': -1, 'maintain-proposition': -1 },
          copyTarget: { path: 'path:landing.body', label: 'Landing page text', current: f.landing.body, allowedTerms: named.teams, maxLength: 200 },
        }),
      )
    } else {
      out.push(
        finding({
          brain: 'journey',
          criterion: 'journey-consistency',
          sciences: ['expectation-confirmation'],
          screen: 'landing',
          element: 'message-match',
          observation: `Every team the landing page names is in the ${named.name} plan.`,
          evidence: contentEvidence(f.landing.body.trim()),
          interpretation: `What was promised is what is offered.`,
          recommendation: null,
          confidence: 'high',
          severity: 'note',
          goals: { 'acquire-content': 1, 'maintain-proposition': 1 },
        }),
      )
    }
  }

  // Content-to-package match, always on: which plan carries the content that brought the reader in.
  if (renders(s, 'plans') && promised.length && s.plans.length > 1) {
    const full = s.plans.filter((p) => promised.every((t) => p.teams.includes(t)))
    const highlighted = s.plans.find((p) => p.highlighted)
    if (full.length === 0) {
      out.push(
        finding({
          brain: 'journey',
          criterion: 'package-comparison',
          sciences: ['madm', 'expectation-confirmation'],
          screen: 'plans',
          element: 'content-package-match',
          observation: `The landing page names ${promised.length} teams. No single plan has all of them.`,
          evidence: contentEvidence(f.landing.body.trim(), ...s.plans.map((p) => `${p.name}: ${p.teams.join(', ')}`)),
          interpretation: `The content that brought the reader in is split across plans, so the cards have to make that choice easy.`,
          recommendation: null,
          confidence: 'high',
          severity: 'check',
          validation: 'none',
          goals: {},
        }),
      )
    } else {
      const p = full[0]
      const favoured = p.highlighted
      out.push(
        finding({
          brain: 'journey',
          criterion: 'journey-consistency',
          sciences: ['expectation-confirmation', 'choice-architecture'],
          screen: 'plans',
          element: 'content-package-match',
          highlight: [p.name],
          observation: `${p.name} is the ${full.length === 1 ? 'only' : 'first'} plan with every team the landing page names (its own team list confirms it). It is ${favoured ? 'the recommended plan' : highlighted ? `not the recommended one; ${highlighted.name} is` : 'not marked'}.`,
          evidence: contentEvidence(f.landing.body.trim(), `${p.name}: ${p.teams.join(', ')}`),
          interpretation: favoured
            ? `The plan that matches the content is the one the screen favours.`
            : `The content points at ${p.name}; the screen's emphasis points elsewhere. Readers have to find the match themselves.`,
          recommendation: favoured ? null : `Consider making ${p.name} the recommended plan, since it is the one the landing page's promise fits. That is a strategy to weigh, not a requirement.`,
          expectedMechanism: 'Emphasis that agrees with the promise saves readers a comparison.',
          confidence: 'high',
          severity: favoured ? 'note' : 'check',
          validation: favoured ? 'none' : 'experiment',
          goals: { 'acquire-content': favoured ? 1 : -1 },
        }),
      )
    }
  }

  // The generic pitch on the sign-in screen. With a content or proposition goal on, the Goal brain traces this.
  if (renders(s, 'auth') && named && !on('acquire-content') && !on('maintain-proposition')) {
    if (!hasWord(f.auth.subtitle, named.name) && !named.teams.some((t) => hasWord(f.auth.subtitle, short(t)))) {
      out.push(
        finding({
          brain: 'journey',
          criterion: 'journey-consistency',
          sciences: ['information-scent', 'expectation-confirmation'],
          screen: 'auth',
          element: 'auth:subtitle',
          highlight: [f.auth.subtitle.trim()],
          observation: `The sign-in screen talks about “live sports, highlights, shows”. It does not mention ${named.name} or its teams, which the two screens before it were about.`,
          evidence: [...contentEvidence(f.auth.subtitle.trim()), ...scienceEvidence('information-scent')],
          interpretation: `For one screen, the journey stops being about what the reader came for.`,
          recommendation: `One line saying the account is the last step before ${named.name}.`,
          expectedMechanism: 'The reason to continue stays visible at the step that asks for the most.',
          confidence: confidenceFromScience('information-scent'),
          severity: 'check',
          validation: 'none',
          goals: { 'acquire-content': -1, 'maintain-proposition': -1 },
          copyTarget: { path: 'path:auth.subtitle', label: 'Sign-in subtitle', current: f.auth.subtitle, allowedTerms: named.teams, maxLength: 110 },
        }),
      )
    }
  }

  // Eligibility checked after the account is made.
  const zip = s.rendered.find((r) => r.id === 'zip')
  const account = s.rendered.find((r) => r.id === 'account')
  if (zip && account && zip.position > account.position) {
    out.push(
      finding({
        brain: 'journey',
        criterion: 'decision-friction',
        sciences: ['perceived-risk', 'sludge', 'mental-models'],
        screen: 'zip',
        alsoOn: ['account'],
        element: 'zip-position',
        highlight: [f.zip.heading],
        observation: `The ZIP check comes at step ${zip.position}, after the account is created at step ${account.position}.`,
        evidence: scienceEvidence('perceived-risk', 'sludge'),
        interpretation: `The check itself has a purpose (regional rights). Its position means readers make an account before learning whether they can watch.`,
        recommendation: null,
        confidence: 'medium',
        severity: 'check',
        nextStep: nextStepFor(ctx, 'how many people fail or leave at the ZIP step after creating an account'),
        goals: {},
      }),
    )
  }

  // Does the confirmation show what was bought.
  if (renders(s, 'ready') && s.plans.length) {
    const named2 = s.plans.find((p) => hasWord(f.ready.title, p.name))
    if (named2) {
      const readyTeams = f.ready.logos.map((id) => s.teamNames[id]).filter(Boolean)
      const same = readyTeams.length === named2.teams.length && readyTeams.every((t) => named2.teams.includes(t))
      out.push(
        finding({
          brain: 'journey',
          criterion: 'purchase-confidence',
          sciences: ['expectation-confirmation', 'commitment-consistency'],
          screen: 'ready',
          element: 'ready:teams',
          highlight: [f.ready.title],
          observation: same ? `The confirmation shows the same ${named2.teams.length} teams the ${named2.name} card showed.` : `The confirmation shows ${readyTeams.length} teams; the ${named2.name} card showed ${named2.teams.length}.`,
          evidence: contentEvidence(f.ready.title, named2.teams.join(', ')),
          interpretation: same ? `The journey ends by confirming what was bought, in the terms it was sold.` : `The close does not confirm the purchase it should.`,
          recommendation: same ? null : `Show the teams of the plan actually bought.`,
          confidence: 'high',
          severity: same ? 'note' : 'fix',
          goals: { 'acquire-content': same ? 1 : -1, 'maintain-proposition': same ? 1 : -1 },
        }),
      )
    }
  }

  // The shape of the whole thing.
  out.push(
    finding({
      brain: 'journey',
      criterion: 'completion',
      sciences: ['mental-models'],
      screen: 'journey',
      element: 'shape',
      highlight: [],
      observation: `${s.rendered.length} steps from “${s.journey.entryCta}” to the confirmation. Plan first, account second, payment last.`,
      evidence: scienceEvidence('mental-models'),
      interpretation: `That is the order people expect from a subscription sign-up. The hard decisions come early, the form-filling late.`,
      recommendation: null,
      confidence: 'medium',
      severity: 'note',
      goals: {},
    }),
  )

  return out
}
