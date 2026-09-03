import type { CardSet, TierPatch } from '../../../rules/content'
import type { FlowContent } from '../../../rules/flow'
import type { FindingFix } from './types'
import { ownerOf, resolveFlow, writeFlow } from '../../../rules/layers'

/**
 * Turns a fix into the patches the store understands: the flow copy, the
 * feature catalogue, and per-tier patches (so a market override stays an
 * override). Only strings change; nothing is added or removed.
 */
export interface FixPatches {
  /** Flow copy, written where each changed field actually lives. */
  flow?: Partial<CardSet>
  featureCatalog?: CardSet['featureCatalog']
  tiers: { id: string; patch: TierPatch }[]
  changed: number
}

/**
 * Routes a fixed copy of the resolved flow back to where each field came from.
 *
 * The Coach reviews what a situation shows, which may be the shared line or a
 * line written for this market alone. Fixing it has to change the one it read:
 * writing every fix to the base would leave the words it objected to on screen,
 * shadowed by the layer they were actually in.
 */
function flowWrites(set: CardSet, next: FlowContent): Partial<CardSet> {
  const current = resolveFlow(set)
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  let working = set
  let out: Partial<CardSet> = {}
  for (const screen of Object.keys(current) as (keyof FlowContent)[]) {
    for (const field of Object.keys(current[screen])) {
      const before = (current[screen] as unknown as Record<string, unknown>)[field]
      const after = (next[screen] as unknown as Record<string, unknown>)[field]
      if (same(before, after)) continue
      const owner = ownerOf(working, screen, field)
      const patch = writeFlow(working, owner?.when ?? {}, screen, {
        [field]: after,
      } as Partial<FlowContent[typeof screen]>)
      working = { ...working, ...patch }
      out = { ...out, ...patch }
    }
  }
  return out
}

function rewrite(text: string, fix: FindingFix): string {
  if ('trim' in fix) return text.replace(/\s{2,}/g, ' ').trim()
  let out = text
  for (const r of fix.replace) out = out.split(r.from).join(r.to)
  return out
}

function walk<T>(value: T, fix: FindingFix, count: { n: number }): T {
  if (typeof value === 'string') {
    const next = rewrite(value, fix)
    if (next !== value) count.n += 1
    return next as T
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, fix, count)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, fix, count)])) as T
  }
  return value
}

export function patchesFor(set: CardSet, fix: FindingFix): FixPatches {
  const count = { n: 0 }
  // Targeted replacements set one field and nothing else: "path:" into the
  // flow copy, "tier:<id>.<field>" on a plan, "feature:<id>" on a feature line.
  if ('replace' in fix && fix.replace.some((r) => /^(path|tier|feature):/.test(r.from))) {
    const flow: FlowContent = structuredClone(resolveFlow(set))
    const tiers: FixPatches['tiers'] = []
    let featureCatalog = set.featureCatalog
    for (const r of fix.replace) {
      const tier = /^tier:([^.]+)\.(planName|description|badge)$/.exec(r.from)
      if (tier) {
        tiers.push({ id: tier[1], patch: { [tier[2]]: r.to } as TierPatch })
        count.n += 1
        continue
      }
      const feature = /^feature:(.+)$/.exec(r.from)
      if (feature) {
        featureCatalog = featureCatalog.map((f) => (f.id === feature[1] ? { ...f, text: r.to } : f))
        count.n += 1
        continue
      }
      if (!r.from.startsWith('path:')) continue
      const keys = r.from.slice('path:'.length).split('.')
      let node: unknown = flow
      for (const k of keys.slice(0, -1)) node = (node as Record<string, unknown>)?.[k]
      const last = keys[keys.length - 1]
      if (node && typeof node === 'object' && last in (node as object)) {
        ;(node as Record<string, unknown>)[last] = r.to
        count.n += 1
      }
    }
    return {
      flow: flowWrites(set, flow),
      featureCatalog: featureCatalog === set.featureCatalog ? undefined : featureCatalog,
      tiers,
      changed: count.n,
    }
  }
  const flow = walk(resolveFlow(set), fix, count)
  const featureCatalog = set.featureCatalog.map((f) => ({ ...f, text: walk(f.text, fix, count) }))
  const tiers = set.tiers.flatMap((t) => {
    const patch: TierPatch = {}
    const name = walk(t.planName, fix, count)
    const description = walk(t.description, fix, count)
    const badge = t.badge === undefined ? undefined : walk(t.badge, fix, count)
    if (name !== t.planName) patch.planName = name
    if (description !== t.description) patch.description = description
    if (badge !== undefined && badge !== t.badge) patch.badge = badge
    return Object.keys(patch).length ? [{ id: t.id, patch }] : []
  })
  return { flow: flowWrites(set, flow), featureCatalog, tiers, changed: count.n }
}
