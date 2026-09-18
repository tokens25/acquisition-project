/**
 * Live plans from DAZN's catalogue, one market at a time.
 *
 *   GET /api/dazn?market=es            → { ok, market, live, cached, fetchedAt }
 *   GET /api/dazn?market=es&refresh=1  → the same, fetched again now
 *
 * The browser cannot ask DAZN's APIs itself — they answer only to dazn.com —
 * so this route asks on its behalf: seven offer bodies (one per product) and
 * the market's content pages, joined into the tool's plans by
 * `src/rules/dazn`. Nothing is stored; the app folds the answer into its own
 * set and keeps everything it has added around the plans.
 *
 * Cached in memory for an hour per market, because prices change daily at
 * most and the content pages are heavy. A cold call takes a few seconds.
 */
import { buildMarket, fetchContent, fetchMarket, MARKETS, BASE_LOCALE, HEADERS, offersUrl, type LiveMarket, type ContentBody, type Product } from '../src/rules/dazn/index.js'

const TTL_MS = 60 * 60 * 1000

interface Cached<T> {
  at: number
  value: T
}
const markets = new Map<string, Cached<LiveMarket | null>>()
let base: Cached<ContentBody[]> | null = null

const fresh = <T,>(c: Cached<T> | null | undefined): c is Cached<T> => Boolean(c && Date.now() - c.at < TTL_MS)

async function englishBase(): Promise<ContentBody[]> {
  if (fresh(base)) return base.value
  const value = await fetchContent(fetch, BASE_LOCALE)
  if (value.length) base = { at: Date.now(), value }
  return value
}

export default async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  const url = new URL(request.url)
  const market = (url.searchParams.get('market') ?? '').toLowerCase()
  const refresh = url.searchParams.get('refresh') === '1'

  if (!MARKETS.includes(market)) {
    return json({ ok: false, error: `Unknown market "${market}". One of: ${MARKETS.join(', ')}.`, markets: MARKETS }, 400)
  }

  // The offers service as it answers, for one product group — what the Dev
  // view reads when a plan on screen and DAZN's catalogue disagree. The
  // browser cannot ask the service itself: it answers only to dazn.com.
  const raw = url.searchParams.get('raw')
  if (raw) {
    const res = await fetch(offersUrl(market, raw as Product), { headers: HEADERS })
    return json({ ok: res.ok, status: res.status, body: res.ok ? await res.json() : null }, res.ok ? 200 : 502)
  }

  const had = markets.get(market)
  if (!refresh && fresh(had)) {
    return json({ ok: true, market, live: had.value, cached: true, fetchedAt: new Date(had.at).toISOString() })
  }

  try {
    const pull = await fetchMarket(fetch, market, await englishBase())
    const live = buildMarket(pull)
    if (!live) {
      // The offers service answered with nothing — DAZN's APIs are up but this
      // market sells nothing through them, or the route was refused.
      const anyOffers = Object.keys(pull.offers).length > 0
      if (!anyOffers) return json({ ok: false, error: `DAZN's offers service returned nothing for ${market.toUpperCase()}.`, market }, 502)
    }
    markets.set(market, { at: Date.now(), value: live })
    return json({ ok: true, market, live, cached: false, fetchedAt: pull.fetchedAt })
  } catch (error) {
    return json({ ok: false, error: describe(error), market }, 502)
  }
}

/**
 * An error as one line a person can read. Node's fetch fails with a TypeError
 * whose real reason sits in `cause` (a DNS refusal, a reset connection), and a
 * throw that is not an Error at all would otherwise read "[object Object]".
 */
function describe(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    const inner = cause instanceof Error ? ` — ${cause.message}` : cause ? ` — ${JSON.stringify(cause)}` : ''
    return `${error.message}${inner}`
  }
  try {
    return typeof error === 'string' ? error : JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/** Longer than Vercel's default: one market is some twenty calls to DAZN, and a slow one must not become a blank page. */
export const config = { maxDuration: 60 }
