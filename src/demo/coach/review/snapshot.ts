import type { CardSet, Context, MarketConfig } from '../../../rules/content'
import { resolveFlow } from '../../../rules/layers'
import { statesOf, tabsOf } from '../../../rules/tabs'
import { deriveCard } from '../../../rules/derive'
import { type FlowContent } from '../../../rules/flow'
import type { Journey, ResolvedStep, SkipReason, StepRenderer } from '../../../rules/journey'
import { marketFor, resolveSet } from '../../../rules/resolve'
import type { ScreenId } from './types'

/**
 * The journey as plain facts, what every brain reads.
 *
 * Built once from the same rules the product renders through, so an
 * observation about a price or a badge is an observation about what is on
 * screen, not about a field in a form. Nothing here is judged; that is the
 * brains' job.
 */

export interface PlanFact {
  id: string
  name: string
  description: string
  /** As rendered, "$29.99". */
  price: string
  priceNumber: number
  unit: string
  cta: string
  /** The ribbon, or null. */
  badge: string | null
  /** The gold treatment, the one plan the set recommends. */
  highlighted: boolean
  features: string[]
  /** Competition / team names, in the order the card shows them. */
  teams: string[]
  teamTotal: number
  order: number
}

export interface ScreenFact {
  id: ScreenId
  name: string
  renderer: StepRenderer
  states: number
  skipped: SkipReason | null
  /** Position among the screens that render, 1-based. */
  position: number
}

export interface JourneySnapshot {
  market: MarketConfig
  cadence: string
  journey: { id: string; name: string; entryCta: string }
  /** Every step, in order, whether it renders or not. */
  steps: ScreenFact[]
  /** The steps that render, in order. */
  rendered: ScreenFact[]
  plans: PlanFact[]
  /** The tabs above the cards, the plan step's states. */
  planTabs: string[]
  flow: FlowContent
  /** Every team name the catalogue knows, keyed by id. */
  teamNames: Record<string, string>
}

export function renders(s: JourneySnapshot, id: ScreenId): boolean {
  return s.rendered.some((r) => r.id === id)
}

export function screenName(s: JourneySnapshot, id: ScreenId): string {
  if (id === 'journey') return 'Whole journey'
  return s.steps.find((r) => r.id === id)?.name ?? id
}

export function buildSnapshot(set: CardSet, journey: Journey, context: Context, planned: ResolvedStep[]): JourneySnapshot {
  const market: MarketConfig = marketFor(set, context.market) ?? {
    code: context.market,
    label: context.market,
    locale: 'en-US',
    currency: 'USD',
  }

  const plans: PlanFact[] = resolveSet(set, context).map(({ tier, offer }) => {
    const card = deriveCard(set, tier, offer, market, context)
    return {
      id: tier.id,
      name: tier.planName,
      description: tier.description,
      price: card.primaryPrice,
      priceNumber: offer.discount && offer.introPrice !== null ? offer.introPrice : offer.standardPrice,
      unit: card.priceUnit,
      cta: card.ctaLabel,
      badge: card.showBadge ? card.badgeText : null,
      highlighted: tier.ultimate,
      features: card.features.map((f) => f.text),
      teams: card.allLogos.map((l) => l.name),
      teamTotal: tier.logoTotal,
      order: tier.displayOrder,
    }
  })

  let position = 0
  const steps: ScreenFact[] = planned.map(({ step, skipped }) => ({
    id: step.id as ScreenId,
    name: step.shortName ?? step.name,
    renderer: step.renderer,
    states: statesOf(step, set).length,
    skipped,
    position: skipped ? 0 : ++position,
  }))

  return {
    market,
    cadence: context.cadence,
    journey: { id: journey.id, name: journey.name, entryCta: journey.entry.cta },
    steps,
    rendered: steps.filter((s) => !s.skipped),
    plans,
    planTabs: tabsOf(set).map((t) => t.name),
    flow: resolveFlow(set),
    teamNames: Object.fromEntries(set.logoCatalog.map((l) => [l.id, l.name])),
  }
}

export interface ScreenString {
  screen: ScreenId
  field: string
  text: string
}

/** Every string on every rendered screen, with where it lives. */
export function screenStrings(s: JourneySnapshot): ScreenString[] {
  const f = s.flow
  const out: ScreenString[] = []
  const add = (screen: ScreenId, field: string, text: string | undefined) => {
    if (renders(s, screen) && text && text.trim()) out.push({ screen, field, text })
  }
  add('landing', 'title', f.landing.title)
  add('landing', 'body', f.landing.body)
  add('landing', 'button', f.landing.cta)
  add('landing', 'second button', f.landing.altCta)
  for (const p of s.plans) {
    add('plans', `${p.name} name`, p.name)
    add('plans', `${p.name} description`, p.description)
    add('plans', `${p.name} button`, p.cta)
    if (p.badge) add('plans', `${p.name} ribbon`, p.badge)
    p.features.forEach((t, i) => add('plans', `${p.name} feature ${i + 1}`, t))
    p.teams.forEach((t) => add('plans', `${p.name} team`, t))
  }
  add('cadence', 'title', f.cadence.navTitle)
  f.cadence.options.forEach((o) => {
    add('cadence', `${o.title} option`, o.title)
    add('cadence', `${o.title} note`, o.note)
    add('cadence', `${o.title} ribbon`, o.badge)
  })
  add('cadence', 'button', f.cadence.cta)
  add('cadence', 'footnote', f.cadence.footnote)
  add('auth', 'title', f.auth.title)
  add('auth', 'subtitle', f.auth.subtitle)
  add('auth', 'notice', f.auth.noticeTitle)
  add('auth', 'notice body', f.auth.noticeBody)
  add('auth', 'button', f.auth.cta)
  add('account', 'title', f.account.navTitle)
  add('account', 'consent', f.account.consentBody)
  add('account', 'button', f.account.cta)
  add('zip', 'title', f.zip.navTitle)
  add('zip', 'heading', f.zip.heading)
  add('zip', 'body', f.zip.body)
  add('zip', 'button', f.zip.cta)
  add('zip', 'second button', f.zip.altCta)
  add('checkout', 'summary title', f.checkout.summaryTitle)
  add('checkout', 'note', f.checkout.note)
  f.checkout.lines.forEach((l) => add('checkout', 'summary line', `${l.label} ${l.value}`))
  add('checkout', 'renewal note', f.checkout.renewalNote)
  add('checkout', 'legal', f.checkout.legal)
  add('checkout', 'button', f.checkout.payCta)
  add('ready', 'title', f.ready.title)
  add('ready', 'body', f.ready.body)
  add('ready', 'button', f.ready.cta)
  f.ready.logos.forEach((id) => add('ready', 'team', s.teamNames[id]))
  return out
}
