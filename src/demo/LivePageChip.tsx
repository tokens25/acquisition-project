import { useLive } from '../editor/liveLandingContext'
import { typesFromLive } from '../rules/sections'

/**
 * Where the page on screen stands against the one this market has up.
 *
 * The panel opens a market on what it draws, which is a claim about something
 * that can change while nobody is looking — so the claim has to carry a time.
 * Without one the list is a fact with no date on it, and the honest reading of
 * an undated fact is that it might be yesterday's.
 *
 * Five states, because the route has five answers and each is worth a
 * different sentence. A market that draws no page for this product is not an
 * error; it is the answer for MSG+, which has an RSN page and no welcome one.
 *
 * Refresh asks the route to skip its cache. The answer is held an hour, so
 * this is for "they shipped a component this morning", not for every glance —
 * and it refreshes the fold under it too, because there is one reading of the
 * page and this is the button that takes it again.
 *
 * Named for the page rather than for being live, so it does not collide with
 * the plan-price chip on the other branch. The two answer different questions
 * of different services and will eventually sit side by side.
 */
export function LivePageChip({ market }: { market: string | undefined }) {
  const { state, page, elsewhere, reload } = useLive()
  if (state === 'off' || !market) return null

  const code = market.toUpperCase()
  const cards = page ? typesFromLive(page.components.map((c) => c.type)).length : 0

  return (
    <span className="lpc" data-state={state} title={title(state, page?.cached)}>
      <span className="lpc__dot" aria-hidden="true" />
      {state === 'loading' && `Reading ${code}…`}
      {state === 'ready' && page && (
        <>
          {code} live · {cards} component{cards === 1 ? '' : 's'} · {at(page.seconds)}
        </>
      )}
      {/* An answer, so it reads as one. What the product does draw is in the
          fold; the chip says only that this is not it. */}
      {state === 'none' &&
        (elsewhere.length ? `${code} · no welcome page for this product` : `${code} · no live page`)}
      {state === 'error' && `${code} · could not be read`}
      {state !== 'loading' && (
        <button type="button" className="lpc__refresh" onClick={reload}>
          {state === 'error' ? 'Try again' : 'Refresh'}
        </button>
      )}
    </span>
  )
}

/**
 * When the route answered, from how old it says its answer is.
 *
 * The route reports an age rather than a timestamp, because the answer it
 * hands back may have been made for somebody else — so the time shown is the
 * time the reading was taken, which is what a reader means by "as of".
 */
function at(seconds: number): string {
  const when = new Date(Date.now() - Math.max(0, seconds) * 1000)
  return when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function title(state: string, cached?: boolean): string | undefined {
  if (state === 'error') return 'The route that reads DAZN’s page could not be reached.'
  if (state === 'none') return 'This product draws no page under this slug in this market.'
  if (state === 'ready') return cached ? 'Held by the route; Refresh asks DAZN again.' : 'Read from DAZN just now.'
  return undefined
}
