import type { ReactNode } from 'react'
import { useLiveLanding } from './useLiveLanding'
import { LiveCtx } from './liveLandingContext'

/** Asks once, for everything under it — see `liveLandingContext.ts`. */
export function LiveLandingProvider({
  market,
  product,
  children,
}: {
  market: string | undefined | null
  product: string | undefined | null
  children: ReactNode
}) {
  const live = useLiveLanding(market, product)
  return <LiveCtx.Provider value={live}>{children}</LiveCtx.Provider>
}
