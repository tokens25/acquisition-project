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

/** BillingPeriod → the cadence names the tool uses. Instalments also count their term. */
export const CADENCE: Record<string, string> = {
  Week: 'Weekly',
  Month: 'Monthly',
  Instalments: 'Yearly Instalments',
  Annual: 'Yearly',
  Seasonal: 'Seasonal',
}
/**
 * The cadence an offer is sold at. Instalment plans differ by how many:
 * twelve is the yearly plan paid monthly, twenty-four Germany's two-year
 * one, five the NFL's season in five payments — different commitments, so
 * different cadences, or the second would overwrite the first.
 */
export function cadenceOf(billingPeriod: string | null | undefined, termMonths?: number | null): string | null {
  if (billingPeriod === 'Instalments' && termMonths && termMonths !== 12) {
    return termMonths === 24 ? '2-Year Instalments' : `${termMonths} Instalments`
  }
  return CADENCE[billingPeriod ?? ''] ?? null
}
/** Every cadence DAZN sells at, in the order the tool lists them: shortest commitment first. */
export const CADENCES = ['Weekly', 'Monthly', '5 Instalments', 'Yearly Instalments', '2-Year Instalments', 'Yearly', 'Seasonal']

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

/**
 * The resource strings the web checkout reads its words from: localised
 * templates keyed by situation, with `%{placeholder}` figures and markdown
 * links. `eu` in the path is where the service runs, not the market.
 */
export const stringsUrl = (cc: string, lang: string) =>
  `https://resource-strings.acc.indazn.com/v1/eu/live?region=${cc}&LanguageCode=${lang}&Platform=web`

/** The families of keys the checkout draws from. Everything else stays behind. */
export const CHECKOUT_KEYS =
  /^(payment_termsWarning(_extended|_klarnaPayOverTime|_weekly)?|payment_ROWexclusion|payment_terms_acceptance_\w+|signUp_cancelSentence_\w+|signUp_\w+_cancelSentence_\w+|signup_cancelation_youthoffer_\w+|auth_payment_cancelSentence_\w+)$/

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
  BillingType?: string
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

export interface StringsBody {
  Strings?: Record<string, string>
  Links?: Record<string, string>
  Metadata?: { Version?: string; LabelsLastUpdated?: string }
}

/** The checkout's words for a market, as the strings service states them. */
export interface CheckoutStrings {
  strings: Record<string, string>
  links: Record<string, string>
  version?: string
  language?: string
}

/** Everything fetched for one market: seven offer bodies, its locale's content pages, its checkout words. */
export interface MarketPull {
  market: string
  offers: Partial<Record<Product, OffersBody>>
  /** The market's own locale (after fallback), then the English base. */
  content: ContentBody[]
  base: ContentBody[]
  /** The checkout's words in English for this market — what the tool reads. */
  strings?: CheckoutStrings | null
  /** The same in the market's own language, for the translator to put on screen. */
  nativeStrings?: CheckoutStrings | null
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

/** The checkout's words for a market, in its own language, trimmed to the keys the checkout reads. */
export async function fetchStrings(fetchFn: Fetch, market: string, language?: string): Promise<CheckoutStrings | null> {
  const lang = language ?? (LOCALE[market] ?? BASE_LOCALE).split('-')[0]
  const body = await get<StringsBody>(fetchFn, stringsUrl(market, lang))
  if (!body?.Strings) return null
  const strings: Record<string, string> = {}
  for (const [k, v] of Object.entries(body.Strings)) if (CHECKOUT_KEYS.test(k) && typeof v === 'string') strings[k] = v
  return { strings, links: body.Links ?? {}, version: body.Metadata?.Version, language: lang }
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
  const lang = locale.split('-')[0]
  const [offers, content, baseContent, english, native] = await Promise.all([
    fetchOffers(fetchFn, market),
    fetchContent(fetchFn, locale),
    base ? Promise.resolve(base) : locale === BASE_LOCALE ? Promise.resolve(null) : fetchContent(fetchFn, BASE_LOCALE),
    fetchStrings(fetchFn, market, 'en'),
    lang === 'en' ? Promise.resolve(null) : fetchStrings(fetchFn, market, lang),
  ])
  return {
    market,
    offers,
    content,
    base: baseContent ?? content,
    strings: english ?? native,
    nativeStrings: lang === 'en' ? null : native,
    fetchedAt: new Date().toISOString(),
  }
}
