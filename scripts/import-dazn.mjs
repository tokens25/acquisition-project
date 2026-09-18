#!/usr/bin/env node
/**
 * Build the content set from what pull-dazn.mjs fetched.
 *
 *   node scripts/import-dazn.mjs            → public/content/card-set.json
 *   node scripts/import-dazn.mjs --dry      → prints what it would write
 *
 * What a plan is here: one product's entitlement set — `NFL / tier_nfl_pro`,
 * `DAZN / tier_ult`. It is one plan in every market that sells it, with that
 * market's name, description and benefits as a market patch and that market's
 * prices as offers. That is the tool's sparse model exactly: authored once,
 * patched by market, priced by cadence — and it is also how DAZN's own APIs
 * see it, since the offers service prices an entitlement set per country and
 * the content service names it per locale.
 *
 * The DAZN product group is a market's general flow (no channel); the six
 * league products are channels. Nothing here is invented: a plan the content
 * service has no card for is named from its entitlement set id and left with
 * an empty description, and the publish gate will say so.
 *
 * The RSN plans (MSG+, Gotham, YES) are not in either API. They are kept from
 * the current content file, unchanged, so the one flow drawn in Figma keeps
 * working. They are flagged in the report.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DATA = 'data/dazn'
const OUT = 'public/content/card-set.json'
const dry = process.argv.includes('--dry')

/* ── What the tool calls things ──────────────────────────────────────── */

/** Product group → channel id in the tool. DAZN itself is "no channel". */
const CHANNEL_OF = {
  NFL: 'nfl',
  NHL: 'nhl',
  FIBA: 'fiba',
  CollegeSports: 'college-sports',
  RallyTV: 'rallytv',
  NationalLeagueTV: 'national-league',
}
/** As DAZN markets them, from the Atlas dataset. FIBA sells as Courtside 1891. */
const CHANNEL_LABEL = {
  nfl: 'NFL Game Pass',
  nhl: 'NHL.TV',
  fiba: 'Courtside 1891',
  'college-sports': 'College Sports',
  rallytv: 'Rally TV',
  'national-league': 'National League TV',
}

/** BillingPeriod → the cadence names the tool already uses. */
const CADENCE = { Month: 'Monthly', Instalments: 'Yearly Instalments', Annual: 'Yearly' }

const MARKET_LABEL = {
  be: 'Belgium', at: 'Austria', de: 'Germany', li: 'Liechtenstein', lu: 'Luxembourg',
  ch: 'Switzerland', fr: 'France', it: 'Italy', jp: 'Japan', pt: 'Portugal', es: 'Spain',
  tw: 'Taiwan', ca: 'Canada', ie: 'Ireland', mx: 'Mexico', nl: 'Netherlands', pl: 'Poland',
  gb: 'United Kingdom', us: 'United States', au: 'Australia', br: 'Brazil',
}
const LOCALE = {
  be: 'nl-BE', at: 'de-AT', de: 'de-DE', li: 'de-LI', lu: 'fr-LU', ch: 'de-CH', fr: 'fr-FR',
  it: 'it-IT', jp: 'ja-JP', pt: 'pt-PT', es: 'es-ES', tw: 'zh-TW', ca: 'en-CA', ie: 'en-IE',
  mx: 'es-MX', nl: 'nl-NL', pl: 'pl-PL', gb: 'en-GB', us: 'en-US', au: 'en-AU', br: 'pt-BR',
}
/** Locales the content service had nothing for; read the nearest instead. */
const LOCALE_FALLBACK = { 'fr-LU': 'fr-FR', 'nl-NL': 'nl-BE', 'pl-PL': 'en-GB' }
const BASE_LOCALE = 'en-GB'

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* ── The Atlas dataset ────────────────────────────────────────────────── */

/**
 * Curated English names, descriptions and benefit lines from the DAZN Package
 * Atlas (data/dazn/atlas.json), kept by hand by whoever runs that dashboard.
 *
 * Used for what the content service does not have: the six league products'
 * cards, and a description where a market's card ships without one. Never
 * over what the content service does have — the CMS is what the site shows,
 * in the market's own language, and a curated English line is not an
 * improvement on the Italian a customer in Italy reads.
 */
async function loadAtlas() {
  let d
  try {
    d = await readJson(join(DATA, 'atlas.json'))
  } catch {
    return { league: new Map(), dazn: new Map(), youthNote: false }
  }
  const league = new Map() // `${product}|${entSet}` → { name, inc, tags }
  const dazn = new Map() // `${cc}|${entSet}` → { name, desc, inc, badge, hl }
  for (const [cc, m] of Object.entries(d.markets ?? {})) {
    for (const t of m.tiers ?? []) {
      dazn.set(`${cc.toLowerCase()}|${t.id}`, { name: t.name, desc: t.desc, inc: t.inc ?? [], badge: t.badge, hl: Boolean(t.hl), resolution: t.resolution })
    }
    for (const p of m.products ?? []) {
      for (const t of p.tiers ?? []) {
        const k = `${p.pg}|${t.id}`
        if (!league.has(k)) league.set(k, { product: p.name, name: t.name, inc: t.inc ?? [], tags: t.tags ?? [], resolution: t.resolution })
      }
    }
  }
  return { league, dazn }
}

/* ── Read ─────────────────────────────────────────────────────────────── */

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'))

async function loadOffers() {
  const files = await readdir(join(DATA, 'offers'))
  const out = [] // { market, product, body }
  for (const f of files) {
    const m = /^([a-z]{2})-([A-Za-z]+)\.json$/.exec(f)
    if (!m) continue
    out.push({ market: m[1], product: m[2], body: await readJson(join(DATA, 'offers', f)) })
  }
  return out
}

/** One locale's content, indexed. */
async function loadContent(locale) {
  // The DAZN page's groups, plus each product's own page when the pull has
  // it: the league plans' cards live under their product's pageId.
  const files = [`${locale}.json`, ...Object.keys(CHANNEL_OF).map((p) => `${locale}--${p}.json`)]
  const entries = new Map()
  const assets = new Map()
  const groups = []
  let any = false
  for (const f of files) {
    let body
    try {
      body = await readJson(join(DATA, 'content', f))
    } catch {
      continue
    }
    any = true
    for (const e of body.includes?.Entry ?? []) entries.set(e.sys.id, e)
    for (const a of body.includes?.Asset ?? []) assets.set(a.sys.id, a)
    groups.push(...(body.items ?? []))
  }
  return any ? { locale, groups, entries, assets } : null
}

/* ── Tier details, from the offers service's Entitlements ─────────────── */

/**
 * What a plan lets you do, as the offers service states it.
 *
 * These are facts about the entitlement set, not copy: how many streams at
 * once, on how many networks, whether downloads are allowed, whether the plan
 * is phone-only, how many pay-per-views it bundles. DAZN's own cards turn
 * exactly these into benefit lines — "Stream on 2 devices in 1 location" — so
 * a card that has no such line gets one written from the same facts, and a
 * plan with no description at all gets one made of nothing but them.
 */
function detailsOf(body) {
  const out = new Map()
  for (const e of body.Entitlements ?? []) {
    const ids = e.entitlementIds ?? []
    const f = e.features ?? {}
    const conc = f.CONCURRENCY ?? {}
    const dev = f.DEVICE ?? {}
    const policy = ids.some((x) => x.includes('disallow_watch_concurrency'))
      ? 'one'
      : ids.some((x) => x.includes('with_single_location'))
        ? 'single'
        : ids.some((x) => x.includes('watch_concurrency'))
          ? 'multi'
          : null
    out.set(e.setId, {
      streams: typeof conc.max_devices === 'number' ? conc.max_devices : null,
      networks: typeof conc.max_ips === 'number' ? conc.max_ips : policy === 'single' ? 1 : null,
      policy,
      downloads: ids.some((x) => x.includes('allow_download')),
      mobileOnly: dev.access_device === 'mobile',
      ppvs: (e.ppvsIncluded ?? []).length,
      multiview: (e.multiviewEnabledCountries ?? []).length > 0,
    })
  }
  return out
}

/** The lines those facts make, in the order DAZN's cards tend to put them. */
function detailLines(d, resolution) {
  const lines = []
  if (resolution) lines.push(resolution === '4K/HDR' ? 'HDR and Dolby 5.1 on selected events' : 'Full HD video')
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
}

/* ── Choosing the right card for a market ────────────────────────────── */

const norm = (s) => String(s ?? '').toLowerCase()

/**
 * The tier items that describe an entitlement set for a market, best first.
 *
 * The CMS carries every variant of every market's page — promos, tests,
 * welcome pages, other regions. A group is right for a market when it is in
 * production, on the DAZN page, and either tagged with the market or, failing
 * that, tagged common. Names that say EXCLUDE, promo, test or welcome go to the
 * back of the queue rather than out of it: they are still real cards, just not
 * the ones a signup page shows first.
 */
function cardsFor(content, market, entSetId) {
  if (!content) return []
  const tag = norm(market)
  const scored = []
  for (const g of content.groups) {
    const f = g.fields
    if (!(f.env ?? []).includes('production')) continue
    if (!(f.pageIds ?? []).includes('DAZN') && !(f.pageIds ?? []).some((p) => p in CHANNEL_OF)) continue
    const tags = (f.tags ?? []).map(norm)
    const name = norm(f.displayName)
    let score = 0
    if (tags.includes(tag)) score += 100
    else if (tags.some((t) => t === 'common' || t.endsWith('common'))) score += 40
    else continue
    if (/exclude|promo|test|welcome|black ?friday|stag/.test(name)) score -= 30
    if (/sign ?up|tiering unified|prod/.test(name)) score += 10
    for (const link of f.tiers ?? []) {
      const item = content.entries.get(link.sys.id)
      if (!item || item.sys.contentType.sys.id !== 'CommonContentTierItem') continue
      if (item.fields.entitlementSetId !== entSetId) continue
      // A monthly card names the plan; an instalment card often names the
      // billing, "Annual — pay monthly", which is not the plan's name.
      const monthly = item.fields.billingPeriod === 'Month' ? 5 : 0
      scored.push({ score: score + monthly, item, group: f.displayName })
    }
  }
  return scored.sort((a, b) => b.score - a.score)
}

function benefitsOf(content, item) {
  return (item.fields.benefits ?? [])
    .map((l) => content.entries.get(l.sys.id))
    .filter(Boolean)
    .map((e) => ({
      key: e.fields.key ?? 'check',
      text: String(e.fields.value ?? '').replace(/​/g, '').trim(),
    }))
    .filter((b) => b.text)
}

function logosOf(content, item) {
  // The small row of competition badges is `overrideLogos`; `bigLogos` is the
  // larger strip some markets draw instead. The card wants the small row.
  const f = item.fields
  const links = !f.showLogos ? [] : f.showOverrideLogos ? f.overrideLogos ?? [] : f.bigLogos ?? f.overrideLogos ?? []
  return links
    .map((l) => content.assets.get(l.sys.id))
    .filter(Boolean)
    .map((a) => ({
      id: `logo-${slug(a.fields.title ?? a.sys.id)}`,
      name: a.fields.title ?? a.sys.id,
      url: a.fields.file?.url ? `https:${a.fields.file.url}` : null,
    }))
    .filter((l) => l.url)
}

/* ── Build ────────────────────────────────────────────────────────────── */

async function main() {
  const current = await readJson(OUT).catch(() => ({}))
  const pulled = await loadOffers()
  const contentByLocale = new Map()
  const content = async (locale) => {
    const want = LOCALE_FALLBACK[locale] ?? locale
    if (!contentByLocale.has(want)) contentByLocale.set(want, await loadContent(want))
    return contentByLocale.get(want)
  }
  const base = await content(BASE_LOCALE)
  const atlas = await loadAtlas()

  const report = { markets: [], plans: [], unnamed: [], kept: [], offersSkipped: 0 }

  /* Markets: every country that answered, with the currency its prices are in. */
  const currencyOf = {}
  for (const { market, body } of pulled) {
    const c = body.Offers?.[0]?.ChargeTiers?.[0]?.Currency
    if (c) currencyOf[market] ??= c
  }
  const markets = Object.keys(LOCALE)
    .filter((m) => currencyOf[m])
    .map((code) => ({ code, label: MARKET_LABEL[code] ?? code.toUpperCase(), locale: LOCALE[code], currency: currencyOf[code] }))
  report.markets = markets.map((m) => `${m.code}:${m.currency}`)

  /* Plans and their prices. */
  const tiers = new Map() // id → tier
  const offers = []
  const features = new Map() // text → id
  const logos = new Map() // id → entry
  /*
   * One id per line, where "one line" ignores what a copywriter's keyboard did
   * to it: a double space or a trailing full stop is not a different benefit.
   * The first spelling seen is the one kept.
   */
  const canon = (text) => text.replace(/\s+/g, ' ').replace(/[.\u200b]+$/g, '').trim()
  const featureKeys = new Map() // canonical lower → text as first seen
  const featureId = (raw) => {
    const text = canon(raw)
    const key = text.toLowerCase()
    if (!featureKeys.has(key)) featureKeys.set(key, text)
    const kept = featureKeys.get(key)
    if (!features.has(kept)) features.set(kept, `f-${slug(kept).slice(0, 48)}-${features.size + 1}`)
    return features.get(kept)
  }
  /** The same line twice on one card says it once. */
  const uniq = (ids) => [...new Set(ids)]

  for (const { market, product, body } of pulled) {
    const channel = CHANNEL_OF[product] // undefined for DAZN itself
    const seen = new Set()
    const ranks = new Map()
    for (const o of body.Offers ?? []) {
      if (o.ProductType && o.ProductType !== 'SUBSCRIPTION') continue
      const cadence = CADENCE[o.BillingPeriod]
      if (!cadence) continue
      const key = `${o.EntitlementSetId}|${cadence}`
      // The service repeats an offer once per payment method; one row will do.
      if (seen.has(key)) continue
      seen.add(key)
      ranks.set(o.EntitlementSetId, o.TierRank ?? 0)

      const tierId = `${slug(product)}-${slug(o.EntitlementSetId)}`
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
          // Not a field the tool reads — a note for anyone opening the file.
          _source: { product, entitlementSetId: o.EntitlementSetId },
        })
      }
      const ct = o.ChargeTiers?.[0]
      if (!ct || typeof ct.Price !== 'number') {
        report.offersSkipped += 1
        continue
      }
      const d = ct.Discount
      offers.push({
        id: `${tierId}-${market}-${slug(cadence)}`,
        tierId,
        cadence,
        market,
        standardPrice: ct.Price,
        discount: Boolean(d && typeof d.Price === 'number'),
        introPrice: d && typeof d.Price === 'number' ? d.Price : null,
        introMonths: d?.DiscountedMonths ?? 0,
        addOnId: null,
        addOnPurchaseType: null,
        addOnDiscountPercent: null,
        includedAddOnIds: [],
      })
    }

    /* This market's words for each plan, as a market patch. */
    const local = await content(LOCALE[market])
    const details = detailsOf(body)
    for (const [entSet, rank] of ranks) {
      const tierId = `${slug(product)}-${slug(entSet)}`
      const tier = tiers.get(tierId)
      tier.displayOrder = Math.max(tier.displayOrder, rank)
      // The same entitlement set states the same facts in every market; the
      // first market to answer supplies them.
      if (!tier._details && details.get(entSet)) tier._details = details.get(entSet)
      const curatedRes = (atlas.league.get(`${product}|${entSet}`) ?? atlas.dazn.get(`${market}|${entSet}`))?.resolution
      if (curatedRes && !tier._resolution) tier._resolution = curatedRes
      const best = cardsFor(local, market, entSet)[0] ?? cardsFor(base, market, entSet)[0]
      if (!best) {
        // No card in the CMS. The Atlas has one for every league product, and
        // it is the same in every market, so it becomes the base — once.
        const curated = atlas.league.get(`${product}|${entSet}`) ?? atlas.dazn.get(`${market}|${entSet}`)
        if (curated && !tier.planName) {
          tier.planName = curated.name
          tier.description = curated.desc?.trim() ?? ''
          tier.features = uniq(curated.inc.map((line) => featureId(line)))
          if (curated.badge) tier.badge = curated.badge
          tier.highlighted = Boolean(curated.hl || curated.badge)
          tier._curated = true
        }
        continue
      }
      const f = best.item.fields
      const source = local ?? base
      const lines = benefitsOf(source, best.item)
      const badges = logosOf(source, best.item)
      for (const l of badges) logos.set(l.id, l)
      const curatedHere = atlas.dazn.get(`${market}|${entSet}`)
      const patch = {
        planName: f.title?.trim() || undefined,
        // The CMS's own words first; the Atlas's curated line only where the
        // card ships without one, because a card with no description is a
        // card the publish gate refuses.
        description: f.description?.trim() || curatedHere?.desc?.trim() || undefined,
        // The card has one switch for the gold treatment and the badge; the CMS
        // has two. A card DAZN badges is a card DAZN is pointing at.
        highlighted: Boolean(f.isCardHighlighted || (f.showEyebrow && f.eyebrowText) || (f.showBestValueBadge && f.bestValueBadgeText)),
        badge: f.showEyebrow && f.eyebrowText
          ? String(f.eyebrowText).trim()
          : f.showBestValueBadge && f.bestValueBadgeText
            ? String(f.bestValueBadgeText).trim()
            : undefined,
        features: uniq(lines.map((b) => featureId(b.text))),
        logoTiles: badges.map((l) => l.id),
        logoTotal: badges.length,
      }
      for (const k of Object.keys(patch)) if (patch[k] === undefined) delete patch[k]

      // The base is the first English card seen; every market then patches.
      if (!tier.planName && LOCALE[market].startsWith('en')) {
        Object.assign(tier, patch)
      } else if (!tier.planName && !tier._pendingBase) {
        tier._pendingBase = patch
      }
      tier.overrides.push({ id: `${tierId}-${market}`, when: { market }, patch })
    }
  }

  /* A plan no English market named takes its first market's words as base. */
  for (const tier of tiers.values()) {
    if (!tier.planName && tier._pendingBase) Object.assign(tier, tier._pendingBase)
    delete tier._pendingBase
    const ent = tier._source.entitlementSetId
    /*
     * Two kinds of plan the main picker does not show, priced though they are.
     *
     * A youth plan (`…_yp`) is the same plan at an under-25 rate for a year,
     * sold from a youth page. A bundle (`tier_bundle_…`) is DAZN plus a league
     * pass, sold as an upsell. Both are real, both are kept, and both are
     * `legacy` — priced but not offered to a new customer from the picker —
     * with names that say what they are, so nobody opening the file has to
     * decode an id.
     */
    if (/_yp$/.test(ent)) {
      tier.status = 'legacy'
      const parent = tiers.get(tier.id.replace(/-yp$/, ''))
      if (!tier.planName) tier.planName = parent?.planName ?? ''
      if (tier.planName && !/Youth$/.test(tier.planName)) tier.planName += ' · Youth'
      for (const o of tier.overrides) if (o.patch.planName && !/Youth$/.test(o.patch.planName)) o.patch.planName += ' · Youth'
    }
    if (/^tier_bundle_/.test(ent)) {
      tier.status = 'legacy'
      const s = ent.toLowerCase()
      const basePlan = /_ul_|unlimited/.test(s) ? 'DAZN Unlimited' : /_full_/.test(s) ? 'DAZN Full' : /_std_|standard/.test(s) ? 'DAZN Standard' : 'DAZN'
      const add = /nflult/.test(s) ? 'NFL Ultimate' : /nflpro/.test(s) ? 'NFL Pro' : /nfl/.test(s) ? 'NFL Game Pass' : /nhl/.test(s) ? 'NHL.TV' : ''
      tier.planName = add ? `${basePlan} + ${add}` : basePlan
      tier.description = tier.description || 'Two subscriptions in one payment.'
    }
    if (!tier.planName) {
      // A DAZN set the DAZN page has no card for is priced but not on sale to
      // a new customer from the page — a closed plan, a duplicate SKU. That is
      // what `legacy` means here.
      if (tier._source.product === 'DAZN') tier.status = 'legacy'
      // Named from the id, honestly: "tier_fiba_pro" → "FIBA Pro".
      tier.planName = tier._source.entitlementSetId
        .replace(/^tier_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        // The league names are initialisms and read wrong in title case.
        .replace(/\b(Fiba|Nfl|Nhl|Tv|Ul|Ult|Std)\b/g, (m) => ({ Ul: 'Ultimate', Ult: 'Ultimate', Std: 'Standard' })[m] ?? m.toUpperCase())
        .replace(/\bNationalleaguetv\b/, 'National League TV')
        .replace(/\bCollegesports\b/, 'College Sports')
        .replace(/\bRallytv\b/, 'Rally TV')
        .replace(/\bNflpro\b/, 'NFL Pro')
        .replace(/\bNflult\b/, 'NFL Ultimate')
      report.unnamed.push(`${tier.id} (${tier._source.product})`)
    }
    // A market patch identical to the base says nothing; drop it.
    tier.overrides = tier.overrides.filter((o) =>
      Object.entries(o.patch).some(([k, v]) => JSON.stringify(v) !== JSON.stringify(tier[k])),
    )
    report.plans.push(`${tier.id}: "${tier.planName}"${tier._curated ? ' (Atlas)' : ''}${tier._detailed ? ' (+details)' : ''}${tier.status === 'legacy' ? ' [legacy]' : ''} · ${tier.overrides.length} market patches`)
  }

  /*
   * What the details fill in, once the words have had their say.
   *
   * A description made of facts where a plan has none — "Full HD video ·
   * Stream on 2 devices in 1 location · Download to watch offline" — and a
   * benefit line for any detail the card's own lines do not mention, in any
   * of the languages a card here is written in. Nothing is added where the
   * card already speaks to it; a card saying "Dispositivi: 2" is not given
   * "Stream on 2 devices" beside it.
   */
  const textOf = (id) => [...features].find(([, v]) => v === id)?.[0] ?? ''
  const mentions = (ids, re) => ids.some((id) => re.test(textOf(id)))
  for (const tier of tiers.values()) {
    const d = tier._details
    if (!d) continue
    const lines = detailLines(d, tier._resolution)
    const missing = lines.filter((line) => {
      if (/device|stream/i.test(line)) return !mentions(tier.features, SAYS.streams)
      if (/download/i.test(line)) return !mentions(tier.features, SAYS.downloads)
      if (/mobile/i.test(line)) return !mentions(tier.features, SAYS.mobile)
      if (/pay-per-view/i.test(line)) return !mentions(tier.features, SAYS.ppv)
      return !mentions(tier.features, /\b(hd|hdr|4k|dolby|1080|full hd)\b/i)
    })
    if (missing.length) {
      tier.features = uniq([...tier.features, ...missing.map((line) => featureId(line))])
      tier._detailed = true
    }
    if (!tier.description.trim() && lines.length) {
      tier.description = lines.slice(0, 3).join(' · ')
      tier._detailed = true
    }
  }

  /* One highlighted plan per row (S-1). A row is one market's plans for one
     product, so the check runs there: the highest-ranked keeps it and the rest
     are patched off in that market. The base keeps whatever the English card
     said — it is the patch that is read. */
  const rows = new Map() // `${market}|${product}` → tiers priced there
  for (const o of offers) {
    const t = tiers.get(o.tierId)
    const k = `${o.market}|${t._source.product}`
    if (!rows.has(k)) rows.set(k, new Set())
    rows.get(k).add(t)
  }
  const litIn = (t, market) => {
    const p = t.overrides.find((o) => o.when.market === market)?.patch
    return p && 'highlighted' in p ? p.highlighted : t.highlighted
  }
  for (const [k, set] of rows) {
    const market = k.split('|')[0]
    const lit = [...set].filter((t) => litIn(t, market)).sort((a, b) => b.displayOrder - a.displayOrder)
    for (const t of lit.slice(1)) {
      const o = t.overrides.find((x) => x.when.market === market)
      if (o) o.patch.highlighted = false
      else t.overrides.push({ id: `${t.id}-${market}`, when: { market }, patch: { highlighted: false } })
    }
  }

  /* What the APIs do not have: the RSN plans, kept from the current file. */
  const keptTiers = (current.tiers ?? []).filter((t) => (t.subscriptions ?? []).includes('rsns'))
  const keptIds = new Set(keptTiers.map((t) => t.id))
  const keptOffers = (current.offers ?? []).filter((o) => keptIds.has(o.tierId))
  report.kept = keptTiers.map((t) => t.id)
  const keptFeatureIds = new Set(keptTiers.flatMap((t) => t.features))
  const keptLogoIds = new Set(keptTiers.flatMap((t) => t.logoTiles))

  const set = {
    ...current,
    markets,
    cadences: ['Monthly', 'Yearly Instalments', 'Yearly'],
    featureCatalog: [
      ...(current.featureCatalog ?? []).filter((f) => keptFeatureIds.has(f.id)),
      ...[...features].map(([text, id]) => ({ id, iconId: 'check', text, status: 'active' })),
    ],
    logoCatalog: [
      ...(current.logoCatalog ?? []).filter((l) => keptLogoIds.has(l.id)),
      ...[...logos.values()].map((l) => ({ id: l.id, name: l.name, altText: `${l.name} logo`, status: 'active', image: l.url })),
    ],
    tiers: [
      ...keptTiers,
      ...[...tiers.values()].map(({ _source, _curated, _details, _detailed, _resolution, ...t }) => ({
        ...t,
        source: {
          ..._source,
          ...(_curated ? { copy: 'atlas' } : {}),
          ...(_detailed ? { details: 'entitlements' } : {}),
          ...(_details ? { limits: _details } : {}),
        },
      })),
    ],
    offers: [...keptOffers, ...offers],
    // Start where the data is richest.
    context: { ...(current.context ?? {}), market: 'gb', subscription: undefined, cadence: 'Monthly' },
    journeyId: '',
    stepId: '',
  }

  const summary = [
    `markets  ${markets.length}: ${report.markets.join(' ')}`,
    `plans    ${tiers.size} from the APIs + ${keptTiers.length} RSN kept`,
    `offers   ${offers.length} priced rows (${report.offersSkipped} skipped, no price)`,
    `benefits ${features.size} distinct lines`,
    `badges   ${logos.size} logo assets`,
    `unnamed  ${report.unnamed.length}: ${report.unnamed.join(', ') || '—'}`,
    '',
    ...report.plans,
  ].join('\n')

  if (dry) {
    console.log(summary)
    return
  }
  await writeFile(OUT, JSON.stringify(set, null, 2) + '\n')
  await writeFile(join(DATA, 'import-report.txt'), summary + '\n')
  console.log(summary)
  console.log(`\nWritten to ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
