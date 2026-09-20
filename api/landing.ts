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

/**
 * What this tool calls a product group, and what the CMS calls it.
 *
 * Two vocabularies for one idea, so the tool keeps its own and this is where
 * the other is written down. The offers service has a third — same words for
 * DAZN, NFL and NHL, `RallyTV` where the CMS says `RallyTv`, and nothing at
 * all for MSG, which answers 400 there. So MSG+ has a landing page and no
 * offers of its own, which is a fact about the product rather than a gap here.
 *
 * Unset on 499 of the 954 configs — the campaign long tail. Every welcome page
 * sets it, all of them to DAZN.
 */
const PRODUCT: Record<string, string> = {
  dazn: 'DAZN',
  msg: 'YESMSG',
  nfl: 'NFL',
  nhl: 'NHL',
}
const PRODUCTS = Object.keys(PRODUCT)

/**
 * The page a product opens on, where it is not the welcome one.
 *
 * MSG+ has no welcome page. It has seven, and `msgplusyes` is the one that
 * carries the whole journey — thirteen components, and the only place
 * `ZipCodeCheck`, `TeamsRail` and `SubscriptionProviders` are drawn together.
 * So asking for MSG+ without naming a page asks for that one.
 *
 * NFL and NHL are simpler: each has a slug named after itself, and it is the
 * one the market configs carry. NFL's is per-market — a US welcome of five
 * components, fourteen in GB and DACH — and NHL's is one config serving GB and
 * DACH together. MSG+ is the odd one, and the only reason this is a table
 * rather than "the product's own name": DAZN's page is `welcome`.
 *
 * A `page` on the query always wins: this is a default, not a redirect.
 */
const HOME: Record<string, string> = {
  msg: 'msgplusyes',
  nfl: 'nfl',
  nhl: 'nhl',
}

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
const configUrl = (locale: string, country: string, page: string, env: string, group: string | null) =>
  `https://dazn-content-proxy.sd.indazn.com/spaces/${SPACE}/environments/master/entries` +
  `?content_type=LPRootConfig&locale=${encodeURIComponent(locale)}&include=10` +
  `&fields.pages[in]=${encodeURIComponent(page)}` +
  `&fields.includedCountries[in]=${country},ALL` +
  `&fields.excludedCountries[nin]=${country}` +
  `&fields.environment[in]=${encodeURIComponent(env)}` +
  (group ? `&fields.prductGroup=${encodeURIComponent(group)}` : '')

/**
 * The pages this product does draw here, for when the one asked for is not one
 * of them. Asked only on a miss, and cheap: no `include`, three fields.
 *
 * A product group with no page under the slug somebody asked for is the
 * ordinary case rather than a fault — MSG+ has no welcome page, it has an RSN
 * one — and an answer that says so and names them is worth more than a no.
 */
const elsewhereUrl = (locale: string, country: string, env: string, group: string) =>
  `https://dazn-content-proxy.sd.indazn.com/spaces/${SPACE}/environments/master/entries` +
  `?content_type=LPRootConfig&locale=${encodeURIComponent(locale)}&limit=20` +
  `&select=fields.displayName,fields.pages` +
  `&fields.includedCountries[in]=${country},ALL` +
  `&fields.excludedCountries[nin]=${country}` +
  `&fields.environment[in]=${encodeURIComponent(env)}` +
  `&fields.prductGroup=${encodeURIComponent(group)}`

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
  /** The small line over the heading, where the component carries one. */
  overLine: string | null
  /** Which rail, for the components that are served one. */
  railId: string | null
  railParams: string | null
  entries: Child[]
  /**
   * What the rail is serving, for the components that are served one.
   *
   * Null where a component has no rail. An empty `tiles` with `count` zero
   * is the answer that explains the page: a rail whose contents have run out
   * — a tournament that is over, a fight night with nothing booked — draws
   * nothing at all, so the live page shows fewer blocks than it is configured
   * with. Canada is configured with three spotlight rails and draws one.
   */
  rail: { title: string | null; count: number; tiles: { title: string; meta: string }[] } | null
}

/** As many as anything here would draw. The count is the true number. */
const TILE_CAP = 12

/**
 * What one rail is serving.
 *
 * The params are the CMS's, decoded once already and handed back encoded: they
 * say which sport or competition the rail is for, and without them the router
 * answers with an empty rail rather than an error.
 */
async function railOf(
  country: string,
  id: string,
  params: string | null,
): Promise<{ title: string | null; count: number; tiles: { title: string; meta: string }[] }> {
  const url =
    `https://rail-router.discovery.indazn.com/${country}/v10/Rail?id=${encodeURIComponent(id)}` +
    `&platform=web&country=${country}` +
    (params ? `&params=${encodeURIComponent(params)}` : '')
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return { title: null, count: 0, tiles: [] }
    const body = (await res.json()) as { Title?: string; Tiles?: { Title?: string; Label?: string }[] }
    const all = Array.isArray(body.Tiles) ? body.Tiles : []
    return {
      title: typeof body.Title === 'string' && body.Title.trim() ? body.Title : null,
      count: all.length,
      tiles: all.slice(0, TILE_CAP).map((t) => ({ title: t.Title ?? '', meta: t.Label ?? '' })),
    }
  } catch {
    // A rail that cannot be reached is not a rail that is empty, but neither
    // is worth failing the page for: the components still answer.
    return { title: null, count: 0, tiles: [] }
  }
}

/**
 * One thing inside a component, as much of it as is words.
 *
 * `name` is the CMS's own label for the entry — "[CA] LP || Features | Follow"
 * — which is how the editor is filed rather than anything a reader sees. The
 * rest is what is on the page: a tile's line, a feature's heading, a question.
 *
 * Which field carries the line depends on the component. A tile in an events
 * rail puts it in `title` and a tile in a products rail in `description`, so
 * both come across and whoever reads them decides.
 */
interface Child {
  type: string
  id: string
  /** The CMS's filing label, not copy. */
  name: string | null
  title: string | null
  /** Above the title, and usually the same words as the badge. */
  preTitle: string | null
  badge: string | null
  body: string | null
  /** The first button's label, which is the only one a tile ever draws. */
  cta: string | null
  /** Set on `CommonKeyValue`, which is how a component carries a loose string. */
  key: string | null
  value: string | null
  /** The picture this entry stands for or carries, at the phone's breakpoint. */
  image: string | null
}

type Assets = Record<string, { url: string }>

/**
 * A picture reference as one URL, at the breakpoint a phone would ask for.
 *
 * Two shapes reach here. A field can link an asset directly — a logo, a poster
 * — or link an `AdaptiveImage`, which is five links, one per breakpoint. The
 * page picks between them by the screen it is on; this tool draws a phone, so
 * it takes `mobile` and falls back through the others rather than answering
 * nothing when a picture has been given for some screens and not others.
 */
const BREAKPOINTS = ['mobile', 'default', 'web', 'tablet', 'livingRoom']

function pictureOf(value: unknown, byId: Map<string, Entry>, assets: Assets): string | null {
  if (!isLink(value)) return null
  const id = value.sys.id
  if (assets[id]) return assets[id].url
  const entry = byId.get(id)
  if (!entry) return null
  for (const at of BREAKPOINTS) {
    const link = entry.fields[at]
    if (isLink(link) && assets[link.sys.id]) return assets[link.sys.id].url
  }
  return null
}

/**
 * The picture a child entry stands for, wherever it keeps it.
 *
 * An `AdaptiveImage` is the picture. Everything else carries one under a name
 * that depends on what it is: a banner's is its background, a video's is the
 * still it shows before it plays.
 */
function imageOf(kid: Entry, byId: Map<string, Entry>, assets: Assets): string | null {
  if (kid.sys.contentType.sys.id === 'AdaptiveImage') {
    for (const at of BREAKPOINTS) {
      const link = kid.fields[at]
      if (isLink(link) && assets[link.sys.id]) return assets[link.sys.id].url
    }
    return null
  }
  for (const field of ['backgroundImage', 'posterImage', 'logoImage', 'logo']) {
    const found = pictureOf(kid.fields[field], byId, assets)
    if (found) return found
  }
  return null
}

/** The words on one child entry, with its button resolved. */
function childOf(link: unknown, byId: Map<string, Entry>, assets: Assets): Child {
  const kid = isLink(link) ? byId.get(link.sys.id) : undefined
  const id = isLink(link) ? link.sys.id : ''
  if (!kid)
    return { type: 'unresolved', id, name: null, title: null, preTitle: null, badge: null, body: null, cta: null, key: null, value: null, image: null }
  const f = kid.fields
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
  const buttons = Array.isArray(f.buttons) ? (f.buttons as unknown[]) : []
  const first = buttons.map((b) => (isLink(b) ? byId.get(b.sys.id) : undefined)).find(Boolean)
  return {
    type: kid.sys.contentType.sys.id,
    id,
    name: str(f.displayName),
    title: str(f.title),
    preTitle: str(f.preTitle),
    badge: str(f.badgeText),
    body: str(f.description),
    // Two spellings of the same thing across two button types.
    cta: first ? (str(first.fields.label) ?? str(first.fields.buttonLabel)) : null,
    key: str(f.key),
    value: str(f.value),
    image: imageOf(kid, byId, assets),
  }
}

/**
 * The page's components in the order the page draws them.
 *
 * Every one of them is an `LPContentGroup`; what it *is* comes from its
 * `componentType`. A link that resolves to nothing is kept and marked rather
 * than dropped: a hole in the order is the thing somebody needs to see.
 */
function componentsOf(root: Entry, byId: Map<string, Entry>, assets: Assets): Component[] {
  const links = Array.isArray(root.fields.components) ? (root.fields.components as unknown[]) : []
  return links.map((link, at) => {
    const entry = isLink(link) ? byId.get(link.sys.id) : undefined
    if (!entry) {
      return { at, type: 'unresolved', version: null, title: null, description: null, overLine: null, railId: null, railParams: null, entries: [], rail: null }
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
      overLine: typeof f.overLine === 'string' ? f.overLine : null,
      railId: typeof f.railId === 'string' ? f.railId : null,
      // Encoded in the CMS, decoded onto the rail router's query string.
      railParams: typeof params?.params === 'string' ? decodeURIComponent(params.params) : null,
      entries: kids.map((k) => childOf(k, byId, assets)),
      // Filled in after, where there is a rail to ask about.
      rail: null,
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

/**
 * Every component's rail, asked for at once.
 *
 * At once because a page has a handful of them and asking in turn would add
 * their round trips together for no reason. The answer is held with the page's
 * own, so this is paid once an hour and not once a look.
 */
async function withRails(components: Component[], market: string): Promise<Component[]> {
  const country = market.toLowerCase()
  return Promise.all(
    components.map(async (c) =>
      c.railId ? { ...c, rail: await railOf(country, c.railId, c.railParams) } : c,
    ),
  )
}

async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  // Absolute from Vercel's Web runtime, relative from anything else.
  const url = new URL(request.url, 'http://localhost')
  const market = (url.searchParams.get('market') ?? '').toLowerCase()
  const named = url.searchParams.get('page')
  const env = url.searchParams.get('env') ?? 'Live'
  const product = (url.searchParams.get('product') ?? '').toLowerCase()
  const page = named ?? HOME[product] ?? 'welcome'
  const refresh = url.searchParams.get('refresh') === '1'
  const raw = url.searchParams.get('raw') === '1'

  if (!MARKETS.includes(market)) {
    return json({ ok: false, error: `Unknown market "${market}". One of: ${MARKETS.join(', ')}.`, markets: MARKETS }, 400)
  }
  if (!ENVIRONMENTS.includes(env)) {
    return json({ ok: false, error: `Unknown env "${env}". One of: ${ENVIRONMENTS.join(', ')}.`, environments: ENVIRONMENTS }, 400)
  }
  if (product && !PRODUCTS.includes(product)) {
    return json({ ok: false, error: `Unknown product "${product}". One of: ${PRODUCTS.join(', ')}.`, products: PRODUCTS }, 400)
  }

  const locale = LOCALE[market]
  const country = market.toUpperCase()
  const group = product ? PRODUCT[product] : null
  const key = `${market}|${page}|${env}|${group ?? ''}`
  const held = pages.get(key)
  const started = Date.now()

  let body: Body
  let cached = false
  if (!refresh && held && Date.now() - held.at < TTL_MS) {
    body = held.value
    cached = true
  } else {
    const target = configUrl(locale, country, page, env, group)
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
  // given page, and 200-with-nothing is how this service says so. Where a
  // product group was named, say what it does draw rather than only what it
  // does not.
  if (!root) {
    let elsewhere: { displayName: string | null; pages: string[] }[] = []
    if (group) {
      try {
        const also = await fetch(elsewhereUrl(locale, country, env, group), { headers: HEADERS })
        if (also.ok) {
          const body2 = (await also.json()) as Body
          elsewhere = (body2.items ?? []).map((it) => ({
            displayName: typeof it.fields.displayName === 'string' ? it.fields.displayName : null,
            pages: Array.isArray(it.fields.pages) ? (it.fields.pages as string[]) : [],
          }))
        }
      } catch {
        // The answer stands without it; a second call failing is not a reason
        // to turn a found-nothing into an error.
      }
    }
    return json({ ok: true, market, locale, page, env, product: product || null, cached, seconds, found: false, components: [], assets: {}, elsewhere })
  }

  if (raw) return json({ ok: true, market, locale, page, env, cached, seconds, found: true, body })

  const byId = new Map<string, Entry>()
  for (const e of body.includes?.Entry ?? []) byId.set(e.sys.id, e)
  const pictures = assetsOf(body)

  const f = root.fields
  return json({
    ok: true,
    market,
    locale,
    page,
    env,
    product: product || null,
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
    // Built once and handed down: every picture on the page resolves
    // through it, and building it per entry would be the same map each time.
    components: await withRails(componentsOf(root, byId, pictures), market),
    assets: pictures,
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
