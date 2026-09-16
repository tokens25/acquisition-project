import { useRef } from 'react'
import { badgeSrc, logoArtwork } from '../card/assets'
import type { CatalogEntry } from '../rules/content'

/**
 * The picture on a competition, and how to change it.
 *
 * Deliberately says whose picture it is: a competition's badge belongs to the
 * catalogue, not to the plan being edited, so uploading one here changes it on
 * every plan that carries that competition. That is the right behaviour — the
 * same competition should not look like two different things — but it is not
 * what somebody editing one plan would assume, so the panel says it rather
 * than letting them find out.
 */
export function BadgePicker({
  entry,
  fieldKey,
  onPick,
  onShipped,
  usedOn,
}: {
  entry: CatalogEntry
  /** How the preview finds this control when its tile is clicked. */
  fieldKey: string
  onPick: (dataUrl: string) => void
  onShipped: () => void
  /** How many plans carry this competition, so the warning can be specific. */
  usedOn: number
}) {
  const file = useRef<HTMLInputElement>(null)
  const uploaded = Boolean(entry.image?.trim())
  const shipped = Boolean(logoArtwork[entry.id])
  const src = badgeSrc(entry)

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    const read = new FileReader()
    read.onload = () => onPick(String(read.result ?? ''))
    read.readAsDataURL(chosen)
    // Cleared, so choosing the same file twice still fires a change.
    e.target.value = ''
  }

  return (
    <div className="ed-badge" data-field={fieldKey}>
      <button
        type="button"
        className="ed-badge__shot"
        onClick={() => file.current?.click()}
        aria-label={`Replace the badge for ${entry.name || entry.id}`}
      >
        {src ? <img src={src} alt="" /> : <span className="ed-badge__none">No badge</span>}
        <span className="ed-badge__over">Replace</span>
      </button>
      <div className="ed-badge__side">
        <p className="ed-badge__what">{uploaded ? 'Uploaded badge' : shipped ? 'Shipped badge' : 'No badge yet'}</p>
        {usedOn > 1 && (
          <p className="ed-badge__note">
            Carried by {usedOn} plans. Changing it changes all of them.
          </p>
        )}
        {uploaded && shipped && (
          <button type="button" className="pl-textbtn" onClick={onShipped}>
            Use the shipped badge
          </button>
        )}
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="ed-badge__file"
        onChange={pick}
        aria-label={`Upload a badge for ${entry.name || entry.id}`}
      />
    </div>
  )
}
