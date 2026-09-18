import { useEffect, useState } from 'react'
import type { Context } from '../rules/content'
import type { CardSetStore } from '../editor/useCardSet'
import {
  ENTRY_POINTS,
  entryPoints,
  journeysMatching,
  STATUS_LABELS,
  USER_STATUSES,
  userStatuses,
} from '../rules/entry'
import { MARKETS, MARKET_GROUP_LABELS, channelsFor } from '../rules/catalogue'
import { resolveChannelJourney, resolveMarketJourney } from '../rules/journeyConfig'
import { allJourneys, channelsSold } from '../rules/liveJourneys'
import { journeyApplies } from '../rules/journey'
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
const answeredThisVisit = new Set<string>()

/** The select's word for "no channel": DAZN itself, the market's general flow. */
const DAZN_SELF = '__dazn__'

export function DefaultPanel({
  store,
  prompt = false,
  entry: askEntry = true,
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
  /**
   * Whether where they arrived from is still a question.
   *
   * A landing page is the arrival, so nothing arrives at it and the field has
   * nothing to ask. The journey underneath still has an entry — it has to, to
   * resolve — and it settles on the first one the rest of the situation
   * allows, exactly as it does while the question is unanswered.
   */
  entry?: boolean
  /** How many questions are still unanswered, for whoever is waiting on them. */
  onAsking?: (pending: number) => void
}) {
  const { context, setContext, updateSet, journey } = store

  const [answered, setAnswered] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries([...answeredThisVisit].map((k) => [k, true])),
  }))
  const asked = (key: string) => prompt && !answered[key]
  /** The standing answer, or nothing while the question is still being asked. */
  const shown = (key: string, actual: string) => (asked(key) ? '' : actual)
  /** The prompt itself, only for as long as it is unanswered. */
  const asking = (key: string) => (asked(key) ? [{ value: '', label: 'Choose…' }] : [])
  /** Offered, and inert: adding a market is a job nothing here can do yet. */
  const ADD_MARKET = '__add__'

  /**
   * The channel to carry into a market, given the one on screen.
   *
   * Cleared rather than swapped for a neighbour when the new market does not
   * carry it: picking a different product on someone's behalf is a decision,
   * and this is not the place to make it. The RSNs leaving the US is the case
   * this exists for.
   */
  const carried = (market: string, current?: string) =>
    current && channelsSold(store.set, market).includes(current) ? current : ''

  const answer = (key: string) => {
    answeredThisVisit.add(key)
    setAnswered((prev) => ({ ...prev, [key]: true }))
  }

  /**
   * What this situation resolves to, so the panel can say so rather than
   * showing an empty flow with no explanation. Availability and readiness are
   * different states and this keeps them apart.
   */
  /*
   * A market with live plans has a direct journey without anyone writing
   * one, so the two lookups below — which only know `journeyConfig` — are
   * asked only when the catalogue has given this situation nothing.
   */
  const journeys = allJourneys(store.set)
  /* What can be chosen under the market: the products with plans here, in
     the catalogue's order, DAZN's own first. One choice is no choice, and the
     question is not asked — the market's own plans are what is meant. */
  const soldHere = channelsSold(store.set, context.market)
  const channelChoices = [
    ...(soldHere.includes('') ? [''] : []),
    ...channelsFor(context.market).map((c) => c.id).filter((id) => soldHere.includes(id)),
  ]
  const live = journeys.some((j) => j.id.startsWith('direct-') && journeyApplies(j, context))
  const resolution = live
    ? ({ state: 'ok', scope: context.subscription ? 'channel' : 'market', shared: false } as const)
    : context.subscription
      ? resolveChannelJourney(context.market, context.subscription)
      : resolveMarketJourney(context.market)

  // The statuses this situation has journeys for, or the standing questions
  // when it has none. A situation nobody has written for still has a user at
  // the door, and the field below says which situation is unconfigured.
  const written = userStatuses(journeys, context)
  const statuses = written.length ? written : USER_STATUSES
  const status = statuses.includes(journey.audience) ? journey.audience : (statuses[0] ?? '')
  const writtenEntries = entryPoints(journeys, context, status)
  const entries = writtenEntries.length ? writtenEntries : ENTRY_POINTS
  const entryCta = entries.includes(journey.entry.cta) ? journey.entry.cta : (entries[0] ?? '')

  /*
   * The questions on screen, and how many are still open.
   *
   * Counted here rather than by whoever is waiting on the answer: the questions
   * belong to this component, and nothing outside it should have to know how
   * many there are.
   */
  const open = (key: string) => (prompt && !answered[key] ? 1 : 0)
  const pending =
    open('market') + (channelChoices.length > 1 ? open('subscription') : 0) + open('status') + (askEntry ? open('entry') : 0)
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
    const here = allJourneys(store.set)
    // No fallback to some other journey in this market and channel. Picking a
    // user status nobody has written for is how a second variant gets set up:
    // the answer has to be "nothing runs here yet", or the setup prompt for
    // that status can never be reached.
    const found = journeysMatching(here, next, nextStatus, cta ?? '')[0]
    // Naming nothing is the point. Leaving the previous situation's journey id
    // in place is how a market with no flow of its own came to render another
    // market's — and the progress through it belongs to that journey too.
    updateSet({ journeyId: found?.id ?? '', stepId: found?.steps[0]?.id ?? '' })
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
          // Core and Growth are how the business reads the list, so the list
          // reads that way too. They are headings and nothing more — a market's
          // group has never decided anything about its journey.
          ...MARKETS.map((m) => ({
            value: m.id,
            label: `${m.flag}  ${m.label}`,
            group: MARKET_GROUP_LABELS[m.group],
          })),
          ...(prompt ? [{ value: ADD_MARKET, label: 'Add new' }] : []),
        ]}
        onChange={(v) => {
          if (!v || v === ADD_MARKET) return
          answer('market')
          settle(
            { ...context, market: v, subscription: carried(v, context.subscription) },
            status,
            entryCta,
          )
        }}
      />

      {channelChoices.length > 1 && (
        <SelectField
          label="Channel"
          helpText={
            resolution.state === 'ok'
              ? 'Which product, inside the market above. The two together name the journey.'
              : resolution.message
          }
          value={shown('subscription', context.subscription || DAZN_SELF)}
          options={[
            ...asking('subscription'),
            // Only what is on sale here. DAZN's own subscription is the
            // market's general flow — the one with no channel on it — and
            // needs a word in the list, because an empty value is what the
            // select shows while the question is open.
            ...channelChoices.map((c) => ({ value: c || DAZN_SELF, label: c ? (channelsFor(context.market).find((x) => x.id === c)?.label ?? c) : 'DAZN' })),
          ]}
          onChange={(v) => {
            if (!v) return
            answer('subscription')
            settle({ ...context, subscription: v === DAZN_SELF ? '' : v }, status, entryCta)
          }}
        />
      )}

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

      {askEntry && (
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
      )}

      {/* No fourth question. Market, product, state and entry name exactly one
          journey between them, so there is never a choice left to make. */}
    </>
  )
}
