import type { JourneySnapshot } from './snapshot'
import type { CopySuggestion, CopyTarget } from './types'

/**
 * The Coach's approval of a piece of copy. The rules are the brief's, made
 * mechanical: nothing invented, nothing claimed, nothing pushed. A rewrite
 * that fails any one of them is not shown as a fix; the card says why.
 */
const URGENCY = /\b(hurry|only today|today only|limited time|last chance|ends soon|don.t miss|act now|selling fast|now or never)\b/i
const CLAIMS = /\b(best|most popular|#1|number one|top rated|unbeatable|unmissable|guaranteed|cheapest|lowest price)\b/i

export function approveCopy(target: CopyTarget, after: string, s: JourneySnapshot, source: 'rules' | 'ai'): CopySuggestion {
  const text = after.trim()
  const reject = (reason: string): CopySuggestion => ({ source: 'ai', approved: false, after: text, reason })

  if (!text) return reject('It is empty.')
  if (text === target.current.trim()) return reject('It is the same as what is there.')
  if (/—/.test(text)) return reject('It uses a dash the tool does not allow.')
  if (URGENCY.test(text)) return reject('It adds urgency the content cannot back.')
  if (CLAIMS.test(text) && !CLAIMS.test(target.current)) return reject('It adds a claim nothing on screen supports.')

  // No new numbers: a price, a count or a date that was not already there.
  const numbersBefore = new Set([...target.current.matchAll(/\d[\d.,]*/g)].map((m) => m[0]))
  const newNumbers = [...text.matchAll(/\d[\d.,]*/g)].map((m) => m[0]).filter((n) => !numbersBefore.has(n))
  if (newNumbers.length) return reject(`It introduces a number (${newNumbers[0]}) that is not in the content.`)

  // Only the teams the plan really carries.
  if (target.allowedTerms) {
    const allTeams = Object.values(s.teamNames)
    const shortOf = (n: string) => n.split(' ').pop() ?? n
    const allowed = new Set(target.allowedTerms.flatMap((t) => [t.toLowerCase(), shortOf(t).toLowerCase()]))
    for (const team of allTeams) {
      const short = shortOf(team)
      const mentioned = new RegExp(`(^|[^\\p{L}])${short}(?=$|[^\\p{L}])`, 'iu').test(text)
      if (mentioned && !allowed.has(short.toLowerCase())) return reject(`It names ${short}, which this plan does not include.`)
    }
  }

  const max = target.maxLength ?? Math.max(90, Math.round(target.current.length * 1.3))
  if (text.length > max) return reject(`It is too long (${text.length} characters; the field holds about ${max}).`)

  return { source, approved: true, after: text }
}
