/**
 * The live landing page for a market, as DAZN's own CMS holds it.
 *
 *   GET /api/landing?market=gb                → { ok, market, locale, components }
 *   GET /api/landing?market=gb&page=boxing    → a page other than the welcome one
 *   GET /api/landing?market=gb&env=Test       → what is being worked on, not what is live
 *   GET /api/landing?market=gb&refresh=1      → fetched again now
 *   GET /api/landing?market=gb&raw=1          → the Contentful body untouched
 *
 * The companion to /api/dazn, which answers for what a plan costs. This one
 * answers for what the page is made of: which components, in what order, and
 * which rail each one points at.
 *
 * A route rather than a fetch from the page because the content service is one
 * of two DAZN answers from a browser that is not theirs, and relying on that
 * is relying on a CORS policy nobody here controls. The offers service already
 * refuses us — see /api/dazn — so the two sit together rather than one being
 * asked from the page and the other from a server.
 *
 * Cached in memory for an hour per market and page, because a landing page
 * changes when somebody publishes one, not continuously.
 *
 * Nothing here needs a credential and nothing here stores one. See
 * LANDING-API.md for where the query and its filters come from.
 */

/** The locale the content service holds each market's words in. */
const LOCALE: Record<string, string> = {
  be: 'nl-BE', at: 'de-AT', de: 'de-DE', li: 'de-LI', lu: 'fr-LU', ch: 'de-CH',
  fr: 'fr-FR', it: 'it-IT', jp: 'ja-JP', pt: 'pt-PT', es: 'es-ES', tw: 'zh-TW',
  ca: 'en-CA', ie: 'en-IE', mx: 'es-MX', nl: 'nl-NL', pl: 'pl-PL', gb: 'en-GB',
  us: 'en-US', au: 'en-AU', br: 'pt-BR',
}
const MARKETS = Object.keys(LOCALE)

/**
 * Which audience the page is drawn for.
 *
 * Not a deployment tier a page moves through — a list on the entry saying who
 * may see it, and a page can carry more than one. `Live` is the public site.
 */
const ENVIRONMENTS = ['Live', 'Test', 'Beta']

const SPACE = 'vhp9jnid12wf'
const TTL_MS = 60 * 60 * 1000

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://www.dazn.com',
}

/**
 * Three lists on the entry, intersected — not a base with overrides laid over
 * it. A config answers for this page slug, in this market or in every market,
 * for this audience. `include=10` flattens the whole tree into one answer
 * rather than leaving a page's components to be fetched one link at a time.
 */
const configUrl = (locale: string, country: string, page: string, env: string) =>
  `https://dazn-content-proxy.sd.indazn.com/spaces/${SPACE}/environments/master/entries` +
  `?content_type=LPRootConfig&locale=${encodeURIComponent(locale)}&include=10` +
  `&fields.pages[in]=${encodeURIComponent(page)}` +
  `&fields.includedCountries[in]=${country},ALL` +
  `&fields.excludedCountries[nin]=${country}` +
  `&fields.environment[in]=${encodeURIComponent(env)}`

/* ── The shapes, only the fields read ──────────────────────────────────── */

interface Link {
  sys: { id: string; linkType?: string }
}
interface Entry {
  sys: { id: string; contentType: { sys: { id: string } } }
  fields: Record<string, unknown>
}
interface Asset {
  sys: { id: string }
  fields: { title?: string; file?: { url?: string; details?: { image?: { width: number; height: number } } } }
}
interface Body {
  total?: number
  items?: Entry[]
  includes?: { Entry?: Entry[]; Asset?: Asset[] }
}

const isLink = (v: unknown): v is Link =>
  typeof v === 'object' && v !== null && 'sys' in v && typeof (v as Link).sys?.id === 'string'

/* ── What the tool is actually after ───────────────────────────────────── */

interface Component {
  at: number
  /** What it is. The live page discriminates on this rather than on the type. */
  type: string
  /** A renderer switch where a component has been redesigned. */
  version: string | null
  title: string | null
  description: string | null
  /** Which rail, for the components that are served one. */
  railId: string | null
  railParams: string | null
  entries: { type: string; id: string; name: string | null }[]
}

/**
 * The page's components in the order the page draws them.
 *
 * Every one of them is an `LPContentGroup`; what it *is* comes from its
 * `componentType`. A link that resolves to nothing is kept and marked rather
 * than dropped: a hole in the order is the thing somebody needs to see.
 */
function componentsOf(root: Entry, byId: Map<string, Entry>): Component[] {
  const links = Array.isArray(root.fields.components) ? (root.fields.components as unknown[]) : []
  return links.map((link, at) => {
    const entry = isLink(link) ? byId.get(link.sys.id) : undefined
    if (!entry) {
      return { at, type: 'unresolved', version: null, title: null, description: null, railId: null, railParams: null, entries: [] }
    }
    const f = entry.fields
    const params = f.railParams as { params?: string } | undefined
    const kids = Array.isArray(f.entries) ? (f.entries as unknown[]) : []
    return {
      at,
      type: typeof f.componentType === 'string' ? f.componentType : entry.sys.contentType.sys.id,
      version: typeof f.version === 'string' ? f.version : null,
      title: typeof f.title === 'string' ? f.title : null,
      description: typeof f.description === 'string' ? f.description : null,
      railId: typeof f.railId === 'string' ? f.railId : null,
      // Encoded in the CMS, decoded onto the rail router's query string.
      railParams: typeof params?.params === 'string' ? decodeURIComponent(params.params) : null,
      entries: kids.map((k) => {
        const kid = isLink(k) ? byId.get(k.sys.id) : undefined
        return {
          type: kid ? kid.sys.contentType.sys.id : 'unresolved',
          id: isLink(k) ? k.sys.id : '',
          name: kid && typeof kid.fields.displayName === 'string' ? kid.fields.displayName : null,
        }
      }),
    }
  })
}

/** The pictures, by the id the entries link to them with. */
function assetsOf(body: Body): Record<string, { url: string; title: string | null; width: number | null; height: number | null }> {
  const out: Record<string, { url: string; title: string | null; width: number | null; height: number | null }> = {}
  for (const a of body.includes?.Asset ?? []) {
    const url = a.fields?.file?.url
    if (!url) continue
    const size = a.fields.file?.details?.image
    // Protocol-relative as Contentful gives it, which is not a URL anything
    // server-side can fetch.
    out[a.sys.id] = {
      url: url.startsWith('//') ? `https:${url}` : url,
      title: typeof a.fields.title === 'string' ? a.fields.title : null,
      width: size?.width ?? null,
      height: size?.height ?? null,
    }
  }
  return out
}

/**
 * An error as one line a person can read. Node's fetch fails with a TypeError
 * whose real reason sits in `cause`, and a throw that is not an Error at all
 * would otherwise read "[object Object]".
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

interface Cached {
  at: number
  value: Body
}
const pages = new Map<string, Cached>()

async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  // Absolute from Vercel's Web runtime, relative from anything else.
  const url = new URL(request.url, 'http://localhost')
  const market = (url.searchParams.get('market') ?? '').toLowerCase()
  const page = url.searchParams.get('page') ?? 'welcome'
  const env = url.searchParams.get('env') ?? 'Live'
  const refresh = url.searchParams.get('refresh') === '1'
  const raw = url.searchParams.get('raw') === '1'

  if (!MARKETS.includes(market)) {
    return json({ ok: false, error: `Unknown market "${market}". One of: ${MARKETS.join(', ')}.`, markets: MARKETS }, 400)
  }
  if (!ENVIRONMENTS.includes(env)) {
    return json({ ok: false, error: `Unknown env "${env}". One of: ${ENVIRONMENTS.join(', ')}.`, environments: ENVIRONMENTS }, 400)
  }

  const locale = LOCALE[market]
  const country = market.toUpperCase()
  const key = `${market}|${page}|${env}`
  const held = pages.get(key)
  const started = Date.now()

  let body: Body
  let cached = false
  if (!refresh && held && Date.now() - held.at < TTL_MS) {
    body = held.value
    cached = true
  } else {
    const target = configUrl(locale, country, page, env)
    try {
      const response = await fetch(target, { headers: HEADERS })
      if (!response.ok) {
        return json({ ok: false, market, locale, page, env, status: response.status, error: `The content service answered ${response.status}.` }, 502)
      }
      body = (await response.json()) as Body
    } catch (error) {
      return json({ ok: false, market, locale, page, env, error: describe(error) }, 502)
    }
    pages.set(key, { at: Date.now(), value: body })
  }

  const seconds = Number(((Date.now() - started) / 1000).toFixed(2))
  const root = body.items?.[0]

  // No config is an answer, not a failure: plenty of markets do not draw a
  // given page, and 200-with-nothing is how this service says so.
  if (!root) {
    return json({ ok: true, market, locale, page, env, cached, seconds, found: false, components: [], assets: {} })
  }

  if (raw) return json({ ok: true, market, locale, page, env, cached, seconds, found: true, body })

  const byId = new Map<string, Entry>()
  for (const e of body.includes?.Entry ?? []) byId.set(e.sys.id, e)

  const f = root.fields
  return json({
    ok: true,
    market,
    locale,
    page,
    env,
    cached,
    seconds,
    found: true,
    fetchedAt: new Date(held?.at ?? started).toISOString(),
    config: {
      id: root.sys.id,
      brand: typeof f.brand === 'string' ? f.brand : null,
      displayName: typeof f.displayName === 'string' ? f.displayName : null,
      // Lists, all three of them — see LANDING-API.md.
      pages: Array.isArray(f.pages) ? f.pages : [],
      environment: Array.isArray(f.environment) ? f.environment : [],
      includedCountries: Array.isArray(f.includedCountries) ? f.includedCountries : [],
    },
    components: componentsOf(root, byId),
    assets: assetsOf(body),
  })
}

/*
 * Vercel reads the Web-standard signature — a Request in, a Response out —
 * only from handlers exported by HTTP method. A default export is taken for
 * the Node style (req, res), which hands over a relative URL and ignores a
 * returned Response: deployed, this route hung until it was killed. The
 * dev server's own plugin reads whichever of these it finds.
 */
export const GET = handler
