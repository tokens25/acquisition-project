import type { CardSet, PlanTab, Tier } from './content'
import type { Step } from './journey'

/**
 * The tabs the design draws, for content written before they were authored.
 *
 * The ids are the plan step's states in Figma, so an unedited set keeps
 * claiming the exported Standard and Ultimate frames.
 */
const FIGMA_TABS: PlanTab[] = [
  { id: 'standard', name: 'Standard' },
  { id: 'ultimate', name: 'Ultimate' },
]

/** The tabs over the plan picker. */
export function tabsOf(set: CardSet): PlanTab[] {
  return set.planTabs?.length ? set.planTabs : FIGMA_TABS
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
  if (step.renderer === 'plans') return tabsOf(set).map((t) => t.id)
  return step.states ?? [null]
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
  return { id: `tab-${n}`, name: `Tab ${n}` }
}
