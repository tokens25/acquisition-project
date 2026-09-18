#!/usr/bin/env node
/**
 * Build the shared content file from DAZN's APIs.
 *
 *   node scripts/import-dazn.mjs            → fetch every market live, write public/content/card-set.json
 *   node scripts/import-dazn.mjs --cached   → build from data/dazn/{offers,content} (what pull-dazn.mjs saved)
 *   node scripts/import-dazn.mjs --dry      → print the report, write nothing
 *
 * The same code the app's /api/dazn route runs (src/rules/dazn), bundled here
 * with esbuild so the script needs nothing installed beyond the repo. The
 * file it writes is the fallback the app opens with when the live route
 * cannot be reached, and the copy everyone shares.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'esbuild'

const DATA = 'data/dazn'
const OUT = 'public/content/card-set.json'
const args = new Set(process.argv.slice(2))
const dry = args.has('--dry')
const cached = args.has('--cached')

async function load(entry) {
  const r = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node20', logLevel: 'silent' })
  return import(`data:text/javascript;base64,${Buffer.from(r.outputFiles[0].text).toString('base64')}`)
}
const dazn = await load('src/rules/dazn/index.ts')
const { MARKETS, LOCALE, LOCALE_FALLBACK, PRODUCTS, buildMarket, mergeLive, withoutLive, fetchMarket, fetchContent, BASE_LOCALE } = dazn

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'))

/** A market's pull, from the files pull-dazn.mjs saved. */
async function pullFromFiles(market, base) {
  const offers = {}
  for (const p of PRODUCTS) {
    try {
      offers[p] = await readJson(join(DATA, 'offers', `${market}-${p}.json`))
    } catch { /* not sold here */ }
  }
  const locale = LOCALE_FALLBACK[LOCALE[market]] ?? LOCALE[market]
  const content = []
  for (const f of [`${locale}.json`, ...PRODUCTS.filter((p) => p !== 'DAZN').map((p) => `${locale}--${p}.json`)]) {
    try { content.push(await readJson(join(DATA, 'content', f))) } catch { /* no page */ }
  }
  // `{cc}.json` is the market's own language, `{cc}.en.json` the English; a
  // market whose language is English has only the first.
  let native = null
  let english = null
  try { native = await readJson(join(DATA, 'strings', `${market}.json`)) } catch { /* not pulled */ }
  try { english = await readJson(join(DATA, 'strings', `${market}.en.json`)) } catch { /* not pulled */ }
  const lang = (LOCALE[market] ?? 'en-GB').split('-')[0]
  if (native && !native.language) native.language = lang
  return {
    market, offers, content, base: base ?? content,
    strings: lang === 'en' ? native : (english ?? native),
    nativeStrings: lang === 'en' ? null : native,
    fetchedAt: new Date().toISOString(),
  }
}

const current = await readJson(OUT).catch(() => null)
if (!current) {
  console.error(`${OUT} is missing — the import patches the shared file, it does not create one.`)
  process.exit(1)
}
let set = withoutLive(current)
const report = []

const base = cached
  ? (await pullFromFiles('gb')).content
  : await fetchContent(fetch, BASE_LOCALE)

for (const market of MARKETS) {
  const pull = cached ? await pullFromFiles(market, base) : await fetchMarket(fetch, market, base)
  const live = buildMarket(pull)
  if (!live) {
    report.push(`${market}: nothing on sale`)
    continue
  }
  set = mergeLive(set, live)
  report.push(`${market}: ${live.tiers.length} plans, ${live.offers.length} prices, ${live.market.currency}${live.notes.length ? ` · ${live.notes.join('; ')}` : ''}`)
  process.stderr.write(`${market} `)
}
process.stderr.write('\n')

set = { ...set, context: { ...(set.context ?? {}), market: set.context?.market || 'gb' } }

/* Base flow copy from when MSG+ was the only content. It is a layer now, so
   the file ships the DAZN-generic base the app carries and nothing else. */
if (set.flow && /MSG\+|TV provider|Knicks/i.test(JSON.stringify(set.flow))) {
  const { flow: _flow, ...rest } = set
  set = rest
}

/* Catalogue lines nothing refers to any more — a benefit reworded upstream,
   a badge dropped from a card — go, so the file does not grow a tail of
   spellings no plan uses. */
const used = { features: new Set(), logos: new Set() }
for (const t of set.tiers) {
  for (const id of t.features) used.features.add(id)
  for (const id of t.logoTiles) used.logos.add(id)
  for (const o of set.offers) for (const id of o.features ?? []) used.features.add(id)
  for (const o of t.overrides) {
    for (const id of o.patch.features ?? []) used.features.add(id)
    for (const id of o.patch.logoTiles ?? []) used.logos.add(id)
  }
}
set = {
  ...set,
  featureCatalog: set.featureCatalog.filter((f) => used.features.has(f.id)),
  logoCatalog: set.logoCatalog.filter((l) => used.logos.has(l.id)),
}

const liveTiers = set.tiers.filter((t) => t.source)
const summary = [
  `markets  ${set.markets.length}`,
  `plans    ${liveTiers.length} live + ${set.tiers.length - liveTiers.length} authored`,
  `offers   ${set.offers.length}`,
  `benefits ${set.featureCatalog.length} lines`,
  `badges   ${set.logoCatalog.length}`,
  '',
  ...report,
  '',
  ...liveTiers.map((t) => `${t.id}: "${t.planName}"${t.source.copy ? ` (${t.source.copy})` : ''}${t.status === 'legacy' ? ' [legacy]' : ''} · ${t.overrides.length} market patches`),
].join('\n')

console.log(summary)
if (!dry) {
  await writeFile(OUT, JSON.stringify(set, null, 2) + '\n')
  await writeFile(join(DATA, 'import-report.txt'), summary + '\n').catch(() => {})
  console.log(`\nWritten to ${OUT}`)
}
