/**
 * Photographing the screen.
 *
 * A bug report is a sentence and an arrow, and the arrow needs something to
 * point at. The picture is taken before anything of the reporter's own is
 * drawn over the page — the menu that opened it has to be closed and painted
 * first, or the report is a photograph of the menu used to file it.
 *
 * The library is loaded when the shutter is pressed rather than with the app:
 * it is the only thing here that reads the whole document, nobody reports a
 * bug on most visits, and this is the one place that wants it.
 */

/** One transparent pixel, for when the camera fails. */
const BLANK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/**
 * How long to wait for the camera before giving up on it.
 *
 * The library resolves its work inside a `requestAnimationFrame`, and a tab
 * that is not being drawn is never given one — a background tab, a hidden
 * pane — so without this the promise never settles at all and the menu sits on
 * "Taking a screenshot…" for good. Nobody reports a bug on a page they cannot
 * see, so this should not fire in earnest; it is here so that when it does, it
 * fails the way a failed capture already fails.
 */
const PATIENCE = 15000

/**
 * Two frames and a beat: one for React to commit the close, one for the
 * browser to paint it. Given up on after a moment for the same reason the
 * capture is — a tab nobody is looking at is given no frames, and waiting for
 * one that will never come is how a shutter jams.
 */
const painted = () =>
  Promise.race([
    new Promise<void>((done) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 60))),
    ),
    new Promise<void>((done) => setTimeout(done, 500)),
  ])

/** The work, or a thrown complaint once the patience runs out. */
function impatient(work: Promise<string>): Promise<string> {
  return Promise.race([
    work,
    new Promise<string>((_, fail) =>
      setTimeout(() => fail(new Error('the capture never came back')), PATIENCE),
    ),
  ])
}

/**
 * What the camera leaves out.
 *
 * Two things, both of which cost the reporter their whole report if they are
 * left in:
 *
 *   a picture from somewhere else   inlining it taints the canvas and the
 *                                   capture throws, over an image that does
 *                                   not change what the bug looks like
 *   a video with no box             the library photographs a video by drawing
 *                                   it into a canvas of the video's own size,
 *                                   and a video inside a closed dialog has no
 *                                   size at all. A canvas of nothing yields
 *                                   the empty data URL, which is then loaded
 *                                   as an image and fails — the whole capture
 *                                   with it. It guards its own canvases
 *                                   against exactly this and not its videos.
 *                                   A video being shown still has a box and is
 *                                   still photographed.
 */
function skip(node: HTMLElement): boolean {
  if (
    node instanceof HTMLImageElement &&
    node.src.startsWith('http') &&
    !node.src.startsWith(window.location.origin)
  ) {
    return true
  }
  return node instanceof HTMLVideoElement && (node.clientWidth < 1 || node.clientHeight < 1)
}

export async function captureScreen(): Promise<string> {
  await painted()
  try {
    const { toPng } = await import('html-to-image')
    return await impatient(
      toPng(document.body, {
        /*
         * Half a device pixel over the base. A full-resolution photograph of a
         * wide screen is several megabytes and a browser keeps about five in
         * total, so this is what makes the difference between a report that is
         * kept and one that is refused. Marks stay legible at this size.
         */
        pixelRatio: Math.min(1, window.devicePixelRatio || 1) * 0.5 + 0.5,
        backgroundColor: '#0b0e11',
        filter: (node) => !skip(node),
      }),
    )
  } catch (error) {
    // A note with no picture beats no note at all — but not silently: a
    // reporter looking at a blank rectangle deserves to know the camera is
    // what failed, and so does whoever reads this next.
    console.error('The screen could not be photographed:', error)
    return BLANK
  }
}
