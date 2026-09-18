/**
 * DAZN's two public catalogue APIs, as the tool reads them.
 *
 * Neither needs a credential. The offers service prices an entitlement set
 * per country; the content service names it per locale. Both are read as
 * they are — nothing here is written back — and joined on the entitlement
 * set id. Reference: `dazn-api-reference.md`.
 */

/** Product groups, case-sensitive as the reference warns. DAZN itself first. */
export const PRODUCTS = ['DAZN', 'NFL', 'NHL', 'FIBA', 'CollegeSports', 'RallyTV', 'NationalLeagueTV'] as const
export type Product = (typeof PRODUCTS)[number]

/** Product group → channel id in the tool. DAZN itself is "no channel". */
export const CHANNEL_OF: Partial<Record<Product, string>> = {
  NFL: 'nfl',
  NHL: 'nhl',
  FIBA: 'fiba',
  CollegeSports: 'college-sports',
  RallyTV: 'rallytv',
  NationalLeagueTV: 'national-league',
}

/** BillingPeriod → the cadence names the tool already uses. */
export const CADENCE: Record<string, string> = {
  Month: 'Monthly',
  Instalments: 'Yearly Instalments',
  Annual: 'Yearly',
}
export const CADENCES = ['Monthly', 'Yearly Instalments', 'Yearly']

export const MARKET_LABEL: Record<string, string> = {
  be: 'Belgium', at: 'Austria', de: 'Germany', li: 'Liechtenstein', lu: 'Luxembourg',
  ch: 'Switzerland', fr: 'France', it: 'Italy', jp: 'Japan', pt: 'Portugal', es: 'Spain',
  tw: 'Taiwan', ca: 'Canada', ie: 'Ireland', mx: 'Mexico', nl: 'Netherlands', pl: 'Poland',
  gb: 'United Kingdom', us: 'United States', au: 'Australia', br: 'Brazil',
}
export const LOCALE: Record<string, string> = {
  be: 'nl-BE', at: 'de-AT', de: 'de-DE', li: 'de-LI', lu: 'fr-LU', ch: 'de-CH', fr: 'fr-FR',
  it: 'it-IT', jp: 'ja-JP', pt: 'pt-PT', es: 'es-ES', tw: 'zh-TW', ca: 'en-CA', ie: 'en-IE',
  mx: 'es-MX', nl: 'nl-NL', pl: 'pl-PL', gb: 'en-GB', us: 'en-US', au: 'en-AU', br: 'pt-BR',
}
/** Locales the content service has nothing for; read the nearest instead. */
export const LOCALE_FALLBACK: Record<string, string> = { 'fr-LU': 'fr-FR', 'nl-NL': 'nl-BE', 'pl-PL': 'en-GB' }
export const BASE_LOCALE = 'en-GB'
export const MARKETS = Object.keys(LOCALE)

export const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://www.dazn.com',
}

export const offersUrl = (cc: string, product: Product) =>
  `https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/${cc.toUpperCase()}` +
  `?Platform=web&Brand=DAZN&ProductGroup=${product}&IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2`

export const contentUrl = (locale: string, pageId: string = 'DAZN') =>
  `https://dazn-content-proxy.sd.indazn.com/spaces/vhp9jnid12wf/environments/master/entries` +
  `?content_type=CommonContentTierGroup&locale=${locale}&include=10&fields.env[in]=production&fields.pageIds[in]=${pageId}`

/* ── Raw shapes, only the fields read ─────────────────────────────────── */

export interface RawChargeTier {
  Price?: number | null
  Currency?: string
  Discount?: { Price?: number | null; Percentage?: number; DiscountedMonths?: number } | null
}

export interface RawOffer {
  Id?: string
  EntitlementSetId: string
  BillingPeriod?: string | null
  ProductType?: string
  ProductGroup?: string
  TierRank?: number
  RatePlanId?: string
  ChargeTiers?: RawChargeTier[]
  Instalment?: { TermInMonths?: number } | null
  FreeTrialMonths?: number
  Purchasable?: boolean
}

export interface RawAddon {
  Id?: string
  ProductType?: string
  BillingPeriod?: string | null
  EntitlementSetId: string
  ChargeTiers?: RawChargeTier[]
  Conditions?: { requiredEntitlements?: string[] }[]
}

export interface RawEntitlement {
  setId: string
  entitlementIds?: string[]
  features?: {
    CONCURRENCY?: { max_devices?: number; max_ips?: number }
    DEVICE?: { max_registered_devices?: number; access_device?: string }
  }
  ppvsIncluded?: unknown[]
  multiviewEnabledCountries?: unknown[]
}

export interface OffersBody {
  Offers?: RawOffer[]
  Addons?: RawAddon[]
  Entitlements?: RawEntitlement[]
  PaymentMethods?: { Id?: string }[] | string[]
}

export interface ContentfulLink { sys: { id: string } }
export interface ContentfulEntry {
  sys: { id: string; contentType: { sys: { id: string } } }
  fields: Record<string, unknown>
}
export interface ContentfulAsset {
  sys: { id: string }
  fields: { title?: string; file?: { url?: string } }
}
export interface ContentBody {
  items?: ContentfulEntry[]
  includes?: { Entry?: ContentfulEntry[]; Asset?: ContentfulAsset[] }
}

/** Everything fetched for one market: seven offer bodies, and its locale's content pages. */
export interface MarketPull {
  market: string
  offers: Partial<Record<Product, OffersBody>>
  /** The market's own locale (after fallback), then the English base. */
  content: ContentBody[]
  base: ContentBody[]
  fetchedAt: string
}

export type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

/** One GET; a non-JSON or non-200 answer is `null`, never a throw. */
async function get<T>(fetchFn: Fetch, url: string): Promise<T | null> {
  try {
    const res = await fetchFn(url, { headers: HEADERS })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Every page a locale's cards can live on: the DAZN page and each product's own. */
export async function fetchContent(fetchFn: Fetch, locale: string): Promise<ContentBody[]> {
  const want = LOCALE_FALLBACK[locale] ?? locale
  const pages = ['DAZN', ...PRODUCTS.filter((p) => p !== 'DAZN')]
  const bodies = await Promise.all(pages.map((p) => get<ContentBody>(fetchFn, contentUrl(want, p))))
  return bodies.filter((b): b is ContentBody => b !== null)
}

export async function fetchOffers(fetchFn: Fetch, market: string): Promise<Partial<Record<Product, OffersBody>>> {
  const bodies = await Promise.all(PRODUCTS.map((p) => get<OffersBody>(fetchFn, offersUrl(market, p))))
  const out: Partial<Record<Product, OffersBody>> = {}
  PRODUCTS.forEach((p, i) => {
    const b = bodies[i]
    if (b && (b.Offers?.length ?? 0) > 0) out[p] = b
  })
  return out
}

/**
 * One market, whole: its prices, its words, and the English words to fall
 * back on. `base` may be passed in when the caller already has it, so a
 * server building several markets fetches en-GB once.
 */
export async function fetchMarket(fetchFn: Fetch, market: string, base?: ContentBody[]): Promise<MarketPull> {
  const locale = LOCALE[market] ?? BASE_LOCALE
  const [offers, content, baseContent] = await Promise.all([
    fetchOffers(fetchFn, market),
    fetchContent(fetchFn, locale),
    base ? Promise.resolve(base) : locale === BASE_LOCALE ? Promise.resolve(null) : fetchContent(fetchFn, BASE_LOCALE),
  ])
  return { market, offers, content, base: baseContent ?? content, fetchedAt: new Date().toISOString() }
}
