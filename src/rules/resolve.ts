import type { AuthoredCard, CardPatch, CardSet, Context, Override } from './content'

/**
 * Base plus differences.
 *
 * A card is authored once. Markets and campaigns carry sparse patches, applied
 * in order of specificity so you write a default and a dozen deltas rather than
 * one record per permutation.
 */

/** An override matches when every constraint it states is satisfied. */
export function matches(override: Override, context: Context): boolean {
  const { market, campaign } = override.when
  if (market !== undefined && market !== context.market) return false
  if (campaign !== undefined && campaign !== context.campaign) return false
  return true
}

/** Number of constraints — the base ({}) scores 0 and always applies first. */
export function specificity(override: Override): number {
  return Object.values(override.when).filter((v) => v !== undefined).length
}

function applyPatch(card: AuthoredCard, patch: CardPatch): AuthoredCard {
  // A sparse patch states what it changes. A key present but undefined is not a
  // change — spreading it would erase the base value, which is how a migration
  // that set `features: undefined` blanked every card's feature list.
  const stated = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<AuthoredCard>

  return {
    ...card,
    ...stated,
    // Nested objects merge rather than replace, so an override can change the
    // add-on's price without restating its title.
    addOn: patch.addOn ? { ...card.addOn, ...patch.addOn } : card.addOn,
  }
}

/**
 * Resolves a card for a context.
 *
 * Ordering is (specificity, priority, declaration order). The last two make it
 * deterministic — two equally specific overrides must never depend on which
 * happened to be evaluated first.
 */
export function resolveCard(card: AuthoredCard, context: Context): AuthoredCard {
  const applicable = card.overrides
    .map((o, index) => ({ o, index }))
    .filter(({ o }) => matches(o, context))
    .sort((a, b) => {
      const bySpecificity = specificity(a.o) - specificity(b.o)
      if (bySpecificity !== 0) return bySpecificity
      const byPriority = (a.o.priority ?? 0) - (b.o.priority ?? 0)
      if (byPriority !== 0) return byPriority
      return a.index - b.index
    })

  return applicable.reduce((acc, { o }) => applyPatch(acc, o.patch), card)
}

export function resolveSet(set: CardSet, context: Context = set.context): AuthoredCard[] {
  return set.cards.map((card) => resolveCard(card, context))
}

export function marketFor(set: CardSet, code: string) {
  return set.markets.find((m) => m.code === code) ?? set.markets[0]
}

/** Every context worth validating — all markets, with and without each campaign. */
export function allContexts(set: CardSet): Context[] {
  const out: Context[] = []
  for (const market of set.markets) {
    out.push({ market: market.code })
    for (const campaign of set.campaigns) {
      out.push({ market: market.code, campaign: campaign.code })
    }
  }
  return out
}

/** Which fields an override changes, for showing what a market actually differs on. */
export function patchedKeys(patch: CardPatch): string[] {
  return Object.keys(patch).filter((k) => patch[k as keyof CardPatch] !== undefined)
}

/** The override that a given context writes to, if one exists. */
export function findOverride(card: AuthoredCard, context: Context): Override | undefined {
  return card.overrides.find(
    (o) => o.when.market === context.market && o.when.campaign === context.campaign,
  )
}
