import type { SheetRows } from './xlsx'

/**
 * Turns the filled content template into the shape the engine adapter reads.
 *
 * Deliberately produces the *engine's* JSON rather than ours: that conversion
 * is already written, already tested against their real Spain export, and is
 * the shape their renderer consumes. Two importers that disagree about what a
 * tier is would be the expensive kind of duplication.
 *
 * Columns are found by header name, not by position, so inserting a column in
 * the template does not silently shift every value one field to the left.
 */

export interface SheetImport {
  content: unknown
  /** Problems worth showing rather than swallowing. */
  notes: string[]
}

const clean = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase()

/** Header row to column index, keyed by the header's first line, lowercased. */
function headerMap(rows: string[][]): Map<string, number> {
  const map = new Map<string, number>()
  const header = rows[0] ?? []
  header.forEach((cell, i) => {
    const key = clean(cell.split('\n')[0] ?? '')
    if (key) map.set(key, i)
  })
  return map
}

const bodyRows = (rows: string[][]) => rows.slice(1).filter((r) => r.some((c) => c.trim() !== ''))

function list(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const bool = (value: string) => value.trim().toUpperCase() === 'TRUE'

function num(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** True when the row is the template's own worked example, not real content. */
const isExample = (countryCode: string, tierCode: string) =>
  /example/i.test(tierCode) || /example/i.test(countryCode)

export function readTemplate(sheets: SheetRows): SheetImport {
  const notes: string[] = []
  const tiersSheet = sheets['Tiers']
  const offersSheet = sheets['CadenceOffers']
  if (!tiersSheet || !offersSheet) {
    throw new Error('This does not look like the content template — no "Tiers" or "CadenceOffers" tab.')
  }

  const tierCols = headerMap(tiersSheet)
  const at = (row: string[], cols: Map<string, number>, name: string) => {
    const i = cols.get(name)
    return i === undefined ? '' : (row[i] ?? '')
  }

  const idFor = new Map<string, string>()
  const tiers = []
  let skippedExamples = 0

  for (const row of bodyRows(tiersSheet)) {
    const country = at(row, tierCols, 'country_code').toUpperCase()
    const code = at(row, tierCols, 'tier_code')
    if (!country || !code) continue
    if (isExample(country, code)) {
      skippedExamples += 1
      continue
    }
    const id = `${country.toLowerCase()}-${code.toLowerCase()}`
    idFor.set(`${country}|${code}`, id)
    const order = num(at(row, tierCols, 'display_order'))
    tiers.push({
      id,
      countryCode: country,
      tierCode: code,
      planName: at(row, tierCols, 'plan_name'),
      description: at(row, tierCols, 'description'),
      features: list(at(row, tierCols, 'features')),
      ultimate: bool(at(row, tierCols, 'ultimate')),
      logoTiles: list(at(row, tierCols, 'logo_tiles')),
      displayOrder: order ?? tiers.length + 1,
      status: at(row, tierCols, 'status').toLowerCase() || 'live',
      channel: at(row, tierCols, 'channel').toLowerCase() || 'direct',
      visibleToPartners: bool(at(row, tierCols, 'visible_to_partners')),
    })
  }

  const offerCols = headerMap(offersSheet)
  const cadenceOffers = []
  for (const row of bodyRows(offersSheet)) {
    const country = at(row, offerCols, 'country_code').toUpperCase()
    const code = at(row, offerCols, 'tier_code')
    const cadence = at(row, offerCols, 'cadence')
    if (!country || !code || !cadence) continue
    if (isExample(country, code)) continue
    const tierId = idFor.get(`${country}|${code}`)
    if (!tierId) {
      // A price for a plan that is not on the Tiers tab. Dropping it silently
      // would leave a plan mysteriously unpriced later.
      notes.push(`Priced a plan that is not on the Tiers tab: ${country} / ${code} (${cadence}).`)
      continue
    }
    cadenceOffers.push({
      id: `${tierId}-${cadence.toLowerCase().replace(/\s+/g, '-')}`,
      tierId,
      cadence,
      standardPrice: num(at(row, offerCols, 'standard_price')),
      discount: bool(at(row, offerCols, 'discount')),
      introPrice: num(at(row, offerCols, 'intro_price')),
      addOnId: at(row, offerCols, 'add_on_id') || null,
      includedAddOnIds: list(at(row, offerCols, 'included_add_on_ids')),
      addOnPurchaseType: at(row, offerCols, 'add_on_purchase_type') || null,
      addOnDiscountPercent: num(at(row, offerCols, 'add_on_discount_percent')),
    })
  }

  // The reference tabs list the ids already in the build, so they are read for
  // wording changes rather than treated as new content.
  const featureSheet = sheets['Feature ids']
  const featureCatalog = []
  if (featureSheet) {
    const cols = headerMap(featureSheet)
    const idCol = cols.get('id') ?? 0
    const iconCol = cols.get('icon') ?? 1
    const textCol = cols.get('wording shown on the card') ?? 2
    for (const row of bodyRows(featureSheet)) {
      const id = row[idCol]?.trim()
      if (!id) continue
      featureCatalog.push({ id, iconId: row[iconCol]?.trim() ?? '', text: row[textCol]?.trim() ?? '' })
    }
  }

  if (tiers.length === 0) {
    notes.push('No plans were found. Fill the Tiers tab — the example row is ignored on purpose.')
  }
  if (skippedExamples > 0) {
    notes.push(`Ignored ${skippedExamples} example row(s) from the template.`)
  }

  return {
    content: { tiers, cadenceOffers, addOns: [], featureCatalog },
    notes,
  }
}
