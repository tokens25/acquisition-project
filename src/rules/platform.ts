/**
 * Which build of the app a screen is being looked at in.
 *
 * The same page ships twice: once as a web page in a browser, once inside the
 * app itself, and the two differ in their chrome rather than in their words —
 * a browser bar at the foot against a native one at the top.
 *
 * Optional on the situation for the same reason `pageView` is: it is the
 * answer to a question, and nothing derives from it yet.
 */

export type Platform = 'web' | 'native'

export const PLATFORMS: { code: Platform; label: string; hint: string }[] = [
  { code: 'web', label: 'Web', hint: 'The page as a browser draws it' },
  { code: 'native', label: 'Native', hint: 'The page inside the app' },
]

export const DEFAULT_PLATFORM: Platform = 'web'
