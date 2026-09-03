import type { CardSet } from '../rules/content'
import { keepAsIs } from './fields'

/**
 * The Coach's gate, as it applies to a translation.
 *
 * Every other line the tool writes goes through the Coach before anyone sees
 * it, and a translation is a line the tool wrote. So the same discipline
 * applies here: what comes back is checked, and a string that breaks a rule
 * keeps its English rather than going on screen unread.
 *
 * What is checked is what can honestly be checked across a language the tool
 * does not speak. A number is a number in every language, a brand is a brand,
 * a dash is a dash, and a button that no longer fits is a broken button. Tone,
 * specificity and value are judged in the prompt the translator writes to and
 * by the person who reads it before promoting it, not by a regular expression
 * looking for English words in Japanese.
 */
export interface Verdict {
  ok: boolean
  /** Why not, in words a person can act on. */
  reason?: string
}

/**
 * The numbers in a line, as values rather than as they are written.
 *
 * A translation is allowed to write a number the way the language writes it:
 * German puts a comma where English puts a decimal point, and a date loses its
 * leading zero. None of that changes the fact, so every run of digits is taken
 * on its own and read as a value, which makes "01/10/2027" and "1.10.2027" the
 * same three numbers.
 *
 * Sorted, because a sentence may put its numbers in another order and still say
 * the same thing. That does mean two numbers swapping places passes this check,
 * so whether a date reads day-first is for the person who promotes it rather
 * than for a regular expression.
 */
const numbersIn = (text: string) =>
  (text.match(/\d+/g) ?? []).map((run) => Number(run)).sort((a, b) => a - b)

export function judgeTranslation(set: CardSet, english: string, translated: string): Verdict {
  const text = translated.trim()
  if (!text) return { ok: false, reason: 'came back empty' }

  // No dash of any kind, the same rule the Coach holds every line to.
  if (/[—–]/.test(text)) return { ok: false, reason: 'used a dash' }

  // A price, a date or a count is a fact. It may move in the sentence; it may
  // not change.
  const before = numbersIn(english)
  const after = numbersIn(text)
  if (before.join('|') !== after.join('|')) {
    return { ok: false, reason: before.length === after.length ? 'changed a number' : before.length > after.length ? 'dropped a number' : 'added a number' }
  }

  // A brand is not translated. Anything named in the English has to survive.
  for (const term of keepAsIs(set)) {
    if (!english.toLowerCase().includes(term.toLowerCase())) continue
    if (!text.toLowerCase().includes(term.toLowerCase())) return { ok: false, reason: `dropped the name "${term}"` }
  }

  // A line that no longer fits its screen is a broken screen. Generous, and
  // deliberately so: German compounds and French articles simply run longer
  // than English, and holding back a good translation for being long costs
  // more than a card footer that wraps. What this catches is a sentence where
  // an explanation has been added.
  // The floor is what a short label needs: "Pay now" is seven characters and
  // its French is nearer forty, which is not a problem with the French.
  const room = Math.max(48, Math.round(english.length * 1.9))
  if (text.length > room) return { ok: false, reason: 'far longer than the English' }

  return { ok: true }
}
