import { useEffect, useState } from 'react'
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
/**
 * Which questions have been answered, for as long as the tab is open.
 *
 * Outside the component on purpose. Leaving the front door pushes a route
 * rather than loading a page, so coming back with the browser's own Back
 * finds this still here and the answers still showing. Reloading the front
 * door throws the module away with everything else, which is the one thing
 * that should start the questions again.
 */
const answeredThisVisit: Record<string, boolean> = {}

export function DefaultPanel({
  store,
  prompt = false,
  onAsking,
}: {
  store: CardSetStore
  /**
   * Open unanswered, and ask.
   *
   * The front door asks these questions of someone who has not answered them
   * yet, so showing an answer nobody gave would be putting words in their
   * mouth. The set underneath always has one — a journey has to resolve to
   * something for the tool to open on — so this changes what is shown, not
   * what is held.
   */
  prompt?: boolean
  /** How many questions are still unanswered, for whoever is waiting on them. */
  onAsking?: (pending: number) => void
}) {
  const { set, context, setContext, updateSet, journey } = store

  const [answered, setAnswered] = useState<Record<string, boolean>>(() => ({
    ...answeredThisVisit,
  }))
  const asked = (key: string) => prompt && !answered[key]
  /** The standing answer, or nothing while the question is still being asked. */
  const shown = (key: string, actual: string) => (asked(key) ? '' : actual)
  /** The prompt itself, only for as long as it is unanswered. */
  const asking = (key: string) => (asked(key) ? [{ value: '', label: 'Choose…' }] : [])
  const answer = (key: string) => {
    answeredThisVisit[key] = true
    setAnswered((prev) => ({ ...prev, [key]: true }))
  }

  const statuses = userStatuses(journeys, context)
  const status = statuses.includes(journey.audience) ? journey.audience : (statuses[0] ?? '')
  const entries = entryPoints(journeys, context, status)
  const entryCta = entries.includes(journey.entry.cta) ? journey.entry.cta : (entries[0] ?? '')
  const matches = journeysMatching(journeys, context, status, entryCta)

  /*
   * The questions actually on screen, and how many are still open.
   *
   * Counted here rather than by whoever is waiting on the answer: the fourth
   * question only exists when the first three describe more than one journey,
   * so nobody outside this component can say how many there are.
   */
  const open = (key: string) => (prompt && !answered[key] ? 1 : 0)
  const pending =
    open('market') +
    open('status') +
    open('entry') +
    (matches.length > 1 ? open('journey') : 0)
  useEffect(() => {
    onAsking?.(pending)
  }, [onAsking, pending])


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
          // Unanswered, it cannot say what is being edited without naming a
          // market nobody has picked — which is the one thing the field above
          // it is refusing to do.
          asked('market')
            ? 'Which country this is for, or the base they all start from.'
            : context.market === '*'
              ? 'Editing the base — changes reach every market.'
              : `Editing ${context.market}'s difference from the base.`
        }
        value={shown('market', context.market)}
        options={[
          ...asking('market'),
          { value: '*', label: 'Base — all markets' },
          // The currency is not part of a market's name. It is what the
          // pricing group's own heading says, where it is being used.
          ...set.markets.map((m) => ({ value: m.code, label: m.label })),
        ]}
        onChange={(v) => {
          if (!v) return
          answer('market')
          setContext({ ...context, market: v })
        }}
      />

      <SelectField
        label="User status"
        helpText="Who is buying. It narrows the entry points below."
        value={shown('status', status)}
        options={[
          ...asking('status'),
          ...statuses.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s })),
        ]}
        onChange={(v) => {
          if (!v) return
          answer('status')
          pick(v)
        }}
      />

      <SelectField
        label="Entry point"
        helpText="Where they arrived from. Narrowed by user status — a migrating subscriber never arrives from Upgrade."
        value={shown('entry', entryCta)}
        options={[...asking('entry'), ...entries.map((e) => ({ value: e, label: e }))]}
        onChange={(v) => {
          if (!v) return
          answer('entry')
          pick(status, v)
        }}
      />

      {/* Only when the situation genuinely describes more than one journey.
          Hidden for the sixteen pairs that identify one, so the common case
          stays three questions rather than four. */}
      {matches.length > 1 && (
        <SelectField
          label="Which journey"
          helpText={`This situation covers ${matches.length} journeys. They differ after the entry.`}
          value={shown('journey', journey.id)}
          options={[...asking('journey'), ...matches.map((j) => ({ value: j.id, label: j.name }))]}
          onChange={(v) => {
            if (!v) return
            answer('journey')
            updateSet({ journeyId: v })
          }}
        />
      )}
    </>
  )
}
