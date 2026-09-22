import type { CardSet, Context, PlanTab, Tier } from './content'
import type { Step } from './journey'

/**
 * The tabs the design draws, for content written before they were authored.
 *
 * The ids are the plan step's states in Figma, so an unedited set keeps
 * claiming the exported Standard and Ultimate frames.
 */
const FIGMA_TABS: PlanTab[] = [
  { id: 'standard', name: 'Standard', style: 'plain' },
  { id: 'ultimate', name: 'Ultimate', style: 'celebratory' },
]

/**
 * The tabs over the plan picker. An empty list is no tabs at all.
 *
 * Absent and empty are different answers: a set that has never been asked draws
 * the two the design draws, and a set whose tabs were deliberately removed
 * draws none. Reading empty as "use the default two" would make removing them
 * impossible.
 */
/**
 * The tabs over a market's plan picker.
 *
 * A market that has written its own has them. Otherwise the Standard and
 * Ultimate tabs Figma draws — which are the MSG+ flow's, and only that
 * flow's: DAZN's own plans in Spain or Germany sit in one row, as they do on
 * dazn.com, and a tab row borrowed from an RSN storefront would divide them
 * by a distinction they do not have.
 */
export function tabsOf(set: CardSet, market = set.context.market): PlanTab[] {
  // A league's own tabs first: NHL.TV's Monthly and Season are its page's,
  // whichever market it is sold in.
  const channel = set.context.subscription ?? ''
  if (channel && channel !== 'rsns') {
    const league = set.planTabsByChannel?.[`${market}|${channel}`]
    if (league !== undefined) return league
  }
  const own = set.planTabsByMarket?.[market]
  if (own !== undefined) {
    // A market's tabs are DAZN's own storefront's — Spain's Standard and
    // Youth −30. A league sold in the same market (Courtside, NFL Game Pass)
    // has its own picker, and its plans sit on none of those tabs; drawing
    // the tabs over it would show the same cards twice. The tabs apply to a
    // channel only when a plan of that channel is placed on one of them.
    const channel = set.context.subscription ?? ''
    if (channel && channel !== 'rsns' && !placesOnTabs(set, market, channel, own)) return []
    return own
  }
  if (set.context.subscription === 'rsns') return set.planTabs ?? FIGMA_TABS
  return []
}

/** Whether any plan of a channel names one of these tabs, in its base or in its patch for the market. */
function placesOnTabs(set: CardSet, market: string, channel: string, tabs: PlanTab[]): boolean {
  const ids = new Set(tabs.map((t) => t.id))
  return set.tiers.some((t) => {
    if (!t.subscriptions?.includes(channel)) return false
    const own = t.tabs ?? []
    const patched = t.overrides.filter((o) => o.when.market === market).flatMap((o) => o.patch.tabs ?? [])
    return [...own, ...patched].some((id) => ids.has(id))
  })
}

/**
 * Writes a market's tabs, taking them for that market the first time.
 *
 * The market's list starts as whatever it was already showing, so taking it is
 * invisible: the tabs on screen do not change, only whose they are. Everything
 * written after that stays in this market — the same deal the flow screens
 * make.
 */
export function writeTabs(set: CardSet, tabs: PlanTab[], market = set.context.market) {
  const key = channelKey(set, market)
  if (key) return { planTabsByChannel: { ...set.planTabsByChannel, [key]: tabs } }
  return { planTabsByMarket: { ...set.planTabsByMarket, [market]: tabs } }
}

/** The key a league's tabs are kept under here, or null when the DAZN page is on screen. */
function channelKey(set: CardSet, market: string): string | null {
  const channel = set.context.subscription ?? ''
  return channel && channel !== 'rsns' ? `${market}|${channel}` : null
}

/** Whether this market has taken its tabs rather than reading the shared ones. */
export function ownsTabs(set: CardSet, market = set.context.market): boolean {
  const key = channelKey(set, market)
  if (key) return set.planTabsByChannel?.[key] !== undefined
  return set.planTabsByMarket?.[market] !== undefined
}

/** Hands a market's tabs back, so it reads the shared ones again. */
export function shareTabs(set: CardSet, market = set.context.market) {
  const key = channelKey(set, market)
  if (key) {
    const rest = { ...set.planTabsByChannel }
    delete rest[key]
    return { planTabsByChannel: rest }
  }
  const rest = { ...set.planTabsByMarket }
  delete rest[market]
  return { planTabsByMarket: rest }
}

/**
 * The tab on screen, when it prices the cards rather than picking among them.
 *
 * The context names the tab; the tab names the cadence. Absent when no tab is
 * on screen, when the tab shows a set of plans instead, or when the market
 * has no tabs at all.
 */
export function cadenceTabOf(set: CardSet, context: Context = set.context): PlanTab | null {
  if (!context.tab) return null
  const tab = tabsOf(set, context.market).find((t) => t.id === context.tab)
  return tab?.cadence ? tab : null
}

/**
 * The way of paying a card on this tab is priced at, or null when the plan is
 * not sold that way here — a plan with no weekly pass is not on the Weekly
 * tab. Instalments match instalments of any term: the CMS's "Monthly" tab on
 * Game Pass is twelve payments in one market and five in another.
 */
export function cadenceOnTab(tab: PlanTab, sold: string[]): string | null {
  const want = tab.cadence ?? ''
  if (!want) return null
  if (sold.includes(want)) return want
  if (/instalments/i.test(want)) return sold.find((c) => /instalments/i.test(c)) ?? null
  return null
}

/**
 * How a tab is drawn.
 *
 * Tabs written before the choice existed fall back to the id, so the Ultimate
 * tab keeps the bolt and the sparkle it has always had.
 */
export function styleOf(tab: PlanTab): 'plain' | 'celebratory' {
  return tab.style ?? (tab.id === 'ultimate' ? 'celebratory' : 'plain')
}

/**
 * The states a step draws.
 *
 * Every step's states are the ones Figma drew, except the plan picker's: its
 * are the tabs, and the tabs are content. A tab added in the tool is a screen
 * that has to appear in the row and in the walkthrough, and this is the one
 * place that knows it.
 */
export function statesOf(step: Step, set: CardSet): (string | null)[] {
  if (step.renderer !== 'plans') return step.states ?? [null]
  // No tabs is still one screen — the plans, with nothing dividing them.
  const tabs = tabsOf(set)
  return tabs.length ? tabs.map((t) => t.id) : [null]
}

/** Whether a tier appears under a tab. Saying nothing means every tab. */
export function tierOnTab(tier: Tier, tabId: string): boolean {
  return !tier.tabs?.length || tier.tabs.includes(tabId)
}

/** The tiers a tab shows, in order. */
export function tiersOnTab(tiers: Tier[], tabId: string | null): Tier[] {
  if (!tabId) return tiers
  return tiers.filter((t) => tierOnTab(t, tabId))
}

/** A new tab, named for where it sits until someone names it properly. */
export function blankTab(existing: PlanTab[]): PlanTab {
  let n = existing.length + 1
  while (existing.some((t) => t.id === `tab-${n}`)) n += 1
  return { id: `tab-${n}`, name: `Tab ${n}`, style: 'plain' }
}

/**
 * Tabs come in twos, then singly.
 *
 * One tab is a control with nothing to choose between — it divides the plans
 * into the plans. So the first add makes a pair and every add after it makes
 * one more.
 */
export function withTabAdded(existing: PlanTab[]): PlanTab[] {
  if (existing.length) return [...existing, blankTab(existing)]
  const first = blankTab([])
  return [first, blankTab([first])]
}

/**
 * Removing the second-to-last takes the last with it, for the same reason:
 * what is left would be one tab, and one tab is no choice.
 */
export function withTabRemoved(existing: PlanTab[], index: number): PlanTab[] {
  if (existing.length <= 2) return []
  return existing.filter((_, i) => i !== index)
}

/** Tiers stop naming a tab that no longer exists. */
export function forgetTab(tiers: Tier[], tabId: string): Tier[] {
  return tiers.map((t) => (t.tabs?.length ? { ...t, tabs: t.tabs.filter((id) => id !== tabId) } : t))
}
