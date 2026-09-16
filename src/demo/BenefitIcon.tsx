import { useRef, useState } from 'react'
import aiSparkle from '../assets/icons/ai-sparkle.svg?raw'
import { BENEFIT_ICON_IDS, BENEFIT_ICON_LABELS, iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { FeatureEntry } from '../rules/content'
import { sanitiseSvg } from '../rules/svg'

/**
 * The icon on a benefit: pick one from the set, upload one, or ask for one.
 *
 * The assistant is offered rather than imposed. It answers with an id from the
 * list below and nothing else, so the worst case is a wrong-but-valid icon a
 * person then corrects with one click.
 *
 * An uploaded glyph replaces the chosen one rather than joining the row: the
 * row is the shipped set, and a file somebody sent is not part of it. Removing
 * the upload puts the chosen one back, which is why choosing one is not undone
 * by uploading.
 */
export function BenefitIcon({
  entry,
  onPick,
  onUpload,
  onClearUpload,
}: {
  entry: FeatureEntry
  onPick: (iconId: string) => void
  onUpload: (svg: string) => void
  onClearUpload: () => void
}) {
  const file = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const uploaded = entry.icon?.trim()

  const take = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    e.target.value = ''
    if (!chosen) return
    setProblem(null)
    const read = new FileReader()
    read.onload = () => {
      const result = sanitiseSvg(String(read.result ?? ''))
      if (!result.ok) {
        setProblem(result.problem.message)
        return
      }
      onUpload(result.svg)
    }
    read.readAsText(chosen)
  }
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
      {uploaded && (
        <div className="ed-icons__own">
          <span className="ed-icons__option" data-on="">
            <Icon svg={uploaded} size={20} />
          </span>
          <p className="ed-icons__note">Your own icon. The row below is the shipped set.</p>
          <button type="button" className="pl-textbtn" onClick={onClearUpload}>
            Remove it
          </button>
        </div>
      )}
      <div className="ed-icons__row" role="radiogroup" aria-label="Benefit icon" data-quiet={uploaded || undefined}>
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
      <button type="button" className="ed-icons__upload" onClick={() => file.current?.click()}>
        Upload an SVG
      </button>
      <input
        ref={file}
        type="file"
        accept=".svg,image/svg+xml"
        className="ed-badge__file"
        onChange={take}
        aria-label="Upload an SVG icon"
      />
      {problem && <p className="ed-icons__problem">{problem}</p>}
      {note && <p className="ed-icons__note">{note}</p>}
    </div>
  )
}
