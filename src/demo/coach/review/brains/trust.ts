import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, contentEvidence, scienceEvidence } from '../evidence'
import { amountsIn, datesIn, finding, hasWord } from '../finding'
import { renders, type JourneySnapshot } from '../snapshot'
import { proposeTest } from '../tests'
import type { Finding } from '../types'

/** Labels that state a fact about others or about performance, against labels that state a business choice. */
const FACTUAL_CLAIM = /\b(most popular|popular|best value|best seller|most watched|top rated|save \d+%|\d+% off|#1|number one)\b/i
const BUSINESS_PICK = /\b(recommended|our pick|best experience|editor.s choice)\b/i

/**
 * Trust & Risk Brain: claims, conditions, contradictions and pressure,
 * especially near payment.
 */
export function trustBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const f = s.flow
  void ctx

  // A label is a claim when it implies evidence.
  if (renders(s, 'cadence')) {
    for (const o of f.cadence.options) {
      if (!o.badge.trim()) continue
      const factual = FACTUAL_CLAIM.test(o.badge)
      const pick = BUSINESS_PICK.test(o.badge)
      const mixedCase = /[A-Z]{3,}/.test(o.badge) && /[A-Z][a-z]+/.test(o.badge)
      out.push(
        finding({
          brain: 'trust',
          criterion: 'informed-choice',
          sciences: ['social-proof', 'signaling', 'persuasion-knowledge'],
          screen: 'cadence',
          element: `cadence:${o.id}:badge`,
          highlight: [o.badge],
          observation: factual
            ? `The yearly option carries “${o.badge}”. That is a claim about what other people choose, and nothing in the content backs it${mixedCase ? '; its casing is also mixed' : ''}.`
            : `The yearly option carries “${o.badge}”${pick ? ', a business recommendation rather than a factual claim' : ''}.`,
          evidence: factual ? [...contentEvidence(o.badge), ...scienceEvidence('social-proof', 'persuasion-knowledge')] : scienceEvidence('signaling'),
          interpretation: factual
            ? `“Most popular” works as social proof only if it is true. Readers who sense a claim with nothing behind it tend to resist.`
            : `A recommendation says which option the business stands behind. That is legitimate as long as it is meant.`,
          recommendation: factual
            ? `Back the claim with DAZN data, or reword it as a business recommendation (“Recommended”) or a verified fact (the yearly saving).${mixedCase ? ` If it stays, write it “${o.badge.toUpperCase()}” to match the card ribbons.` : ''}`
            : null,
          expectedMechanism: 'A label that states something true keeps its persuasive value; one that cannot be backed costs trust.',
          confidence: factual ? 'high' : 'medium',
          severity: factual ? 'fix' : 'note',
          validation: factual ? 'dazn-data' : 'none',
          nextStep: factual ? 'DAZN analytics on which cadence is chosen most would confirm or refute the claim.' : undefined,
          goals: { 'drive-annual': factual ? -1 : 1 },
          fix: factual && mixedCase ? { label: `Write it “${o.badge.toUpperCase()}”`, replace: [{ from: `path:cadence.options.${f.cadence.options.indexOf(o)}.badge`, to: o.badge.toUpperCase() }] } : undefined,
        }),
      )
    }
  }

  // The bill has to agree with itself.
  if (renders(s, 'checkout')) {
    const c = f.checkout
    const byPrice = new Map(f.cadence.options.map((o) => [amountsIn(o.price)[0], o]))
    for (const line of c.lines) {
      const option = byPrice.get(amountsIn(line.value)[0])
      if (option && line.unit && line.unit.trim().toLowerCase() !== option.unit.trim().toLowerCase()) {
        out.push(
          finding({
            brain: 'trust',
            criterion: 'purchase-confidence',
            sciences: ['consistency-check', 'perceived-risk'],
            screen: 'checkout',
            alsoOn: ['cadence'],
            element: `checkout:line:${line.label}`,
            highlight: [line.label, `/${line.unit}`],
            observation: `Checkout shows ${line.value} per ${line.unit}. Cadence shows the same ${option.price} per ${option.unit}.`,
            evidence: contentEvidence(`${line.value} /${line.unit}`, `${option.price}/${option.unit}`),
            interpretation: `The bill contradicts the screen before it, at the moment of paying.`,
            recommendation: `Change the unit to “${option.unit}”. The amount is right.`,
            confidence: 'high',
            severity: 'fix',
            goals: { 'drive-annual': -1 },
            fix: { label: `Change /${line.unit} to /${option.unit}`, replace: [{ from: `path:checkout.lines.${c.lines.indexOf(line)}.unit`, to: option.unit }] },
          }),
        )
      }
    }

    const lineDates = c.lines.flatMap((l) => datesIn(l.label))
    const noteDates = datesIn(c.renewalNote)
    if (lineDates.length && noteDates.length && !lineDates.some((d) => noteDates.includes(d))) {
      out.push(
        finding({
          brain: 'trust',
          criterion: 'purchase-confidence',
          sciences: ['consistency-check', 'perceived-risk'],
          screen: 'checkout',
          element: 'checkout:renewal-date',
          highlight: [lineDates[0], noteDates[0]],
          observation: `Checkout gives two renewal dates: ${lineDates[0]} in the summary and ${noteDates[0]} in the note below it.`,
          evidence: contentEvidence(lineDates[0], noteDates[0]),
          interpretation: `Whichever is right, the other tells readers the checkout does not know when it will charge them.`,
          recommendation: `Use one date in both places.`,
          confidence: 'high',
          severity: 'fix',
          goals: { 'drive-annual': -1 },
          fix: { label: `Use ${lineDates[0]} in both places`, replace: [{ from: noteDates[0], to: lineDates[0] }] },
        }),
      )
    }

    if (/encrypt|secure|cancel|change/i.test(c.note)) {
      out.push(
        finding({
          brain: 'trust',
          criterion: 'purchase-confidence',
          sciences: ['perceived-risk'],
          screen: 'checkout',
          element: 'checkout:note',
          highlight: [c.note],
          observation: `Checkout opens by saying payment is encrypted and can be changed any time.`,
          evidence: scienceEvidence('perceived-risk'),
          interpretation: `That answers the two questions people have at the moment of paying. This is working.`,
          recommendation: null,
          confidence: 'medium',
          severity: 'note',
          goals: {},
        }),
      )
    }
  }

  // Later screens written for one plan only.
  if (renders(s, 'plans') && s.plans.length > 1) {
    const names = s.plans.map((p) => p.name)
    const mentions = (text: string) => names.filter((n) => hasWord(text, n))
    const fixed: { screen: 'cadence' | 'checkout' | 'ready'; where: string; text: string }[] = []
    if (renders(s, 'checkout') && mentions(f.checkout.summaryTitle).length === 1) fixed.push({ screen: 'checkout', where: 'the order summary', text: f.checkout.summaryTitle })
    if (renders(s, 'ready') && mentions(f.ready.title).length === 1) fixed.push({ screen: 'ready', where: 'the confirmation', text: f.ready.title })
    if (renders(s, 'cadence')) {
      const monthly = f.cadence.options.find((o) => /month/i.test(o.unit))
      const plan = monthly && s.plans.find((p) => p.priceNumber === amountsIn(monthly.price)[0])
      if (plan) fixed.push({ screen: 'cadence', where: 'the monthly price', text: monthly.price })
    }
    if (fixed.length) {
      const only = mentions(fixed[0].text)[0] ?? s.plans[0].name
      const others = names.filter((n) => n !== only)
      const w = fixed.map((x) => x.where)
      const list = w.length > 1 ? `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}` : w[0]
      out.push(
        finding({
          brain: 'trust',
          criterion: 'journey-consistency',
          sciences: ['consistency-check', 'expectation-confirmation'],
          screen: fixed[0].screen,
          alsoOn: fixed.slice(1).map((x) => x.screen),
          element: 'single-plan-strings',
          highlight: fixed.map((x) => x.text),
          observation: `${list[0].toUpperCase() + list.slice(1)} ${fixed.length > 1 ? 'are' : 'is'} written for ${only} only. Someone who picks ${others.join(' or ')} still sees ${only} at checkout.`,
          evidence: contentEvidence(...fixed.map((x) => x.text)),
          interpretation: `${others.length} of ${names.length} paths end with the wrong plan on the bill.`,
          recommendation: `Make these screens read the plan that was chosen instead of a typed name.`,
          confidence: 'high',
          severity: 'fix',
          goals: { 'drive-package': -1, 'maintain-proposition': -1 },
        }),
      )
    }
  }

  // "Free" on the way to a paid plan.
  if (renders(s, 'auth') && renders(s, 'plans') && /\bfree\b/i.test(f.auth.title)) {
    out.push(
      finding({
        brain: 'trust',
        criterion: 'informed-choice',
        sciences: ['expectation-confirmation', 'persuasion-knowledge'],
        screen: 'auth',
        element: 'auth:title',
        highlight: [f.auth.title],
        observation: `Two screens after choosing a paid plan, the sign-in screen says “${f.auth.title}”.`,
        evidence: [...contentEvidence(f.auth.title), ...scienceEvidence('expectation-confirmation')],
        interpretation: `The account is free, the plan is not. Read in order, “free” can sound like a promise the payment screen then breaks. Whether readers hear it that way is unknown.`,
        recommendation: null,
        confidence: confidenceFromScience('expectation-confirmation'),
        severity: 'test',
        test: proposeTest({
          hypothesis: 'Removing “for free” from the sign-in title reduces the expectation gap before payment.',
          science: 'Expectation-Confirmation Theory',
          observation: 'The word “free” appears two screens before a paid checkout.',
          control: `“${f.auth.title}”`,
          variant: `“${f.auth.title.replace(/\s*for free\b/i, '')}”`,
          primaryMeasure: 'Progression from sign-in to completed payment',
          learn: 'Whether the word changes progression through payment at all.',
          goalRelevant: false,
          strongMechanism: true,
        }),
        goals: { 'maintain-proposition': -1 },
        copyTarget: { path: 'path:auth.title', label: 'Sign-in title', current: f.auth.title, maxLength: 40 },
      }),
    )
  }

  return out
}
