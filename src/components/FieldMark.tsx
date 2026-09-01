import './fieldmark.css'

import type { ReactNode } from 'react'
import type { FieldChange } from './fieldMarks'
import { useFieldMark } from './fieldMarks'

/**
 * The line under a changed field: what Dev has, and the way back to it.
 *
 * Undo puts the received value back, which is also what turns the page's chip
 * green again — the two are the same fact, seen from the field and the page.
 */
export function FieldMarkNote({ mark, onRevert }: { mark: FieldChange; onRevert?: () => void }) {
  return (
    <p className="fm-note" role="status">
      <span className="fm-note__dot" aria-hidden="true" />
      <span className="fm-note__text">
        Changed since dev received it
        <span className="fm-note__was"> · was {mark.before === '' ? 'empty' : `“${mark.before}”`}</span>
      </span>
      {onRevert && (
        <button type="button" className="fm-note__undo" onClick={onRevert}>
          Undo
        </button>
      )}
    </p>
  )
}

/**
 * Wraps a control that cannot carry the key itself — a picker, a toggle — so it
 * gets the same orange edge and the same line under it as a text field.
 */
export function MarkedField({
  pipelineKey,
  onRevert,
  children,
}: {
  pipelineKey?: string
  onRevert?: (before: string) => void
  children: ReactNode
}) {
  const mark = useFieldMark(pipelineKey)
  if (!mark) return <>{children}</>
  return (
    <div className="fm-wrap" data-changed="">
      {children}
      <FieldMarkNote mark={mark} onRevert={onRevert ? () => onRevert(mark.before) : undefined} />
    </div>
  )
}
