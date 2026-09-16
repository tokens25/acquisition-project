import { ENTRY_POINTS, STATUS_LABELS, USER_STATUSES } from './entry'
/**
 * The shape of a flow, decided before any of its words exist.
 *
 * A market or a market-and-channel with nothing written for it is not a gap to
 * fill with somebody else's flow — it is a flow nobody has described yet. This
 * is where that description is kept: how many plans, which parts of the card
 * are drawn, whether paying is its own step, how many consents. Structure, and
 * nothing that could be mistaken for content.
 *
 * Kept apart from the content on purpose. Deciding a card has a savings label
 * is not the same as knowing what it says, and a tool that asks for both at
 * once gets neither: the second question is unanswerable until somebody has
 * seen the first one drawn.
 */

/** How far a flow has got. Four states, and finishing the third is not the fourth. */
export type FlowState =
  /** Nobody has started. */
  | 'not-configured'
  /** Someone is part way through describing it. */
  | 'in-progress'
  /** Described, and waiting on its words and numbers. */
  | 'structure-saved'
  /** Described, filled in, and checked. */
  | 'ready'

/** Which parts of a tier card this flow draws. */
export interface CardStructure {
  title: boolean
  description: boolean
  /** The "Starts at" line. Only asked about when there is a price. */
  startsAt: boolean
  price: boolean
  /** The small print under the price. */
  legal: boolean
  cta: boolean
  /** The savings plate above the button. Only asked about when there is one. */
  saving: boolean
  logos: boolean
  logoRows: 1 | 2
  logoOverflow: 'count' | 'logo'
  features: boolean
  featureCount: number
}

export interface PlansStructure {
  count: number
  /**
   * Which plan is promoted, and which one the customer arrives on. Two
   * settings, because they answer two questions — "which do we recommend" and
   * "which is chosen" — and a tool that conflates them cannot describe a set
   * that recommends one plan while starting on another.
   */
  highlighted: number | null
  selected: number | null
}

export interface CadenceStructure {
  /** Whether paying is a step of its own. */
  enabled: boolean
  optionCount: number
  defaultOption: number | null
  /** Which options each plan offers, by plan index. Absent means all of them. */
  optionsByPlan: Record<number, number[]>
}

export interface BannerStructure {
  enabled: boolean
  title: boolean
  description: boolean
  link: boolean
}

export interface ConsentItem {
  required: boolean
  withLink: boolean
}

export interface FlowStructure {
  marketId: string
  /** Absent for a market's general flow. */
  channelId?: string
  /**
   * Who this flow is for — a user status, as the journeys name it.
   *
   * Asked first, and not as a formality: what someone already has decides
   * which screens they are shown at all. A returning customer is not asked to
   * make an account, and a flow built without knowing who walks in is a flow
   * that shows everybody everything.
   */
  audience: string
  /**
   * Where they arrive from — the CTA that started the journey.
   *
   * The pair of this and `audience` is how a journey is identified everywhere
   * else in the tool, so setting up a second variant of the same flow is
   * answering these two differently rather than starting again.
   */
  entry: string
  state: FlowState
  /** Which step of the setup was last open, so leaving and coming back lands there. */
  step: number
  card: CardStructure
  plans: PlansStructure
  cadence: CadenceStructure
  banner: BannerStructure
  consents: ConsentItem[]
  updatedAt: string
}

/**
 * How a flow is addressed.
 *
 * Market and market-and-channel are different keys rather than one key with an
 * empty half, so a general market flow can never be reached by a lookup that
 * forgot to pass a channel.
 */
export const structureKey = (marketId: string, channelId?: string): string =>
  channelId ? `channel:${marketId}/${channelId}` : `market:${marketId}`

/** Everything off that can be off, and one plan. A starting point, not a proposal. */
export function blankStructure(marketId: string, channelId?: string): FlowStructure {
  return {
    marketId,
    channelId,
    audience: USER_STATUSES[0],
    entry: ENTRY_POINTS[0],
    state: 'in-progress',
    step: 1,
    card: {
      title: true,
      description: true,
      startsAt: true,
      price: true,
      legal: false,
      cta: true,
      saving: false,
      logos: false,
      logoRows: 1,
      logoOverflow: 'count',
      features: true,
      featureCount: 4,
    },
    plans: { count: 2, highlighted: null, selected: null },
    cadence: { enabled: false, optionCount: 2, defaultOption: null, optionsByPlan: {} },
    banner: { enabled: false, title: true, description: true, link: false },
    consents: [],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * The settings a switch being off makes unanswerable.
 *
 * Applied on write rather than read, so what is stored is always a description
 * somebody could have given — "no price, but the Starts at line is on" is not
 * one, and leaving it in the record means the next screen has to decide which
 * half to believe.
 */
export function settle(card: CardStructure): CardStructure {
  return {
    ...card,
    startsAt: card.price ? card.startsAt : false,
    saving: card.cta ? card.saving : false,
    featureCount: card.features ? Math.max(1, card.featureCount) : 0,
  }
}

/** A plan that is no longer there cannot be the promoted one, or the chosen one. */
export function settlePlans(plans: PlansStructure): PlansStructure {
  const within = (n: number | null) => (n !== null && n >= 0 && n < plans.count ? n : null)
  return { ...plans, count: Math.max(1, plans.count), highlighted: within(plans.highlighted), selected: within(plans.selected) }
}

/** What the review step lists, in the order it lists it. */
export function structureSummary(s: FlowStructure): { label: string; value: string }[] {
  const on = (b: boolean) => (b ? 'Yes' : 'No')
  const named = (n: number | null) => (n === null ? 'None' : `Plan ${n + 1}`)
  const parts = [
    s.card.title && 'title',
    s.card.description && 'description',
    s.card.startsAt && '“Starts at”',
    s.card.price && 'price',
    s.card.legal && 'legal text',
    s.card.cta && 'button',
    s.card.saving && 'savings label',
    s.card.logos && `logos (${s.card.logoRows} row${s.card.logoRows === 1 ? '' : 's'}, ${s.card.logoOverflow === 'count' ? '“+N”' : 'a logo'} last)`,
    s.card.features && `${s.card.featureCount} features`,
  ].filter(Boolean) as string[]

  return [
    { label: 'For', value: STATUS_LABELS[s.audience] ?? s.audience },
    { label: 'Arriving from', value: s.entry },
    { label: 'Card', value: parts.length ? parts.join(' · ') : 'Nothing drawn yet' },
    { label: 'Plans', value: String(s.plans.count) },
    { label: 'Highlighted', value: named(s.plans.highlighted) },
    { label: 'Selected by default', value: named(s.plans.selected) },
    {
      label: 'Payment step',
      value: s.cadence.enabled
        ? `${s.cadence.optionCount} options, default ${s.cadence.defaultOption === null ? 'none' : `option ${s.cadence.defaultOption + 1}`}`
        : 'No',
    },
    { label: 'Login banner', value: on(s.banner.enabled) },
    { label: 'Consents', value: String(s.consents.length) },
  ]
}

/** The steps, named once so the wizard and the review cannot disagree. */
export const SETUP_STEPS = [
  { n: 1, title: 'Who it is for', blurb: 'Who is at the door. What they already have decides which screens they see.' },
  { n: 2, title: 'How they arrive', blurb: 'What they pressed to get here. Together with the answer above, this is the flow.' },
  { n: 3, title: 'Card structure', blurb: 'Which parts of a plan card this flow draws.' },
  { n: 4, title: 'Plans', blurb: 'How many, which is promoted, which is chosen.' },
  { n: 5, title: 'Payment', blurb: 'Whether choosing how to pay is its own step.' },
  { n: 6, title: 'Login banner', blurb: 'Whether the login page carries a notice.' },
  { n: 7, title: 'Consents', blurb: 'How many, and which are required.' },
  { n: 8, title: 'Review', blurb: 'What has been described, before any content.' },
] as const

export const LAST_STEP = SETUP_STEPS.length
