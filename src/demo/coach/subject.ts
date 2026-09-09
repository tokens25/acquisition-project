/**
 * What the Coach is reading, and what to call it.
 *
 * The Coach reads a flow on one product and a page on the other. The engine
 * knows which; so must the words, or a review of a landing page spends its
 * whole interface calling it a journey.
 */
export type CoachSubject = 'journey' | 'page'

export const SUBJECT_WORDS: Record<CoachSubject, { one: string; the: string; every: string }> = {
  journey: { one: 'journey', the: 'this journey', every: 'every screen of this journey' },
  page: { one: 'page', the: 'this page', every: 'every component of this page' },
}
