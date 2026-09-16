import { channelById, marketById } from './catalogue'
import type { CadenceOffer, CardSet, Tier } from './content'
import type { Journey, Step } from './journey'
import { configuredJourneys } from './journeyConfig'
import type { FlowStructure } from './onboarding'
import { structureKey } from './onboarding'
import { writeFlow } from './layers'
import { flowIdKey, planIdPrefix } from './flowIds'

/**
 * Turning a described structure into a flow that runs.
 *
 * The wizard asks what shape a flow has; this makes that shape real — a
 * journey with steps, a plan slot per plan, and a price row for each way of
 * paying. What it does not do is write anything: every name is a slot label
 * and every price is zero, because the words and the numbers are the part a
 * person supplies. The publish gate then reads as a to-do list rather than as
 * a set of failures, which is what it is at this point.
 *
 * Generation is idempotent and additive. Someone who has filled in half a
 * flow and then changes its structure gets the change, not a fresh start:
 * plans keep their ids, so what has been written stays written, and only the
 * difference between the old shape and the new one is applied.
 */

/** Journeys the app knows about: the ones written down, plus the ones built here. */
export const allJourneys = (set: CardSet): Journey[] => [
  ...configuredJourneys,
  ...(set.journeys ?? []),
]

/** `channel:jp/nfl` → `channel-jp-nfl`, so it can be part of an id. */
const slug = (key: string): string => key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

/**
 * The flow — the market and channel pair. Its plans belong to it.
 *
 * Separate from the journey id below, and the difference matters: setting the
 * same flow up for a second kind of user gives a second journey, and both of
 * them sell the same plans. Keying the plans to the journey would have given
 * the returning customer a second set of cards to write.
 */
export const flowIdFor = (s: FlowStructure): string => flowIdKey(s.marketId, s.channelId)

/** The journey — who it is for and where they arrived from, as well. */
export const journeyIdFor = (s: FlowStructure): string =>
  `${flowIdFor(s)}-${slug(s.audience)}-${slug(s.entry)}`

const tierIdFor = (s: FlowStructure, index: number): string =>
  `${planIdPrefix(s.marketId, s.channelId)}${index + 1}`

/** What this flow is selling, in words — the channel, or DAZN itself. */
function subject(s: FlowStructure): string {
  return s.channelId ? (channelById(s.channelId)?.label ?? s.channelId) : 'DAZN'
}

/**
 * The ways of paying this flow offers.
 *
 * The wizard asks how many options there are, not what they are called: a
 * cadence is a name the set already keeps, so the count picks from that list
 * rather than inventing three new ones. A flow with no payment step still
 * needs one row per plan, or the plan has no price and does not render.
 */
export function cadencesFor(s: FlowStructure, set: CardSet): string[] {
  const all = set.cadences.length ? set.cadences : ['Monthly']
  if (!s.cadence.enabled) return [all[0]]
  return all.slice(0, Math.max(1, Math.min(s.cadence.optionCount, all.length)))
}

/**
 * The steps a described flow walks.
 *
 * Four of these are not asked about and are here anyway: something has to be
 * arrived from, signed into, paid on and confirmed by. The wizard asks about
 * the parts that differ between flows; these are the parts that do not. Each
 * one says where it came from, so nothing here reads as a decision somebody
 * made and then forgot.
 *
 * Every step is `proposed`: it was decided here, not drawn in Figma. That is
 * what the flag means, and it keeps the Figma reconciliation honest — a
 * generated flow must not start counting towards what the design file draws.
 */
export function stepsFor(s: FlowStructure): Step[] {
  const steps: Step[] = []

  // A landing page is a screen this flow draws only when the flow starts on
  // one. Arriving from an email or from inside the catalogue means the first
  // screen is the plan picker, and drawing a landing page anyway would be
  // describing a journey nobody walks.
  if (s.entry === 'Landing page') {
    steps.push({
      id: 'landing',
      name: 'Landing',
      shortName: 'Landing',
      renderer: 'landing',
      order: 10,
      proposed: true,
      requires: ['auth.signedOut'],
      note: 'Where the journey is entered, because setup said it starts here.',
    })
  }

  steps.push({
    id: 'plans',
    name: 'Choose your subscription',
    shortName: 'Subscription',
    renderer: 'plans',
    order: 20,
    captures: 'plan',
    proposed: true,
    note: `${s.plans.count} plan${s.plans.count === 1 ? '' : 's'}, as set up. The cards are empty until someone writes them.`,
  })

  if (s.cadence.enabled) {
    steps.push({
      id: 'cadence',
      name: 'Choose how to pay',
      shortName: 'Cadence',
      renderer: 'cadence',
      order: 30,
      proposed: true,
      note: `${s.cadence.optionCount} options, chosen in a step of their own.`,
    })
  }

  steps.push(
    {
      id: 'auth',
      name: 'Login',
      shortName: 'Login',
      renderer: 'auth',
      order: 40,
      captures: 'auth',
      proposed: true,
      requires: ['auth.signedOut'],
      note: s.banner.enabled
        ? 'Carries the information banner set up for this flow.'
        : 'No banner was set up for this page.',
    },
    {
      id: 'account',
      name: 'Account setup',
      shortName: 'Account setup',
      renderer: 'account',
      order: 50,
      captures: 'account',
      proposed: true,
      requires: ['form.valid'],
      note: s.consents.length
        ? `${s.consents.length} consent item${s.consents.length === 1 ? '' : 's'}, ${s.consents.filter((c) => c.required).length} of them required.`
        : 'No consent items were set up.',
    },
    {
      id: 'checkout',
      name: 'Checkout',
      shortName: 'Checkout',
      renderer: 'checkout',
      order: 60,
      proposed: true,
      note: 'Not asked about in setup: a plan has to be paid for.',
    },
    {
      id: 'ready',
      name: 'Confirmation screen',
      shortName: 'Confirmation',
      renderer: 'ready',
      order: 70,
      proposed: true,
      requires: ['payment.succeeded'],
      note: 'Not asked about in setup: the end of the flow.',
    },
  )

  return steps
}

/** The journey a structure describes. */
export function journeyFor(s: FlowStructure): Journey {
  const what = subject(s)
  const where = marketById(s.marketId)?.label ?? s.marketId
  return {
    id: journeyIdFor(s),
    name: `${where} · ${what} · ${s.entry}`,
    audience: s.audience,
    // Scoped to exactly what was set up. A market flow leaves `subscription`
    // open, because it is the flow for the country rather than for a product.
    when: s.channelId ? { market: s.marketId, subscription: s.channelId } : { market: s.marketId },
    entry: {
      cta: s.entry,
      section: s.entry,
      figmaFrame: '—',
      figmaSection: '—',
    },
    // Somebody who already has an account is not asked to make one. The step
    // stays in the list and is marked skipped, because why it is absent is
    // worth reading — that is what a seed is for.
    seeds: s.audience === 'logged-out-existing' ? ['account'] : [],
    steps: stepsFor(s),
    // Deliberately no figmaScreens: nothing in the file draws this yet, and
    // claiming a count would make the drift check report a difference that is
    // not one.
  }
}

/**
 * A plan slot, carrying whatever setup picked for it.
 *
 * The name is a label and the price is zero, because those are the parts
 * nobody has decided yet. The competitions and the feature lines are not: they
 * were chosen in setup, from the catalogue, and they are what makes the card
 * come out looking like a plan rather than an empty box.
 */
function blankTier(s: FlowStructure, index: number): Tier {
  const logos = s.plans.logos[index] ?? []
  const features = s.plans.features[index] ?? []
  return {
    id: tierIdFor(s, index),
    planName: `Plan ${index + 1}`,
    description: '',
    features,
    logoTiles: logos,
    // What the plan carries, as far as anyone has said. A plan with more
    // competitions than logos supplied is a thing somebody states later; it is
    // not something setup can know.
    logoTotal: logos.length,
    logoRows: s.card.logos ? s.card.logoRows : undefined,
    logoOverflow: s.card.logos ? s.card.logoOverflow : undefined,
    startsAt: s.card.startsAt,
    // The highlighted plan is the one carrying the badge. Nothing else about
    // it is decided here.
    highlighted: s.plans.highlighted === index,
    displayOrder: index,
    // Only this product sells these plans. Without it a FIBA plan would be on
    // sale in every flow in the tool.
    subscriptions: s.channelId ? [s.channelId] : undefined,
    status: 'live',
    channel: 'direct',
    visibleToPartners: false,
    overrides: [],
  }
}

/**
 * A price row with no price in it.
 *
 * Scoped to the market, which is what keeps a Japanese flow's plans out of
 * every other country: a tier with no offer in a market does not render there,
 * and that is the sparse rule the offer table already runs on.
 */
function blankOffer(s: FlowStructure, tierId: string, cadence: string): CadenceOffer {
  return {
    id: `${tierId}-${slug(cadence)}`,
    tierId,
    cadence,
    market: s.marketId,
    standardPrice: 0,
    discount: false,
    introPrice: null,
    introMonths: 0,
    addOnId: null,
    addOnPurchaseType: null,
    addOnDiscountPercent: null,
    includedAddOnIds: [],
  }
}

/** What generating changed, so the tool can say it rather than imply it. */
export interface GenerationReport {
  journeyId: string
  firstStepId: string
  plansAdded: number
  plansRemoved: number
  plansKept: number
  offersAdded: number
}

export interface Generated {
  set: CardSet
  report: GenerationReport
}

/**
 * Build this structure's flow into the set.
 *
 * Everything here is a replace-by-id or an add-if-missing. Nothing written by
 * a person is overwritten: a plan that exists keeps its name, its description,
 * its features and its prices, and only the parts the structure actually
 * decides — how many plans there are, which one is highlighted, how the logo
 * row is laid out — are taken from the new shape.
 */
export function generateFlow(set: CardSet, s: FlowStructure): Generated {
  const journey = journeyFor(s)
  const journeys = [...(set.journeys ?? []).filter((j) => j.id !== journey.id), journey]

  const wanted = Array.from({ length: s.plans.count }, (_, i) => tierIdFor(s, i))
  const mine = new Set(wanted)
  const existing = new Map(set.tiers.filter((t) => mine.has(t.id)).map((t) => [t.id, t]))

  const tiers = wanted.map((id, i) => {
    const had = existing.get(id)
    if (!had) return blankTier(s, i)
    return {
      ...had,
      // The structure owns these three and nothing else. The words stay put.
      logoRows: s.card.logos ? s.card.logoRows : undefined,
      logoOverflow: s.card.logos ? s.card.logoOverflow : undefined,
      startsAt: s.card.startsAt,
      highlighted: s.plans.highlighted === i,
      displayOrder: i,
    }
  })

  // Plans this structure used to have and no longer does. Only ones it owns:
  // the id prefix is the flow's own, so nothing else can be caught by this.
  const prefix = planIdPrefix(s.marketId, s.channelId)
  const dropped = set.tiers.filter((t) => t.id.startsWith(prefix) && !mine.has(t.id))
  const droppedIds = new Set(dropped.map((t) => t.id))

  const nextTiers = [...set.tiers.filter((t) => !mine.has(t.id) && !droppedIds.has(t.id)), ...tiers]

  const cadences = cadencesFor(s, set)
  const kept = set.offers.filter((o) => !droppedIds.has(o.tierId))
  const have = new Set(kept.map((o) => `${o.tierId}|${o.cadence}|${o.market ?? ''}`))
  const added: CadenceOffer[] = []
  for (const tier of tiers) {
    for (const cadence of cadences) {
      if (have.has(`${tier.id}|${cadence}|${s.marketId}`)) continue
      added.push(blankOffer(s, tier.id, cadence))
    }
  }

  /*
   * The words setup was given, laid over this situation.
   *
   * Layered rather than written into the base, because the base is what every
   * other market and product reads: a headline written for Japan's NFL flow
   * belongs to Japan's NFL flow. A screen left blank writes nothing at all —
   * that is the difference between "left empty on purpose" and "filled with
   * emptiness", and only one of them can be told apart from a mistake later.
   */
  const scope = { market: s.marketId, subscription: s.channelId ?? '' }
  let written: CardSet = { ...set, journeys, tiers: nextTiers, offers: [...kept, ...added] }
  if (s.landing.configure) {
    written = {
      ...written,
      ...writeFlow(written, scope, 'landing', {
        ...(s.landing.title.trim() ? { title: s.landing.title.trim() } : {}),
        ...(s.landing.body.trim() ? { body: s.landing.body.trim() } : {}),
        ...(s.landing.cta.trim() ? { cta: s.landing.cta.trim() } : {}),
        ...(s.landing.altCta.trim() ? { altCta: s.landing.altCta.trim() } : {}),
      }),
    }
  }
  if (s.checkout.configure) {
    written = {
      ...written,
      ...writeFlow(written, scope, 'checkout', {
        ...(s.checkout.navTitle.trim() ? { navTitle: s.checkout.navTitle.trim() } : {}),
        ...(s.checkout.note.trim() ? { note: s.checkout.note.trim() } : {}),
        ...(s.checkout.payCta.trim() ? { payCta: s.checkout.payCta.trim() } : {}),
        ...(s.checkout.legal.trim() ? { legal: s.checkout.legal.trim() } : {}),
      }),
    }
  }

  return {
    set: {
      ...written,
      journeys,
      tiers: nextTiers,
      offers: [...kept, ...added],
      flowStructures: {
        ...(set.flowStructures ?? {}),
        [structureKey(s.marketId, s.channelId)]: {
          ...s,
          state: 'ready',
          updatedAt: new Date().toISOString(),
        },
      },
      journeyId: journey.id,
      stepId: journey.steps[0].id,
      context: { ...set.context, market: s.marketId, subscription: s.channelId },
    },
    report: {
      journeyId: journey.id,
      firstStepId: journey.steps[0].id,
      plansAdded: wanted.length - existing.size,
      plansRemoved: dropped.length,
      plansKept: existing.size,
      offersAdded: added.length,
    },
  }
}
