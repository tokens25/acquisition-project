import type { LiveMarket } from '../rules/dazn/build'

/**
 * Client for `/api/dazn`: one market's plans, as DAZN sells them today.
 *
 * Allowed to fail. A dev server without the route, a deployment that DAZN's
 * APIs refuse, a laptop offline — in each case the app keeps what it has (the
 * shared file, or this browser's copy) and says the plans are not live.
 */
export type LiveResult =
  | { ok: true; market: string; live: LiveMarket | null; fetchedAt: string; cached: boolean }
  | { ok: false; market: string; error: string }

export async function fetchLiveMarket(market: string, refresh = false): Promise<LiveResult> {
  try {
    const res = await fetch(`/api/dazn?market=${encodeURIComponent(market)}${refresh ? '&refresh=1' : ''}`, {
      signal: AbortSignal.timeout(65000),
      headers: { accept: 'application/json' },
    })
    // A dev server with no API routes answers with the app's own HTML.
    if (!res.headers.get('content-type')?.includes('json')) {
      return { ok: false, market, error: 'No live route on this server.' }
    }
    const body = (await res.json()) as Partial<LiveResult> & { error?: string | { code?: string; message?: string } }
    if (!res.ok || !body.ok) {
      // Vercel's own failures arrive as { error: { code, message } } — a
      // function that ran out of time, most often. Read as an object, that
      // was "[object Object]" on screen.
      const e = body.error
      const reason =
        typeof e === 'string' ? e : e && typeof e === 'object' ? [e.code, e.message].filter(Boolean).join(': ') : ''
      return { ok: false, market, error: reason || `The live route returned ${res.status}.` }
    }
    return body as LiveResult
  } catch (error) {
    return { ok: false, market, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Where the plans on screen stand in relation to DAZN's catalogue. */
export type LiveStatus =
  | { state: 'off' }
  | { state: 'loading'; market: string }
  | { state: 'live'; market: string; fetchedAt: string }
  | { state: 'unreachable'; market: string; reason: string }
