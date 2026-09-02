import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, contentEvidence, scienceEvidence } from '../evidence'
import { amountsIn, finding, hasWord } from '../finding'
import { renders, type JourneySnapshot } from '../snapshot'
import { proposeTest } from '../tests'
import type { Finding } from '../types'

/** "Every local Knicks, Rangers and Sabres game": the cards' own pattern. */
function describeTeams(teams: string[]): string {
  const shorts = teams.map((t) => t.split(' ').pop() ?? t)
  const list = shorts.length > 1 ? `${shorts.slice(0, -1).join(', ')} and ${shorts[shorts.length - 1]}` : shorts[0]
  return `Every local ${list} game`
}

/**
 * Decision Brain: how people compare options and reach a decision. It asks
 * whether the differences that matter are the ones that are easy to see.
 */
export function decisionBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const on = (g: string) => (ctx.businessGoals as string[]).includes(g)

  if (renders(s, 'plans') && s.plans.length > 1) {
    const featureSets = s.plans.map((p) => p.features.join('|'))
    if (featureSets.every((f) => f === featureSets[0]) && s.plans[0].features.length > 0) {
      out.push(
        finding({
          brain: 'decision',
          criterion: 'package-comparison',
          sciences: ['madm', 'attribute-based-choice'],
          screen: 'plans',
          element: 'features',
          highlight: [s.plans[0].features[0]],
          observation: `All ${s.plans.length} plans list the same ${s.plans[0].features.length} feature lines. Only the teams and the price differ between them.`,
          evidence: [...contentEvidence(...s.plans.map((p) => `${p.name}: ${p.features.join('; ')}`)), ...scienceEvidence('madm')],
          interpretation: `People compare on what differs. Lines that are identical on every card cannot help the comparison, and they take the space the differences need.`,
          recommendation: `Let the cards lead with what differs (the teams). Say the shared features once, for all plans, rather than four times.`,
          expectedMechanism: 'Fewer identical lines make the real differences easier to find and weigh.',
          confidence: confidenceFromScience('madm'),
          severity: 'check',
          validation: 'research',
          nextStep: 'A short comprehension test (can people say what differs between the plans?) would settle whether this matters here.',
          goals: { 'drive-benefit': -1, 'drive-package': -1 },
        }),
      )
    }

    // A plan described by naming the others. Two defensible framings, so this
    // is a test, not a fault: naming the sub-brands implies breadth, while
    // enumerating teams is concrete but sets a ceiling. The card also shows
    // the team logos, so the names are not the only cue on screen.
    for (const p of s.plans) {
      const named = s.plans.filter((o) => o.id !== p.id && hasWord(p.description, o.name))
      if (named.length === 0) continue
      const logos = p.teams.length
      out.push(
        finding({
          brain: 'decision',
          criterion: 'package-comparison',
          sciences: ['recognition-over-recall', 'loss-aversion', 'framing'],
          screen: 'plans',
          element: `plan:${p.id}:description`,
          highlight: [p.description],
          observation: `${p.name} is described as “${p.description}”, so it is defined by the other plans. The card also shows ${logos} team ${logos === 1 ? 'badge' : 'badges'} below it.`,
          evidence: [...contentEvidence(p.description, `${p.name} badges: ${p.teams.join(', ')}`), ...scienceEvidence('recognition-over-recall', 'framing')],
          interpretation: `Two readings pull against each other, and the content cannot settle which wins. Naming ${named.map((o) => o.name).join(' and ')} needs the reader to remember the other cards, but it frames the plan as everything, which sounds open-ended. Listing the teams is concrete and needs no memory, but it draws a boundary: a reader who counts seven names may read that as the limit of what they get. The badges already carry the teams either way, so the sentence is not the only place the reader learns them.`,
          recommendation: null,
          expectedMechanism: 'Breadth framing versus concrete enumeration: one may raise expected value, the other may raise comprehension.',
          confidence: 'low',
          severity: 'test',
          test: proposeTest({
            hypothesis: `How ${p.name} is framed changes whether readers choose it: breadth (“everything in A and B”) against a named team list.`,
            science: 'Framing Effect, with Loss Aversion on the ceiling a list implies',
            observation: `Today the description names the other plans, and the badges below it show the ${logos} teams.`,
            control: `“${p.description}”`,
            variant: `“${describeTeams(p.teams)}”`,
            primaryMeasure: `Share of plan choices that are ${p.name}`,
            guardrail: 'Overall acquisition completion',
            learn: `Whether breadth or a named list works better for ${p.name} here. The answer is not obvious from science alone.`,
            goalRelevant: false,
            strongMechanism: false,
          }),
          goals: {},
        }),
      )
    }
  }

  // A yearly saving that exists in the numbers and is never said. With Drive Annual Plan on, the Goal brain covers it.
  if (renders(s, 'plans') && renders(s, 'cadence') && !on('drive-annual')) {
    const c = s.flow.cadence
    const yearly = c.options.find((o) => /year|annual/i.test(o.unit))
    const monthly = c.options.find((o) => /month/i.test(o.unit))
    const y = yearly && amountsIn(yearly.price)[0]
    const m = monthly && amountsIn(monthly.price)[0]
    if (yearly && monthly && y && m) {
      const saving = Math.round((1 - y / (m * 12)) * 100)
      const stated = /save|saving|%|off/i.test(`${yearly.note} ${yearly.badge} ${c.footnote}`)
      if (saving > 0) {
        out.push(
          finding({
            brain: 'decision',
            criterion: 'offer-comprehension',
            sciences: ['reference-price', 'framing'],
            screen: 'cadence',
            element: 'cadence-prices',
            highlight: [yearly.price],
            observation: stated
              ? `Paying yearly saves ${saving}% against monthly, and the screen says so.`
              : `Paying yearly (${yearly.price}) saves ${saving}% against 12 monthly payments. The screen never says so.`,
            evidence: [...contentEvidence(`${yearly.price}/${yearly.unit}`, `${monthly.price}/${monthly.unit}`), ...scienceEvidence('reference-price', 'framing')],
            interpretation: stated ? `The bigger number arrives with its reason.` : `Readers see a number nine times the monthly price with no reason beside it. The saving is real; the comparison is left to their arithmetic.`,
            recommendation: stated ? null : `State the saving next to the yearly price, as the numbers already show it. The price itself does not change.`,
            expectedMechanism: 'A stated, verified saving gives the larger amount a reference point.',
            confidence: confidenceFromScience('reference-price'),
            severity: stated ? 'note' : 'check',
            validation: 'none',
            goals: { 'drive-annual': stated ? 1 : -1, 'drive-offer': stated ? 1 : -1 },
          }),
        )
      }
    }
  }

  return out
}
