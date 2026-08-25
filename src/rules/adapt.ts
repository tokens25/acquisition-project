import type {
  AddOnEntry,
  CadenceOffer,
  CardSet,
  CatalogEntry,
  FeatureEntry,
  MarketConfig,
  Tier,
} from './content'
import { DIRECT } from './content'
import { defaultSet } from './defaults'

/**
 * Adapter for the engineering-side export.
 *
 * Their model scopes a tier to a country — one row per (country, tier), ids
 * like `es-tier_vito_es`. Ours keeps tiers global and scopes *offers* to a
 * market. Those meet cleanly: emit every offer with `market: countryCode`, and
 * a Spanish tier simply has no offer outside Spain, so it stops rendering
 * there without needing a country field of its own.
 *
 * What is lost is deduplication. Their tier codes already carry the country
 * (`tier_vito_es`), so the same plan in two countries is two unrelated rows —
 * there is nothing to fold into a base plus differences, and pretending
 * otherwise would invent a relationship the data does not claim.
 *
 * ── Where their template and this renderer disagree ──────────────
 *
 * From their Content Editor Template cheat sheet. None of these break the
 * import; all three surface the day someone compares the two outputs, so they
 * are recorded here rather than rediscovered.
 *
 * 1. `display_order` — the cheat sheet calls it "authored, but not yet wired
 *    into the engine's sort — a known, parked gap". This renderer does sort by
 *    it (resolveSet). Same content, different card order. Ours matches what the
 *    column claims; theirs is the gap.
 *
 * 2. Nothing carries the total-competitions count. Their `logo_tiles_count` is
 *    auto and read-only — it counts the ids in `logo_tiles` — so a plan showing
 *    five logos reports 5. The card's "+N" tile is derived from how many
 *    competitions the plan actually carries (9 for Ultimate), a different
 *    number that is not in the template at all. An import cannot produce "+N"
 *    from their sheet, and the card under-reports the plan. `Tier.logoTotal`
 *    is authored here to fill that gap.
 *
 * 3. `ultimate` — their rule is "exactly one tier per country may be TRUE".
 *    S-1 here is one per *rendered set*: market x storefront x cadence. Both
 *    catch the same failures today; they diverge the moment a partner wants a
 *    different flagship from direct, which theirs forbids and ours allows.
 *
 * Useful, and not obvious from the data: `tier_code` is the real OvpSKU for
 * Spain's rows, so those ids trace back to billing. A reverse adapter must
 * preserve them exactly.
 */


interface EngineTier {
  id: string
  countryCode: string
  tierCode: string
  planName: string
  description: string
  features: string[]
  ultimate: boolean
  logoTiles: string[]
  displayOrder: number | null
  status: string | null
  channel: string | null
  visibleToPartners: boolean
}

interface EngineOffer {
  id: string
  tierId: string
  cadence: string
  standardPrice: number | null
  discount: boolean
  introPrice: number | null
  addOnId: string | null
  includedAddOnIds: string[]
  addOnPurchaseType: string | null
  addOnDiscountPercent: number | null
}

interface EngineContent {
  tiers: EngineTier[]
  cadenceOffers: EngineOffer[]
  addOns: { id: string; title: string; subtitle: string; price: number | null }[]
  featureCatalog: { id: string; iconId: string; text: string }[]
}

/** Their export is recognisable by the one key our own shape never has. */
export function isEngineContent(raw: unknown): raw is EngineContent {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    Array.isArray((raw as EngineContent).cadenceOffers) &&
    Array.isArray((raw as EngineContent).tiers)
  )
}

/** Their icons are namespaced (`features-multiview`); our artwork keys are not. */
const stripIconPrefix = (id: string) => id.replace(/^features-/, '')

/** Locale and currency are not in their export, so they come from here. */
const KNOWN_MARKETS: Record<string, Omit<MarketConfig, 'code'>> = {
  ES: { label: 'Spain', locale: 'es-ES', currency: 'EUR' },
  DE: { label: 'Germany', locale: 'de-DE', currency: 'EUR' },
  IT: { label: 'Italy', locale: 'it-IT', currency: 'EUR' },
  IE: { label: 'Ireland', locale: 'en-IE', currency: 'EUR' },
  FR: { label: 'France', locale: 'fr-FR', currency: 'EUR' },
  GB: { label: 'United Kingdom', locale: 'en-GB', currency: 'GBP' },
  US: { label: 'United States', locale: 'en-US', currency: 'USD' },
  JP: { label: 'Japan', locale: 'ja-JP', currency: 'JPY' },
  CA: { label: 'Canada', locale: 'en-CA', currency: 'CAD' },
}

const titleise = (id: string) =>
  id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export interface AdaptResult {
  set: CardSet
  /** Things the adapter had to assume, so they are visible rather than silent. */
  notes: string[]
}

export function adaptEngineContent(input: EngineContent): AdaptResult {
  const notes: string[] = []

  const markets: MarketConfig[] = [...new Set(input.tiers.map((t) => t.countryCode))]
    .filter(Boolean)
    .map((code) => {
      const known = KNOWN_MARKETS[code]
      if (!known) notes.push(`No locale or currency known for "${code}" — defaulted to en/EUR.`)
      return { code, ...(known ?? { label: code, locale: 'en', currency: 'EUR' }) }
    })

  const channels = [...new Set(input.tiers.map((t) => t.channel || DIRECT))].map((code) => ({
    code,
    label: titleise(code),
  }))

  const cadences = [...new Set(input.cadenceOffers.map((o) => o.cadence))].filter(Boolean)

  /* Their export carries no logo catalogue — it lives in the logo pipeline. Build
     one from the ids actually referenced so every reference resolves; artwork is
     a separate question, and a missing file still shows a placeholder. */
  const referencedLogos = [...new Set(input.tiers.flatMap((t) => t.logoTiles ?? []))]
  const logoCatalog: CatalogEntry[] = referencedLogos.map((id) => ({
    id,
    name: titleise(id),
    altText: `${titleise(id)} logo`,
    status: 'active',
  }))
  if (referencedLogos.length) {
    notes.push(
      `${referencedLogos.length} logo id(s) catalogued from references. Any without artwork will render a placeholder.`,
    )
  }

  const featureCatalog: FeatureEntry[] = (input.featureCatalog ?? []).map((f) => ({
    id: f.id,
    iconId: stripIconPrefix(f.iconId),
    text: f.text,
    status: 'active',
  }))

  const addOnCatalog: AddOnEntry[] = (input.addOns ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    price: a.price,
    // Their add-ons carry no image reference; the one real add-on is the World Cup.
    imageId: 'world-cup',
  }))

  const tiers: Tier[] = input.tiers.map((t) => ({
    id: t.id,
    planName: t.planName,
    description: t.description,
    features: t.features ?? [],
    logoTiles: t.logoTiles ?? [],
    // Their schema has no total; without one there is no overflow tile, which is
    // the honest reading of "we only know about the ones listed".
    logoTotal: (t.logoTiles ?? []).length,
    ultimate: t.ultimate === true,
    displayOrder: t.displayOrder ?? 0,
    status: String(t.status).toLowerCase() === 'legacy' ? 'legacy' : 'live',
    channel: t.channel || DIRECT,
    visibleToPartners: t.visibleToPartners === true,
    overrides: [],
  }))

  const countryByTierId = new Map(input.tiers.map((t) => [t.id, t.countryCode]))

  const offers: CadenceOffer[] = input.cadenceOffers.map((o) => ({
    id: o.id,
    tierId: o.tierId,
    cadence: o.cadence,
    // Scoping every offer to its country is what keeps a Spanish tier out of
    // the German storefront without giving tiers a country of their own.
    market: countryByTierId.get(o.tierId),
    standardPrice: o.standardPrice ?? 0,
    discount: o.discount === true,
    introPrice: o.introPrice,
    introMonths: 3,
    addOnId: o.addOnId,
    addOnPurchaseType:
      o.addOnPurchaseType === 'one_time_payment' || o.addOnPurchaseType === 'discount_code'
        ? o.addOnPurchaseType
        : null,
    addOnDiscountPercent: o.addOnDiscountPercent,
    includedAddOnIds: o.includedAddOnIds ?? [],
  }))

  const missingPrices = offers.filter((o) => !(o.standardPrice > 0)).length
  if (missingPrices) notes.push(`${missingPrices} of ${offers.length} offers have no price — those contexts will fail validation.`)
  const noIntroMonths = input.cadenceOffers.some((o) => o.discount)
  if (noIntroMonths) notes.push('Their schema has no intro duration; every discounted offer defaulted to 3 months.')

  return {
    set: {
      markets: markets.length ? markets : defaultSet.markets,
      campaigns: [],
      channels: channels.length ? channels : defaultSet.channels,
      cadences: cadences.length ? cadences : defaultSet.cadences,
      logoCatalog,
      featureCatalog,
      addOnCatalog,
      tiers,
      offers,
      context: {
        market: markets[0]?.code ?? defaultSet.context.market,
        channel: DIRECT,
        cadence: cadences[0] ?? defaultSet.context.cadence,
      },
      journeyId: defaultSet.journeyId,
      stepId: defaultSet.stepId,
      device: defaultSet.device,
    },
    notes,
  }
}
