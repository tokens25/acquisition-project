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

/**
 * The Figma flow, exported frame by frame.
 *
 * Every screen after Subscription is a stub — agreed and modelled, but not
 * built. Until it is built the honest thing to show is the design itself, so
 * the frames row reads as the flow rather than as a row of filenames.
 *
 * These are pictures, not components. Nothing here renders the live content,
 * which is exactly why they carry a `figma:` provenance rather than pretending
 * to be a preview: change a price in the panel and the Subscription tile
 * updates while these do not. That difference is the point — a tile showing
 * artwork is a tile whose screen still has to be built.
 *
 * Keyed `stepId` or `stepId/state`, matching the step ids and state names in
 * `rules/journeys.ts`. The two are checked against each other on dev boot, so a
 * renamed state shows up as a missing picture rather than a silent fallback.
 *
 * Source: Figma "Flow", node 583:23442.
 */
export const flowArtwork: Record<string, string> = {
  cadence,
  auth: login,
  'account/empty': accountEmpty,
  'account/filled': accountFilled,
  'account/confirmed': accountConfirmed,
  'zip/default': zipDefault,
  'zip/edit': zipEdit,
  'zip/edit results': zipEditResults,
  'checkout/empty': checkoutEmpty,
  'checkout/filled': checkoutFilled,
  'checkout/payment process': checkoutPaymentProcess,
  'checkout/payment verified': checkoutPaymentVerified,
  ready: confirmation,
}

/**
 * The picture for one step in one state, when the design file has one.
 *
 * `state` is null on a step drawn once, which is a normal case rather than a
 * missing value — hence null as well as undefined.
 */
export function artworkFor(stepId: string, state?: string | null): string | undefined {
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
