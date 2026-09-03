import type { Context } from './content'

/**
 * A journey is an ordered list of steps with selectors.
 *
 * Journeys are distinguished by their **entry point** — which CTA on the landing
 * page started them. That matters structurally, not cosmetically: an entry can
 * arrive already knowing things, and a step whose value is already known is
 * skipped rather than asked.
 *
 * Which steps appear is configuration. What happens *between* steps is not:
 * geo-IP results, payment outcomes and form validity are runtime facts that
 * belong in code. `requires` documents that dependency without pretending the
 * CMS evaluates it.
 */

/** Runtime facts a step depends on. Evaluated by the product, never authored. */
export type RuntimeCondition =
  | 'geo.zipKnown'
  | 'geo.zipUnknown'
  | 'auth.signedIn'
  | 'auth.signedOut'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'form.valid'

/**
 * A value the entry CTA already carries into the journey.
 *
 * Seeded values still flow downstream — the step that would have captured one is
 * skipped, but every later step that reads it behaves as though it was asked.
 *
 * `auth` and `account` are the same idea applied to identity: a journey that
 * starts inside the product already knows who you are, so those two screens are
 * not drawn. They stay in the step list, marked skipped, because the reason they
 * are absent is worth reading — and because a TVE user is authenticated without
 * having completed an account, which is why these are two seeds and not one.
 */
export type Seed = 'zip' | 'tier' | 'plan' | 'auth' | 'account'


/**
 * Which component draws a step.
 *
 * 'stub' is a step that has no screen yet and says so. Everything else names
 * a screen that is built, and is editable in the panel for that reason.
 */
export type StepRenderer =
  | 'plans'
  | 'landing'
  | 'cadence'
  | 'auth'
  | 'account'
  | 'zip'
  | 'checkout'
  | 'ready'
  | 'stub'

/** Why a step isn't in the resolved journey. */
export type SkipReason = 'seeded' | 'not-applicable'

export interface Step {
  id: string
  name: string
  /** Label for the step picker — the design uses short names there. */
  shortName?: string
  figmaFrame?: string
  renderer: StepRenderer
  order: number
  /** Selector — omitted keys are wildcards, as card overrides work. */
  when?: Partial<Context>
  /**
   * The markets a step runs in, when there is more than one.
   *
   * `when.market` holds a single value, which suits a step belonging to one
   * country. The ZIP check belongs to a product rather than a country — it runs
   * wherever regional blackouts do, which is every market carrying the RSN —
   * so it names its markets instead. Same shape as `ChannelConfig.markets`,
   * which already means exactly this.
   */
  markets?: string[]
  /**
   * The value this step exists to capture. When the journey's entry seeds it,
   * the step is skipped — but the value is still present for later steps.
   */
  captures?: Seed
  /**
   * A seed that constrains this step without answering it. "Get Ultimate"
   * pre-selects the tier but the plan is still chosen here — the step narrows
   * rather than disappearing, which is why Figma draws two frames, not one.
   */
  narrowedBy?: Seed
  /** Runtime gates. Documentation for the product, not evaluated here. */
  requires?: RuntimeCondition[]
  /** States drawn as separate frames in Figma. One step, several states. */
  states?: string[]
  /**
   * Agreed, but not yet drawn.
   *
   * The model is allowed to run ahead of the file — that is the point of
   * deciding a journey here rather than in Figma. A proposed step renders and
   * is editable like any other, but it does not count towards the Figma
   * reconciliation, so `figmaScreens` keeps meaning "what the section draws"
   * instead of quietly becoming "whatever we last agreed".
   */
  proposed?: boolean
  note?: string
}

export interface JourneyEntry {
  /** The CTA label as it appears on the landing page. */
  cta: string
  /** Which part of the landing page it sits in. */
  section: string
  figmaFrame: string
  figmaSection: string
}

export interface Journey {
  id: string
  name: string
  audience: string
  entry: JourneyEntry
  /** What the entry already knows. Seeded steps drop out. */
  seeds: Seed[]
  steps: Step[]
  /**
   * Where this journey runs. Omitted keys are wildcards, exactly as on a step.
   *
   * Partner journeys rarely need one: a channel belongs to a market, so a
   * Movistar journey is Spanish by construction. Stating it twice invites the
   * two to disagree. Reach for this when a DIRECT journey genuinely differs —
   * an unlaunched market, a country with its own purchase flow.
   */
  when?: Partial<Pick<Context, 'market' | 'channel' | 'subscription'>>
  /**
   * How many screens the Figma section actually contains for this journey.
   *
   * Reconciled by hand once, then checked on every dev boot. Without it the
   * model drifts from the file silently — a step quietly dropped still renders
   * a plausible-looking journey, which is the failure that is hardest to see.
   */
  figmaScreens?: number
}

/** Reference context for counting: US, direct, so no step is filtered by market. */
const COUNTING_CONTEXT: Context = { market: 'US', channel: 'direct', cadence: 'Monthly' }

/** Screens a journey renders — states included, seeded steps excluded. */
export function screenCount(
  journey: Journey,
  context: Context = COUNTING_CONTEXT,
  { includeProposed = true }: { includeProposed?: boolean } = {},
): number {
  return resolveJourney(journey, context)
    .filter((s) => includeProposed || !s.proposed)
    .reduce((n, s) => n + (s.states?.length ?? 1), 0)
}

/** Steps decided here but not yet in the design file. */
export function proposedSteps(all: Journey[]): { journey: Journey; step: Step }[] {
  return all.flatMap((j) => j.steps.filter((s) => s.proposed).map((step) => ({ journey: j, step })))
}

/** Journeys whose modelled screen count no longer matches the Figma section. */
export function driftFromFigma(all: Journey[]): { id: string; declared: number; actual: number }[] {
  return all.flatMap((j) => {
    if (j.figmaScreens === undefined) return []
    // Compared without proposed steps: drift means the file changed under us,
    // not that we chose to add something to it.
    const actual = screenCount(j, COUNTING_CONTEXT, { includeProposed: false })
    return actual === j.figmaScreens ? [] : [{ id: j.id, declared: j.figmaScreens, actual }]
  })
}

/** Whether a journey runs in this context at all. */
export function journeyApplies(journey: Journey, context: Context): boolean {
  const { market, channel, subscription } = journey.when ?? {}
  if (market !== undefined && market !== context.market) return false
  if (channel !== undefined && channel !== context.channel) return false
  if (subscription !== undefined && subscription !== context.subscription) return false
  return true
}

/** Journeys available here, in declaration order. */
export function journeysFor(all: Journey[], context: Context): Journey[] {
  return all.filter((j) => journeyApplies(j, context))
}

/**
 * The journey a set is on: the one it names if that one runs here, otherwise
 * the first that does.
 *
 * One function because two answers to this question is two situations — the
 * editor would be writing copy for a journey the preview is not showing.
 */
export function chosenJourney(all: Journey[], context: Context, journeyId: string): Journey {
  const running = journeysFor(all, context)
  return running.find((j) => j.id === journeyId) ?? running[0] ?? all[0]
}

/**
 * A journey with its steps in the order the set says, if it says anything.
 *
 * Ids the journey does not have are ignored and ids the order omits keep their
 * relative position at the end, so an order recorded before a step was added or
 * renamed degrades to a partial ordering rather than losing steps.
 *
 * `order` is renumbered from position, per J-8: reordering is moving an id, not
 * renumbering by hand.
 */
export function applyStepOrder(journey: Journey, order?: string[]): Journey {
  if (!order || order.length === 0) return journey
  const rank = new Map(order.map((id, i) => [id, i]))
  const steps = journey.steps
    .slice()
    .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((step, i) => ({ ...step, order: (i + 1) * 10 }))
  return { ...journey, steps }
}

/** Whether this journey runs in an order other than the one Figma draws. */
export function isReordered(journey: Journey, order?: string[]): boolean {
  if (!order || order.length === 0) return false
  const drawn = journey.steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id)
  return drawn.join('|') !== order.filter((id) => drawn.includes(id)).join('|')
}

export interface ResolvedStep {

  step: Step
  /** Null when the step is included. */
  skipped: SkipReason | null
  /**
   * Included, but constrained by a seed the entry carried — the step still
   * asks its question, from a narrower set of answers.
   */
  narrowed: boolean
}

/** Every step with its inclusion decision, in order. */
export function planJourney(journey: Journey, context: Context): ResolvedStep[] {
  return journey.steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((step) => {
      const narrowed = Boolean(step.narrowedBy && journey.seeds.includes(step.narrowedBy))
      if (step.markets && !step.markets.includes(context.market)) {
        return { step, skipped: 'not-applicable' as const, narrowed }
      }
      if (step.when) {
        const { market, campaign } = step.when
        if (market !== undefined && market !== context.market) {
          return { step, skipped: 'not-applicable' as const, narrowed }
        }
        if (campaign !== undefined && campaign !== context.campaign) {
          return { step, skipped: 'not-applicable' as const, narrowed }
        }
      }
      if (step.captures && journey.seeds.includes(step.captures)) {
        return { step, skipped: 'seeded' as const, narrowed }
      }
      return { step, skipped: null, narrowed }
    })
}

/** Steps that actually render, in order. */
export function resolveJourney(journey: Journey, context: Context): Step[] {
  return planJourney(journey, context)
    .filter((r) => r.skipped === null)
    .map((r) => r.step)
}

export function excludedSteps(journey: Journey, context: Context): ResolvedStep[] {
  return planJourney(journey, context).filter((r) => r.skipped !== null)
}

/**
 * Values available to a step, whether they were seeded by the entry or captured
 * by an earlier step. This is what a later screen may treat as inbound.
 */
export function knownAt(journey: Journey, context: Context, stepId: string): Seed[] {
  const known = new Set<Seed>(journey.seeds)
  for (const { step, skipped } of planJourney(journey, context)) {
    if (step.id === stepId) break
    if (step.captures && skipped === null) known.add(step.captures)
  }
  return [...known]
}
