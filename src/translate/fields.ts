import type { CardSet } from '../rules/content'
import { priceUnitFor } from '../rules/derive'
import { resolveFlow } from '../rules/layers'
import { tabsOf } from '../rules/tabs'
import { defaultFlow, type FlowContent } from '../rules/flow'

/**
 * Which strings on the screens are words, and which are not.
 *
 * Keyed the way the panel already keys its fields (`landing.title`,
 * `cadence.options[0].badge`), so one key names the same string in the panel,
 * in a translation and in the Coach's fixes. Nothing else has to agree.
 *
 * What is left out is deliberate. A price is a number and a currency, and a
 * translator changing either would be inventing a commercial fact. A plan name
 * and a team name are brands, and DAZN does not become DAZN in German. The
 * sample values in the preview's fields (a name, an email, a ZIP) are stand-ins
 * for what a user types, not copy anyone reads.
 */
const SKIP = new Set([
  'cadence.options[].price',
  'cadence.options[].saving',
  // Which option or method is chosen. An id, not a word.
  'cadence.selected',
  'checkout.chosen',
  // Which icon a row draws, and the TV providers' own names.
  'checkout.methods[].marks',
  'landing.providers[].name',
  'auth.emailValue',
  'auth.providers[].id',
  'account.firstNameValue',
  'account.lastNameValue',
  'account.emailValue',
  'account.passwordValue',
  'zip.fieldValue',
  'checkout.cardsOverflow',
  'checkout.lines[].value',
  'checkout.lines[].unit',
  'ready.logos[]',
])

export interface Translatable {
  key: string
  /** What to call the field when asking for it, and in the panel. */
  label: string
  text: string
}

/** The same key with array indices blanked, so one rule covers every option. */
const shape = (key: string) => key.replace(/\[\d+\]/g, '[]')

function walk(node: unknown, key: string, out: Translatable[], label: string) {
  if (typeof node === 'string') {
    if (!node.trim() || SKIP.has(shape(key))) return
    // An id is never a word, whatever it is the id of. A rule rather than a
    // list, so a new list of things with ids cannot leak them to a translator.
    if (key.endsWith('.id')) return
    // A bare number, a price or a date is a fact, not a word.
    if (/^[^\p{L}]*$/u.test(node)) return
    out.push({ key, label, text: node })
    return
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${key}[${i}]`, out, label))
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, key ? `${key}.${k}` : k, out, label)
  }
}

const SCREEN_LABEL: Record<string, string> = {
  plans: 'Subscription',
  landing: 'Landing',
  cadence: 'Cadence',
  auth: 'Sign in',
  account: 'Account setup',
  zip: 'Zip code',
  checkout: 'Checkout',
  ready: 'Confirmation',
}

/** Every word on the screens after the plan picker. */
export function flowStrings(flow: FlowContent = defaultFlow): Translatable[] {
  const out: Translatable[] = []
  for (const [screen, node] of Object.entries(flow)) {
    walk(node, screen, out, SCREEN_LABEL[screen] ?? screen)
  }
  return out
}

/**
 * The tabs over the plan picker. Their names are written per market, so the
 * ones collected are the ones this market shows.
 */
export function tabStrings(set: CardSet): Translatable[] {
  return tabsOf(set)
    .filter((t) => t.name.trim())
    .map((t) => ({ key: `planTabs.${t.id}.name`, label: 'Tab name', text: t.name }))
}

/**
 * The words on the plan cards. A plan's name is a brand and stays; its
 * description, its badge and the feature lines are copy.
 */
export function cardStrings(set: CardSet): Translatable[] {
  const out: Translatable[] = []
  for (const t of set.tiers) {
    // The keys the panel already uses for these fields (`plans.<id>.<field>`),
    // so a field, its change mark and its translation share one name.
    if (t.description.trim()) out.push({ key: `plans.${t.id}.description`, label: `${t.planName} description`, text: t.description })
    if (t.badge?.trim()) out.push({ key: `plans.${t.id}.badge`, label: `${t.planName} badge`, text: t.badge })
  }
  for (const f of set.featureCatalog) {
    if (f.text.trim()) out.push({ key: `features.${f.id}`, label: 'Feature line', text: f.text })
  }
  return out
}

/**
 * What reads after a price on a plan card: the "month" in "$29.99 /month".
 *
 * It is derived rather than written — a cadence called Monthly is paid by the
 * month — so it never appeared in the content and never reached the translator,
 * which left an English word beside a translated price. Collected here per
 * cadence, under the key the set stores it at, so translating it is the same
 * act as translating anything else.
 */
export function unitStrings(set: CardSet): Translatable[] {
  return set.cadences.map((cadence) => ({
    key: `priceUnits.${cadence}`,
    label: `${cadence} price period`,
    text: priceUnitFor(set, cadence, 'en'),
  }))
}

export function everyString(set: CardSet): Translatable[] {
  // The flow as this situation resolves it, not the base underneath. A market
  // that has taken its own copy of the screens reads that copy, and asking for
  // the base would translate words nobody is looking at.
  return [...flowStrings(resolveFlow(set)), ...tabStrings(set), ...cardStrings(set), ...unitStrings(set)]
}

/** Names a translation must leave exactly as they are. */
export function keepAsIs(set: CardSet): string[] {
  return [...new Set(['DAZN', ...set.tiers.map((t) => t.planName), ...set.logoCatalog.map((l) => l.name), ...set.addOnCatalog.map((a) => a.title)])]
}
