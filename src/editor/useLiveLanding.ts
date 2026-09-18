import { useEffect, useState } from 'react'

/**
 * What the market's landing page is actually made of, from DAZN's own CMS.
 *
 * The panel draws the page this tool holds. This says what the live one holds
 * beside it — which components, in what order — so the two can be compared
 * without leaving the tool and without anybody keeping a second list by hand.
 *
 * Read-only on purpose. Nothing here changes the page: knowing that GB draws
 * four spotlight rails is worth having on its own, and adopting the live
 * arrangement is a decision somebody makes rather than a thing that happens
 * while they are looking at it.
 *
 * Through `/api/landing` rather than straight from the page, because the
 * services this reads answer only to dazn.com — see LANDING-API.md.
 */

export interface LiveComponent {
  at: number
  /** The production `componentType` — what the live page discriminates on. */
  type: string
  version: string | null
  title: string | null
  description: string | null
  /** Set on the components that are served a rail rather than authored. */
  railId: string | null
  railParams: string | null
  entries: { type: string; id: string; name: string | null }[]
}

export interface LivePage {
  market: string
  locale: string
  page: string
  env: string
  cached: boolean
  seconds: number
  config: { displayName: string | null; pages: string[]; environment: string[] }
  components: LiveComponent[]
}

/**
 * `off` — nothing to ask for. The base copy is every market at once and the
 * live page is one market's; and NFL and NHL are product groups sitting in the
 * market list, which the live page has no country for.
 * `none` — asked, and this market draws no such page. An answer, not a fault.
 */
export type LiveState = 'off' | 'loading' | 'ready' | 'none' | 'error'

/**
 * What came back, and what it came back for.
 *
 * Tagged with the question rather than held beside a separate `loading` flag,
 * so waiting is something this works out rather than something it remembers:
 * an answer whose tag is not the question being asked is the previous market's,
 * and the only honest thing to say about the current one is that it is still
 * being read. It also keeps every `setState` inside the reply, where a render
 * is expected, instead of in the body of an effect where it cascades.
 */
interface Answer {
  asked: string
  state: 'ready' | 'none' | 'error' | 'off'
  page: LivePage | null
  error: string | null
}

export function useLiveLanding(market: string | undefined | null) {
  const code = (market ?? '').trim().toLowerCase()
  const [answer, setAnswer] = useState<Answer | null>(null)
  /** Bumped to ask again, which is the only thing a reload has to do. */
  const [nonce, setNonce] = useState(0)
  const asked = `${code}|${nonce}`

  useEffect(() => {
    if (!code) return
    // A market changed while an answer was in flight would otherwise land on
    // the new market's panel as if it were its own.
    const stop = new AbortController()

    const ask = async () => {
      try {
        const url = `/api/landing?market=${encodeURIComponent(code)}${nonce ? '&refresh=1' : ''}`
        const response = await fetch(url, { signal: stop.signal })
        const body = await response.json()
        if (stop.signal.aborted) return
        // The route is the authority on what is a market. Its 400 is not a
        // fault to report, it is "there is nothing here to ask for" — which is
        // what NFL and NHL are, sitting in the market list as product groups.
        if (response.status === 400) {
          setAnswer({ asked, state: 'off', page: null, error: null })
          return
        }
        if (!response.ok || body?.ok === false) {
          const said = typeof body?.error === 'string' ? body.error : `The route answered ${response.status}.`
          setAnswer({ asked, state: 'error', page: null, error: said })
          return
        }
        if (!body.found) {
          setAnswer({ asked, state: 'none', page: null, error: null })
          return
        }
        setAnswer({ asked, state: 'ready', page: body as LivePage, error: null })
      } catch (e) {
        if (stop.signal.aborted) return
        // A tool running without its routes — a static preview, a build with
        // no functions — should say so rather than look broken.
        setAnswer({ asked, state: 'error', page: null, error: e instanceof Error ? e.message : String(e) })
      }
    }
    void ask()
    return () => stop.abort()
  }, [code, nonce, asked])

  const mine = answer?.asked === asked ? answer : null
  const state: LiveState = !code ? 'off' : (mine?.state ?? 'loading')

  return {
    state,
    page: mine?.page ?? null,
    error: mine?.error ?? null,
    reload: () => setNonce((n) => n + 1),
  }
}
