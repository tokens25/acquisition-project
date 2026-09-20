import { useEffect, useState } from 'react'
import type { CardSet, Context } from '../rules/content'
import type { CardSetStore } from '../editor/useCardSet'
import { entryPoints, journeysMatching, STATUS_LABELS, userStatuses } from '../rules/entry'
import { DEFAULT_PAGE_VIEW, PAGE_VIEWS } from '../rules/pageViews'
import { MARKETS, SUBSCRIPTIONS, journeys, marketFlag, sellsHere } from '../rules/journeys'
import { SelectField } from '../components/SelectField'
import { defaultSectionsFor, isUntouched, rememberLive, sectionsFingerprint } from '../rules/sections'
import { baseFlow, writeFlow } from '../rules/layers'
import { useLive } from '../editor/liveLandingContext'

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
  entry: askEntry = true,
  views = false,
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
  /**
   * Whether "who is looking" is a page rather than an audience.
   *
   * The journey product asks which user a journey is for, and the answer picks
   * one of the modelled journeys. A one-page product has no journeys to pick
   * between — what the same question means there is which of the four landing
   * surfaces is on screen, so the field keeps its name and changes its list.
   */
  views?: boolean
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
  const pending =
    open('market') + open('subscription') + open('status') + (askEntry ? open('entry') : 0)
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
    /*
     * A market that does not sell what is selected moves the selection.
     *
     * Greying an option stops somebody choosing it and does nothing about a
     * choice already made: pick NHL in Germany, switch to Spain, and the
     * selection is a product Spain has no offers for. Falling back to DAZN is
     * the one answer every market has.
     *
     * Only where something was chosen. An unanswered question at the front
     * door stays unanswered rather than being answered for somebody.
     */
    const sold = !next.subscription || sellsHere(next.market, next.subscription)
    const here: Context = sold ? next : { ...next, subscription: 'dazn' }

    setContext(here)
    const options = entryPoints(journeys, here, nextStatus)
    const cta = nextEntry && options.includes(nextEntry) ? nextEntry : options[0]
    const found = journeysMatching(journeys, here, nextStatus, cta ?? '')[0]

    /*
     * The page a market and a product are given.
     *
     * Read off the live pages, so picking Germany and NFL opens on what
     * Germany's NFL page is made of rather than on the run the design shipped.
     * A starting point and not a mirror: the moment somebody adds, removes or
     * reorders a block the page is theirs, and changing market from then on
     * leaves it alone.
     *
     * Written at the base rather than at the market's own layer, because this
     * is what the page is rather than one market's difference from it.
     *
     * One patch rather than two updates: each reads the set as it stands, and
     * two in a row would have the second undo the first. The two halves touch
     * different fields, so merging them is merging and not a choice.
     */
    const patch: Partial<CardSet> = found ? { journeyId: found.id } : {}
    /*
     * Asked of the page under the markets, not of the market on screen.
     *
     * Every edit on this screen is written to the market's own copy, because
     * that is the only scope the landing panel writes at — so a market that
     * has arranged its page holds that arrangement itself, and the page below
     * is still the run of blocks the last market was given. Asking the
     * resolved content would find Canada's work and conclude the page had
     * been arranged, leaving Germany reading Canada's list instead of its own.
     */
    if (isUntouched(baseFlow(set).landing, context.market, context.subscription, set.sectionsDefault)) {
      const sections = defaultSectionsFor(here.market, here.subscription)
      Object.assign(patch, writeFlow(set, {}, 'landing', { sections }), {
        sectionsDefault: sectionsFingerprint(sections),
      })
    }
    if (Object.keys(patch).length > 0) updateSet(patch)
  }

  /*
   * What this market draws, read once here and remembered for everybody.
   *
   * The table of defaults was a reading of the live pages on the day it was
   * written, and Germany had already moved: it draws StandardRailV2, which is
   * StandardRail, and the row was never added. A table that has to be kept in
   * step is a table that will be out of step, so the live page answers where
   * it can and the table only where it cannot — offline, or a combination
   * production draws no page for.
   *
   * The answer arrives after the market is picked, so picking is not where
   * this can happen. It happens when the answer lands, and only onto an
   * arrangement nobody has made their own.
   */
  const live = useLive()
  const page = live.state === 'ready' ? live.page : null
  useEffect(() => {
    if (!page) return
    // Asked before the answer moves. Afterwards the page matches the list it
    // is about to be given rather than the one it was given, and every
    // arrangement would read as somebody's own work.
    const spare = isUntouched(
      baseFlow(set).landing,
      context.market,
      context.subscription,
      set.sectionsDefault,
    )
    const news = rememberLive(
      context.market,
      context.subscription,
      page.components.map((c) => c.type),
    )
    if (!news || !spare) return
    const sections = defaultSectionsFor(context.market, context.subscription)
    updateSet({
      ...writeFlow(set, {}, 'landing', { sections }),
      sectionsDefault: sectionsFingerprint(sections),
    })
  }, [page, context.market, context.subscription, set, updateSet])

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
          ...MARKETS.map((m) => ({ value: m.code, label: `${marketFlag(m.code)} ${m.label}`.trim() })),
          ...(prompt ? [{ value: ADD_MARKET, label: 'Add new' }] : []),
        ]}
        onChange={(v) => {
          if (!v || v === ADD_MARKET) return
          answer('market')
          settle({ ...context, market: v }, status, entryCta)
        }}
      />

      <SelectField
        label="Product group"
        helpText="What is being sold. It picks the journey; nothing else reads it yet."
        value={shown('subscription', context.subscription ?? '')}
        options={[
          ...asking('subscription'),
          /* A product the market does not sell is offered and not choosable.
             Greyed rather than dropped: a list that quietly loses an option is
             a list somebody searches for the missing one in. */
          ...SUBSCRIPTIONS.map((sub) => ({
            value: sub.code,
            label: sub.label,
            disabled: !sellsHere(context.market, sub.code),
          })),
        ]}
        onChange={(v) => {
          if (!v) return
          answer('subscription')
          settle({ ...context, subscription: v }, status, entryCta)
        }}
      />

      {/* The same question either way — who is looking at this — and two
          different things to answer it with. A journey has an audience, and
          choosing one picks the journey. A single page has none: what varies
          is which of its four surfaces this is, and that is held on the
          situation rather than looked up. */}
      {views ? (
        <SelectField
          label="User status"
          helpText="Which of the landing surfaces this is. Logged out and Logged in can each be written over the page everybody gets."
          value={context.pageView ?? DEFAULT_PAGE_VIEW}
          options={PAGE_VIEWS.map((v) => ({ value: v.code, label: v.label }))}
          onChange={(v) => {
            if (!v) return
            setContext({ ...context, pageView: v })
          }}
        />
      ) : (
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
      )}

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
