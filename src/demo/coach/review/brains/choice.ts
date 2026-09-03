import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, nextStepFor, scienceEvidence } from '../evidence'
import { amountsIn, finding } from '../finding'
import { renders, type JourneySnapshot } from '../snapshot'
import { proposeTest } from '../tests'
import type { Finding } from '../types'

/**
 * Choice Architecture Brain: order, defaults, the recommended plan, how many
 * options, relative prominence. It names the advantage a structure gives and
 * proposes a test when two arrangements are both defensible. It never moves
 * a default, an order or a badge itself.
 */
export function choiceBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const on = (g: string) => (ctx.businessGoals as string[]).includes(g)

  if (renders(s, 'plans') && s.plans.length > 0) {
    const highlighted = s.plans.find((p) => p.highlighted)

    // The recommended plan, when no package direction is configured (the Goal brain owns it otherwise).
    if (highlighted && !on('drive-package') && !on('drive-bundle')) {
      out.push(
        finding({
          brain: 'choice',
          criterion: 'informed-choice',
          sciences: ['signaling', 'default-effect'],
          screen: 'plans',
          element: `plan:${highlighted.id}`,
          highlight: [highlighted.name, highlighted.badge ?? ''].filter(Boolean),
          observation: `${highlighted.name} is marked as the recommended plan${highlighted.badge ? ` (“${highlighted.badge}”)` : ''}.`,
          evidence: scienceEvidence('signaling', 'default-effect'),
          interpretation: `A recommendation is a business choice, and it draws choice toward that plan. There is no configured direction saying ${highlighted.name} is the plan to favour.`,
          recommendation: `If ${highlighted.name} is the plan you want to favour, set that as the goal so the Coach can judge the journey against it. If not, decide which plan the badge belongs to.`,
          expectedMechanism: 'A stated direction lets the recommendation be judged rather than assumed.',
          confidence: confidenceFromScience('default-effect'),
          severity: 'check',
          nextStep: nextStepFor(ctx, `how often ${highlighted.name} is chosen against the other plans`),
          goals: {},
        }),
      )
    }

    // How many plans, and how they are grouped.
    if (s.plans.length >= 5) {
      out.push(
        finding({
          brain: 'choice',
          criterion: 'package-comparison',
          sciences: ['choice-overload', 'hick-hyman'],
          screen: 'plans',
          element: 'plan-count',
          observation: `${s.plans.length} plans on one screen.`,
          evidence: scienceEvidence('choice-overload', 'hick-hyman'),
          interpretation: `Many similar options can make choosing harder. The effect depends on how different they read; it is not a law.`,
          recommendation: null,
          confidence: 'low',
          severity: 'check',
          nextStep: nextStepFor(ctx, 'time on the plan screen and how many people leave without choosing'),
          goals: {},
        }),
      )
    } else if (s.planTabs.length > 1) {
      out.push(
        finding({
          brain: 'choice',
          criterion: 'package-comparison',
          sciences: ['hick-hyman', 'choice-overload'],
          screen: 'plans',
          element: 'plan-count',
          highlight: s.planTabs,
          observation: `The plan screen asks two questions: which tab (${s.planTabs.join(' or ')}), then which of ${s.plans.length} plans.`,
          evidence: scienceEvidence('hick-hyman'),
          interpretation: `Readers see ${s.plans.length} cards but are really choosing from ${s.plans.length * s.planTabs.length}. Whether that helps or hurts here is unknown.`,
          recommendation: null,
          confidence: 'medium',
          severity: 'check',
          nextStep: nextStepFor(ctx, 'how many people switch tabs before choosing'),
          goals: {},
        }),
      )
    }

    // The priciest plan in the middle.
    const byOrder = [...s.plans].sort((a, b) => a.order - b.order)
    const priciest = [...s.plans].sort((a, b) => b.priceNumber - a.priceNumber)[0]
    const middle = byOrder.length === 3 ? byOrder[1] : null
    if (middle && priciest && middle.id === priciest.id) {
      out.push(
        finding({
          brain: 'choice',
          criterion: 'informed-choice',
          sciences: ['compromise-effect', 'anchoring'],
          screen: 'plans',
          element: 'plan-order',
          highlight: [middle.name],
          observation: `The most expensive plan, ${middle.name} (${middle.price}), sits in the middle${middle.highlighted ? ' and is the recommended one' : ''}.`,
          evidence: scienceEvidence('compromise-effect', 'anchoring'),
          interpretation: `Unsure readers sometimes pick the middle option. Here that is also the priciest. The effect is contested and depends on context.`,
          recommendation: `Make sure this order is a decision. If it is, nothing to change.`,
          confidence: 'low',
          severity: 'check',
          nextStep: nextStepFor(ctx, 'the plan mix this order produces'),
          goals: {},
        }),
      )
    }
  }

  // The preselected way to pay, when Drive Annual Plan is not configured (the Goal brain owns it then).
  if (renders(s, 'cadence') && !on('drive-annual')) {
    const c = s.flow.cadence
    const selected = c.options.find((o) => o.id === c.selected)
    const other = c.options.find((o) => o.id !== c.selected)
    if (selected && other) {
      out.push(
        finding({
          brain: 'choice',
          criterion: 'informed-choice',
          sciences: ['default-effect', 'status-quo-bias'],
          screen: 'cadence',
          element: `cadence:${selected.id}`,
          highlight: [selected.title],
          observation: `“${selected.title}” (${selected.price}/${selected.unit}) is preselected. “${other.title}” must be chosen actively.`,
          evidence: scienceEvidence('default-effect', 'status-quo-bias'),
          interpretation: `A preselected option gets chosen more often. That advantage should be a decision. No direction is configured that says which way to pay should be favoured.`,
          recommendation: `Decide which way to pay the business wants favoured, and set it as the goal. Then the default can be judged, and tested, against it.`,
          expectedMechanism: 'When the option that is already ticked is the one you want chosen, that works for you. When it is not, it works against you.',
          confidence: confidenceFromScience('default-effect'),
          severity: 'check',
          nextStep: nextStepFor(ctx, 'how the two ways to pay split today'),
          goals: {},
        }),
      )
    }

    const [first] = c.options
    if (first && c.options.length > 1) {
      const cheapest = [...c.options].sort((a, b) => (amountsIn(a.price)[0] ?? 0) - (amountsIn(b.price)[0] ?? 0))[0]
      if (cheapest && first.id !== cheapest.id) {
        out.push(
          finding({
            brain: 'choice',
            criterion: 'decision-clarity',
            sciences: ['anchoring'],
            screen: 'cadence',
            element: 'cadence-order',
            highlight: [first.price],
            observation: `The first price on the screen is ${first.price}. The smaller ${cheapest.price} comes after it.`,
            evidence: scienceEvidence('anchoring'),
            interpretation: `The first number sets the scale for the next. Which way that cuts here is unknown.`,
            recommendation: null,
            confidence: 'low',
            severity: 'test',
            test: proposeTest({
              hypothesis: 'The order of the two prices changes how the monthly price is judged.',
              science: 'Anchoring Effect',
              observation: `The yearly ${first.price} is shown before the monthly ${cheapest.price}.`,
              control: `${first.title} first, as today.`,
              variant: `${cheapest.title} first.`,
              primaryMeasure: 'Cadence chosen on this screen',
              learn: 'Whether price order changes cadence choice here at all.',
              goalRelevant: false,
              strongMechanism: true,
            }),
            goals: {},
          }),
        )
      }
    }
  }

  return out
}
