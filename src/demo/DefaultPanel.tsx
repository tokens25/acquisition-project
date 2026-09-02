import type { CardSetStore } from '../editor/useCardSet'
import { entryPoints, journeysMatching, STATUS_LABELS, userStatuses } from '../rules/entry'
import { journeys } from '../rules/journeys'
import { SelectField } from '../components/SelectField'

/**
 * The default view's fields: the situation being authored for.
 *
 * Three questions, in the order they narrow each other — where it is sold, to
 * whom, and from where they arrived. The last two pick a journey without
 * anyone having to know journeys have names.
 *
 * The storefront is not asked. Every journey here is sold direct, and a
 * question with one answer is a question nobody should have to read; the
 * context still carries the channel, so a partner storefront needs the field
 * back rather than a new concept.
 */
export function DefaultPanel({ store }: { store: CardSetStore }) {
  const { set, context, setContext, updateSet, journey } = store

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
        helpText={
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
        label="User status"
        helpText="Who is buying. It narrows the entry points below."
        value={status}
        options={statuses.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
        onChange={(v) => pick(v)}
      />

      <SelectField
        label="Entry point"
        helpText="Where they arrived from. Narrowed by user status — a migrating subscriber never arrives from Upgrade."
        value={entryCta}
        options={entries.map((e) => ({ value: e, label: e }))}
        onChange={(v) => pick(status, v)}
      />

      {/* Only when the situation genuinely describes more than one journey.
          Hidden for the sixteen pairs that identify one, so the common case
          stays three questions rather than four. */}
      {matches.length > 1 && (
        <SelectField
          label="Which journey"
          helpText={`This situation covers ${matches.length} journeys. They differ after the entry.`}
          value={journey.id}
          options={matches.map((j) => ({ value: j.id, label: j.name }))}
          onChange={(v) => updateSet({ journeyId: v })}
        />
      )}
    </>
  )
}
