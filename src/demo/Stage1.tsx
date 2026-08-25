import type { CardSetStore } from '../editor/useCardSet'
import { DIRECT } from '../rules/content'
import { entryPoints, journeysMatching, STATUS_LABELS, userStatuses } from '../rules/entry'
import { journeys } from '../rules/journeys'
import { SelectField } from '../editor/Field'

/**
 * Stage one: the situation being authored for.
 *
 * Four questions, in the order they narrow each other — where it is sold, on
 * whose storefront, to whom, and from where they arrived. The last two pick a
 * journey without anyone having to know journeys have names.
 */
export function Stage1({ store }: { store: CardSetStore }) {
  const { set, context, setContext, updateSet, journey } = store

  const channelsHere = set.channels.filter(
    (c) => !c.markets || c.markets.includes(context.market),
  )
  const statuses = userStatuses(journeys, context)
  const status = statuses.includes(journey.audience) ? journey.audience : (statuses[0] ?? '')
  const entries = entryPoints(journeys, context, status)
  const entryCta = entries.includes(journey.entry.cta) ? journey.entry.cta : (entries[0] ?? '')
  const matches = journeysMatching(journeys, context, status, entryCta)

  const pick = (nextStatus: string, nextEntry?: string) => {
    const options = entryPoints(journeys, context, nextStatus)
    const cta = nextEntry && options.includes(nextEntry) ? nextEntry : options[0]
    const found = journeysMatching(journeys, context, nextStatus, cta ?? '')[0]
    if (found) updateSet({ journeyId: found.id })
  }

  return (
    <>
      <SelectField
        label="Market"
        hint={
          context.market === '*'
            ? 'Editing the base — changes reach every market.'
            : `Editing ${context.market}'s difference from the base.`
        }
        value={context.market}
        options={[
          { value: '*', label: 'Base — all markets' },
          ...set.markets.map((m) => ({ value: m.code, label: `${m.label} (${m.currency})` })),
        ]}
        onChange={(v) => setContext({ ...context, market: v })}
      />

      <SelectField
        label="Storefront"
        hint={
          context.channel === DIRECT
            ? 'Direct sells live plans only.'
            : 'Partners also carry direct plans flagged visible to them, legacy or not.'
        }
        value={context.channel}
        options={channelsHere.map((c) => ({ value: c.code, label: c.label }))}
        onChange={(v) => setContext({ ...context, channel: v })}
      />

      <SelectField
        label="User status"
        value={status}
        options={statuses.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
        onChange={(v) => pick(v)}
      />

      <SelectField
        label="Entry point"
        hint="Where they arrived from. Narrowed by user status — a migrating subscriber never arrives from Upgrade."
        value={entryCta}
        options={entries.map((e) => ({ value: e, label: e }))}
        onChange={(v) => pick(status, v)}
      />

      {/* Only when the situation genuinely describes more than one journey.
          Hidden for the sixteen pairs that identify one, so the common case
          stays three questions rather than four. */}
      {matches.length > 1 && (
        <SelectField
          label="Which one"
          hint={`This situation covers ${matches.length} journeys. They differ after the entry.`}
          value={journey.id}
          options={matches.map((j) => ({ value: j.id, label: j.name }))}
          onChange={(v) => updateSet({ journeyId: v })}
        />
      )}
    </>
  )
}
