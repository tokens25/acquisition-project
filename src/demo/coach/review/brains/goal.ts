import type { BusinessGoalId, CoachReviewContext } from '../../brief'
import { BUSINESS_GOALS } from '../../brief'
import { confidenceFromScience, contentEvidence, nextStepFor, scienceEvidence } from '../evidence'
import { amountsIn, finding, hasWord } from '../finding'
import { renders, screenName, screenStrings, type JourneySnapshot, type PlanFact } from '../snapshot'
import { proposeTest } from '../tests'
import type { Finding, ScreenId } from '../types'

/**
 * Goal Alignment Brain: the configured direction, checked against the
 * journey. A goal says what DAZN wants prioritised; it does not say how. The
 * brain names the strategies that could support the goal, judges whether the
 * journey uses them, and proposes tests where two arrangements are both
 * defensible. It never claims a business outcome, never invents a price, and
 * never changes a default, an order or a badge itself.
 */
export function goalBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const on = (g: BusinessGoalId) => ctx.businessGoals.includes(g)
  const target = (g: BusinessGoalId) => ctx.targets[g]?.trim() || ''
  const label = (g: BusinessGoalId) => BUSINESS_GOALS.find((x) => x.id === g)?.label ?? g
  const f = s.flow
  const strings = screenStrings(s)

  /** Screens whose strings carry `needle`: a name, its last word for a team, or most of a phrase. */
  const screensMentioning = (needle: string): ScreenId[] => {
    const words = needle.toLowerCase().split(/\s+/).filter((w) => w.length >= 4)
    const isTeam = Object.values(s.teamNames).includes(needle)
    const short = isTeam ? (needle.split(' ').pop() ?? needle) : null
    const found = new Set<ScreenId>()
    for (const x of strings) {
      const t = x.text.toLowerCase()
      if (t.includes(needle.toLowerCase())) found.add(x.screen)
      else if (short && hasWord(x.text, short)) found.add(x.screen)
      else if (words.length >= 2 && words.filter((w) => t.includes(w)).length / words.length >= 0.6) found.add(x.screen)
    }
    return s.rendered.map((r) => r.id).filter((id) => found.has(id))
  }

  const askFor = (g: BusinessGoalId, what: string) =>
    out.push(
      finding({
        brain: 'goal',
        criterion: 'goal-alignment',
        sciences: ['causal-inference'],
        screen: 'journey',
        element: `goal:${g}:target`,
        observation: `“${label(g)}” is on, but you did not say ${what}.`,
        evidence: [],
        interpretation: `The Coach cannot check a direction without knowing what it is about.`,
        recommendation: `Name ${what} and the Coach will trace it through every screen.`,
        confidence: 'high',
        severity: 'check',
        validation: 'none',
        goals: { [g]: -1 },
      }),
    )

  /** Where a proposition is, and is not, from the landing page on. */
  const continuity = (g: BusinessGoalId, needle: string) => {
    const present = screensMentioning(needle)
    const missing = s.rendered.map((r) => r.id).filter((id) => !present.includes(id) && id !== 'account' && id !== 'zip')
    const names = (ids: ScreenId[]) => ids.map((id) => screenName(s, id)).join(', ')
    if (present.length === 0) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['information-scent', 'expectation-confirmation'],
          screen: 'landing',
          element: `goal:${g}:absent`,
          observation: `“${needle}” is not on any screen.`,
          evidence: contentEvidence(needle),
          interpretation: `The reason the reader came is never picked up.`,
          recommendation: `Say “${needle}” on the landing page and the plan screen at least.`,
          expectedMechanism: 'The reason to continue stays visible where the decisions are made.',
          confidence: 'high',
          severity: 'fix',
          goals: { [g]: -1 },
        }),
      )
    } else if (missing.length > 0) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['information-scent', 'expectation-confirmation'],
          screen: missing[0],
          alsoOn: missing.slice(1),
          element: `goal:${g}:continuity`,
          observation: `“${needle}” is on ${names(present)}, but not on ${names(missing)}.`,
          evidence: [...contentEvidence(needle), ...scienceEvidence('information-scent')],
          interpretation: `On ${missing.length} screens the reader can wonder whether this is still about what they came for.`,
          recommendation: `One line mentioning “${needle}” on each of ${names(missing)}.`,
          expectedMechanism: 'The scent that brought the reader in does not go cold before payment.',
          confidence: 'medium',
          severity: 'check',
          validation: 'none',
          goals: { [g]: -1 },
        }),
      )
    } else {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['information-scent'],
          screen: 'journey',
          element: `goal:${g}:continuity`,
          observation: `“${needle}” is on every screen that asks for a decision.`,
          evidence: contentEvidence(needle),
          interpretation: `The reason the reader came stays visible all the way. This is working.`,
          recommendation: null,
          confidence: 'high',
          severity: 'note',
          goals: { [g]: 1 },
        }),
      )
    }
  }

  /**
   * The plan the direction points at, and what the screen does with it.
   * Being first, being recommended or being the default are strategies, so a
   * plan without them is a test to propose, never a fault to fix.
   */
  const planAlignment = (g: BusinessGoalId, p: PlanFact, because: string) => {
    if (!renders(s, 'plans')) return
    const order = [...s.plans].sort((a, b) => a.order - b.order)
    const position = order.findIndex((x) => x.id === p.id) + 1
    const highlighted = s.plans.find((x) => x.highlighted)
    const favoured = p.highlighted
    out.push(
      finding({
        brain: 'goal',
        criterion: 'goal-alignment',
        sciences: ['choice-architecture', 'signaling', 'default-effect'],
        screen: 'plans',
        element: `goal:${g}:plan`,
        highlight: [p.name],
        observation: `${p.name} is the plan to drive (${because}). On the plan screen it is ${position === 1 ? 'first' : `number ${position} of ${s.plans.length}`} and ${favoured ? 'the recommended plan' : highlighted ? `not the recommended one; ${highlighted.name} is` : 'not marked in any way'}.`,
        evidence: [...contentEvidence(`${p.name}: position ${position}, ${favoured ? 'recommended' : 'plain'}`), ...scienceEvidence('signaling', 'default-effect')],
        interpretation: favoured
          ? `The screen already points at ${p.name}. Whether readers follow is a question for DAZN data.`
          : `Recommendation, position and any preselected plan all draw choice, and today they ${highlighted ? `point at ${highlighted.name}` : 'point nowhere'}. A direction does not require any single one of them; each is a strategy, and which to use is a decision for you and a test.`,
        recommendation: favoured
          ? `If a plan is ever preselected on this screen, ${p.name} is the one this direction points at. Nothing to change today.`
          : `Strategies worth weighing, in order of how strongly they draw choice: recommend ${p.name}; preselect ${p.name} if the screen ever carries a default; place it first; lead its card with what it includes. Test before committing to any of them.`,
        expectedMechanism: 'A recommendation draws choice toward the plan it marks.',
        confidence: 'high',
        severity: favoured ? 'note' : 'test',
        test: favoured
          ? undefined
          : proposeTest({
              hypothesis: `Marking ${p.name} as the recommended plan shifts plan choice toward it.`,
              science: 'Signaling Theory and the Default Effect',
              observation: `${highlighted ? `${highlighted.name} carries the recommendation today` : 'No plan is recommended today'}; the configured direction is ${p.name}.`,
              goal: label(g),
              control: highlighted ? `${highlighted.name} recommended, as today.` : 'No recommended plan, as today.',
              variant: `${p.name} recommended; everything else unchanged.`,
              primaryMeasure: `Share of plan choices that are ${p.name}`,
              learn: `Whether the recommendation moves plan choice toward ${p.name} without hurting completion.`,
              goalRelevant: true,
              strongMechanism: true,
            }),
        goals: { [g]: favoured ? 1 : -1 },
      }),
    )
  }

  // Drive Specific Package.
  if (on('drive-package')) {
    const chosen = s.plans.find((p) => ctx.prioritisedTiers.includes(p.id))
    if (!chosen) askFor('drive-package', 'which package')
    else planAlignment('drive-package', chosen, 'your configured priority')
  }

  // Drive Bundle / Add-on.
  if (on('drive-bundle') && renders(s, 'plans')) {
    const t = target('drive-bundle')
    const bundle = s.plans.find((p) => ctx.prioritisedTiers.includes(p.id)) ?? s.plans.find((p) => (t && p.name.toLowerCase().includes(t.toLowerCase())) || /bundle/i.test(p.name))
    if (!bundle) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['causal-inference'],
          screen: 'plans',
          element: 'goal:drive-bundle:none',
          observation: `You want to drive a bundle${t ? ` (“${t}”)` : ''}, but no plan on the screen is one.`,
          evidence: contentEvidence(...s.plans.map((p) => p.name)),
          interpretation: `There is nothing here to prioritise.`,
          recommendation: `Name the bundle, or check it is sold in this market.`,
          confidence: 'high',
          severity: 'check',
          validation: 'none',
          goals: { 'drive-bundle': -1 },
        }),
      )
    } else planAlignment('drive-bundle', bundle, 'the bundle to drive')
  }

  // Drive Annual Plan.
  if (on('drive-annual') && renders(s, 'cadence')) {
    const yearly = f.cadence.options.find((o) => /year|annual/i.test(`${o.unit} ${o.note}`))
    const monthly = f.cadence.options.find((o) => /month/i.test(o.unit))
    const selected = f.cadence.options.find((o) => o.id === f.cadence.selected)
    if (!yearly) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['causal-inference'],
          screen: 'cadence',
          element: 'goal:drive-annual:none',
          observation: `You want to drive the annual plan, but there is no annual option on the cadence screen.`,
          evidence: contentEvidence(...f.cadence.options.map((o) => o.title)),
          interpretation: `The journey cannot support a direction it does not offer.`,
          recommendation: `Offering an annual option is a business decision, and its price is yours. Until then this goal cannot be met here.`,
          confidence: 'high',
          severity: 'check',
          validation: 'none',
          goals: { 'drive-annual': -1 },
        }),
      )
    } else {
      const annualDefault = selected?.id === yearly.id
      const y = amountsIn(yearly.price)[0]
      const m = monthly && amountsIn(monthly.price)[0]
      const saving = y && m ? Math.round((1 - y / (m * 12)) * 100) : 0
      const stated = /save|saving|%|off/i.test(`${yearly.note} ${yearly.badge} ${f.cadence.footnote}`)

      // The default: a strategy to test, whichever way it points today.
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['default-effect', 'status-quo-bias'],
          screen: 'cadence',
          element: 'goal:drive-annual:default',
          highlight: [selected?.title ?? yearly.title],
          observation: annualDefault
            ? `Annual (“${yearly.title}”) is preselected, and Annual is the configured direction.`
            : `“${selected?.title}” is preselected while the configured direction is Annual.`,
          evidence: [...contentEvidence(`selected: ${selected?.title}`), ...scienceEvidence('default-effect', 'status-quo-bias')],
          interpretation: annualDefault
            ? `The default gives Annual a choice-architecture advantage that agrees with the goal. How much it does here is unknown.`
            : `The preselected option gets a choice-architecture advantage, and today it goes to Monthly. That does not make Monthly wrong; it makes the default worth testing.`,
          recommendation: annualDefault ? null : `Test an Annual default against today's Monthly default before changing it.`,
          expectedMechanism: 'The default effect: the preselected option is chosen more often.',
          confidence: confidenceFromScience('default-effect'),
          severity: annualDefault ? 'note' : 'test',
          test: annualDefault
            ? undefined
            : proposeTest({
                hypothesis: 'Preselecting Annual changes which cadence people choose.',
                science: 'Default Effect',
                observation: `${selected?.title} is preselected today.`,
                goal: 'Drive Annual Plan',
                control: `${selected?.title} preselected, as today.`,
                variant: `${yearly.title} preselected; everything else unchanged.`,
                primaryMeasure: 'Annual-plan selection on this screen',
                learn: 'Whether changing the default causally changes cadence selection without an unacceptable effect elsewhere.',
                goalRelevant: true,
                strongMechanism: true,
              }),
          goals: { 'drive-annual': annualDefault ? 1 : -1 },
        }),
      )

      // The verified saving: an existing fact the copy may state.
      if (saving > 0) {
        out.push(
          finding({
            brain: 'goal',
            criterion: 'offer-comprehension',
            sciences: ['reference-price', 'framing'],
            screen: 'cadence',
            element: 'goal:drive-annual:benefit',
            highlight: [yearly.price],
            observation: stated ? `The annual option says what it saves.` : `Paying yearly saves ${saving}% against 12 monthly payments, and nothing on the screen says so.`,
            evidence: [...contentEvidence(`${yearly.price}/${yearly.unit}`, `${monthly?.price}/${monthly?.unit}`), ...scienceEvidence('reference-price')],
            interpretation: stated ? `The reason to commit is beside the price.` : `The reason to commit for a year is left to the reader's arithmetic.`,
            recommendation: stated ? null : `State the verified saving next to the yearly price. It is already true in the numbers; the price does not change.`,
            expectedMechanism: 'A stated reference makes the larger amount readable as a saving rather than a jump.',
            confidence: confidenceFromScience('reference-price'),
            severity: stated ? 'note' : 'check',
            validation: 'none',
            goals: { 'drive-annual': stated ? 1 : -1 },
          }),
        )
      }
    }
  }

  // Acquire for Specific Content.
  if (on('acquire-content')) {
    const t = target('acquire-content')
    if (!t) askFor('acquire-content', 'which content')
    else {
      continuity('acquire-content', t)
      // The default plan this content points at.
      const isTeam = Object.values(s.teamNames).includes(t)
      const carriers = isTeam ? s.plans.filter((p) => p.teams.includes(t)) : []
      if (carriers.length && renders(s, 'plans')) {
        const best = carriers.reduce((a, b) => (a.teams.length <= b.teams.length ? a : b))
        planAlignment('acquire-content', best, `the smallest plan that carries ${t.split(' ').pop()}`)
      }
    }
  }

  // Acquire Specific Audience.
  if (on('acquire-audience')) {
    const t = target('acquire-audience')
    if (!t) askFor('acquire-audience', 'which audience')
    else {
      const notice = renders(s, 'auth') && f.auth.noticeTitle.trim() ? `The sign-in screen speaks to one audience by name: “${f.auth.noticeTitle.trim()}”.` : 'No screen addresses an audience by name.'
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['mental-models', 'processing-fluency'],
          screen: renders(s, 'auth') ? 'auth' : 'landing',
          element: 'goal:acquire-audience',
          observation: `The audience is “${t}”. ${notice}`,
          evidence: scienceEvidence('mental-models'),
          interpretation: `Whether the words fit ${t} is a question about them, not about the copy. Without research the Coach would be guessing.`,
          recommendation: null,
          confidence: 'low',
          severity: 'check',
          validation: 'research',
          nextStep: `User research with ${t}, or DAZN data on how they move through this journey, would say whether the words land.`,
          goals: {},
        }),
      )
    }
  }

  // Drive Specific Offer.
  if (on('drive-offer')) {
    const t = target('drive-offer')
    if (!t) askFor('drive-offer', 'which offer')
    else {
      const present = screensMentioning(t)
      const anyDiscount = s.plans.some((p) => /save|off|then/i.test(p.cta))
      if (present.length === 0 && !anyDiscount) {
        out.push(
          finding({
            brain: 'goal',
            criterion: 'offer-comprehension',
            sciences: ['causal-inference'],
            screen: 'plans',
            element: 'goal:drive-offer:absent',
            observation: `The offer “${t}” is not on any screen. Every plan shows one plain price.`,
            evidence: contentEvidence(t),
            interpretation: `An offer that is not on screen cannot be prioritised.`,
            recommendation: `Show the offer where the price is: the plan cards and the cadence screen. Its terms stay as they are.`,
            confidence: 'high',
            severity: 'fix',
            goals: { 'drive-offer': -1 },
          }),
        )
      } else continuity('drive-offer', t)
    }
  }

  // Drive Specific Benefit.
  if (on('drive-benefit')) {
    const t = target('drive-benefit')
    if (!t) askFor('drive-benefit', 'which benefit')
    else if (renders(s, 'plans')) {
      const carriers = s.plans.filter((p) => [p.description, ...p.features].some((x) => x.toLowerCase().includes(t.toLowerCase())))
      const everyone = carriers.length === s.plans.length
      const lead = `${f.landing.body} ${f.landing.title}`.toLowerCase().includes(t.toLowerCase())
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['means-end-chain', 'attribute-based-choice'],
          screen: carriers.length ? 'plans' : 'landing',
          element: 'goal:drive-benefit',
          observation: carriers.length
            ? `“${t}” is on ${everyone ? 'every plan' : carriers.map((p) => p.name).join(' and ')}${lead ? ' and on the landing page' : ', but not on the landing page'}.`
            : `“${t}” is not on any plan card${lead ? ', only on the landing page' : ' or the landing page'}.`,
          evidence: contentEvidence(t),
          interpretation: carriers.length === 0 ? `The benefit meant to be the reason to choose is missing where the choice is made.` : everyone ? `A benefit every plan shares is a reason to choose DAZN, not a reason to choose a plan.` : `The benefit sets ${carriers.map((p) => p.name).join(' and ')} apart, which is what a lead benefit does.`,
          recommendation: carriers.length === 0 ? `Put it on the cards, in the words the goal uses.` : lead ? null : `Lead with it on the landing page too.`,
          expectedMechanism: 'A benefit stated where the decision is made connects the attribute to a reason to choose.',
          confidence: 'high',
          severity: carriers.length === 0 ? 'fix' : lead ? 'note' : 'check',
          validation: 'none',
          goals: { 'drive-benefit': carriers.length === 0 ? -1 : lead ? 1 : -1 },
        }),
      )
    }
  }

  // Maintain Campaign Proposition.
  if (on('maintain-proposition')) {
    const t = target('maintain-proposition')
    if (!t) askFor('maintain-proposition', 'the campaign proposition')
    else continuity('maintain-proposition', t)
  }

  // Trade-offs between configured directions.
  if (on('drive-package') && on('drive-bundle')) {
    const a = s.plans.find((p) => ctx.prioritisedTiers.includes(p.id))
    if (a && !/bundle/i.test(a.name)) {
      out.push(
        finding({
          brain: 'goal',
          criterion: 'goal-alignment',
          sciences: ['choice-architecture'],
          screen: 'plans',
          element: 'goal:tradeoff',
          observation: `Two directions point at two plans: ${a.name} (Drive Specific Package) and the bundle.`,
          evidence: [],
          interpretation: `One screen can favour one plan. The Coach cannot settle which; that is a business decision.`,
          recommendation: null,
          confidence: 'high',
          severity: 'check',
          validation: 'none',
          goals: {},
        }),
      )
    }
  }

  // What this brain will not do.
  out.push(
    finding({
      brain: 'goal',
      criterion: 'goal-alignment',
      sciences: ['causal-inference'],
      screen: 'journey',
      element: 'pricing-stance',
      observation: `${s.plans.length} plan prices and ${f.cadence.options.length} ways to pay.`,
      evidence: [],
      interpretation: `The Coach judges how prices are shown and compared, never whether they are the right prices. It will not raise, lower or invent one, and it claims no business outcome without DAZN causal evidence.`,
      recommendation: null,
      confidence: 'high',
      severity: 'note',
      goals: {},
    }),
  )

  void nextStepFor
  return out
}
