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
 */
export type Seed = 'zip' | 'tier' | 'plan'

export type StepRenderer = 'plans' | 'stub'

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
