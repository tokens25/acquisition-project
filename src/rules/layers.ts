import type { CardSet } from './content'
import type { FlowContent } from './flow'
import { defaultFlow } from './flow'
import { STATUS_LABELS } from './entry'
import { MARKETS, SUBSCRIPTIONS, journeys } from './journeys'
import { chosenJourney } from './journey'
import { VIEW_STATUS, pageViewLabel } from './pageViews'

/**
 * Which situation content is being written for.
 *
 * The four the tool already asks about on the way in. Nothing new is stored to
 * know them: market and subscription are on the context, and the status and the
 * entry point are the chosen journey's own — so a situation is a reading of the
 * set rather than a second copy of the answers.
 */
export interface Situation {
  market: string
  subscription: string
  status: string
  entry: string
}

/**
 * Which situations a layer is for. Sparse: an omitted key matches anything.
 *
 * Sparseness is the whole point. "Spain, whatever else" is one layer rather
 * than the twenty-four that pinning all four would need, and a layer that
 * pins nothing is the copy everybody gets.
 */
export type Selector = Partial<Situation>

/**
 * Whether a scope is a market's own copy of the flow.
 *
 * Markets are separate. Editing one line in Spain must not leave Spain's other
 * six screens following a shared copy somebody else can change underneath it —
 * so a market's layer is the whole flow, taken at the moment it is first
 * written to, and every screen in that market is that market's from then on.
 *
 * The narrower scopes are not like this. Inside a market, a subscription or a
 * user status is a refinement of that market's copy, and refining is exactly
 * the case where inheriting the rest is what you want.
 */
export const isMarketCopy = (scope: Selector) =>
  scope.market !== undefined &&
  scope.subscription === undefined &&
  scope.status === undefined &&
  scope.entry === undefined

/** The fields one layer changes, per screen. Everything else is inherited. */
export type FlowPatch = { [K in keyof FlowContent]?: Partial<FlowContent[K]> }

/** Copy for the situations a selector matches. */
export interface FlowLayer {
  id: string
  when: Selector
  patch: FlowPatch
}

const KEYS: (keyof Situation)[] = ['market', 'subscription', 'status', 'entry']

/** What the copy is called when it belongs to no market in particular. */
export const SHARED = 'Shared copy'

/** The situation the set is currently being edited in. */
export function situationOf(set: CardSet): Situation {
  // The journey the editor and the preview are both on, not the id the set
  // happens to name: a set carrying an id that does not run here is showing
  // some other journey, and its copy belongs to the one on screen.
  const journey = chosenJourney(journeys, set.context, set.journeyId)
  // A context carrying a page view is the one-page product's, where the panel
  // asks which surface this is instead of which audience — so the view is the
  // whole of the answer there, including when it is one of the two that name
  // no viewer and so pin nothing. Without one, the journey answers as before.
  const view = set.context.pageView
  return {
    market: set.context.market,
    subscription: set.context.subscription ?? '',
    status: view ? (VIEW_STATUS[view] ?? '') : (journey?.audience ?? ''),
    entry: journey?.entry.cta ?? '',
  }
}

/** Whether a layer applies here. A key it does not pin is a key it ignores. */
export function selectorMatches(when: Selector, at: Situation): boolean {
  return KEYS.every((k) => when[k] === undefined || when[k] === at[k])
}

/**
 * How specific a selector is, so overlapping layers resolve the same way every
 * time rather than by the order they happen to be stored in.
 *
 * How many keys are pinned decides it — three beats one, always. Between two
 * that pin the same number, the declared order breaks the tie: market, then
 * subscription, then status, then entry. Both halves are in one number so
 * sorting is a comparison and not a policy.
 */
export function specificity(when: Selector): number {
  const pinned = KEYS.filter((k) => when[k] !== undefined)
  const weight = pinned.reduce((n, k) => n + (1 << (KEYS.length - 1 - KEYS.indexOf(k))), 0)
  return pinned.length * 16 + weight
}

/**
 * What a surface is, rather than what anybody wrote it to be.
 *
 * Somebody already signed in cannot sign in, so the nav's sign-in button is
 * not something the logged-in page withholds by choice — it is something that
 * page does not have. No market is pinned because none is relevant: it is as
 * true in Spain as in Canada.
 *
 * These stack after everything written, not at their own specificity. A market
 * that has taken its own copy took a snapshot of every field at the moment it
 * forked, this one included, and at a plain market's specificity that snapshot
 * would outrank a rule the market never had an opinion about — so the forked
 * markets, the ones most likely to be somebody's long-standing work, would be
 * the only ones the rule failed to reach.
 */
const BUILT_IN: FlowLayer[] = [
  {
    id: 'built-in:signed-in-nav',
    when: { status: 'logged-in' },
    patch: { landing: { navSignUpEnabled: false } },
  },
]

/** The layers that apply here, least specific first — the order they stack in. */
export function layersFor(set: CardSet, at: Situation = situationOf(set)): FlowLayer[] {
  const written = (set.flowLayers ?? [])
    .filter((l) => selectorMatches(l.when, at))
    .sort((a, b) => specificity(a.when) - specificity(b.when))
  return [...written, ...BUILT_IN.filter((l) => selectorMatches(l.when, at))]
}

/**
 * The copy this situation actually shows.
 *
 * The base is merged by screen and not by field, which is how it has always
 * read: a screen saved before a field existed says nothing about that field,
 * and the screen's own fallbacks are what answer for it. Merging fields here
 * would answer for it with the default, which is a different thing.
 */
export function resolveFlow(set: CardSet, at: Situation = situationOf(set)): FlowContent {
  // Each screen is copied before a layer is written into it: the base screens
  // are the shipped defaults or the saved content, and neither may be edited.
  // Written out rather than mapped so a new screen is a compile error here
  // instead of a screen no layer can reach.
  const base = { ...defaultFlow, ...set.flow }
  const out: FlowContent = {
    landing: { ...base.landing },
    plans: { ...base.plans },
    cadence: { ...base.cadence },
    auth: { ...base.auth },
    account: { ...base.account },
    zip: { ...base.zip },
    checkout: { ...base.checkout },
    ready: { ...base.ready },
  }
  for (const layer of layersFor(set, at)) {
    for (const key of Object.keys(layer.patch) as (keyof FlowContent)[]) {
      Object.assign(out[key], layer.patch[key])
    }
  }
  return out
}

/**
 * Where a field's value comes from — the layer that last set it, or null for
 * the copy everybody gets.
 *
 * A field is a screen's own key, so a change anywhere inside a list is a change
 * to the list: an overridden list replaces the one below it rather than merging
 * into it, because merging two lists item by item has no answer for an item
 * that was removed.
 */
export function ownerOf(
  set: CardSet,
  screen: keyof FlowContent,
  field: string,
  at: Situation = situationOf(set),
): FlowLayer | null {
  const owning = layersFor(set, at).filter((l) => field in (l.patch[screen] ?? {}))
  return owning[owning.length - 1] ?? null
}

/**
 * Writes fields to one layer, and returns the set patch that does it.
 *
 * An empty scope is the copy everybody gets, which lives on the set itself
 * rather than in a layer of its own — there is only ever one of it, and a
 * layer that matches everything would be a second place for it to live.
 */
export function writeFlow<K extends keyof FlowContent>(
  set: CardSet,
  scope: Selector,
  screen: K,
  next: Partial<FlowContent[K]>,
): Partial<CardSet> {
  const flow = { ...defaultFlow, ...set.flow }
  if (!KEYS.some((k) => scope[k] !== undefined)) {
    return { flow: { ...flow, [screen]: { ...flow[screen], ...next } } }
  }
  const layers = set.flowLayers ?? []
  const at = layers.findIndex((l) => sameSelector(l.when, scope))
  const existing = layers[at]
  // A market taking its copy takes what it was already showing, so the fork is
  // invisible at the moment it happens — the words on screen do not change,
  // only who owns them.
  const opening: FlowPatch =
    existing || !isMarketCopy(scope) ? {} : (forkFrom(set, scope) as FlowPatch)
  const base = existing?.patch ?? opening
  const written: FlowLayer = {
    id: existing?.id ?? layerId(scope),
    when: scope,
    patch: {
      ...base,
      [screen]: { ...base[screen], ...next },
    },
  }
  return {
    flowLayers: existing
      ? layers.map((l, i) => (i === at ? written : l))
      : [...layers, written],
  }
}

/**
 * What a market's copy starts as: everything it was showing, which is the
 * shared copy plus anything broader than the market itself.
 */
function forkFrom(set: CardSet, scope: Selector): FlowContent {
  const mine = specificity(scope)
  const below: CardSet = {
    ...set,
    flowLayers: (set.flowLayers ?? []).filter((l) => specificity(l.when) < mine),
  }
  return resolveFlow(below, { ...blankSituation, ...scope })
}

const blankSituation: Situation = { market: '', subscription: '', status: '', entry: '' }

/**
 * The copy everybody gets, with nothing written over it.
 *
 * A different question from what a situation ends up showing, and the one to
 * ask about the page itself: a market with its own copy resolves to that copy,
 * so asking the resolved content whether the page is still a default answers
 * for the market rather than for the page under it.
 */
export const baseFlow = (set: CardSet): FlowContent => resolveFlow(set, blankSituation)

/** Drops a whole layer, so its situations read what they read before it. */
export function clearLayer(set: CardSet, scope: Selector): Partial<CardSet> {
  return { flowLayers: (set.flowLayers ?? []).filter((l) => !sameSelector(l.when, scope)) }
}

/** Drops a layer's changes to one screen, so the screen inherits again. */
export function clearFlow(set: CardSet, scope: Selector, screen: keyof FlowContent): Partial<CardSet> {
  const layers = set.flowLayers ?? []
  return {
    flowLayers: layers.flatMap((l) => {
      if (!sameSelector(l.when, scope)) return [l]
      const patch = { ...l.patch }
      delete patch[screen]
      // A layer that changes nothing is not a layer.
      return Object.keys(patch).length ? [{ ...l, patch }] : []
    }),
  }
}

/** Two selectors cover the same situations. */
export const sameSelector = (a: Selector, b: Selector) => KEYS.every((k) => a[k] === b[k])

const layerId = (scope: Selector) =>
  KEYS.filter((k) => scope[k] !== undefined)
    .map((k) => `${k}:${scope[k]}`)
    .join('|')

/** What a selector covers, in the words the situation fields use. */
export function selectorLabel(when: Selector): string {
  const parts = [
    when.market && (MARKETS.find((m) => m.code === when.market)?.label ?? when.market),
    when.subscription &&
      (SUBSCRIPTIONS.find((s) => s.code === when.subscription)?.label ?? when.subscription),
    // Journey audiences are named in entry.ts and page views in pageViews.ts,
    // and a status here came from whichever control was on screen.
    when.status && (STATUS_LABELS[when.status] ?? pageViewLabel(when.status)),
    when.entry,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : SHARED
}

/**
 * The scopes an edit can be made at, from the copy everybody gets down to this
 * exact situation.
 *
 * A ladder rather than every combination of the four: sixteen scopes is not a
 * menu anybody can hold in their head, and the ones left out — status without
 * market, entry without status — are narrower than the reason for wanting them.
 * There is no rung for a subscription across markets either: markets are
 * separate, so a layer spanning them would be one a market with its own copy
 * could never see.
 */
export function scopeLadder(at: Situation): { when: Selector; label: string }[] {
  const rungs: Selector[] = [
    {},
    { market: at.market },
    { market: at.market, subscription: at.subscription },
    { market: at.market, subscription: at.subscription, status: at.status },
    { market: at.market, subscription: at.subscription, status: at.status, entry: at.entry },
  ]
  return rungs
    // A rung pinning something the situation does not know would be a layer
    // that never matches anything.
    .filter((when) => KEYS.every((k) => when[k] === undefined || at[k]))
    .filter((when, i, all) => all.findIndex((o) => sameSelector(o, when)) === i)
    .map((when) => ({ when, label: selectorLabel(when) }))
}
