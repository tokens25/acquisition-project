import type { LiveStatus } from '../editor/live'

/**
 * Where the plans on screen stand against DAZN's catalogue.
 *
 * One chip, four states: nothing fetched, fetching, live as of a time, or
 * unreachable with the reason. Refresh asks again — the answer is cached an
 * hour on the server, so this is for "prices changed this morning", not for
 * every glance.
 */
export function LiveChip({ live, onRefresh }: { live: LiveStatus; onRefresh: () => void }) {
  const time = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const market = 'market' in live ? live.market.toUpperCase() : ''
  return (
    <span className="demo__live" data-state={live.state} title={live.state === 'unreachable' ? live.reason : undefined}>
      <span className="demo__live-dot" aria-hidden="true" />
      {live.state === 'off' && 'Plans from the shared file'}
      {live.state === 'loading' && `Asking DAZN for ${market}…`}
      {live.state === 'live' && `DAZN live · ${market} · ${time(live.fetchedAt)}`}
      {live.state === 'unreachable' && `Not live · ${market}`}
      {live.state !== 'loading' && (
        <button type="button" className="demo__live-refresh" onClick={onRefresh}>
          {live.state === 'unreachable' ? 'Try again' : 'Refresh'}
        </button>
      )}
    </span>
  )
}
