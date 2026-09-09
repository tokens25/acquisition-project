import { useEffect, useRef, useState } from 'react'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { Icon } from '../components/Icon'
import { whereNow } from './where'
import './account.css'

/**
 * Reporting a bug by drawing on the screen.
 *
 * Ported from the hero studio's overlay, and deliberately four controls: draw,
 * clear, say what happened, send. No shapes, no colours, no undo stack — a bug
 * report is a sentence and an arrow, and every extra tool is a decision the
 * reporter has to make before they are allowed to complain.
 *
 * The picture arrives already taken. It has to: this is drawn over the screen,
 * so anything that photographed the screen from in here would photograph
 * itself.
 *
 * Marks live on a canvas over the picture and are burnt into it when it is
 * sent, so what is kept is one flat PNG that renders anywhere rather than a
 * photograph and a set of lines to lay over it again later.
 */
export function BugReportOverlay({
  shot,
  onSend,
  onClose,
}: {
  shot: string
  /** Keeps it, or says the browser would not. */
  onSend: (note: string, flattened: string, where: string) => boolean
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drawing = useRef(false)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /*
   * The drawing surface, sized to the picture as it is being shown and in the
   * screen's own pixels — which is what puts the line under the cursor rather
   * than near it on a retina display.
   */
  const syncCanvas = () => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const box = img.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(box.width * ratio))
    canvas.height = Math.max(1, Math.round(box.height * ratio))
    canvas.style.width = `${box.width}px`
    canvas.style.height = `${box.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.strokeStyle = '#ff3b30'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  useEffect(() => {
    syncCanvas()
    window.addEventListener('resize', syncCanvas)
    return () => window.removeEventListener('resize', syncCanvas)
  }, [])

  const pointAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = pointAt(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    // A tap with no travel is a dot rather than nothing at all.
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointAt(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = () => {
    drawing.current = false
  }

  const clearMarks = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  /** The marks burnt into the picture: one flat PNG, no layers to reassemble. */
  const flatten = (): string => {
    const img = imgRef.current
    const marks = canvasRef.current
    if (!img || img.naturalWidth === 0) return shot
    const out = document.createElement('canvas')
    out.width = img.naturalWidth
    out.height = img.naturalHeight
    const ctx = out.getContext('2d')
    if (!ctx) return shot
    ctx.drawImage(img, 0, 0, out.width, out.height)
    if (marks) ctx.drawImage(marks, 0, 0, out.width, out.height)
    return out.toDataURL('image/png')
  }

  const send = () => {
    if (sent) return
    const kept = onSend(note, flatten(), whereNow())
    if (!kept) {
      setError(
        'The browser would not keep it — its store is full. Forget an older report and try again.',
      )
      return
    }
    setSent(true)
    // Long enough to read the confirmation, short enough not to trap anybody.
    window.setTimeout(onClose, 900)
  }

  return (
    <div className="bug" role="dialog" aria-modal="true" aria-label="Report a bug">
      <header className="bug__head">
        <span className="bug__title">Report a bug</span>
        <span className="bug__hint">Draw on the screen to mark the problem</span>
        <button type="button" className="bug__clear" onClick={clearMarks}>
          Clear marks
        </button>
        <button
          type="button"
          className="bug__close"
          aria-label="Close bug report"
          title="Close"
          onClick={onClose}
        >
          <Icon svg={closeIcon} size={16} />
        </button>
      </header>

      <div className="bug__stage">
        <div className="bug__shot">
          <img
            ref={imgRef}
            src={shot}
            alt="The screen as it was"
            onLoad={syncCanvas}
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="bug__marks"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        </div>
      </div>

      <footer className="bug__foot">
        {/* Send sits inside the field rather than beside it: one thing to aim
            at, and it sits where the sentence ends. The field's end padding
            reserves its room so a long note never runs underneath it. */}
        <div className="bug__composer">
          <label htmlFor="bug-note" className="acc-sr">
            What went wrong
          </label>
          <textarea
            id="bug-note"
            className="bug__note"
            value={note}
            rows={2}
            placeholder="What went wrong?"
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className="bug__send" onClick={send} disabled={sent}>
            {sent ? 'Sent' : 'Send'}
          </button>
        </div>
        {error && <p className="bug__error">{error}</p>}
      </footer>
    </div>
  )
}
