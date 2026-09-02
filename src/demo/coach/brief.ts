/**
 * What the Coach is told before it looks at a single screen.
 *
 * The brief's order: Business Goal → Desired Package → Business Constraints →
 * Available Evidence. Market, entry point and journey are already chosen in
 * the panel, so they are shown, not asked again. User goal and target audience
 * are not asked yet, the owner will say how.
 */
export interface CoachReviewContext {
  businessGoals: BusinessGoalId[]
  /** What a goal is about, when it asks, the content, the offer, the audience. */
  targets: Partial<Record<BusinessGoalId, string>>
  prioritisedTiers: string[]
  constraints: ConstraintId[]
  evidence: EvidenceSourceId[]
}

/**
 * Configurable goals, what the Coach is allowed to optimise for.
 *
 * Each names a lever the business may pull; the baseline questions still run
 * whatever is chosen. `asks` is the one thing the Coach needs to know to
 * check a goal against the journey, which content, which offer, and the
 * field appears in the popup only when that goal is on.
 */
/** What a goal lets the user pick from: the set's plans, its teams, or its feature lines. */
export type GoalPicks = 'plans' | 'teams' | 'features'

export const BUSINESS_GOALS = [
  {
    id: 'drive-package',
    label: 'Drive Specific Package',
    hint: 'Make a business-selected package the clearest path. First place, a default or a badge are strategies, not requirements',
    picks: 'plans',
  },
  {
    id: 'drive-annual',
    label: 'Drive Annual Plan',
    hint: 'Communicate Annual clearly and check whether the existing choice architecture supports or works against it',
  },
  {
    id: 'acquire-content',
    label: 'Acquire for Specific Content',
    hint: 'Trace the sport, competition, team, athlete or event that brought the user in, and find where it disappears',
    picks: 'teams',
    asks: 'Or type other content',
    guide: 'The sport, competition, team, athlete or event that brought the user in. Name it the way the campaign named it.',
  },
  {
    id: 'acquire-audience',
    label: 'Acquire Specific Audience',
    hint: 'Check whether language, proposition and benefits address the audience, without pretending to know their preferences',
    asks: 'Or describe the audience',
    guide: 'Who the campaign is aimed at. The Coach checks whether the words address them; it will not guess their preferences.',
  },
  {
    id: 'drive-offer',
    label: 'Drive Specific Offer',
    hint: 'Check an existing verified offer is clearly communicated and maintained. The economics never change',
    asks: 'Or type the offer',
    guide: 'An offer that already exists: a trial, an intro price, a bundled add-on. The Coach never changes its economics.',
  },
  {
    id: 'drive-benefit',
    label: 'Drive Specific Benefit',
    hint: 'Check a verified benefit is clear, relevant to the decision and carried through the journey',
    picks: 'features',
    asks: 'Or type another benefit',
    guide: 'A verified product benefit, such as content access or a capability. Pick one of the lines the cards already carry, or name another.',
  },
  {
    id: 'drive-bundle',
    label: 'Drive Bundle / Add-on',
    hint: 'Check whether structure, copy, ordering and emphasis support the bundle or add-on',
    picks: 'plans',
  },
  {
    id: 'maintain-proposition',
    label: 'Maintain Campaign Proposition',
    hint: 'Trace the proposition from entry through checkout and find where the promise is diluted, contradicted or lost',
    asks: 'Or type the proposition',
    guide: 'The promise that brought the user in, in the campaign’s own words. The Coach traces it from entry to checkout.',
  },
] as const

export type BusinessGoalId = (typeof BUSINESS_GOALS)[number]['id']

export const BUSINESS_CONSTRAINTS = [
  { id: 'offer-eligibility', label: 'Offer eligibility' },
  { id: 'content-rights', label: 'Content rights' },
  { id: 'market-requirements', label: 'Market-specific requirements' },
  { id: 'operational', label: 'Operational constraints' },
] as const

export type ConstraintId = (typeof BUSINESS_CONSTRAINTS)[number]['id']

/** The evidence hierarchy, strongest first. What is switched off, the Coach must say it lacks. */
export const EVIDENCE_SOURCES = [
  { id: 'dazn-experiments', label: 'DAZN experiments', hint: 'A/B tests, controlled experiments' },
  { id: 'dazn-analytics', label: 'DAZN analytics', hint: 'Funnel data, observed behaviour' },
  { id: 'research', label: 'Market or user research', hint: 'Interviews, surveys, market studies' },
  { id: 'historical', label: 'Historical performance', hint: 'How earlier journeys did' },
] as const

export type EvidenceSourceId = (typeof EVIDENCE_SOURCES)[number]['id']
