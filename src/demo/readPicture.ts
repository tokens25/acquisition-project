/**
 * Reading a picture, to say whether words will survive on it.
 *
 * The idea is the hero studio's: it measures a creative's brightness and
 * busyness and suggests a treatment rather than leaving somebody to squint at
 * it. Theirs asks a service; this asks the browser, which already has the
 * picture decoded and a canvas to put it on — no model, no round trip, and it
 * works on an uploaded file the instant it is chosen.
 *
 * What it measures, and why those two:
 *
 *   brightness   the average luminance of the lower half, because that is
 *                where the heading, the line under it and the buttons sit
 *   busyness     how much that half changes from pixel to pixel — a crowd or
 *                a stadium is busy, a sky is not, and busy is what breaks
 *                white text far more reliably than bright does
 *
 * Both come back 0 to 100, and the suggestion is the wash strength the hero
 * should carry. Nothing here writes anything: it reports, and the panel offers.
 */

export interface PictureReading {
  brightness: number
  busyness: number
  /** The wash this picture is asking for. */
  suggest: 'light' | 'standard' | 'heavy'
  /** What to say about it, in one sentence. */
  note: string
}

/** How many pixels across to sample. Enough to judge, small enough to be free. */
const SAMPLE = 64

export async function readPicture(src: string): Promise<PictureReading | null> {
  const image = await load(src)
  if (!image) return null

  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE)

  let data: Uint8ClampedArray
  try {
    // A picture from another origin taints the canvas and reading it throws.
    // Uploaded pictures are data URLs and shipped ones are ours, so this is
    // the unusual case rather than the expected one — but it must not crash
    // the panel.
    data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data
  } catch {
    return null
  }

  // The lower half only: the top of a hero is picture, the bottom is words.
  const from = Math.floor(SAMPLE / 2)
  const lum: number[] = []
  for (let y = from; y < SAMPLE; y += 1) {
    for (let x = 0; x < SAMPLE; x += 1) {
      const i = (y * SAMPLE + x) * 4
      // Rec. 601 luma: the eye is not equally sensitive to the three channels.
      lum.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }
  }

  const mean = lum.reduce((n, v) => n + v, 0) / lum.length
  const variance = lum.reduce((n, v) => n + (v - mean) ** 2, 0) / lum.length
  const brightness = Math.round((mean / 255) * 100)
  // A standard deviation of about 64 is as varied as a photograph gets.
  const busyness = Math.min(100, Math.round((Math.sqrt(variance) / 64) * 100))

  const hard = brightness > 55 || busyness > 70
  const easy = brightness < 28 && busyness < 40
  return {
    brightness,
    busyness,
    suggest: hard ? 'heavy' : easy ? 'light' : 'standard',
    note: hard
      ? `Bright or busy where the words go — ${brightness} light, ${busyness} busy. A heavier wash keeps them readable.`
      : easy
        ? `Dark and calm where the words go — ${brightness} light, ${busyness} busy. A lighter wash lets more of the picture through.`
        : `Middling where the words go — ${brightness} light, ${busyness} busy. The standard wash suits it.`,
  }
}

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((done) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => done(image)
    image.onerror = () => done(null)
    image.src = src
  })
}
