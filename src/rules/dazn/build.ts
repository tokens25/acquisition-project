/**
 * From what DAZN's APIs say to what the tool draws.
 *
 * What a plan is here: one product's entitlement set — `NFL / tier_nfl_pro`,
 * `DAZN / tier_ult`. It is one plan in every market that sells it, with that
 * market's name, description and benefits as a market patch and that
 * market's prices as offers. That is the tool's sparse model exactly, and it
 * is also how DAZN's own APIs see it.
 *
 * The DAZN product group is a market's general flow (no channel); the six
 * league products are channels. Nothing here is invented: a plan the content
 * service has no card for takes the Atlas's curated English, then a line made
 * of the entitlement facts, then its id — and says which.
 *
 * Built one market at a time, because that is what a live refresh fetches,
 * and folded into the set with `mergeLive`: live wins for the facts about a
 * plan, and everything the tool adds around them — flow copy, journeys, tabs,
 * uploaded artwork, the "Starts at" switch — is kept.
 */
import type {
  AddOnEntry,
  AddOnLine,
  CadenceOffer,
  CardSet,
  CatalogEntry,
  FeatureEntry,
  MarketConfig,
  PlanLimits,
  PlanTab,
  Tier,
  TierPatch,
} from '../content'
import { ATLAS_DAZN, ATLAS_LEAGUE } from './atlas'
import {
  BASE_LOCALE,
  CADENCE,
  CADENCES,
  cadenceOf,
  CHANNEL_OF,
  LOCALE,
  MARKET_LABEL,
  PRODUCTS,
  type ContentBody,
  type ContentfulAsset,
  type ContentfulEntry,
  type ContentfulLink,
  type MarketPull,
  type OffersBody,
  type RawEntitlement,
  type RawOffer,
} from './spec'

/* ── Ids ──────────────────────────────────────────────────────────────── */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const tierIdFor = (product: string, entitlementSetId: string) => `${slug(product)}-${slug(entitlementSetId)}`

/**
 * One id per benefit line, where "one line" ignores what a copywriter's
 * keyboard did to it: a double space or a trailing full stop is not a
 * different benefit. Derived from the words, so two markets building
 * separately land on the same id for the same line.
 */
const canon = (text: string) =>
  text
    // Markdown the CMS lets through — "## Streaming…", "**live**", "- line".
    .replace(/^\s*(#{1,6}|[-*•])\s*/, '')
    .replace(/\s*#{1,6}\s*$/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/[.\u200b]+$/g, '')
    .trim()
function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
export const featureIdFor = (raw: string) => {
  const text = canon(raw)
  return `f-${slug(text).slice(0, 40)}-${hash(text.toLowerCase())}`
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)]

/* ── Content: finding a market's card for an entitlement set ─────────── */

interface Content {
  groups: ContentfulEntry[]
  entries: Map<string, ContentfulEntry>
  assets: Map<string, ContentfulAsset>
}

function index(bodies: ContentBody[]): Content | null {
  if (bodies.length === 0) return null
  const entries = new Map<string, ContentfulEntry>()
  const assets = new Map<string, ContentfulAsset>()
  const groups: ContentfulEntry[] = []
  for (const b of bodies) {
    for (const e of b.includes?.Entry ?? []) entries.set(e.sys.id, e)
    for (const a of b.includes?.Asset ?? []) assets.set(a.sys.id, a)
    groups.push(...(b.items ?? []))
  }
  return { groups, entries, assets }
}

const norm = (s: unknown) => String(s ?? '').toLowerCase()
const arr = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : [])
const str = (x: unknown) => (typeof x === 'string' ? x.trim() : '')

/**
 * The tier items that describe an entitlement set for a market, best first.
 *
 * The CMS carries every variant of every market's page — promos, tests,
 * welcome pages, other regions. A group is right for a market when it is in
 * production, on a page the tool reads, and either tagged with the market or,
 * failing that, tagged common. Names that say EXCLUDE, promo, test or welcome
 * go to the back of the queue rather than out of it.
 */
function cardsFor(content: Content | null, market: string, entSetId: string) {
  if (!content) return []
  const scored: { score: number; item: ContentfulEntry }[] = []
  for (const g of content.groups) {
    const f = g.fields
    if (!arr<string>(f.env).includes('production')) continue
    const pages = arr<string>(f.pageIds)
    if (!pages.includes('DAZN') && !pages.some((p) => p in CHANNEL_OF)) continue
    const tags = arr<string>(f.tags).map(norm)
    const name = norm(f.displayName)
    let score = 0
    if (tags.includes(market)) score += 100
    else if (tags.some((t) => t === 'common' || t.endsWith('common'))) score += 40
    else continue
    if (/exclude|promo|test|welcome|black ?friday|stag/.test(name)) score -= 30
    if (/sign ?up|tiering unified|prod/.test(name)) score += 10
    for (const link of arr<ContentfulLink>(f.tiers)) {
      const item = content.entries.get(link.sys.id)
      if (!item || item.sys.contentType.sys.id !== 'CommonContentTierItem') continue
      if (item.fields.entitlementSetId !== entSetId) continue
      // A monthly card names the plan; an instalment card often names the
      // billing — "Annual, pay monthly" — which is not the plan's name.
      const monthly = item.fields.billingPeriod === 'Month' ? 5 : 0
      scored.push({ score: score + monthly, item })
    }
  }
  return scored.sort((a, b) => b.score - a.score)
}

function benefitsOf(content: Content, item: ContentfulEntry): string[] {
  return arr<ContentfulLink>(item.fields.benefits)
    .map((l) => content.entries.get(l.sys.id))
    .filter((e): e is ContentfulEntry => Boolean(e))
    .map((e) => str(e.fields.value).replace(/\u200b/g, '').trim())
    .filter(Boolean)
}

/** A CMS asset's description, as one line: it arrives with hard wraps and stray trailing spaces. */
const blurbOf = (a: ContentfulAsset) => str(a.fields.description).replace(/\s+/g, ' ').trim()

/**
 * The badge id carries the asset's own id as well as its name. "Serie A" is
 * the title of a dozen assets — one per market, each with its own artwork and
 * its own line about what it gives you — and a badge named for its title alone
 * would let the last market pulled overwrite every other's.
 */
const logoIdFor = (a: ContentfulAsset) => `logo-${slug(a.fields.title ?? a.sys.id)}-${slug(a.sys.id)}`

function logoAssetsOf(content: Content, item: ContentfulEntry): ContentfulAsset[] {
  // The small row of competition badges is `overrideLogos`; `bigLogos` is the
  // larger strip some markets draw instead. The card wants the small row.
  const f = item.fields
  const links = !f.showLogos
    ? []
    : f.showOverrideLogos
      ? arr<ContentfulLink>(f.overrideLogos)
      : arr<ContentfulLink>(f.bigLogos).length
        ? arr<ContentfulLink>(f.bigLogos)
        : arr<ContentfulLink>(f.overrideLogos)
  return links
    .map((l) => content.assets.get(l.sys.id))
    .filter((a): a is ContentfulAsset => Boolean(a?.fields.file?.url))
}

function logosOf(content: Content, item: ContentfulEntry): CatalogEntry[] {
  return logoAssetsOf(content, item).map((a) => {
    const name = a.fields.title ?? a.sys.id
    // The asset's description is the one line the dialog's Content tab shows
    // under the competition — where the CMS has written one.
    const blurb = blurbOf(a)
    return {
      id: logoIdFor(a),
      name,
      altText: `${name} logo`,
      status: 'active' as const,
      image: `https:${a.fields.file!.url}`,
      ...(blurb ? { blurb } : {}),
    }
  })
}

/** The tier group a market's DAZN page draws — the best-scoring one for it. */
function groupFor(content: Content | null, market: string): ContentfulEntry | null {
  if (!content) return null
  let best: { score: number; group: ContentfulEntry } | null = null
  for (const g of content.groups) {
    const f = g.fields
    if (!arr<string>(f.env).includes('production')) continue
    if (!arr<string>(f.pageIds).includes('DAZN')) continue
    const tags = arr<string>(f.tags).map(norm)
    const name = norm(f.displayName)
    let score = 0
    if (tags.includes(market)) score += 100
    else if (tags.some((t) => t === 'common' || t.endsWith('common'))) score += 40
    else continue
    if (/exclude|promo|test|welcome|black ?friday|stag/.test(name)) score -= 30
    if (/sign ?up|tiering unified|prod/.test(name)) score += 10
    if (!best || score > best.score) best = { score, group: g }
  }
  return best?.group ?? null
}

/** A CMS label, without the ##markdown## and zero-width marks it comes wrapped in. */
const label = (x: unknown) => str(x).replace(/#/g, '').replace(/\u200b/g, '').trim()

/**
 * The tabs over a market's plan picker, as the CMS draws them.
 *
 * A tier group with `showTierTypeSwitcher` lists `tierTypes`: each one a
 * tab with a label, a tier type (Standard, or Ultimate for the gold one),
 * and the entitlement sets it shows — Spain's "Tarifas Estándar" and
 * "Tarifa Joven -30", Canada's "Standard" and "Ultimate". `defaultTierType`
 * says which the picker opens on. A group without the switcher has no tabs,
 * and the plans sit in one row.
 */
function tabsOf(content: Content | null, market: string): { tabs: PlanTab[]; onTab: Map<string, string[]> } | null {
  const group = groupFor(content, market)
  if (!group || !group.fields.showTierTypeSwitcher) return null
  const defaultType = str(group.fields.defaultTierType)
  const tabs: PlanTab[] = []
  const onTab = new Map<string, string[]>() // entitlement set → tab ids
  for (const link of arr<ContentfulLink>(group.fields.tierTypes)) {
    const plan = content!.entries.get(link.sys.id)
    if (!plan || plan.sys.contentType.sys.id !== 'LPBillingPlans') continue
    const f = plan.fields
    const sets = arr<unknown>(f.tiers).filter((x): x is string => typeof x === 'string')
    if (sets.length === 0) continue
    const id = slug(str(f.itemId) || label(f.label) || `tab-${tabs.length + 1}`)
    const type = str(f.tierType)
    tabs.push({
      id,
      name: label(f.label) || label(f.displayTitle) || type || id,
      style: type === 'Ultimate' ? 'celebratory' : 'plain',
      ...(defaultType && type === defaultType ? { preselected: true } : {}),
    })
    for (const raw of sets) {
      const entSet = raw.split('#')[0]
      onTab.set(entSet, [...(onTab.get(entSet) ?? []), id])
    }
  }
  return tabs.length > 1 ? { tabs, onTab } : null
}

/**
 * Terms the CMS attaches to a way of paying for a plan.
 *
 * `LPBillingPlans` entries name entitlement sets (sometimes with an
 * `#autoRenew:false` suffix) and a billing period, and a few carry
 * `termsandconditions` — the season passes, mostly. Read as plain text:
 * the HTML link and the `&nbsp;` are the CMS's, not the words'.
 */
function legalOf(content: Content | null): Map<string, string> {
  const out = new Map<string, string>() // `${entSet}|${cadence}` → text
  if (!content) return out
  for (const e of content.entries.values()) {
    if (e.sys.contentType.sys.id !== 'LPBillingPlans') continue
    const f = e.fields
    const text = str(f.termsandconditions)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue
    const cadence = CADENCE[str(f.billingPeriodType)]
    if (!cadence) continue
    for (const raw of arr<unknown>(f.tiers)) {
      if (typeof raw !== 'string') continue
      const entSet = raw.split('#')[0]
      if (!out.has(`${entSet}|${cadence}`)) out.set(`${entSet}|${cadence}`, text)
    }
  }
  return out
}

/* ── Facts from the offers service ────────────────────────────────────── */

function limitsOf(e: RawEntitlement, video: string | null): PlanLimits {
  const ids = e.entitlementIds ?? []
  const conc = e.features?.CONCURRENCY ?? {}
  const dev = e.features?.DEVICE ?? {}
  const policy = ids.some((x) => x.includes('disallow_watch_concurrency'))
    ? 'one'
    : ids.some((x) => x.includes('with_single_location'))
      ? 'single'
      : ids.some((x) => x.includes('watch_concurrency'))
        ? 'multi'
        : null
  return {
    streams: typeof conc.max_devices === 'number' ? conc.max_devices : null,
    networks: typeof conc.max_ips === 'number' ? conc.max_ips : policy === 'single' ? 1 : null,
    policy,
    downloads: ids.some((x) => x.includes('allow_download')),
    mobileOnly: dev.access_device === 'mobile',
    ppvs: (e.ppvsIncluded ?? []).length,
    multiview: (e.multiviewEnabledCountries ?? []).length > 0,
    video,
  }
}

/** The lines those facts make, in the order DAZN's cards tend to put them. */
export function limitLines(d: PlanLimits): string[] {
  const lines: string[] = []
  if (d.video) lines.push(d.video === '4K/HDR' ? 'HDR and Dolby 5.1 on selected events' : 'Full HD video')
  if (d.policy === 'one' || d.streams === 1) lines.push('Watch on one device at a time')
  else if (d.streams && d.networks && d.networks > 1) lines.push(`Watch on ${d.streams} devices in ${d.networks} locations`)
  else if (d.streams && (d.networks === 1 || d.policy === 'single')) lines.push(`Stream on ${d.streams} devices in 1 location`)
  else if (d.streams) lines.push(`Stream on ${d.streams} devices at once`)
  if (d.mobileOnly) lines.push('Mobile only — phone and tablet')
  if (d.downloads) lines.push('Download to watch offline')
  if (d.ppvs > 0) lines.push(`${d.ppvs} pay-per-view event${d.ppvs === 1 ? '' : 's'} included`)
  return lines
}

/** Whether a card already says something about a detail, in any language. */
const SAYS = {
  streams: /\b(stream|device|dispositiv|appareil|gerät|端末|デバイス|apparat|urządze|dispositivo)/i,
  downloads: /\b(download|descarg|téléchar|herunterlad|ダウンロード|scaric|pobier)/i,
  mobile: /\b(mobile|móvil|mobil|モバイル|celular)/i,
  ppv: /\b(pay-per-view|ppv|pago por visión)/i,
  video: /\b(hd|hdr|4k|dolby|1080|full hd)\b/i,
}

/** "tier_fiba_pro" → "FIBA Pro", honestly named from the id. */
function nameFromId(entitlementSetId: string): string {
  return entitlementSetId
    .replace(/^tier_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Fiba|Nfl|Nhl|Tv|Ul|Ult|Std)\b/g, (m) => ({ Ul: 'Ultimate', Ult: 'Ultimate', Std: 'Standard' })[m] ?? m.toUpperCase())
    .replace(/\bNationalleaguetv\b/, 'National League TV')
    .replace(/\bCollegesports\b/, 'College Sports')
    .replace(/\bRallytv\b/, 'Rally TV')
    .replace(/\bNflpro\b/, 'NFL Pro')
    .replace(/\bNflult\b/, 'NFL Ultimate')
}

/* ── One market ───────────────────────────────────────────────────────── */

/** What one market's fetch adds to the set. */
export interface LiveMarket {
  market: MarketConfig
  tiers: Tier[]
  offers: CadenceOffer[]
  featureCatalog: FeatureEntry[]
  logoCatalog: CatalogEntry[]
  /** The pay-per-views a plan here bundles in, named. */
  addOnCatalog: AddOnEntry[]
  fetchedAt: string
  /** The tabs the CMS draws over this market's picker; absent for one row. */
  tabs?: PlanTab[]
  /** What the words fell back on, per plan, for the report. */
  notes: string[]
}

export function buildMarket(pull: MarketPull): LiveMarket | null {
  const { market } = pull
  const products = PRODUCTS.filter((p) => pull.offers[p])
  if (products.length === 0) return null

  const local = index(pull.content)
  const base = index(pull.base)
  const locale = LOCALE[market] ?? BASE_LOCALE
  const currency = products.map((p) => pull.offers[p]?.Offers?.[0]?.ChargeTiers?.[0]?.Currency).find(Boolean) ?? 'EUR'
  // The ways to pay, as the market's DAZN offers list them; a league product's
  // list is the same market's and is read only when DAZN's own is missing.
  const paymentMethods = uniq(
    products.flatMap((p) =>
      (pull.offers[p]?.PaymentMethods ?? []).map((m) => (typeof m === 'string' ? m : (m.Id ?? ''))).filter(Boolean),
    ),
  )

  const tiers = new Map<string, Tier>()
  const offers: CadenceOffer[] = []
  const features = new Map<string, FeatureEntry>()
  const logos = new Map<string, CatalogEntry>()
  const addOns = new Map<string, AddOnEntry>()
  const words: Record<string, string> = {}
  const notes: string[] = []
  const feature = (text: string) => {
    const id = featureIdFor(text)
    if (!features.has(id)) features.set(id, { id, iconId: 'check', text: canon(text), status: 'active' })
    return id
  }

  for (const product of products) {
    const body = pull.offers[product] as OffersBody
    const channel = CHANNEL_OF[product]
    const seen = new Set<string>()
    const ranks = new Map<string, number>()

    // The service lists the same rate plan more than once — plain, and again
    // with a running promotion's discount on it (`…_#rule`). The promoted row
    // is the offer the site shows, so it goes first and the plain one is
    // the repeat. Purchasable rows before ones that are not.
    const discounted = (o: RawOffer) => typeof o.ChargeTiers?.[0]?.Discount?.Price === 'number'
    const ordered = [...(body.Offers ?? [])].sort((a, b) => {
      const p = Number(b.Purchasable !== false) - Number(a.Purchasable !== false)
      return p !== 0 ? p : Number(discounted(b)) - Number(discounted(a))
    })

    for (const o of ordered) {
      // A subscription, or a pass — the NFL's weekly pass is a one-off buy of
      // the same plan for a week, and a way to pay for it all the same.
      if (o.ProductType && o.ProductType !== 'SUBSCRIPTION' && o.ProductType !== 'PASS') continue
      const cadence = cadenceOf(o.BillingPeriod, o.Instalment?.TermInMonths)
      if (!cadence) continue
      const key = `${o.EntitlementSetId}|${cadence}`
      // The service repeats an offer once per payment method; one row will do.
      if (seen.has(key)) continue
      seen.add(key)
      ranks.set(o.EntitlementSetId, Math.max(ranks.get(o.EntitlementSetId) ?? 0, o.TierRank ?? 0))

      const tierId = tierIdFor(product, o.EntitlementSetId)
      if (!tiers.has(tierId)) {
        tiers.set(tierId, {
          id: tierId,
          planName: '',
          description: '',
          features: [],
          logoTiles: [],
          logoTotal: 0,
          highlighted: false,
          displayOrder: 0,
          subscriptions: channel ? [channel] : undefined,
          status: 'live',
          channel: 'direct',
          visibleToPartners: true,
          overrides: [],
          source: { product, entitlementSetId: o.EntitlementSetId, fetchedAt: pull.fetchedAt },
        })
      }
      const ct = o.ChargeTiers?.[0]
      if (!ct || typeof ct.Price !== 'number') continue
      const d = ct.Discount
      const introPrice = d && typeof d.Price === 'number' ? d.Price : null
      const offer: CadenceOffer = {
        id: `${tierId}-${market}-${slug(cadence)}`,
        tierId,
        cadence,
        market,
        standardPrice: ct.Price,
        discount: introPrice !== null,
        introPrice,
        introMonths: d?.DiscountedMonths ?? 0,
        addOnId: null,
        addOnPurchaseType: null,
        addOnDiscountPercent: null,
        includedAddOnIds: [],
      }
      const term = o.Instalment?.TermInMonths
      if (typeof term === 'number' && term > 1) offer.termMonths = term
      if (o.FreeTrialMonths) offer.freeTrialMonths = o.FreeTrialMonths
      if (o.BillingType === 'OneOff' || o.ProductType === 'PASS') offer.oneOff = true
      offers.push(offer)
    }

    /* Add-ons: what each plan can bolt on, at this market's price. */
    const canAdd = new Map<string, AddOnLine[]>() // entitlement set → lines
    for (const a of body.Addons ?? []) {
      if (a.ProductType !== 'addon') continue
      const price = a.ChargeTiers?.[0]?.Price
      if (typeof price !== 'number') continue
      const cadence = CADENCE[a.BillingPeriod ?? ''] ?? 'Monthly'
      for (const c of a.Conditions ?? []) {
        for (const req of c.requiredEntitlements ?? []) {
          if (!ranks.has(req)) continue
          const list = canAdd.get(req) ?? []
          if (!list.some((l) => l.id === a.EntitlementSetId)) list.push({ id: a.EntitlementSetId, name: '', price, cadence })
          canAdd.set(req, list)
        }
      }
    }

    /* Terms the CMS states for a way of paying, where it states any. */
    const legal = legalOf(local)
    const legalBase = legalOf(base)
    for (const o of offers) {
      if (o.legal) continue
      const t = tiers.get(o.tierId)
      const ent = t?.source?.entitlementSetId
      if (!ent) continue
      const text = legal.get(`${ent}|${o.cadence}`) ?? legalBase.get(`${ent}|${o.cadence}`)
      if (text) o.legal = text
    }

    /* Pay-per-views bundled into a plan, named from the market's own PPV
       offers — "billing2_ES_PPV_CANELO_VS_MBILLI" is Canelo vs Mbilli. A
       paired bundle id names two events and is skipped: each is listed on
       its own. */
    const ppvName = new Map<string, string>()
    for (const a of body.Addons ?? []) {
      if (a.ProductType !== 'ppv' || !a.Id) continue
      const m = /_PPV_(.+)$/.exec(a.Id)
      if (!m) continue
      const name = m[1]
        .toLowerCase()
        .split('_')
        .map((w) => (w === 'vs' ? 'vs' : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ')
      ppvName.set(a.EntitlementSetId, name)
    }
    const includedBySet = new Map<string, string[]>()
    for (const e of body.Entitlements ?? []) {
      const ids = (e.ppvsIncluded ?? []).filter((x): x is string => typeof x === 'string' && !x.includes('_bundle_'))
      if (ids.length) includedBySet.set(e.setId, ids)
    }
    for (const o of offers) {
      const t = tiers.get(o.tierId)
      const ent = t?.source?.entitlementSetId
      const ids = ent ? includedBySet.get(ent) : undefined
      if (!ids?.length || o.includedAddOnIds.length) continue
      for (const id of ids) {
        const catalogId = `ppv-${slug(id.replace(/^ppv_t_/, ''))}`
        if (!addOns.has(catalogId)) {
          const name = ppvName.get(id) ?? id.replace(/^ppv_t_/, '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          addOns.set(catalogId, { id: catalogId, title: name, subtitle: 'Pay-per-view included', price: null, imageId: '' })
        }
        o.includedAddOnIds.push(catalogId)
      }
    }

    /* This market's words for each plan. */
    const limitsBySet = new Map((body.Entitlements ?? []).map((e) => [e.setId, e]))
    for (const [entSet, rank] of ranks) {
      const tierId = tierIdFor(product, entSet)
      const tier = tiers.get(tierId)!
      tier.displayOrder = Math.max(tier.displayOrder, rank)
      const curated = ATLAS_LEAGUE[`${product}|${entSet}`] ?? ATLAS_DAZN[`${market}|${entSet}`]
      const ent = limitsBySet.get(entSet)
      if (ent) tier.limits = limitsOf(ent, curated?.resolution ?? null)

      // The tool reads English. The market's group has its cards in English
      // in the en-GB locale, so those are the words; the market's own language
      // is kept beside them for the translator to put on screen on request.
      const english = cardsFor(base, market, entSet)[0]
      const native = cardsFor(local, market, entSet)[0]
      const best = english ?? native
      if (best) {
        const source = (english ? base : local) as Content
        const f = best.item.fields
        const lines = benefitsOf(source, best.item)
        if (english && native && local && local !== base) {
          const nf = native.item.fields
          const nativeLines = benefitsOf(local, native.item)
          if (str(nf.description)) words[`plans.${tierId}.description`] = str(nf.description)
          const nBadge = (nf.showEyebrow ? str(nf.eyebrowText) : '') || (nf.showBestValueBadge ? str(nf.bestValueBadgeText) : '')
          if (nBadge) words[`plans.${tierId}.badge`] = nBadge
          // Line for line, when the two cards list the same number of them.
          if (nativeLines.length === lines.length) {
            lines.forEach((line, i) => {
              if (nativeLines[i]) words[`features.${featureIdFor(line)}`] = canon(nativeLines[i])
            })
          }
          // The same assets, described in the market's language.
          for (const a of logoAssetsOf(local, native.item)) {
            const blurb = blurbOf(a)
            if (blurb) words[`logos.${logoIdFor(a)}.blurb`] = blurb
          }
        }
        const badges = logosOf(source, best.item)
        for (const l of badges) logos.set(l.id, l)
        const eyebrow = f.showEyebrow ? str(f.eyebrowText) : ''
        const bestValue = f.showBestValueBadge ? str(f.bestValueBadgeText) : ''
        tier.planName = str(f.title) || tier.planName
        // The CMS's own words first; the Atlas's curated line only where the
        // card ships without one, because a card with no description is a
        // card the publish gate refuses.
        tier.description = str(f.description) || curated?.desc?.trim() || ''
        if (!str(f.description) && curated?.desc) tier.source!.copy = 'atlas'
        // The card has one switch for the gold treatment and the badge; the
        // CMS has two. A card DAZN badges is a card DAZN is pointing at.
        tier.highlighted = Boolean(f.isCardHighlighted || eyebrow || bestValue)
        const badge = eyebrow || bestValue
        if (badge) tier.badge = badge
        tier.features = uniq(lines.map(feature))
        tier.logoTiles = badges.map((l) => l.id)
        tier.logoTotal = badges.length
      } else if (curated) {
        tier.planName = curated.name
        tier.description = curated.desc?.trim() ?? ''
        tier.features = uniq((curated.inc ?? []).map(feature))
        if (curated.badge) tier.badge = curated.badge
        tier.highlighted = Boolean(curated.hl || curated.badge)
        tier.source!.copy = 'atlas'
        notes.push(`${tierId}: words from the Atlas`)
      }

      const adds = canAdd.get(entSet)
      if (adds) {
        for (const o of offers) if (o.tierId === tierId) o.canAdd = adds
      }
    }
  }

  /* The tabs the DAZN page draws, and which plans sit on which. A plan the
     CMS puts on a tab is on sale from the picker — the youth plans in Spain
     are sold from their own tab, not tucked behind the standard ones. */
  // English labels, with the market's own kept for the translator.
  const tabbed = tabsOf(base, market) ?? tabsOf(local, market)
  const nativeTabs = local && local !== base ? tabsOf(local, market) : null
  if (tabbed && nativeTabs) {
    for (const tab of tabbed.tabs) {
      const own = nativeTabs.tabs.find((t) => t.id === tab.id)
      if (own && own.name !== tab.name) words[`planTabs.${tab.id}.name`] = own.name
    }
  }
  const onATab = new Set<string>()
  if (tabbed) {
    for (const tier of tiers.values()) {
      if (tier.source!.product !== 'DAZN') continue
      const ids = tabbed.onTab.get(tier.source!.entitlementSetId)
      if (ids) {
        tier.tabs = ids
        onATab.add(tier.id)
      }
    }
  }

  /* Names the APIs leave implicit. */
  for (const tier of tiers.values()) {
    const ent = tier.source!.entitlementSetId
    /*
     * Two kinds of plan the APIs name only by id. A youth plan (`…_yp`) is
     * the same plan at an under-25 rate for a year — `legacy`, priced, drawn
     * on the parent's card as a line, not a card of its own. A bundle
     * (`tier_bundle_…`) is DAZN plus a league pass in one payment — a plan
     * on the picker, named for what it holds.
     */
    if (/_yp$/.test(ent)) {
      // On a tab of its own — Spain's "Tarifa Joven -30" — it is a card like
      // any other, under the plan's own name. Otherwise it is a line on the
      // parent's card: legacy, no gold, no partner storefront.
      const parent = tiers.get(tier.id.replace(/-yp$/, ''))
      if (!tier.planName) tier.planName = parent?.planName ?? ''
      tier.visibleToPartners = false
      if (!onATab.has(tier.id)) {
        tier.status = 'legacy'
        tier.highlighted = false
        if (tier.planName && !/Youth$/.test(tier.planName)) tier.planName += ' · Youth'
      }
      if (!tier.description) tier.description = parent?.description ?? ''
      if (tier.features.length === 0 && parent) tier.features = parent.features
    }
    if (/^tier_bundle_/.test(ent)) {
      // Sold from the DAZN page as a plan of its own — DAZN plus a league pass
      // in one payment — so it is on the picker, as the Atlas lists it. It
      // takes no gold: the highlighted plan is the market's own.
      tier.highlighted = false
      tier.visibleToPartners = false
      const s = ent.toLowerCase()
      const basePlan = /_ul_|unlimited/.test(s) ? 'DAZN Unlimited' : /_full_/.test(s) ? 'DAZN Full' : /_std_|standard/.test(s) ? 'DAZN Standard' : 'DAZN'
      const add = /nflult/.test(s) ? 'NFL Ultimate' : /nflpro/.test(s) ? 'NFL Pro' : /nfl/.test(s) ? 'NFL Game Pass' : /nhl/.test(s) ? 'NHL.TV' : ''
      tier.planName = add ? `${basePlan} + ${add}` : basePlan
      tier.description = tier.description || 'Two subscriptions in one payment.'
      // What is in it is what is in its two halves: the market's top DAZN
      // plan and the NFL pass it is sold with. The CMS has no card for a
      // bundle, so the lines come from the cards it has.
      if (tier.features.length === 0) {
        const daznHalf = [...tiers.values()]
          .filter((t) => t.source!.product === 'DAZN' && !/^tier_bundle_|_yp$/.test(t.source!.entitlementSetId) && t.status === 'live')
          .sort((a, b) => b.displayOrder - a.displayOrder)[0]
        const nflHalf = tiers.get(tierIdFor('NFL', /nflult/.test(s) ? 'tier_nfl_ultimate' : 'tier_nfl_pro'))
        tier.features = uniq([...(daznHalf?.features.slice(0, 3) ?? []), ...(nflHalf?.features.slice(0, 2) ?? [])])
        tier.logoTiles = uniq([...(daznHalf?.logoTiles.slice(0, 3) ?? []), ...(nflHalf?.logoTiles.slice(0, 2) ?? [])])
        tier.logoTotal = tier.logoTiles.length
      }
    }
    if (!tier.planName) {
      // A DAZN set the DAZN page has no card for is priced but not on sale to
      // a new customer from the page — a closed plan, a duplicate SKU.
      if (tier.source!.product === 'DAZN') tier.status = 'legacy'
      tier.planName = nameFromId(ent)
      tier.source!.copy = 'id'
      notes.push(`${tier.id}: named from its id`)
    }
    /* The facts fill in what the words leave out. */
    if (tier.limits) {
      const said = (re: RegExp) => tier.features.some((id) => re.test(features.get(id)?.text ?? ''))
      const missing = limitLines(tier.limits).filter((line) => {
        if (/device|stream/i.test(line)) return !said(SAYS.streams)
        if (/download/i.test(line)) return !said(SAYS.downloads)
        if (/mobile/i.test(line)) return !said(SAYS.mobile)
        if (/pay-per-view/i.test(line)) return !said(SAYS.ppv)
        return !said(SAYS.video)
      })
      if (missing.length) tier.features = uniq([...tier.features, ...missing.map(feature)])
      if (!tier.description.trim()) {
        tier.description = limitLines(tier.limits).slice(0, 3).join(' · ')
        tier.source!.copy = 'entitlements'
      }
    }
  }
  /* Add-on names: the add-on's set is usually a plan of its own. */
  for (const o of offers) {
    for (const line of o.canAdd ?? []) {
      if (line.name) continue
      const asPlan = [...tiers.values()].find((t) => t.source!.entitlementSetId === line.id)
      line.name = asPlan?.planName || nameFromId(line.id)
    }
  }

  /* One highlighted plan per row (S-1): a row is one product's live plans
     on one tab, so the highest-ranked on each keeps it. */
  const rows = new Map<string, Tier[]>()
  for (const t of tiers.values()) {
    if (t.status !== 'live' || !t.highlighted) continue
    for (const tab of t.tabs?.length ? t.tabs : ['']) {
      const key = `${t.source!.product}|${tab}`
      rows.set(key, [...(rows.get(key) ?? []), t])
    }
  }
  for (const row of rows.values()) {
    for (const t of row.sort((a, b) => b.displayOrder - a.displayOrder).slice(1)) t.highlighted = false
  }

  return {
    market: {
      code: market,
      label: MARKET_LABEL[market] ?? market.toUpperCase(),
      locale,
      currency,
      ...(paymentMethods.length ? { paymentMethods } : {}),
      ...(Object.keys(words).length && !locale.startsWith('en')
        ? { words: { language: locale.split('-')[0], strings: words } }
        : {}),
      // The tool reads English, so only English strings are read as the
      // checkout's words; a market pulled in its own language alone keeps
      // those for the translator and reads the authored lines until then.
      ...((pull.strings && Object.keys(pull.strings.strings).length) || (pull.nativeStrings && Object.keys(pull.nativeStrings.strings).length)
        ? {
            checkoutCopy: {
              strings: pull.strings && (pull.strings.language ?? 'en') === 'en' ? pull.strings.strings : {},
              links: pull.strings?.links ?? pull.nativeStrings?.links ?? {},
              ...(pull.strings?.version ? { version: pull.strings.version } : {}),
              ...(pull.nativeStrings && Object.keys(pull.nativeStrings.strings).length && pull.nativeStrings.language
                ? { native: { language: pull.nativeStrings.language, strings: pull.nativeStrings.strings } }
                : {}),
            },
          }
        : {}),
    },
    tiers: [...tiers.values()],
    offers,
    featureCatalog: [...features.values()],
    logoCatalog: [...logos.values()],
    addOnCatalog: [...addOns.values()],
    fetchedAt: pull.fetchedAt,
    ...(tabbed ? { tabs: tabbed.tabs } : {}),
    notes,
  }
}

/* ── Folding a market into the set ───────────────────────────────────── */

/** The plan facts DAZN owns. Everything else on a tier is the tool's. */
const FACTS = ['planName', 'description', 'features', 'logoTiles', 'logoTotal', 'highlighted', 'badge', 'status', 'tabs'] as const
type Fact = (typeof FACTS)[number]

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/**
 * A market's fresh plans, folded in. Live wins for the facts; the tool's own
 * additions stay.
 *
 * A plan new to the set arrives whole, with this market's words as its base.
 * A plan already in the set keeps its base and takes this market's words as
 * its market patch — only where they differ — so the resolved card in this
 * market reads exactly what DAZN's page reads, and every other market is
 * untouched. Prices are replaced for this market alone.
 */
export function mergeLive(set: CardSet, live: LiveMarket): CardSet {
  const market = live.market.code
  const tiers = set.tiers.map((t) => ({ ...t, overrides: [...t.overrides] }))
  const byId = new Map(tiers.map((t) => [t.id, t]))

  for (const fresh of live.tiers) {
    const have = byId.get(fresh.id)
    if (!have) {
      tiers.push(fresh)
      byId.set(fresh.id, fresh)
      continue
    }
    // Facts the same in every market ride on the tier itself.
    have.limits = fresh.limits ?? have.limits
    have.source = fresh.source
    have.displayOrder = Math.max(have.displayOrder, fresh.displayOrder)
    have.subscriptions = fresh.subscriptions
    const patch: TierPatch = {}
    for (const k of FACTS) {
      if (!same(fresh[k], have[k])) (patch as Record<Fact, unknown>)[k] = fresh[k]
    }
    have.overrides = have.overrides.filter((o) => !(o.when.market === market && !o.when.campaign && !o.when.tab))
    if (Object.keys(patch).length) have.overrides.unshift({ id: `${fresh.id}-${market}`, when: { market }, patch })
  }

  const liveIds = new Set(live.tiers.map((t) => t.id))
  const offers = [
    ...set.offers.filter((o) => !(o.market === market && liveIds.has(o.tierId))),
    ...live.offers,
  ]
  const replace = <T extends { id: string }>(old: T[], fresh: T[]) => {
    const ids = new Set(fresh.map((x) => x.id))
    return [...old.filter((x) => !ids.has(x.id)), ...fresh]
  }
  const keepUploaded = (old: CatalogEntry[], fresh: CatalogEntry[]) =>
    fresh.map((f) => {
      const was = old.find((o) => o.id === f.id)
      // A badge somebody uploaded over the CDN one stays theirs.
      return was?.image?.startsWith('data:') ? { ...f, image: was.image } : f
    })
  const markets = [...set.markets.filter((m) => m.code !== market), live.market]

  // The tabs the CMS draws over this market's picker replace whatever the
  // market had; a market the CMS draws in one row keeps its own tabs, if
  // anyone wrote some.
  const planTabsByMarket = live.tabs
    ? { ...(set.planTabsByMarket ?? {}), [market]: live.tabs }
    : set.planTabsByMarket

  return {
    ...set,
    markets,
    ...(planTabsByMarket ? { planTabsByMarket } : {}),
    // In the tool's order — shortest commitment first — with anything a set
    // names that DAZN does not after.
    cadences: [...CADENCES, ...set.cadences.filter((c) => !CADENCES.includes(c))],
    featureCatalog: replace(set.featureCatalog, live.featureCatalog),
    logoCatalog: replace(set.logoCatalog, keepUploaded(set.logoCatalog, live.logoCatalog)),
    addOnCatalog: replace(set.addOnCatalog ?? [], live.addOnCatalog),
    tiers,
    offers,
    live: { ...(set.live ?? {}), [market]: live.fetchedAt },
  }
}

/** Which markets the set has live plans for, and when they were last fetched. */
export const liveMarkets = (set: CardSet) => Object.keys(set.live ?? {})

/**
 * The set with every live plan taken back out — what a full re-import starts
 * from, so a SKU DAZN has withdrawn does not linger. Authored plans, the
 * catalogues, flow copy and journeys stay.
 */
export function withoutLive(set: CardSet): CardSet {
  const liveIds = new Set(set.tiers.filter((t) => t.source).map((t) => t.id))
  return {
    ...set,
    tiers: set.tiers.filter((t) => !liveIds.has(t.id)),
    offers: set.offers.filter((o) => !liveIds.has(o.tierId)),
    live: {},
  }
}
