/**
 * The Market → Dev handoff pipeline.
 *
 * Market writes strings and marks a page ready; Dev implements them and marks
 * it completed. Everything here is pure: the sections and their strings are
 * derived from the card set, the status is derived from the snapshot Dev last
 * acknowledged, and every transition returns a new document.
 *
 * A section is one page of the journey. The subscription page is one section
 * carrying every plan's strings, grouped by plan — it is marked ready as a
 * page, the way it ships.
 *
 * Source: "Handoff: Market / Dev pipeline (Figma Dev Mode pattern)" — the
 * README that came with the design reference.
 */

import type { CardSet, Tier } from './content'
import { FLOW_STEPS, defaultFlow } from './flow'

export type Mode = 'market' | 'dev'
export type SectionStatus = 'draft' | 'ready' | 'changed' | 'done'
export type LogTone = 'ok' | 'warn' | 'dim' | 'faint'

export interface LogEvent {
  text: string
  /** ISO timestamp. Rendered relative while recent, as a date afterwards. */
  at: string
  tone: LogTone
  /** Set on edit events so consecutive edits to one string fold into one line. */
  key?: string
}

export interface PipelineDoc {
  /** Sections Market has marked ready for dev. */
  ready: Record<string, true>
  /** Sections Dev has marked completed. */
  done: Record<string, true>
  /** Who completed a section, and when — ISO timestamp. */
  doneBy: Record<string, string>
  /** The values Dev last acknowledged, per section, per string key. */
  snap: Record<string, Record<string, string>>
  /** When each string was last changed — ISO timestamp, per key. */
  meta: Record<string, string>
  /** Newest first. */
  log: Record<string, LogEvent[]>
}

export const emptyPipeline = (): PipelineDoc => ({
  ready: {},
  done: {},
  doneBy: {},
  snap: {},
  meta: {},
  log: {},
})

export interface StringDef {
  key: string
  label: string
  value: string
  required: boolean
  /** The plan a string belongs to, on the subscription page. */
  group?: string
}

export interface Section {
  /** The journey step's id. */
  id: string
  label: string
  strings: StringDef[]
}

/** The person acting in this browser. There is no login, so it is always you. */
export const WHO = 'You'

/** Longest a section's activity is kept. Older events fall off the end. */
const LOG_LIMIT = 200

/** The step whose section is every plan. */
export const PLANS = 'plans'

/* ── Keys ────────────────────────────────────────────────────────────── */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** `plans.msg-plus.description` */
export const tierKey = (tierId: string, field: string) => `${PLANS}.${tierId}.${field}`

/** `plans.msg-plus.price.monthly.full` */
export const cadenceKey = (tierId: string, cadence: string, field: string) =>
  `${PLANS}.${tierId}.price.${slug(cadence)}.${field}`

/* ── Strings ─────────────────────────────────────────────────────────── */

/** Field names in the flow content, named the way the edit panel names them. */
const FLOW_LABELS: Record<string, string> = {
  navTitle: 'Screen title',
  title: 'Heading',
  heading: 'Heading',
  subtitle: 'Under the heading',
  body: 'Under the heading',
  cta: 'Button',
  altCta: 'Second button',
  payCta: 'Pay button',
  secureCta: 'Under the pay button',
  workingCta: 'Button while working',
  changeCta: 'Change button',
  navExplore: 'First button',
  navSignUp: 'Second button',
  note: 'Note at the top',
  footnote: 'Footnote',
  badge: 'Ribbon',
  price: 'Price',
  unit: 'How to pay',
  label: 'Label',
  value: 'Amount',
  noticeTitle: 'Notice heading',
  noticeBody: 'Notice body',
  emailLabel: 'Email field',
  emailValue: 'Typed email',
  dividerLabel: 'Divider',
  providers: 'Provider button',
  options: 'Option',
  rules: 'Rule',
  lines: 'Line',
  nameHeading: 'Name heading',
  firstNameLabel: 'First name field',
  firstNameValue: 'First name shown',
  lastNameLabel: 'Last name field',
  lastNameValue: 'Last name shown',
  emailHeading: 'Email heading',
  passwordHeading: 'Password heading',
  passwordLabel: 'Password field',
  passwordValue: 'Password shown',
  rulesTitle: 'Checklist heading',
  notifyHeading: 'Consent heading',
  consentBody: 'Consent text',
  consentNote: 'Under the box',
  fieldLabel: 'Field',
  fieldValue: 'Code shown',
  resultsLabel: 'Heading over the teams',
  summaryTitle: 'Summary title',
  renewalNote: 'Renewal note',
  cardsLabel: 'Cards option',
  cardsOverflow: 'Cards chip',
  cardNumberLabel: 'Card number field',
  expiryLabel: 'Expiry field',
  cvcLabel: 'CVC field',
  nameOnCardLabel: 'Name on card field',
  legal: 'Legal text',
  googlePayLabel: 'Google Pay option',
  paypalLabel: 'PayPal option',
  promoLabel: 'Promo row',
}

/** Flow fields that are settings or ids rather than copy. */
const NOT_COPY = new Set(['id', 'selected', 'logos', 'schedule'])

/** Copy a screen cannot ship without. */
const FLOW_REQUIRED = new Set(['title', 'heading', 'cta', 'navTitle', 'payCta'])

const humanise = (field: string) =>
  FLOW_LABELS[field] ??
  field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())

/** Walks one flow screen and lists every string on it, in field order. */
function flowStrings(prefix: string, screen: Record<string, unknown>): StringDef[] {
  const out: StringDef[] = []
  const walk = (value: unknown, key: string, label: string, field: string) => {
    if (NOT_COPY.has(field)) return
    if (typeof value === 'string') {
      out.push({ key, label, value, required: FLOW_REQUIRED.has(field) })
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${key}[${i}]`, `${label} ${i + 1}`, field))
    } else if (typeof value === 'object' && value !== null) {
      for (const [f, v] of Object.entries(value)) {
        walk(v, `${key}.${f}`, `${label} · ${humanise(f)}`, f)
      }
    }
  }
  for (const [field, value] of Object.entries(screen)) {
    walk(value, `${prefix}.${field}`, humanise(field), field)
  }
  return out
}

/**
 * A plan's strings, in the base content — before any market or campaign
 * override. Prices belong to (tier × cadence), so each base offer contributes
 * its own group of keys.
 */
function tierStrings(set: CardSet, tier: Tier): StringDef[] {
  const group = tier.planName || tier.id
  const k = (field: string) => tierKey(tier.id, field)
  const out: StringDef[] = [
    { key: k('badge'), label: 'Badge', value: tier.badge ?? '', required: false, group },
    { key: k('name'), label: 'Tier name', value: tier.planName, required: true, group },
    { key: k('description'), label: 'Description', value: tier.description, required: true, group },
  ]
  tier.features.forEach((id, i) => {
    const entry = set.featureCatalog.find((f) => f.id === id)
    out.push({
      key: k(`features[${i}]`),
      label: `Benefit ${i + 1}`,
      value: entry?.text ?? id,
      required: false,
      group,
    })
  })
  tier.logoTiles.forEach((id, i) => {
    const entry = set.logoCatalog.find((l) => l.id === id)
    out.push({
      key: k(`competitions[${i}]`),
      label: `Competition ${i + 1}`,
      value: entry?.name ?? id,
      required: false,
      group,
    })
  })
  out.push({
    key: k('competitions.total'),
    label: 'Total competitions',
    value: String(tier.logoTotal),
    required: false,
    group,
  })
  const offers = set.offers
    .filter((o) => o.tierId === tier.id && !o.market)
    .sort((a, b) => set.cadences.indexOf(a.cadence) - set.cadences.indexOf(b.cadence))
  for (const o of offers) {
    const c = (field: string) => cadenceKey(tier.id, o.cadence, field)
    out.push({ key: c('full'), label: `${o.cadence} · Full price`, value: String(o.standardPrice), required: true, group })
    out.push({
      key: c('per'),
      label: `${o.cadence} · Price per`,
      value: set.priceUnits?.[o.cadence] ?? '',
      required: false,
      group,
    })
    if (o.discount) {
      out.push({
        key: c('discount'),
        label: `${o.cadence} · Discount price`,
        value: o.introPrice == null ? '' : String(o.introPrice),
        required: false,
        group,
      })
      out.push({
        key: c('explainer'),
        label: `${o.cadence} · Price explainer`,
        value: o.explainer ?? '',
        required: false,
        group,
      })
    }
    out.push({ key: c('cta'), label: `${o.cadence} · Button`, value: o.ctaLabel ?? '', required: false, group })
  }
  return out
}

/**
 * Every section in the set: one per page of the journey.
 *
 * `labels` names the sections after their journey steps; without it the step
 * id is used.
 */
export function sectionsFor(set: CardSet, labels: Record<string, string> = {}): Section[] {
  const flow = { ...defaultFlow, ...set.flow }
  const out: Section[] = FLOW_STEPS.map((id) => ({
    id,
    label: labels[id] ?? humanise(id),
    strings: flowStrings(id, flow[id] as unknown as Record<string, unknown>),
  }))
  const tiers = [...set.tiers].sort((a, b) => a.displayOrder - b.displayOrder)
  out.splice(1, 0, {
    id: PLANS,
    label: labels[PLANS] ?? 'Subscription',
    strings: tiers.flatMap((t) => tierStrings(set, t)),
  })
  return out
}

export function valuesOf(section: Section): Record<string, string> {
  return Object.fromEntries(section.strings.map((s) => [s.key, s.value]))
}

/** "MSG+ · Description", or just "Description" off the subscription page. */
export const fullLabel = (s: Pick<StringDef, 'label' | 'group'>) =>
  s.group ? `${s.group} · ${s.label}` : s.label

/* ── Derived status ──────────────────────────────────────────────────── */

export interface Change {
  key: string
  label: string
  group?: string
  before: string
  after: string
  /** When the string was last edited — ISO timestamp, when known. */
  at?: string
}

/**
 * Every string that differs from what Dev last received.
 *
 * Keys are the union of the snapshot and the current strings, so a line
 * added or removed since counts as much as one rewritten. In the order the
 * strings appear on the page, with removed ones last.
 */
export function changedKeys(doc: PipelineDoc, section: Section): Change[] {
  const snap = doc.snap[section.id]
  if (!snap) return []
  const out: Change[] = []
  const seen = new Set<string>()
  for (const s of section.strings) {
    seen.add(s.key)
    const before = snap[s.key] ?? ''
    if (before !== s.value) {
      out.push({ key: s.key, label: s.label, group: s.group, before, after: s.value, at: doc.meta[s.key] })
    }
  }
  for (const [key, before] of Object.entries(snap)) {
    if (seen.has(key) || before === '') continue
    out.push({ key, label: labelFromKey(key), before, after: '', at: doc.meta[key] })
  }
  return out
}

/** The same, keyed — for the field that has to show its own change. */
export function changeMap(doc: PipelineDoc, section: Section): Map<string, Change> {
  return new Map(changedKeys(doc, section).map((c) => [c.key, c]))
}

/** A label for a string the section no longer carries, from its key alone. */
function labelFromKey(key: string) {
  const tail = key.split('.').pop() ?? key
  const m = /^(\w+)\[(\d+)\]$/.exec(tail)
  return m ? `${humanise(m[1])} ${Number(m[2]) + 1}` : humanise(tail)
}

export function statusOf(doc: PipelineDoc, section: Section): SectionStatus {
  if (!doc.ready[section.id]) return 'draft'
  if (changedKeys(doc, section).length) return 'changed'
  return doc.done[section.id] ? 'done' : 'ready'
}

export const missingRequired = (section: Section) =>
  section.strings.filter((s) => s.required && s.value.trim() === '')

export const STATUS_LABEL: Record<SectionStatus, string> = {
  draft: 'Not marked ready',
  ready: 'Ready for dev',
  changed: 'Changed',
  done: 'Completed',
}

/* ── Transitions ─────────────────────────────────────────────────────── */

const now = () => new Date().toISOString()

function logged(doc: PipelineDoc, id: string, event: LogEvent): PipelineDoc {
  const list = [event, ...(doc.log[id] ?? [])].slice(0, LOG_LIMIT)
  return { ...doc, log: { ...doc.log, [id]: list } }
}

const without = <T>(record: Record<string, T>, id: string): Record<string, T> => {
  const next = { ...record }
  delete next[id]
  return next
}

export function markReady(doc: PipelineDoc, section: Section): PipelineDoc {
  if (missingRequired(section).length) return doc
  return logged(
    {
      ...doc,
      ready: { ...doc.ready, [section.id]: true },
      snap: { ...doc.snap, [section.id]: valuesOf(section) },
    },
    section.id,
    { text: 'marked ready for dev', at: now(), tone: 'ok' },
  )
}

export function markCompleted(doc: PipelineDoc, section: Section): PipelineDoc {
  const at = now()
  return logged(
    {
      ...doc,
      done: { ...doc.done, [section.id]: true },
      doneBy: { ...doc.doneBy, [section.id]: at },
      snap: { ...doc.snap, [section.id]: valuesOf(section) },
    },
    section.id,
    { text: 'marked completed', at, tone: 'dim' },
  )
}

export function reopen(doc: PipelineDoc, id: string): PipelineDoc {
  return logged({ ...doc, done: without(doc.done, id), doneBy: without(doc.doneBy, id) }, id, {
    text: 'reopened',
    at: now(),
    tone: 'dim',
  })
}

export function removeReady(doc: PipelineDoc, id: string): PipelineDoc {
  return logged(
    {
      ...doc,
      ready: without(doc.ready, id),
      done: without(doc.done, id),
      doneBy: without(doc.doneBy, id),
      snap: without(doc.snap, id),
    },
    id,
    { text: 'removed ready status', at: now(), tone: 'faint' },
  )
}

const quote = (s: string) => (s === '' ? 'nothing' : `“${s}”`)

/**
 * Records edits made to a ready section since `previous` was on screen.
 *
 * The snapshot keeps the value Dev received, so a string edited for the first
 * time since is baselined at its previous value. Consecutive edits to the same
 * string fold into one activity line — a sentence typed letter by letter is one
 * change, not forty — and an edit typed back to the received value withdraws
 * the line, as the chip itself goes back to green.
 */
export function recordEdits(
  doc: PipelineDoc,
  section: Section,
  previous: Record<string, string>,
): PipelineDoc {
  if (!doc.ready[section.id]) return doc
  const current = valuesOf(section)
  const defs = new Map(section.strings.map((s) => [s.key, s]))
  const keys = new Set([...Object.keys(previous), ...Object.keys(current)])
  let next = doc
  const at = now()
  for (const key of keys) {
    const before = previous[key] ?? ''
    const after = current[key] ?? ''
    if (before === after) continue

    const snap = { ...(next.snap[section.id] ?? {}) }
    if (snap[key] === undefined) snap[key] = before
    const received = snap[key]
    const def = defs.get(key)
    const label = def ? fullLabel(def) : labelFromKey(key)

    const log = [...(next.log[section.id] ?? [])]
    const reverted = after === received
    if (log[0]?.key === key) log.shift()
    if (!reverted) {
      log.unshift({
        text: `changed ${label} from ${quote(received)} to ${quote(after)}`,
        at,
        tone: 'warn',
        key,
      })
    } else if (log[0]?.key !== key) {
      log.unshift({ text: `changed ${label} back to ${quote(received)}`, at, tone: 'faint', key })
    }

    next = {
      ...next,
      snap: { ...next.snap, [section.id]: snap },
      meta: { ...next.meta, [key]: at },
      log: { ...next.log, [section.id]: log.slice(0, LOG_LIMIT) },
    }
  }
  return next
}

/* ── Presentation helpers ────────────────────────────────────────────── */

/** "just now", "4m ago", then the date once it is more than a day old. */
export function formatWhen(iso: string, reference = Date.now()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const s = Math.max(0, Math.round((reference - t) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = new Date(t)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "You · just now" — who did it, and when. */
export const byLine = (iso: string) => `${WHO} · ${formatWhen(iso)}`
