import type { LiveStatus } from '../editor/live'

/**
 * Where the plans on screen stand against DAZN's catalogue.
 *
 * One chip, four states: nothing fetched, fetching, live as of a time, or
 * unreachable with the reason. Refresh asks again — the answer is cached an
 * hour on the server, so this is for "prices changed this morning", not for
 * every glance.
 */
export function LiveChip({
  live,
  onRefresh,
  sharedAt,
}: {
  live: LiveStatus
  onRefresh: () => void
  /**
   * When the shared file last had this market's plans from DAZN, if it does.
   * With the catalogue unreachable, plans that old are what is on screen —
   * which is a fact to state, not a failure to flag: the shared copy is the
   * tool's own fallback, imported from the same catalogue.
   */
  sharedAt?: string
}) {
  const time = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const day = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }
  const market = 'market' in live ? live.market.toUpperCase() : ''
  const fallback = live.state === 'unreachable' && sharedAt
  return (
    <span
      className="demo__live"
      data-state={fallback ? 'shared' : live.state}
      title={live.state === 'unreachable' ? `DAZN's catalogue could not be reached: ${live.reason}` : undefined}
    >
      <span className="demo__live-dot" aria-hidden="true" />
      {live.state === 'off' && 'Plans from the shared file'}
      {live.state === 'loading' && `Asking DAZN for ${market}…`}
      {live.state === 'live' && `DAZN live · ${market} · ${time(live.fetchedAt)}`}
      {live.state === 'unreachable' && (fallback ? `DAZN prices · ${market} · from ${day(sharedAt)}` : `Not live · ${market}`)}
      {live.state !== 'loading' && (
        <button type="button" className="demo__live-refresh" onClick={onRefresh}>
          {live.state === 'unreachable' ? 'Try again' : 'Refresh'}
        </button>
      )}
    </span>
  )
}
