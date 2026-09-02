import { useEffect, useState } from 'react'
import type { Context } from '../rules/content'
import type { CardSetStore } from '../editor/useCardSet'
import { entryPoints, journeysMatching, STATUS_LABELS, userStatuses } from '../rules/entry'
import { MARKETS, SUBSCRIPTIONS, journeys } from '../rules/journeys'
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
  const { context, setContext, updateSet, journey } = store

  const [answered, setAnswered] = useState<Record<string, boolean>>(() => ({
    ...answeredThisVisit,
  }))
  const asked = (key: string) => prompt && !answered[key]
  /** The standing answer, or nothing while the question is still being asked. */
  const shown = (key: string, actual: string) => (asked(key) ? '' : actual)
  /** The prompt itself, only for as long as it is unanswered. */
  const asking = (key: string) => (asked(key) ? [{ value: '', label: 'Choose…' }] : [])
  /** Offered, and inert: adding a market is a job nothing here can do yet. */
  const ADD_MARKET = '__add__'

  const answer = (key: string) => {
    answeredThisVisit[key] = true
    setAnswered((prev) => ({ ...prev, [key]: true }))
  }

  const statuses = userStatuses(journeys, context)
  const status = statuses.includes(journey.audience) ? journey.audience : (statuses[0] ?? '')
  const entries = entryPoints(journeys, context, status)
  const entryCta = entries.includes(journey.entry.cta) ? journey.entry.cta : (entries[0] ?? '')

  /*
   * The questions on screen, and how many are still open.
   *
   * Counted here rather than by whoever is waiting on the answer: the questions
   * belong to this component, and nothing outside it should have to know how
   * many there are.
   */
  const open = (key: string) => (prompt && !answered[key] ? 1 : 0)
  const pending = open('market') + open('subscription') + open('status') + open('entry')
  useEffect(() => {
    onAsking?.(pending)
  }, [onAsking, pending])


  /*
   * Re-reads the journey from the whole situation, every time any of it moves.
   *
   * All four answers name it now — the market and the product as much as the
   * state and the entry — so changing any one of them leaves the standing
   * journey pointing at a situation nobody is in. It is looked up again from
   * the situation as it will be, not as it was, which is why the context is
   * passed in rather than read from above.
   */
  const settle = (next: Context, nextStatus: string, nextEntry?: string) => {
    setContext(next)
    const options = entryPoints(journeys, next, nextStatus)
    const cta = nextEntry && options.includes(nextEntry) ? nextEntry : options[0]
    const found = journeysMatching(journeys, next, nextStatus, cta ?? '')[0]
    if (found) updateSet({ journeyId: found.id })
  }

  /** The same, when only the answer below the context has changed. */
  const pick = (nextStatus: string, nextEntry?: string) => settle(context, nextStatus, nextEntry)

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
          // The base is a place to write, not a place a journey runs, so it is
          // offered where the writing happens and not at the front door.
          ...(prompt ? [] : [{ value: '*', label: 'Base — all markets' }]),
          // The markets the journeys are keyed to, rather than the ones this
          // copy of the content happens to carry. A market with no journey
          // behind it is a dead end, and published content can be older than
          // the list. The currency is not part of a market's name either — the
          // pricing group's own heading says it, where it is being used.
          ...MARKETS.map((m) => ({ value: m.code, label: m.label })),
          ...(prompt ? [{ value: ADD_MARKET, label: 'Add new' }] : []),
        ]}
        onChange={(v) => {
          if (!v || v === ADD_MARKET) return
          answer('market')
          settle({ ...context, market: v }, status, entryCta)
        }}
      />

      <SelectField
        label="Subscription"
        helpText="What is being sold. It picks the journey; nothing else reads it yet."
        value={shown('subscription', context.subscription ?? '')}
        options={[
          ...asking('subscription'),
          ...SUBSCRIPTIONS.map((sub) => ({ value: sub.code, label: sub.label })),
        ]}
        onChange={(v) => {
          if (!v) return
          answer('subscription')
          settle({ ...context, subscription: v }, status, entryCta)
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

      {/* No fourth question. Market, product, state and entry name exactly one
          journey between them, so there is never a choice left to make. */}
    </>
  )
}
