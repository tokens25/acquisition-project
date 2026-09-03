import type { CardSet, PlanTab, Tier } from './content'
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
export function tabsOf(set: CardSet): PlanTab[] {
  return set.planTabs ?? FIGMA_TABS
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
