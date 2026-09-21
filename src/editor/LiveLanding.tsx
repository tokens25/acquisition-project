import type { ReactNode } from 'react'
import { useLiveLanding } from './useLiveLanding'
import { LiveCtx } from './liveLandingContext'

/** Asks once, for everything under it — see `liveLandingContext.ts`. */
export function LiveLandingProvider({
  market,
  product,
  lang,
  children,
}: {
  market: string | undefined | null
  product: string | undefined | null
  /** What the translation is set to, or nothing for English. */
  lang?: string | null
  children: ReactNode
}) {
  const live = useLiveLanding(market, product, lang)
  return <LiveCtx.Provider value={live}>{children}</LiveCtx.Provider>
}
