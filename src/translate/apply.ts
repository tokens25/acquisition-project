import type { CardSet, TierPatch } from '../rules/content'
import { priceUnitFor } from '../rules/derive'
import { resolveFlow } from '../rules/layers'
import { tabsOf } from '../rules/tabs'
import { defaultFlow, type FlowContent } from '../rules/flow'

/** One string's translation, and how far it has got. */
export interface Translated {
  text: string
  /** `machine` came from the translator. `reviewed` was accepted by a person. */
  state: 'machine' | 'reviewed'
  /** The English it was made from, so a changed source can be spotted. */
  from: string
}

export type Translations = Record<string, Translated>

const path = (key: string) => key.replace(/\[(\d+)\]/g, '.$1').split('.')

/** Writes one value into a copy of `root`, leaving the original alone. */
function put<T>(root: T, key: string, value: string): T {
  const keys = path(key)
  const clone = structuredClone(root) as Record<string, unknown>
  let node: Record<string, unknown> = clone
  for (const k of keys.slice(0, -1)) {
    const next = node[k]
    if (next === undefined || next === null || typeof next !== 'object') return clone as T
    node = next as Record<string, unknown>
  }
  const last = keys[keys.length - 1]
  if (typeof node[last] === 'string') node[last] = value
  return clone as T
}

/**
 * The set as a market reads it.
 *
 * A translation is a view, not an edit: this returns a copy for the screens to
 * render and never touches what is stored. Only strings still matching the
 * English they were made from are used, so editing the source drops its stale
 * translation rather than showing a sentence nobody wrote.
 */
export function translatedSet(set: CardSet, translations: Translations): CardSet {
  return applyCopy(
    set,
    Object.fromEntries(Object.entries(translations).filter(([key, t]) => currentAt(set, key) === t.from).map(([key, t]) => [key, t.text])),
  )
}

/**
 * The set as a market reads it: the base words, then the ones that market has
 * kept, then whatever is only translated in this browser. Kept words win over
 * a fresh machine translation, because a person has read them.
 */
export function viewSet(set: CardSet, market: string, machine: Translations): CardSet {
  const kept = set.copyByMarket?.[market] ?? {}
  const draft: Record<string, string> = {}
  for (const [key, t] of Object.entries(machine)) {
    if (key in kept) continue
    if (currentAt(set, key) !== t.from) continue
    draft[key] = t.text
  }
  return applyCopy(set, { ...kept, ...draft })
}

/** Writes a flat key to text map over a copy of the set. */
export function applyCopy(set: CardSet, words: Record<string, string>): CardSet {
  /**
   * The flow as it resolves for this situation, flattened.
   *
   * A market can own its copy of the screens, and that copy is a layer over
   * the base. Writing a translation into the base would leave the layer to put
   * the English back on top of it, so the view is the resolved flow with the
   * layers dropped: what is on screen, translated, and nothing left to
   * override it.
   */
  let flow: FlowContent = resolveFlow(set)
  let tabs = tabsOf(set)
  let tabsTouched = false
  let tiers = set.tiers
  let featureCatalog = set.featureCatalog
  let priceUnits = set.priceUnits

  for (const [key, text] of Object.entries(words)) {
    if (!text.trim()) continue
    const unit = /^priceUnits\.(.+)$/.exec(key)
    if (unit) {
      priceUnits = { ...priceUnits, [unit[1]]: text }
      continue
    }
    const tier = /^plans\.([^.]+)\.(description|badge)$/.exec(key)
    if (tier) {
      tiers = tiers.map((x) => (x.id === tier[1] ? { ...x, [tier[2]]: text } : x))
      continue
    }
    const feature = /^features\.(.+)$/.exec(key)
    if (feature) {
      featureCatalog = featureCatalog.map((f) => (f.id === feature[1] ? { ...f, text } : f))
      continue
    }
    const tab = /^planTabs\.([^.]+)\.name$/.exec(key)
    if (tab) {
      tabs = tabs.map((t) => (t.id === tab[1] ? { ...t, name: text } : t))
      tabsTouched = true
      continue
    }
    flow = put(flow, key, text)
  }

  return {
    ...set,
    flow,
    flowLayers: [],
    tiers,
    featureCatalog,
    priceUnits,
    planTabsByMarket: tabsTouched ? { ...set.planTabsByMarket, [set.context.market]: tabs } : set.planTabsByMarket,
  }
}

/** What the set says at a key today, whichever kind of key it is. */
export function currentAt(set: CardSet, key: string): string | undefined {
  const tier = /^plans\.([^.]+)\.(description|badge)$/.exec(key)
  if (tier) {
    const t = set.tiers.find((x) => x.id === tier[1])
    const value = t?.[tier[2] as 'description' | 'badge']
    return typeof value === 'string' ? value : undefined
  }
  const feature = /^features\.(.+)$/.exec(key)
  if (feature) return set.featureCatalog.find((f) => f.id === feature[1])?.text
  const unit = /^priceUnits\.(.+)$/.exec(key)
  if (unit) return priceUnitFor(set, unit[1], 'en')
  const tab = /^planTabs\.([^.]+)\.name$/.exec(key)
  if (tab) return tabsOf(set).find((t) => t.id === tab[1])?.name
  return readAt(resolveFlow(set), key)
}

/** What the set says at a key today, for checking a translation is still current. */
export function readAt(root: unknown, key: string): string | undefined {
  let node: unknown = root
  for (const k of path(key)) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[k]
  }
  return typeof node === 'string' ? node : undefined
}

/** A promoted translation, as the patches the store already understands. */
export function promotion(set: CardSet, key: string, text: string): { flow?: FlowContent; featureCatalog?: CardSet['featureCatalog']; priceUnits?: CardSet['priceUnits']; tiers: { id: string; patch: TierPatch }[] } {
  const tier = /^plans\.([^.]+)\.(description|badge)$/.exec(key)
  if (tier) return { tiers: [{ id: tier[1], patch: { [tier[2]]: text } as TierPatch }] }
  const unit = /^priceUnits\.(.+)$/.exec(key)
  if (unit) return { priceUnits: { ...set.priceUnits, [unit[1]]: text }, tiers: [] }
  const feature = /^features\.(.+)$/.exec(key)
  if (feature) return { featureCatalog: set.featureCatalog.map((f) => (f.id === feature[1] ? { ...f, text } : f)), tiers: [] }
  return { flow: put(set.flow ?? defaultFlow, key, text), tiers: [] }
}
