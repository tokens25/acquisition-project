import { useState } from 'react'
import aiSparkle from '../assets/icons/ai-sparkle.svg?raw'
import { BENEFIT_ICON_IDS, BENEFIT_ICON_LABELS, iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { FeatureEntry } from '../rules/content'

/**
 * The icon on a custom benefit: pick one, or ask for one.
 *
 * Only custom lines need this. A benefit taken from the library arrives with
 * the icon it was paired with once, which is the point of the library — the
 * same capability cannot end up with two different glyphs.
 *
 * The assistant is offered rather than imposed. It answers with an id from the
 * list below and nothing else, so the worst case is a wrong-but-valid icon a
 * person then corrects with one click.
 */
export function BenefitIcon({
  entry,
  onPick,
}: {
  entry: FeatureEntry
  onPick: (iconId: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const suggest = async () => {
    if (!entry.text.trim()) {
      setNote('Write the benefit first — there is nothing to match an icon to yet.')
      return
    }
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          suggestIcon: {
            text: entry.text,
            icons: BENEFIT_ICON_IDS.map((id) => ({ id, means: BENEFIT_ICON_LABELS[id] })),
          },
        }),
      })
      const body = (await res.json()) as { iconId?: string; why?: string; error?: string }
      if (!res.ok || !body.iconId) {
        setNote(body.error ?? 'The assistant could not choose an icon.')
        return
      }
      onPick(body.iconId)
      setNote(body.why ? `Chose ${body.iconId} — ${body.why}` : `Chose ${body.iconId}.`)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'The assistant is unavailable here.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ed-icons">
      <div className="ed-icons__head">
        <span className="ed-icons__label">Icon</span>
        {/* Not gated on whether the API key is set. Without one the question
            goes to the signed-in CLI instead, and a button that greys itself
            out on a laptop reads as broken rather than as unconfigured — if
            neither can answer, the note below says which. */}
        <button
          type="button"
          className="ai-pill"
          disabled={busy}
          title="Ask Claude which icon suits this line"
          onClick={suggest}
        >
          <span
            className="ai-pill__mark"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: aiSparkle }}
          />
          <span>{busy ? 'Choosing…' : 'Suggest'}</span>
        </button>
      </div>
      <div className="ed-icons__row" role="radiogroup" aria-label="Benefit icon">
        {BENEFIT_ICON_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="ed-icons__option"
            role="radio"
            aria-checked={entry.iconId === id}
            data-on={entry.iconId === id || undefined}
            title={BENEFIT_ICON_LABELS[id]}
            onClick={() => onPick(id)}
          >
            <Icon svg={iconArtwork[id]} size={20} />
          </button>
        ))}
      </div>
      {note && <p className="ed-icons__note">{note}</p>}
    </div>
  )
}
