#!/usr/bin/env node
/**
 * Pull DAZN's public pricing and content APIs into data/dazn/.
 *
 * Run it in a normal Terminal on the Mac — `node scripts/pull-dazn.mjs`. It
 * cannot run from inside the assistant's sandbox, whose network is allow-listed
 * and does not include indazn.com; that is why the pull is a script you run
 * and the import is a step that reads what the script wrote.
 *
 * Both APIs are public GETs with no token, per DAZN's own reference. Nothing
 * here needs a credential and nothing here stores one.
 *
 *   data/dazn/offers/{CC}-{ProductGroup}.json   prices, cadences, limits
 *   data/dazn/content/{locale}.json             tier names and benefits
 *   data/dazn/manifest.json                     what was fetched, what failed
 *
 * A market that does not sell a product answers with an error or an empty
 * list. Both are recorded and neither stops the run: the point of pulling
 * everything is to learn which is which.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = 'data/dazn'

/** Every market the tool knows, plus the two Atlas has that it does not. */
const MARKETS = {
  be: 'nl-BE', at: 'de-AT', de: 'de-DE', li: 'de-LI', lu: 'fr-LU', ch: 'de-CH',
  fr: 'fr-FR', it: 'it-IT', jp: 'ja-JP', pt: 'pt-PT', es: 'es-ES', tw: 'zh-TW',
  ca: 'en-CA', ie: 'en-IE', mx: 'es-MX', nl: 'nl-NL', pl: 'pl-PL', gb: 'en-GB',
  us: 'en-US', au: 'en-AU', br: 'pt-BR',
}

/** Case-sensitive, as the reference warns. */
const PRODUCTS = ['DAZN', 'NFL', 'NHL', 'FIBA', 'CollegeSports', 'RallyTV', 'NationalLeagueTV']

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://www.dazn.com',
}

const offersUrl = (cc, product) =>
  `https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/${cc.toUpperCase()}` +
  `?Platform=web&Brand=DAZN&ProductGroup=${product}&IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2`

/* The checkout's words: localised templates, per market and language. */
const stringsUrl = (cc, lang) =>
  `https://resource-strings.acc.indazn.com/v1/eu/live?region=${cc}&LanguageCode=${lang}&Platform=web`
const CHECKOUT_KEYS =
  /^(payment_termsWarning(_extended|_klarnaPayOverTime|_weekly)?|payment_ROWexclusion|payment_terms_acceptance_\w+|signUp_cancelSentence_\w+|signUp_\w+_cancelSentence_\w+|signup_cancelation_youthoffer_\w+|auth_payment_cancelSentence_\w+)$/

const contentUrl = (locale, pageId = 'DAZN') =>
  `https://dazn-content-proxy.sd.indazn.com/spaces/vhp9jnid12wf/environments/master/entries` +
  `?content_type=CommonContentTierGroup&locale=${locale}&include=10&fields.env[in]=production&fields.pageIds[in]=${pageId}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function pull(url) {
  const res = await fetch(url, { headers: HEADERS })
  const text = await res.text()
  let body = null
  try { body = JSON.parse(text) } catch { /* not JSON — recorded as such */ }
  return { status: res.status, ok: res.ok && body !== null, body, text: body ? undefined : text.slice(0, 300) }
}

async function main() {
  await mkdir(join(OUT, 'offers'), { recursive: true })
  await mkdir(join(OUT, 'content'), { recursive: true })
  await mkdir(join(OUT, 'strings'), { recursive: true })
  const manifest = { pulledAt: new Date().toISOString(), offers: [], content: [], strings: [] }

  for (const [cc] of Object.entries(MARKETS)) {
    for (const product of PRODUCTS) {
      const r = await pull(offersUrl(cc, product))
      const offers = Array.isArray(r.body?.Offers) ? r.body.Offers.length : 0
      manifest.offers.push({ market: cc, product, status: r.status, ok: r.ok, offers, note: r.text })
      if (r.ok) await writeFile(join(OUT, 'offers', `${cc}-${product}.json`), JSON.stringify(r.body, null, 2))
      process.stdout.write(`${r.ok ? '✓' : '✗'} ${cc.toUpperCase().padEnd(3)} ${product.padEnd(17)} ${r.status}  ${offers} offers\n`)
      await sleep(150)
    }
  }

  // The DAZN page's cards, then each product's own page — the league plans'
  // names and benefits live under their product's pageId, not DAZN's.
  const pages = ['DAZN', ...PRODUCTS.filter((p) => p !== 'DAZN')]
  for (const locale of new Set(Object.values(MARKETS))) {
    for (const page of pages) {
      const r = await pull(contentUrl(locale, page))
      const items = Array.isArray(r.body?.items) ? r.body.items.length : 0
      manifest.content.push({ locale, page, status: r.status, ok: r.ok, items, note: r.text })
      const file = page === 'DAZN' ? `${locale}.json` : `${locale}--${page}.json`
      if (r.ok && items > 0) await writeFile(join(OUT, 'content', file), JSON.stringify(r.body, null, 2))
      process.stdout.write(`${r.ok && items ? '✓' : '·'} content ${locale.padEnd(6)} ${page.padEnd(17)} ${r.status}  ${items} entries\n`)
      await sleep(150)
    }
  }

  // The checkout's words, trimmed to the keys the checkout reads — the full
  // response is twenty thousand strings, most of them the app's own UI.
  // In English (what the tool reads) and in the market's own language (what
  // Translate puts on screen): `{cc}.json` and `{cc}.en.json`.
  for (const [cc, locale] of Object.entries(MARKETS)) {
    const lang = locale.split('-')[0]
    for (const l of lang === 'en' ? ['en'] : [lang, 'en']) {
      const r = await pull(stringsUrl(cc, l))
      const all = r.body?.Strings ?? {}
      const strings = Object.fromEntries(Object.entries(all).filter(([k]) => CHECKOUT_KEYS.test(k)))
      const n = Object.keys(strings).length
      manifest.strings.push({ market: cc, language: l, status: r.status, ok: r.ok, keys: n, version: r.body?.Metadata?.Version, note: r.text })
      const file = l === 'en' && lang !== 'en' ? `${cc}.en.json` : `${cc}.json`
      if (r.ok && n) await writeFile(join(OUT, 'strings', file), JSON.stringify({ strings, links: r.body.Links ?? {}, version: r.body.Metadata?.Version, language: l }, null, 2))
      process.stdout.write(`${r.ok && n ? '✓' : '·'} strings ${cc.toUpperCase().padEnd(3)} ${l}  ${r.status}  ${n} checkout keys\n`)
      await sleep(150)
    }
  }

  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
  const good = manifest.offers.filter((o) => o.ok && o.offers > 0)
  console.log(`\n${good.length} market × product combinations returned offers. Written to ${OUT}/.`)
  console.log('Next: tell the assistant it is there, and it will map it into the tool.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
