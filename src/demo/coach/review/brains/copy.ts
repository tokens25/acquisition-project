import type { CoachReviewContext } from '../../brief'
import { contentEvidence, scienceEvidence } from '../evidence'
import { finding, hasWord } from '../finding'
import { renders, screenName, screenStrings, type JourneySnapshot } from '../snapshot'
import type { Finding, ScreenId } from '../types'

/**
 * Copy Brain: the hero Copy AI's intelligence applied to a journey. Clarity
 * (Processing Fluency), one action one name, concrete over abstract, value
 * framing (does the copy give a reason, not just a description), CTA
 * language that says what happens, truth guards against unsupported urgency,
 * and the commitment gradient (asking no more than the step has earned). The
 * checks that need no judgement run here; the AI reading adds the rest.
 */
const URGENCY = /\b(hurry|only today|today only|limited time|last chance|ends soon|don.t miss|act now|selling fast|now or never)\b/i
const ABSTRACT = /\b(premium|seamless|amazing|world-class|unrivalled|unmatched|ultimate experience|next level|best-in-class|cutting-edge|revolutionary)\b/i
const FILLER_CTA = /^(learn more|click here|submit|get started|find out more|go|ok)$/i

export function copyBrain(s: JourneySnapshot, ctx: CoachReviewContext): Finding[] {
  const out: Finding[] = []
  void ctx
  const strings = screenStrings(s).filter((x) => x.field !== 'team' && !x.field.endsWith(' team') && !x.field.endsWith(' name') && !x.field.endsWith(' option') && !x.field.endsWith(' ribbon'))

  // One action, two names.
  const signIn = strings.filter((x) => /\bsign in\b/i.test(x.text))
  const logIn = strings.filter((x) => /\blog in\b/i.test(x.text))
  if (signIn.length && logIn.length) {
    const all = [...signIn, ...logIn]
    out.push(
      finding({
        brain: 'copy',
        criterion: 'journey-consistency',
        sciences: ['processing-fluency', 'consistency-check'],
        screen: all[0].screen,
        alsoOn: [...new Set(all.slice(1).map((x) => x.screen))],
        element: 'sign-in-vs-log-in',
        highlight: all.map((x) => x.text.trim()),
        observation: `The same action is called “sign in” on ${[...new Set(signIn.map((x) => screenName(s, x.screen)))].join(', ')} and “log in” on ${[...new Set(logIn.map((x) => screenName(s, x.screen)))].join(', ')}.`,
        evidence: contentEvidence(signIn[0].text.trim(), logIn[0].text.trim()),
        interpretation: `Two names for one action make readers check whether they are the same thing. They are.`,
        recommendation: `Use “Sign in” everywhere.`,
        expectedMechanism: 'One term for one action removes a comprehension step on every screen it appears.',
        confidence: 'high',
        severity: 'fix',
        goals: { 'maintain-proposition': -1 },
        fix: { label: 'Use “Sign in” everywhere', replace: [{ from: 'Log in', to: 'Sign in' }, { from: 'log in', to: 'sign in' }, { from: 'Login', to: 'Sign in' }] },
      }),
    )
  }

  // Slips the reader will notice. One finding per distinct string.
  const seen = new Map<string, { screen: ScreenId; field: string }[]>()
  for (const x of strings) seen.set(x.text.trim(), [...(seen.get(x.text.trim()) ?? []), x])
  for (const [text, places] of seen) {
    const first = places[0]
    const where = places.length > 1 ? `${screenName(s, first.screen)}, on ${places.length} cards` : screenName(s, first.screen)
    const alsoOn = [...new Set(places.slice(1).map((x) => x.screen).filter((sc) => sc !== first.screen))]
    if (/\b1 (locations|devices|games|teams|months)\b/i.test(text)) {
      const to = text.replace(/\b1 (\w+)s\b/i, '1 $1')
      out.push(
        finding({
          brain: 'copy',
          criterion: 'decision-clarity',
          sciences: ['processing-fluency'],
          screen: first.screen,
          alsoOn,
          element: `grammar:${text}`,
          highlight: [text],
          observation: `“${text}” (${where}) has a plural after “1”.`,
          evidence: contentEvidence(text),
          interpretation: `A slip in the list of what you get reads as carelessness about what you get.`,
          recommendation: `“${to}”.`,
          confidence: 'high',
          severity: 'fix',
          goals: {},
          fix: { label: 'Fix the wording', replace: [{ from: text, to }] },
        }),
      )
    }
    if (/\.\s+[a-z]/.test(text) && !/e\.g\.|i\.e\./i.test(text)) {
      const to = text.replace(/\.\s+([a-z])/, (_, c: string) => `, ${c}`)
      out.push(
        finding({
          brain: 'copy',
          criterion: 'decision-clarity',
          sciences: ['processing-fluency'],
          screen: first.screen,
          alsoOn,
          element: `lowercase:${text}`,
          highlight: [text],
          observation: `“${text}” (${where}) has a lower-case word after a full stop.`,
          evidence: contentEvidence(text),
          interpretation: `Either the stop is a comma or the next word needs a capital.`,
          recommendation: `“${to}”.`,
          confidence: 'high',
          severity: 'fix',
          goals: {},
          fix: { label: 'Fix the punctuation', replace: [{ from: text, to }] },
        }),
      )
    }
  }

  // Truth guard: urgency the content cannot back.
  const urgent = strings.filter((x) => URGENCY.test(x.text))
  if (urgent.length) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'informed-choice',
        sciences: ['persuasion-knowledge', 'reactance'],
        screen: urgent[0].screen,
        alsoOn: [...new Set(urgent.slice(1).map((x) => x.screen))],
        element: 'urgency',
        highlight: urgent.map((x) => x.text.trim()),
        observation: `Urgency language on ${urgent.map((x) => `${screenName(s, x.screen)} (“${x.text.trim()}”)`).join(', ')}, with no date or limit behind it.`,
        evidence: contentEvidence(...urgent.map((x) => x.text.trim())),
        interpretation: `Invented urgency is the push readers notice and resist.`,
        recommendation: `Remove it unless it is literally true, like a real end date or match time.`,
        confidence: 'high',
        severity: 'fix',
        goals: {},
      }),
    )
  }

  // Concrete over abstract: words that describe nothing.
  const abstract = strings.filter((x) => ABSTRACT.test(x.text))
  if (abstract.length) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'decision-clarity',
        sciences: ['processing-fluency', 'means-end-chain'],
        screen: abstract[0].screen,
        alsoOn: [...new Set(abstract.slice(1).map((x) => x.screen))],
        element: 'abstract-words',
        highlight: abstract.map((x) => x.text.trim()),
        observation: `${abstract.length} strings lean on abstract words (${abstract.map((x) => `“${(x.text.match(ABSTRACT) ?? [''])[0]}”`).join(', ')}).`,
        evidence: [...contentEvidence(...abstract.slice(0, 2).map((x) => x.text.trim())), ...scienceEvidence('means-end-chain')],
        interpretation: `A word like “premium” names nothing the reader can check. A team, a game, a device does.`,
        recommendation: `Replace each with the concrete thing it stands for.`,
        expectedMechanism: 'Concrete words are understood faster and believed more readily than abstract ones.',
        confidence: 'medium',
        severity: 'check',
        validation: 'none',
        goals: {},
      }),
    )
  }

  // CTA language: the button says what happens next.
  const buttons = strings.filter((x) => /button/.test(x.field))
  const filler = buttons.filter((x) => FILLER_CTA.test(x.text.trim()))
  if (filler.length) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'decision-clarity',
        sciences: ['information-scent', 'processing-fluency'],
        screen: filler[0].screen,
        alsoOn: [...new Set(filler.slice(1).map((x) => x.screen))],
        element: 'filler-cta',
        highlight: filler.map((x) => x.text.trim()),
        observation: `${filler.map((x) => `“${x.text.trim()}” on ${screenName(s, x.screen)}`).join(', ')}: a button that does not say what happens next.`,
        evidence: [...contentEvidence(...filler.map((x) => x.text.trim())), ...scienceEvidence('information-scent')],
        interpretation: `Readers press a button when they can predict where it leads.`,
        recommendation: `Say the outcome: “Get MSG+”, “Pay now”, “Continue to payment”.`,
        expectedMechanism: 'A button that names the next step gives the reader scent for it.',
        confidence: 'medium',
        severity: 'check',
        validation: 'none',
        goals: {},
      }),
    )
  }

  // Value framing: does each card say what you get in the reader's terms.
  if (renders(s, 'plans')) {
    const concrete = s.plans.filter((p) => p.teams.some((t) => hasWord(p.description, t.split(' ').pop() ?? t)))
    const vague = s.plans.filter((p) => !concrete.includes(p) && !/\d/.test(p.description) && !s.plans.some((o) => o.id !== p.id && hasWord(p.description, o.name)))
    if (concrete.length) {
      out.push(
        finding({
          brain: 'copy',
          criterion: 'package-comparison',
          sciences: ['means-end-chain', 'processing-fluency'],
          screen: 'plans',
          element: 'descriptions-name-teams',
          highlight: concrete.map((p) => p.description),
          observation: `${concrete.map((p) => p.name).join(' and ')} name their teams in the description.`,
          evidence: contentEvidence(...concrete.map((p) => p.description)),
          interpretation: `That says what you get in the words a fan thinks in. This is working.`,
          recommendation: null,
          confidence: 'high',
          severity: 'note',
          goals: { 'acquire-content': 1, 'drive-benefit': 1 },
        }),
      )
    }
    for (const p of vague) {
      out.push(
        finding({
          brain: 'copy',
          criterion: 'package-comparison',
          sciences: ['means-end-chain'],
          screen: 'plans',
          element: `plan:${p.id}:vague`,
          highlight: [p.description],
          observation: `${p.name} is described as “${p.description}”. It names no team, game or number.`,
          evidence: [...contentEvidence(p.description), ...scienceEvidence('means-end-chain')],
          interpretation: `A description without a concrete thing in it gives no reason to choose this plan over the next.`,
          recommendation: `Say what ${p.name} includes: the teams, the games, the count.`,
          confidence: 'medium',
          severity: 'check',
          validation: 'none',
          goals: { 'drive-package': -1 },
          copyTarget: { path: `tier:${p.id}.description`, label: `${p.name} description`, current: p.description, allowedTerms: p.teams },
        }),
      )
    }
  }

  // Commitment gradient: "Confirm and continue" where nothing is confirmed yet.
  const confirms = buttons.filter((x) => /confirm and continue/i.test(x.text))
  const authFirst = confirms.find((x) => x.screen === 'auth')
  if (confirms.length >= 2 && authFirst) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'decision-friction',
        sciences: ['processing-fluency', 'commitment-consistency'],
        screen: 'auth',
        element: 'confirm-and-continue',
        highlight: [authFirst.text],
        observation: `The sign-in button says “${authFirst.text}”, but nothing has been entered yet to confirm.`,
        evidence: [...contentEvidence(authFirst.text), ...scienceEvidence('commitment-consistency')],
        interpretation: `The button asks for a bigger commitment than the step has earned. On the later screens the same label is true.`,
        recommendation: `“Continue” on the sign-in screen.`,
        expectedMechanism: 'A button that matches the size of the step keeps the ask honest.',
        confidence: 'medium',
        severity: 'check',
        validation: 'none',
        goals: {},
        fix: { label: 'Use “Continue” here', replace: [{ from: 'path:auth.cta', to: 'Continue' }] },
      }),
    )
  }

  // Stray spaces.
  const untidy = strings.filter((x) => /\s$/.test(x.text) || /\s{2,}/.test(x.text.trim()))
  if (untidy.length) {
    out.push(
      finding({
        brain: 'copy',
        criterion: 'decision-clarity',
        sciences: ['consistency-check'],
        screen: untidy[0].screen,
        alsoOn: [...new Set(untidy.slice(1).map((x) => x.screen))],
        element: 'whitespace',
        highlight: [],
        observation: `${untidy.length} strings end in a space or have a double space (${[...new Set(untidy.map((x) => screenName(s, x.screen)))].join(', ')}).`,
        evidence: contentEvidence(...untidy.slice(0, 2).map((x) => x.text)),
        interpretation: `Invisible on screen, but a sign the copy was pasted rather than written into place.`,
        recommendation: `Trim them.`,
        confidence: 'high',
        severity: 'note',
        goals: {},
        fix: { label: 'Trim every string', trim: true },
      }),
    )
  }

  return out
}
