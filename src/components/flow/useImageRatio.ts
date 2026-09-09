import { useEffect, useState } from 'react'

/**
 * What shape a picture is, once the browser has it.
 *
 * The hero places its picture rather than fitting it: it is drawn at a size
 * and an offset that the framing decides, and both of those need the picture's
 * own proportions. Nothing else about it — not its bytes, not its colours,
 * only how wide it is against how tall.
 *
 * Nought until it is known, which is the only honest answer while a picture is
 * still arriving: the sheet stands the frame's own shape in for it, so the
 * hero looks right on the first paint and settles on the true one.
 */
export function useImageRatio(src: string): number {
  const [ratio, setRatio] = useState(0)

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

  return ratio
}
