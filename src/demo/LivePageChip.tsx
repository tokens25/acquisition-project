import { useLive } from '../editor/liveLandingContext'

/**
 * When the live page was last read, beside the count it belongs to.
 *
 * The panel opens a market on what that market draws, which is a claim about
 * something that can change while nobody is looking — so the claim has to
 * carry a time. Without one the list is a fact with no date on it, and the
 * honest reading of an undated fact is that it might be yesterday's.
 *
 * It sits in the Components header rather than in a bar of its own because the
 * count is already there saying how many, and how many and how fresh are one
 * thought. That also settles what this may say: the market and the number are
 * on either side of it already, so repeating them here would be three ways of
 * saying the same thing in one line. It says the time, and the states where
 * there is no time to say.
 *
 * The dot takes the plan chip's colours from the other branch — green read,
 * amber asking, red unreachable — because the two will sit near each other and
 * a reader should not have to learn which green means what twice.
 *
 * Refresh asks the route to skip its cache, which it holds an hour — so this
 * is for "they shipped a component this morning", not for every glance. It
 * refreshes the fold under it too, because there is one reading of the page
 * and this is the button that takes it again.
 *
 * Named for the page rather than for being live, so it does not collide with
 * the plan-price chip on the other branch. The two answer different questions
 * of different services and will eventually sit near each other.
 */
export function LivePageChip() {
  const { state, page, elsewhere, reload } = useLive()
  if (state === 'off') return null

  return (
    <span className="lpc" data-state={state} title={title(state, page?.cached)}>
      {/* The state as a colour as well as a sentence. Not decoration: while it
          is asking, the sentence is the only thing that changes and a line of
          small grey text changing is easy to miss — a dot that starts blinking
          is not. */}
      <span className="lpc__dot" aria-hidden="true" />
      {state === 'loading' && 'Asking DAZN…'}
      {state === 'ready' && page && at(page.seconds)}
      {/* An answer, so it reads as one. What the product does draw is in the
          fold under this; the header says only that this is not it. */}
      {state === 'none' && (elsewhere.length ? 'no page for this product' : 'no live page')}
      {state === 'error' && 'could not be read'}
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
