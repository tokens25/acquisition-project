import { createContext, useContext } from 'react'

/**
 * A field's change since Dev last received it.
 *
 * Provided by the page that knows the pipeline; read by the field that has to
 * show it. Fields carry a key and look themselves up, so the panels stay
 * ignorant of the pipeline beyond naming their strings.
 */
export interface FieldChange {
  before: string
  after: string
  /** ISO timestamp of the last edit, when known. */
  at?: string
}

export const FieldMarks = createContext<ReadonlyMap<string, FieldChange>>(new Map())

export function useFieldMark(key?: string): FieldChange | null {
  const marks = useContext(FieldMarks)
  return key ? (marks.get(key) ?? null) : null
}
