/**
 * What this build is, put here by Vite at build time.
 *
 * `__BUILD__` is replaced with a literal when the bundle is made — see
 * `vite.config.ts` — so nothing is read at runtime and nothing can be wrong
 * about the running code the way a hand-kept version number can.
 *
 * The fallback is for a context that does the replacing differently or not at
 * all, which is better than a bundle that throws on an undefined global before
 * it has drawn anything.
 */
export interface Build {
  /** The full commit, so the stamp can show a short one and title the rest. */
  sha: string
  /** The branch, which is what says whose work a deployment is showing. */
  ref: string
  /** When the bundle was made, ISO. Not when the commit was written. */
  at: string
}

declare const __BUILD__: Build | undefined

export const BUILD: Build =
  typeof __BUILD__ === 'undefined'
    ? { sha: 'unknown', ref: 'unknown', at: '' }
    : __BUILD__
