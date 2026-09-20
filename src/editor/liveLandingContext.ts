import { createContext, useContext } from 'react'
import type { useLiveLanding } from './useLiveLanding'

/**
 * One reading of the market's live page, for everything that shows it.
 *
 * Three places want it — the chip in the status bar, the comparison fold, and
 * the panel that opens a market on what it draws — and three copies of the
 * hook would be three requests on every market change and, worse, three
 * separate answers. A Refresh that asked again for the chip alone would leave
 * the list under it saying what it said before, which is the one thing a
 * refresh must not do.
 *
 * So the question is asked once, in the provider, and the answer handed down.
 * Refresh is the same function for all of them because it is the same reading.
 *
 * The context and its hook live here rather than beside the provider so that
 * file exports a component and nothing else, which is what fast refresh needs
 * to swap it without reloading the page.
 */
export type Live = ReturnType<typeof useLiveLanding>

/**
 * What a consumer outside the provider sees.
 *
 * Off rather than a throw. Nothing here is load-bearing — a chip that does not
 * draw and a fold that stays shut are both fine — and a component that cannot
 * be rendered in a test or a story because it needs a network provider is a
 * component that will be rendered in neither.
 */
const NOWHERE: Live = { state: 'off', page: null, error: null, elsewhere: [], reload: () => {} }

export const LiveCtx = createContext<Live | null>(null)

export const useLive = (): Live => useContext(LiveCtx) ?? NOWHERE
