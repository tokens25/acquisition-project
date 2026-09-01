import cadence from '../assets/flow/cadence.png'
import login from '../assets/flow/login.png'
import accountEmpty from '../assets/flow/account-empty.png'
import accountFilled from '../assets/flow/account-filled.png'
import accountConfirmed from '../assets/flow/account-confirmed.png'
import zipDefault from '../assets/flow/zip-default.png'
import zipEdit from '../assets/flow/zip-edit.png'
import zipEditResults from '../assets/flow/zip-edit-results.png'
import checkoutEmpty from '../assets/flow/checkout-empty.png'
import checkoutFilled from '../assets/flow/checkout-filled.png'
import checkoutPaymentProcess from '../assets/flow/checkout-payment-process.png'
import checkoutPaymentVerified from '../assets/flow/checkout-payment-verified.png'
import confirmation from '../assets/flow/confirmation.png'

/** The width every frame in the flow is drawn at. */
export const FRAME_WIDTH = 375

export interface FlowFrame {
  src: string
  /** The frame's own height in Figma. They differ — Checkout is 1321. */
  height: number
  /**
   * The `.Safari, iOS` bar baked into the bottom of the export.
   *
   * iOS puts the address bar at the foot of the screen and the frames are
   * drawn that way, but a tile reads as a browser window with the bar on top.
   * Rather than re-export thirteen frames without their chrome — which would
   * mean the pictures no longer matched the file — the bar is measured here
   * and clipped, and the tile draws its own at the top.
   */
  chrome: number
}

/**
 * The Figma flow, exported frame by frame.
 *
 * Every screen after Subscription is a stub — agreed and modelled, but not
 * built. Until it is built the honest thing to show is the design itself, so
 * the frames row reads as the flow rather than as a row of filenames.
 *
 * These are pictures, not components. Nothing here renders live content, which
 * is why a tile showing artwork behaves differently from the Subscription tile
 * beside it: change a price in the panel and Subscription updates while these
 * do not. That difference is the point — artwork means the screen still has to
 * be built.
 *
 * Keyed `stepId` or `stepId/state`, matching `rules/journeys.ts`. The two are
 * checked against each other on dev boot, so a renamed state shows up as a
 * missing picture rather than a silent fallback.
 *
 * Source: Figma "Flow", node 583:23442.
 */
export const flowArtwork: Record<string, FlowFrame> = {
  cadence: { src: cadence, height: 788, chrome: 54 },
  auth: { src: login, height: 820, chrome: 90 },
  'account/empty': { src: accountEmpty, height: 866, chrome: 90 },
  'account/filled': { src: accountFilled, height: 959, chrome: 90 },
  'account/confirmed': { src: accountConfirmed, height: 959, chrome: 90 },
  'zip/default': { src: zipDefault, height: 788, chrome: 90 },
  'zip/edit': { src: zipEdit, height: 788, chrome: 90 },
  'zip/edit results': { src: zipEditResults, height: 788, chrome: 90 },
  'checkout/empty': { src: checkoutEmpty, height: 1321, chrome: 90 },
  'checkout/filled': { src: checkoutFilled, height: 1321, chrome: 90 },
  'checkout/payment process': { src: checkoutPaymentProcess, height: 1321, chrome: 90 },
  'checkout/payment verified': { src: checkoutPaymentVerified, height: 1321, chrome: 90 },
  ready: { src: confirmation, height: 812, chrome: 90 },
}

/**
 * The frame for one step in one state, when the design file has one.
 *
 * `state` is null on a step drawn once, which is a normal case rather than a
 * missing value — hence null as well as undefined.
 */
export function artworkFor(stepId: string, state?: string | null): FlowFrame | undefined {
  return (state ? flowArtwork[`${stepId}/${state}`] : undefined) ?? flowArtwork[stepId]
}

/**
 * Keys here that no step claims.
 *
 * A step renamed or a state relabelled would otherwise leave its picture
 * orphaned and the tile quietly falling back to a filename — the failure would
 * look like a design decision rather than a mistake.
 */
export function orphanedArtwork(steps: { id: string; states?: string[] }[]): string[] {
  const claimed = new Set<string>()
  for (const step of steps) {
    claimed.add(step.id)
    for (const state of step.states ?? []) claimed.add(`${step.id}/${state}`)
  }
  return Object.keys(flowArtwork).filter((key) => !claimed.has(key))
}
