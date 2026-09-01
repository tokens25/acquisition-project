/**
 * How much of an element is actually on screen.
 *
 * The card set lives inside a preview that scrolls in both directions, so
 * "visible" is not the window's business alone — every ancestor that clips has
 * a say. Two callers need the same answer and would otherwise each grow their
 * own version of it: the details dialog places itself inside what is on screen,
 * and the card only offers to open that dialog once it is all there.
 *
 * Measured rather than observed. An IntersectionObserver answers the same
 * question more cheaply, but it reports through the rendering steps, which a
 * hidden page does not run — so its answer can be arbitrarily stale, and it
 * cannot be driven from a test.
 */

/** The rectangle an element is clipped to, by its ancestors and the window. */
export function clipRect(el: HTMLElement) {
  let top = 0
  let left = 0
  let bottom = window.innerHeight
  let right = window.innerWidth
  for (let n = el.parentElement; n; n = n.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(n)
    if (overflowX === 'visible' && overflowY === 'visible') continue
    const b = n.getBoundingClientRect()
    top = Math.max(top, b.top)
    bottom = Math.min(bottom, b.bottom)
    left = Math.max(left, b.left)
    right = Math.min(right, b.right)
  }
  return { top, bottom, left, right }
}

/**
 * The part of `el` that is on screen, in `el`'s own coordinates.
 *
 * `host` comes back too, because the caller is placing things relative to it
 * and re-reading the rectangle would be a second measurement of the same thing.
 */
export function visibleBand(el: HTMLElement) {
  const host = el.getBoundingClientRect()
  const clip = clipRect(el)
  return {
    host,
    top: Math.max(host.top, clip.top) - host.top,
    bottom: Math.min(host.bottom, clip.bottom) - host.top,
    left: Math.max(host.left, clip.left) - host.left,
    right: Math.min(host.right, clip.right) - host.left,
  }
}

/** A pixel of slack — a box on a fractional boundary is not half hidden. */
const SLACK = 1

/** Whether every edge of `el` is inside what its ancestors leave visible. */
export function isWholeInView(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const c = clipRect(el)
  return (
    r.top >= c.top - SLACK &&
    r.bottom <= c.bottom + SLACK &&
    r.left >= c.left - SLACK &&
    r.right <= c.right + SLACK
  )
}
