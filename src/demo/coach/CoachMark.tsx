import type { Review, ScreenId } from './review/types'
import './coach.css'

/**
 * The count beside a screen's name: how many findings touch it, coloured by
 * the worst of them. Nothing for a screen with only notes, a badge on every
 * row would say nothing about any of them.
 */
export function CoachMark({ review, screen }: { review: Review; screen: string }) {
  const s = review.byScreen.find((x) => x.screen === (screen as ScreenId))
  if (!s || s.fixes + s.tests + s.checks === 0) return null
  const worst = s.fixes > 0 ? 'fix' : s.tests > 0 ? 'test' : 'check'
  const parts = [s.fixes ? `${s.fixes} to fix` : '', s.tests ? `${s.tests} to test` : '', s.checks ? `${s.checks} to check` : ''].filter(Boolean)
  return (
    <span className="coach-mark" data-severity={worst} title={`Coach: ${parts.join(' · ')}`} aria-label={`Coach: ${parts.join(', ')}`}>
      {s.fixes + s.tests + s.checks}
    </span>
  )
}
