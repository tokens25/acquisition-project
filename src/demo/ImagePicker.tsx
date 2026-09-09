import { useRef } from 'react'

/**
 * A picture on a component, and the three things you can do to it.
 *
 * The same block the Hero banner tab has had, lifted out so the landing page's
 * other pictures work the way that one does rather than each growing its own.
 *
 * There are three states, not two, because a shipped picture is not the same
 * as no picture:
 *
 *   the shipped one   nothing has been uploaded and nothing removed
 *   an uploaded one   what somebody chose, kept as a data URL in the content
 *   none at all       removed, and the component draws without it
 *
 * Remove always means the last of those, so it does something whichever of
 * the first two you are looking at. Getting the shipped one back is its own
 * small act, offered only where there is a shipped one to get back.
 */
export function ImagePicker({
  src,
  shipped,
  off,
  onPick,
  onRemove,
  onShipped,
  label = 'Upload an image',
  aspect,
}: {
  /** The uploaded picture, if there is one. */
  src?: string
  /** Whether this slot has a picture of its own to fall back on. */
  shipped?: string
  /** Drawn without a picture at all. */
  off?: boolean
  onPick: (dataUrl: string) => void
  onRemove: () => void
  /** Back to the shipped picture. Absent where there is none. */
  onShipped?: () => void
  label?: string
  /**
   * The shape the picture is drawn in, so what you are choosing looks like
   * what you will get. 16 / 9 unless a slot says otherwise — the image card
   * is taller than it is wide, and previewing it in a letterbox would show a
   * band across the middle of a portrait picture.
   */
  aspect?: string
}) {
  const file = useRef<HTMLInputElement>(null)
  const shape = aspect ? { aspectRatio: aspect } : undefined
  const showing = off ? '' : src || shipped || ''

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    const read = new FileReader()
    read.onload = () => onPick(String(read.result ?? ''))
    read.readAsDataURL(chosen)
    // Cleared so choosing the same file twice still fires a change.
    e.target.value = ''
  }

  return (
    <div className="hb-image">
      {showing ? (
        <>
          <img className="hb-image__shot" src={showing} alt="" style={shape} />
          <div className="hb-image__acts">
            <button type="button" className="hb-image__act" onClick={() => file.current?.click()}>
              Replace
            </button>
            <button type="button" className="hb-image__act" onClick={onRemove}>
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="hb-image__drop"
            style={shape}
            onClick={() => file.current?.click()}
          >
            <span className="hb-image__plus" aria-hidden="true">
              +
            </span>
            {label}
            {!off && shipped && <small>The shipped picture is used until you do.</small>}
          </button>
          {off && shipped && onShipped && (
            <div className="hb-image__acts">
              <button type="button" className="hb-image__act" onClick={onShipped}>
                Use the shipped picture
              </button>
            </div>
          )}
        </>
      )}
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hb-image__file"
        onChange={pick}
        aria-label={label}
      />
    </div>
  )
}
