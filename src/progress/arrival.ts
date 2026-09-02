/**
 * The moment the waiting screen lets go and the tool is actually looked at.
 *
 * The route changes early and on purpose — the tool mounts behind the screen
 * while it is still opaque, which is what stops the fade uncovering the page
 * you just left. That makes mounting the wrong moment for anything meant to be
 * seen on arrival: it would play out behind the screen and be over before the
 * screen went. This is the other moment, announced once when it happens.
 *
 * A window event rather than a prop, because the two ends are on opposite
 * sides of the route switch: the screen is above it and the tool is inside it,
 * and threading a flag between them would mean every component in between
 * carrying something that is none of its business.
 */

const ARRIVED = 'acq:arrived'

export function announceArrival() {
  window.dispatchEvent(new CustomEvent(ARRIVED))
}

/** Subscribes for as long as the caller lives. Returns the unsubscribe. */
export function onArrival(run: () => void) {
  window.addEventListener(ARRIVED, run)
  return () => window.removeEventListener(ARRIVED, run)
}
