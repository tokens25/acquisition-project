import './studio.css'

import type { ReactNode } from 'react'
import type { CopyCheck, CopyLimit } from './copy'

/**
 * Label, control, hint — the row every studio panel is built from.
 *
 * Ported from Project A, where the same wrapper keeps a long column of
 * controls aligned. The label row keeps its height whether or not anything
 * sits beside the label, so fields do not shuffle as counters appear.
 */
export function Field({
  label,
  htmlFor,
  labelAside,
  aside,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  /** Sits immediately after the label text — a trigger, a mark. */
  labelAside?: ReactNode
  /** Sits at the right of the label row — usually a counter. */
  aside?: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={['st-field', className].filter(Boolean).join(' ')}>
      <div className="st-field__row">
        <div className="st-field__name">
          <label htmlFor={htmlFor} className="st-field__label">
            {label}
          </label>
          {labelAside}
        </div>
        {aside}
      </div>
      {children}
      {hint && <p className="st-field__hint">{hint}</p>}
    </div>
  )
}

/**
 * How much has been written, out of how much there is room for.
 *
 * Hidden while the field is empty, so an untouched panel is not trailed by a
 * column of zeroes. `warn` stays the quiet colour: only `over` is a problem.
 */
export function CharacterCounter({ check }: { check: CopyCheck }) {
  if (check.count === 0) return null
  return (
    <span className="st-count" data-status={check.status === 'over' ? 'over' : undefined}>
      {check.count}
      <span className="st-count__hard">/{check.hard}</span>
    </span>
  )
}

/**
 * The counter inside the control's own bottom-right corner, which leaves the
 * label row free for actions.
 *
 * A textarea grows downward from its first line, so the count belongs at the
 * bottom. A single-line input centres its text, so `center` puts the count
 * beside the value rather than below it.
 */
export function WithInsetCounter({
  check,
  children,
  align = 'bottom',
}: {
  check: CopyCheck
  children: ReactNode
  align?: 'bottom' | 'center'
}) {
  return (
    <div className="st-inset">
      {children}
      {check.count > 0 && (
        <span className="st-inset__count" data-align={align}>
          <CharacterCounter check={check} />
        </span>
      )}
    </div>
  )
}

/** Said out loud, once there is no more room to type. */
export function LimitMessage({
  value,
  limit,
  message,
}: {
  value: string
  limit: CopyLimit
  message?: string
}) {
  if (value.length < limit.hard) return null
  return (
    <p className="st-limit" role="status">
      {message ?? `Character limit reached · Maximum ${limit.hard} characters`}
    </p>
  )
}
