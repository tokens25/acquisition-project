import type { Context } from './content'

/**
 * A journey is an ordered list of steps with selectors.
 *
 * Which steps appear is configuration — a market or campaign can add or remove
 * one. What happens *between* steps is not: geo-IP results, payment outcomes and
 * form validity are runtime facts that belong in code. `requires` documents that
 * dependency without pretending the CMS evaluates it.
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

/** How a step is rendered today. `stub` means the component isn't built yet. */
export type StepRenderer = 'plans' | 'stub'

export interface Step {
  id: string
  name: string
  /** Figma frame this step corresponds to, for traceability. */
  figmaFrame?: string
  renderer: StepRenderer
  /** Position in the journey. Ties are resolved by declaration order. */
  order: number
  /**
   * Selector — omitted keys are wildcards, exactly as card overrides work.
   * A step with no selector appears in every context.
   */
  when?: Partial<Context>
  /** Runtime gates. Documentation for the product, not evaluated here. */
  requires?: RuntimeCondition[]
  /**
   * States this step passes through in the design. They are one step, not
   * several — the Figma line draws each state as its own frame.
   */
  states?: string[]
  note?: string
}

export interface Journey {
  id: string
  name: string
  /** Who this journey is for. A selector over user state, not market. */
  audience: string
  steps: Step[]
}

/** Steps that apply to a context, in order. */
export function resolveJourney(journey: Journey, context: Context): Step[] {
  return journey.steps
    .filter((step) => {
      if (!step.when) return true
      const { market, campaign } = step.when
      if (market !== undefined && market !== context.market) return false
      if (campaign !== undefined && campaign !== context.campaign) return false
      return true
    })
    .slice()
    .sort((a, b) => a.order - b.order)
}

/** Steps dropped in this context, and why — for the preview's blast radius. */
export function excludedSteps(journey: Journey, context: Context): Step[] {
  const included = new Set(resolveJourney(journey, context).map((s) => s.id))
  return journey.steps.filter((s) => !included.has(s.id))
}
