import './focalDrag.css'

import { useEffect, useRef, useState } from 'react'

/**
 * Drag a picture to say where its crop hangs from.
 *
 * Taken from the hero studio (`preview/FocalDragLayer.tsx`) and kept as it
 * was written, because the way it was written is the good part: the pointer's
 * travel is read as a percentage of the frame rather than in pixels, so the
 * same surface works over a 168px preview and a full-size phone alike.
 *
 * Theirs takes a controller out of a store. This takes the two numbers and a
 * callback, so whatever holds the focal point — content, in our case — is the
 * caller's business.
 *
 * It also carries their best idea about framing, which is that an axis can
 * only be moved when there is anything to move along it. At the zoom that
 * fills the frame, whichever side fills first has no slack: a tall picture in
 * a tall frame moves up and down and not at all across. Rather than let the
 * pointer fight that, the locked axis is held still, the cursor says which way
 * is free, and whoever put the handle there can say so in words.
 *
 * The picture can also be smaller than the frame, which is the same idea from
 * the other side: there is slack again, all of it inside the frame rather than
 * outside it, and the smaller the picture the more of it there is. What that
 * changes is which way the hand goes — dragging a picture larger than the
 * frame reveals what is off the edge, and dragging one smaller than the frame
 * carries it across — so the sign is worked out here alongside the slack.
 */

/** Which way this picture can be moved inside this frame. */
export interface FreeAxes {
  x: boolean
  y: boolean
}

/** That, and which way the number goes when the hand moves. */
interface Framing extends FreeAxes {
  /** −1 while the picture is larger than the frame, +1 once it is smaller. */
  signX: number
  signY: number
}

/**
 * How much slack the picture has in the frame, and which way it runs.
 *
 * The picture is drawn at a multiple of the size that fills the frame exactly,
 * so at 100 there is slack on one axis at most — whichever one `cover` was
 * overflowing. Above it there is slack both ways and it hangs outside; below
 * it there is slack both ways and it sits inside, growing as the picture
 * shrinks. Both are the same distance, `picture − frame`, with the sign
 * saying which side of the frame the spare room is on.
 */
function framingOf(ratio: number, box: DOMRect, zoom: number): Framing {
  const still = { x: false, y: false, signX: -1, signY: -1 }
  if (!ratio || box.width < 1 || box.height < 1) return still
  const width = Math.max(box.width, box.height * ratio) * (zoom / 100)
  const height = width / ratio
  const slackX = width - box.width
  const slackY = height - box.height
  // A pixel or two of slack is not something a hand can aim, so it does not
  // count as free — it would read as a stuck drag rather than a short one.
  return {
    x: Math.abs(slackX) > 2,
    y: Math.abs(slackY) > 2,
    // Larger than the frame: dragging right reveals what is off to the left,
    // so the focal point falls. Smaller: the picture goes with the hand.
    signX: slackX >= 0 ? -1 : 1,
    signY: slackY >= 0 ? -1 : 1,
  }
}
/**
 * Drag the picture to say what the crop should hang from.
 *
 * A transparent surface over the frame: the pointer's travel is read as a
 * percentage of the frame rather than in pixels, so it works at whatever size
 * the preview happens to be drawn at, and dragging right reveals what is off
 * to the left — the picture follows the hand.
 *
 * Their version takes a controller out of a store; this takes the two numbers
 * and a callback, so whatever holds them is the caller's business.
 */
export function FocalDrag({
  focalX,
  focalY,
  onDrag,
  src,
  zoom = 100,
  onAxes,
}: {
  focalX: number
  focalY: number
  onDrag: (x: number, y: number) => void
  /** How far into the picture the frame is; past 100 both axes are free. */
  zoom?: number
  /** The picture being framed, to learn what shape it is. */
  src?: string
  /** Told which ways it can be moved, for whoever wants to say so. */
  onAxes?: (axes: FreeAxes) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(0)
  const [axes, setAxes] = useState<Framing>({ x: true, y: true, signX: -1, signY: -1 })

  // The picture's own proportions, which decide what can move.
  useEffect(() => {
    if (!src) return
    let gone = false
    const image = new Image()
    image.onload = () => {
      if (!gone && image.naturalHeight > 0) setRatio(image.naturalWidth / image.naturalHeight)
    }
    image.src = src
    return () => {
      gone = true
    }
  }, [src])

  // What is free, once both the picture and the frame are known.
  useEffect(() => {
    const el = ref.current
    if (!el || !ratio) return
    const next = framingOf(ratio, el.getBoundingClientRect(), zoom)
    setAxes(next)
    onAxes?.({ x: next.x, y: next.y })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, zoom])
  const from = useRef<{ x: number; y: number; fx: number; fy: number; w: number; h: number } | null>(null)

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return
    from.current = { x: e.clientX, y: e.clientY, fx: focalX, fy: focalY, w: box.width, h: box.height }
    el.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = from.current
    if (!d) return
    const dx = ((e.clientX - d.x) / d.w) * 100
    const dy = ((e.clientY - d.y) / d.h) * 100
    const hold = (n: number) => Math.max(0, Math.min(100, n))
    // A locked axis keeps the value it started with: the picture cannot move
    // that way, so neither does the number.
    onDrag(
      axes.x ? hold(d.fx + axes.signX * dx) : d.fx,
      axes.y ? hold(d.fy + axes.signY * dy) : d.fy,
    )
  }

  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    from.current = null
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      ref={ref}
      className="fd-drag"
      data-axis={axes.x || axes.y ? undefined : 'none'}
      role="application"
      aria-label={
        axes.x && axes.y
          ? 'Drag to reposition the picture'
          : axes.x
            ? 'Drag sideways to reposition the picture'
            : axes.y
              ? 'Drag up and down to reposition the picture'
              : 'This picture fills the frame exactly and cannot be moved'
      }
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    />
  )
}

