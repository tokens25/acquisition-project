import './assistant.css'

import { useEffect, useRef, useState } from 'react'
import type { CardSetStore } from './useCardSet'
import { summarise, validateAll } from '../rules/validate'

/**
 * A conversation about the content, beside the content.
 *
 * The model can read everything and propose changes; it cannot make them. A
 * proposal arrives as a list of specific edits with the current value shown
 * against the suggested one, and applying it is a separate act.
 *
 * That split is not caution for its own sake. Content here is checked across
 * every market by the publish gate, so a proposal that is wrong fails loudly
 * once applied — but a proposal applied without being read is a change nobody
 * decided to make, and those are the ones that reach production.
 */

interface TierChange {
  tierId: string
  market?: string
  planName?: string
  description?: string
  features?: string[]
}

interface OfferChange {
  tierId: string
  cadence: string
  market?: string
  standardPrice?: number
  discount?: boolean
  introPrice?: number
}

interface Proposal {
  summary: string
  tiers?: TierChange[]
  offers?: OfferChange[]
}

interface Turn {
  role: 'user' | 'assistant'
  content: string
  proposal?: Proposal | null
  applied?: boolean
}

export function Assistant({ store }: { store: CardSetStore }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Asked once, on mount. A dev server with no API routes answers with the
  // app's own HTML, so the content type is what separates "no assistant here"
  // from "an assistant that failed" — and saying which is the difference
  // between a panel that looks broken and one that is honestly switched off.
  useEffect(() => {
    let cancelled = false
    fetch('/api/assistant', { headers: { accept: 'application/json' } })
      .then(async (res) => {
        if (!res.headers.get('content-type')?.includes('json')) {
          throw new Error('No assistant route on this deployment.')
        }
        return (await res.json()) as { configured?: boolean; reason?: string }
      })
      .then((body) => {
        if (cancelled) return
        if (!body.configured) {
          setUnavailable(body.reason ?? 'The assistant is not set up on this deployment.')
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setUnavailable(err instanceof Error ? err.message : 'The assistant is unavailable here.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const send = async (text: string) => {

    const next: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(next)
    setDraft('')
    setBusy(true)
    setError(null)
    try {
      const coverage = summarise(validateAll(store.set))
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((t) => ({ role: t.role, content: t.content })),
          set: store.set,
          failing: coverage.failingLabels.slice(0, 12).join(', '),
        }),
      })
      const body = (await res.json()) as {
        configured?: boolean
        reason?: string
        text?: string
        proposal?: Proposal | null
        error?: string
      }
      if (body.configured === false) {
        setUnavailable(body.reason ?? 'The assistant is not set up on this deployment.')
        return
      }
      if (!res.ok || body.error) {
        setError(body.error ?? `The assistant returned ${res.status}.`)
        return
      }
      setTurns([
        ...next,
        { role: 'assistant', content: body.text ?? '', proposal: body.proposal ?? null },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }))
    }
  }

  const apply = (proposal: Proposal, index: number) => {
    // Applied through the same store methods the form uses, so a market-scoped
    // change becomes an override exactly as it would if it were typed.
    const before = store.context
    for (const change of proposal.tiers ?? []) {
      store.setContext({ ...before, market: change.market ?? before.market })
      const { tierId, market: _market, ...patch } = change
      void _market
      store.updateTier(tierId, patch)
    }
    for (const change of proposal.offers ?? []) {
      const { tierId, cadence, market, ...patch } = change
      store.setContext({ ...before, market: market ?? before.market, cadence })
      store.updateOffer(tierId, patch)
    }
    store.setContext(before)
    setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, applied: true } : t)))
  }

  // Switched off, not broken. The panel keeps its shape and says what it would
  // do and what it needs — a single grey line reads as an error nobody can act
  // on, which is how this looked the first time.
  if (unavailable) {
    return (
      <aside className="as as--off">
        <header className="as__head">
          <h2 className="as__title">Assistant · off</h2>
          <p className="as__hint">
            Upload the content spreadsheet and ask what is missing, or have the gaps drafted for
            review. Every suggestion is applied by hand, never automatically.
          </p>
        </header>
        <p className="as__off">
          {unavailable} Add <code>ANTHROPIC_API_KEY</code> to the Vercel project to switch this on,
          or to a local <code>.env</code> to try it here first. Note that requests send the content
          to Anthropic.
        </p>
      </aside>
    )
  }

  return (
    <aside className="as">
      <header className="as__head">
        <h2 className="as__title">Assistant</h2>
        <p className="as__hint">
          It can read the content and suggest changes. Applying one is up to you.
        </p>
      </header>

      <div className="as__list" ref={listRef}>
        {turns.length === 0 && (
          <div className="as__empty">
            <p>Try:</p>
            <ul>
              <li>
                <button type="button" onClick={() => void send('What is missing before this can be published?')}>
                  What is missing before this can be published?
                </button>
              </li>
              <li>
                <button type="button" onClick={() => void send('Draft descriptions for the plans that have none, in the market’s own language, within the two-line budget.')}>
                  Draft the missing descriptions
                </button>
              </li>
              <li>
                <button type="button" onClick={() => void send('Which plans have no features set, and which catalogue lines would suit each?')}>
                  Suggest feature lines
                </button>
              </li>
            </ul>
          </div>
        )}

        {turns.map((turn, i) => (
          <div className="as__turn" data-role={turn.role} key={i}>
            {turn.content && <p className="as__text">{turn.content}</p>}
            {turn.proposal && (
              <ProposalCard
                proposal={turn.proposal}
                applied={turn.applied === true}
                onApply={() => apply(turn.proposal!, i)}
              />
            )}
          </div>
        ))}

        {busy && <p className="as__busy">Thinking…</p>}
        {error && <p className="as__error">{error}</p>}
      </div>

      <form
        className="as__compose"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim() && !busy) void send(draft.trim())
        }}
      >
        <textarea
          className="as__input"
          rows={2}
          value={draft}
          placeholder="Ask about the content, or ask for a draft…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (draft.trim() && !busy) void send(draft.trim())
            }
          }}
        />
        <button type="submit" className="as__send" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}

function ProposalCard({
  proposal,
  applied,
  onApply,
}: {
  proposal: Proposal
  applied: boolean
  onApply: () => void
}) {
  const count = (proposal.tiers?.length ?? 0) + (proposal.offers?.length ?? 0)
  return (
    <div className="as__proposal" data-applied={applied || undefined}>
      <p className="as__proposal-summary">{proposal.summary}</p>
      <ul className="as__changes">
        {proposal.tiers?.map((change, i) => (
          <li key={`t${i}`}>
            <code>{change.tierId}</code>
            {change.market && <span className="as__scope"> · {change.market}</span>}
            {change.planName && <div className="as__value">Name: {change.planName}</div>}
            {change.description && <div className="as__value">{change.description}</div>}
            {change.features && <div className="as__value">Features: {change.features.join(', ')}</div>}
          </li>
        ))}
        {proposal.offers?.map((change, i) => (
          <li key={`o${i}`}>
            <code>{change.tierId}</code>
            <span className="as__scope">
              {' '}
              · {change.cadence}
              {change.market ? ` · ${change.market}` : ''}
            </span>
            <div className="as__value">
              {change.standardPrice !== undefined && `Standard ${change.standardPrice}`}
              {change.introPrice !== undefined && ` · Discount ${change.introPrice}`}
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="as__apply" onClick={onApply} disabled={applied || count === 0}>
        {applied ? 'Applied' : `Apply ${count} change${count === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}
