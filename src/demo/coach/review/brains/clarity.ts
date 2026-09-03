import type { CoachReviewContext } from '../../brief'
import { confidenceFromScience, contentEvidence, scienceEvidence } from '../evidence'
import { finding, looksLikePlaceholder, wordCount } from '../finding'
import { renders, screenName, type JourneySnapshot } from '../snapshot'
import type { Finding, ScreenId } from '../types'

/** Field labels the finding uses, to the path in the flow copy. */
const FIELD_PATH: Record<string, string> = {
  'heading over the teams': 'resultsLabel',
  heading: 'heading',
  notice: 'noticeTitle',
  footnote: 'footnote',
  'summary title': 'summaryTitle',
  title: 'title',
}

/**
 * Cognitive & Clarity Brain: how much a screen asks the reader to hold,
 * whether the same thing is called the same thing everywhere, and whether
 * information arrives when it is needed.
 */
export function clarityBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  const f = s.flow

  // Placeholder text left on screen.
  const strings: { screen: ScreenId; field: string; text: string }[] = [
    { screen: 'zip', field: 'heading over the teams', text: f.zip.resultsLabel },
    { screen: 'zip', field: 'heading', text: f.zip.heading },
    { screen: 'auth', field: 'notice', text: f.auth.noticeTitle },
    { screen: 'cadence', field: 'footnote', text: f.cadence.footnote },
    { screen: 'checkout', field: 'summary title', text: f.checkout.summaryTitle },
    { screen: 'ready', field: 'title', text: f.ready.title },
    { screen: 'plans', field: 'screen title', text: f.plans?.navTitle ?? '' },
  ]
  for (const { screen, field, text } of strings) {
    if (renders(s, screen) && looksLikePlaceholder(text)) {
      out.push(
        finding({
          brain: 'clarity',
          criterion: 'decision-clarity',
          sciences: ['consistency-check'],
          screen,
          element: `${screen}:${field}`,
          highlight: [text],
          observation: `The ${field} on ${screenName(s, screen)} still reads “${text}”. That is placeholder text.`,
          evidence: contentEvidence(text),
          interpretation: `Readers meet a string that means nothing, where the screen explains what their ZIP code unlocked.`,
          recommendation: `Write the ${field}. It should name the teams this ZIP code can watch.`,
          confidence: 'high',
          severity: 'fix',
          goals: { 'acquire-content': -1 },
          copyTarget: { path: `path:${screen}.${FIELD_PATH[field] ?? field}`, label: `${screenName(s, screen)} ${field}`, current: text, maxLength: 40 },
          suggestion: field === 'heading over the teams' ? { source: 'rules', approved: true, after: 'Teams you can watch', why: 'Taken from the sentence above the field: "which local teams and games you can watch".' } : undefined,
        }),
      )
    }
  }

  // One title on many screens.
  const titled = ([
    { screen: 'cadence', title: f.cadence.navTitle },
    { screen: 'auth', title: f.auth.navTitle },
    { screen: 'account', title: f.account.navTitle },
    { screen: 'zip', title: f.zip.navTitle },
    { screen: 'checkout', title: f.checkout.navTitle },
    { screen: 'ready', title: f.ready.navTitle },
  ] as { screen: ScreenId; title: string }[]).filter((t) => renders(s, t.screen))
  if (renders(s, 'plans') && f.plans?.navTitle) titled.unshift({ screen: 'plans', title: f.plans.navTitle })
  const byTitle = new Map<string, ScreenId[]>()
  for (const t of titled) byTitle.set(t.title.trim(), [...(byTitle.get(t.title.trim()) ?? []), t.screen])
  for (const [title, screens] of byTitle) {
    if (screens.length >= 3) {
      out.push(
        finding({
          brain: 'clarity',
          criterion: 'journey-consistency',
          sciences: ['processing-fluency', 'information-scent'],
          screen: screens[screens.length - 1],
          alsoOn: screens.slice(0, -1),
          element: 'nav-title',
          highlight: [title],
          observation: `${screens.length} screens share the title “${title}”: ${screens.map((id) => screenName(s, id)).join(', ')}.`,
          evidence: [...contentEvidence(title), ...scienceEvidence('processing-fluency', 'information-scent')],
          interpretation: `The title is how readers know where they are. When payment and sign-in say the same thing, it stops telling them.`,
          recommendation: `Give each screen a title that says what it does, the way “${f.account.navTitle}” and “${f.zip.navTitle}” already do.`,
          expectedMechanism: 'A title that names the step lets readers place themselves without reading the screen.',
          confidence: confidenceFromScience('processing-fluency'),
          severity: 'check',
          validation: 'none',
          goals: { 'maintain-proposition': -1 },
        }),
      )
    }
  }

  // The same words meaning two things.
  if (renders(s, 'cadence') && renders(s, 'checkout')) {
    const option = f.cadence.options.find((o) => o.title.trim().toLowerCase() === f.checkout.payCta.trim().toLowerCase())
    if (option) {
      out.push(
        finding({
          brain: 'clarity',
          criterion: 'purchase-confidence',
          sciences: ['processing-fluency', 'consistency-check'],
          screen: 'checkout',
          alsoOn: ['cadence'],
          element: 'pay-now-wording',
          highlight: [option.title, f.checkout.payCta],
          observation: `“${f.checkout.payCta}” is the pay button on Checkout, and also the name of the yearly option on Cadence.`,
          evidence: contentEvidence(option.title, f.checkout.payCta),
          interpretation: `The same words mean a way to pay on one screen and the act of paying on the next.`,
          recommendation: `Call the yearly option “Pay ${option.unit}ly”, to match “Pay monthly”. Keep “${f.checkout.payCta}” for the button.`,
          expectedMechanism: 'One phrase, one meaning, across consecutive screens.',
          confidence: 'high',
          severity: 'fix',
          goals: { 'drive-annual': -1 },
          fix: { label: `Rename it “Pay ${option.unit}ly”`, replace: [{ from: `path:cadence.options.${f.cadence.options.indexOf(option)}.title`, to: `Pay ${option.unit}ly` }] },
        }),
      )
    }
  }

  // What the account screen asks at once.
  if (renders(s, 'account')) {
    const a = f.account
    const consentWords = wordCount(a.consentBody)
    out.push(
      finding({
        brain: 'clarity',
        criterion: 'decision-friction',
        sciences: ['cognitive-load', 'sludge'],
        screen: 'account',
        element: 'account-load',
        highlight: [a.consentBody],
        observation: `Account setup asks for name, email and a password with ${a.rules.length} rules, plus a ${consentWords}-word marketing consent.`,
        evidence: scienceEvidence('cognitive-load'),
        interpretation: `The consent is a separate decision, about being contacted, placed inside the one about joining.`,
        recommendation: null,
        confidence: 'low',
        severity: 'check',
        nextStep: `Check whether the consent must sit on this screen under ${s.market.label} rules. If it can move, the screen becomes one decision.`,
        goals: {},
      }),
    )
  }

  // The legal text at the moment of paying.
  if (renders(s, 'checkout')) {
    out.push(
      finding({
        brain: 'clarity',
        criterion: 'purchase-confidence',
        sciences: ['cognitive-load', 'progressive-disclosure'],
        screen: 'checkout',
        element: 'checkout-legal',
        highlight: [f.checkout.legal],
        observation: `The legal text above the pay button is ${wordCount(f.checkout.legal)} words.`,
        evidence: scienceEvidence('progressive-disclosure'),
        interpretation: `Some of it must be here: the start date and the renewal. The rest is reference reading at the moment of highest attention.`,
        recommendation: null,
        confidence: 'low',
        severity: 'note',
        goals: {},
      }),
    )
  }

  void ctx
  return out
}
