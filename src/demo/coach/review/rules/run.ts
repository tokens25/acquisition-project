import { contentEvidence, scienceEvidence } from '../evidence'
import { finding, looksLikePlaceholder, wordCount } from '../finding'
import type { Finding } from '../types'
import type { LandingFacts } from '../landing/facts'
import type { ContentRule } from './types'

/**
 * Running the written-down rules over a page.
 *
 * Every rule here reads the page's own facts, so every finding it raises can
 * quote what it read: these are content findings, and content is the evidence
 * that lets a Fix be a Fix. A rule that wanted to argue from science alone
 * would have to be code, and the guard downstream would hold it to Check
 * anyway.
 */

/** What a rule is looking at, once the facts are in hand. */
interface Subject {
  /** How a sentence names it. */
  what: string
  /** Where the finding points, so the panel can take you there. */
  element: string
  text: string
}

function subjects(rule: ContentRule, f: LandingFacts): Subject[] {
  const { look } = rule
  if (look.at === 'each-component') {
    return f.drawn.map((c) => ({
      what: c.copy ? `${c.label} (copy)` : c.label,
      element: `landing:${c.id}:${look.field}`,
      text:
        look.field === 'heading'
          ? c.heading
          : look.field === 'cta'
            ? c.cta
            : c.words.filter((w) => w.trim() !== '').join(' '),
    }))
  }
  if (look.at === 'component') {
    const on = f.drawn.find((c) => c.type === look.type)
    const known = f.components.find((c) => c.type === look.type)
    return [
      {
        what: known?.label ?? look.type,
        element: `landing:${look.type}`,
        text: on ? on.heading : '',
      },
    ]
  }
  const named = NAMED_FIELDS[look.name]
  return named ? [{ what: look.name, element: `landing:${look.name}`, text: named(f) }] : []
}

/** The things a rule can name that are not a component. */
const NAMED_FIELDS: Record<string, (f: LandingFacts) => string> = {
  'the hero heading': (f) => f.hero.title,
  'the hero body': (f) => f.hero.body,
  'the hero button': (f) => f.hero.cta,
  'the footer': (f) => f.footer.links.join(', '),
}

/** Whether the rule's condition holds, and what it counted. */
function holds(rule: ContentRule, s: Subject, f: LandingFacts): { hit: boolean; count: number } {
  const { when } = rule
  switch (when.is) {
    case 'empty':
      return { hit: s.text.trim() === '', count: 0 }
    case 'placeholder':
      return { hit: s.text.trim() !== '' && looksLikePlaceholder(s.text), count: 0 }
    case 'longer-than':
      return { hit: wordCount(s.text) > when.words, count: wordCount(s.text) }
    case 'absent':
      return { hit: !f.drawn.some((c) => `landing:${c.type}` === s.element), count: 0 }
    case 'after': {
      const here = f.drawn.find((c) => `landing:${c.type}` === s.element)
      const other = f.drawn.find((c) => c.type === when.type)
      return { hit: Boolean(here && other && here.position > other.position), count: 0 }
    }
    case 'repeated': {
      const same = f.drawn.filter(
        (c) =>
          (rule.look.at === 'each-component' && rule.look.field === 'cta' ? c.cta : c.heading)
            .trim()
            .toLowerCase() === s.text.trim().toLowerCase(),
      )
      return { hit: s.text.trim() !== '' && same.length > 1, count: same.length }
    }
  }
}

export function runContentRules(rules: ContentRule[], f: LandingFacts): Finding[] {
  const out: Finding[] = []
  const said = new Set<string>()

  for (const rule of rules) {
    const given = rule.given
    if (given) {
      const on = f.drawn.some((c) => c.type === given.component)
      if (on !== given.on) continue
    }
    for (const s of subjects(rule, f)) {
      const { hit, count } = holds(rule, s, f)
      if (!hit) continue
      // A rule that counts across the page says it once, not once per thing.
      const key = `${rule.id}|${rule.when.is === 'repeated' ? s.text.trim().toLowerCase() : s.element}`
      if (said.has(key)) continue
      said.add(key)
      const words = rule.say({ what: s.what, text: s.text, count })
      out.push(
        finding({
          brain: rule.brain,
          criterion: rule.criterion,
          sciences: rule.sciences,
          screen: 'landing',
          element: s.element,
          observation: words.observation,
          /* What the rule read is what it quotes; a rule that found nothing to
             quote — an absent component — says so as the evidence. */
          evidence: s.text.trim()
            ? contentEvidence(s.text)
            : rule.sciences.length > 0 && rule.when.is !== 'empty' && rule.when.is !== 'absent'
              ? scienceEvidence(...rule.sciences)
              : contentEvidence(`${s.what}: nothing on the page`),
          interpretation: words.interpretation,
          recommendation: words.recommendation,
          confidence: rule.confidence ?? 'high',
          severity: rule.severity,
          highlight: s.text.trim() ? [s.text] : [],
        }),
      )
    }
  }
  return out
}
