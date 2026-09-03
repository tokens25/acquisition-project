import { createContext, useContext } from 'react'

/**
 * A field's translation, offered to the field that draws it.
 *
 * Same shape of arrangement as the pipeline's change marks: the page knows
 * about translations, the field only knows its own key and looks itself up. A
 * panel that has never heard of translation keeps working.
 */
export interface TranslationMark {
  /** The words this market would read. */
  text: string
  /** `machine` came from the translator; `reviewed` a person has kept. */
  state: 'machine' | 'reviewed'
  language: string
  /** Whether keeping is possible: the language must be the market's own. */
  canKeep: boolean
  /** Keep these words for this market, so they can be published. */
  onKeep: () => void
  /** Drop them and read the base again. */
  onDiscard: () => void
}

export const TranslationMarks = createContext<ReadonlyMap<string, TranslationMark>>(new Map())

export function useTranslationMark(key?: string): TranslationMark | null {
  const marks = useContext(TranslationMarks)
  return key ? (marks.get(key) ?? null) : null
}
