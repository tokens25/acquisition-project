import { cadenceKey, tierKey } from '../rules/pipeline'

/**
 * Clicking a part of the card to reach the field that writes it.
 *
 * Read off the rendered page rather than wired through every component. The
 * card is presentation and knows nothing about a panel; the panel knows
 * nothing about a card. What connects them is the key a field already carries
 * for the Market → Dev handoff — the same string on both ends — so this adds a
 * lookup rather than a second model of what a card is made of.
 *
 * The consequence worth stating: a part nobody can edit is a part nothing here
 * matches, and clicking it does nothing. That is the honest behaviour. A
 * gesture that pretends to work is worse than one that plainly does not.
 */

/** Asked for on the preview, answered in the panel. */
export const EDIT_EVENT = 'acq:edit-field'

export interface EditRequest {
  /** The tier the click landed in, so the panel can open it first. */
  tierId: string
  /** The field's pipeline key — what the panel matches on. */
  key: string
}

export function askToEdit(request: EditRequest): void {
  window.dispatchEvent(new CustomEvent<EditRequest>(EDIT_EVENT, { detail: request }))
}

/** Position of an element among the siblings that share its class. */
function indexAmong(el: Element, selector: string): number {
  const parent = el.parentElement
  if (!parent) return 0
  return [...parent.querySelectorAll(`:scope > ${selector}`)].indexOf(el)
}

/**
 * What was clicked, as a field key — or nothing, if it was not a part someone
 * writes. Cadence is passed in because the price fields belong to the way of
 * paying that is on screen, and the card does not carry that.
 */
export function keyForTarget(target: Element, cadence: string): EditRequest | null {
  const card = target.closest<HTMLElement>('.acq-card')
  const tierId = card?.dataset.tierId
  if (!card || !tierId) return null

  const at = (selector: string) => target.closest(selector)
  const tier = (field: string): EditRequest => ({ tierId, key: tierKey(tierId, field) })
  const price = (field: string): EditRequest => ({ tierId, key: cadenceKey(tierId, cadence, field) })

  if (at('.acq-card__eyebrow')) return tier('badge')
  if (at('.acq-card-header__title')) return tier('name')
  if (at('.acq-card-header__description')) return tier('description')

  if (at('.acq-pricing__installment')) return price('per')
  if (at('.acq-pricing__price') || at('.acq-pricing__crossed')) return price('full')
  if (at('.acq-pricing__extra')) return price('explainer')

  if (at('.acq-plan-cta__eyebrow')) return price('discount')
  if (at('.acq-plan-cta')) return price('cta')

  const tile = at('.acq-logo-tiles__tile')
  if (tile) {
    // The overflow tile is not a competition; it is the number of the ones
    // that did not fit, which is written in a field of its own.
    if (tile.classList.contains('acq-logo-tiles__tile--overflow')) return tier('competitions.total')
    return tier(`competitions[${indexAmong(tile, '.acq-logo-tiles__tile')}]`)
  }

  const feature = at('.acq-feature')
  if (feature) return tier(`features[${indexAmong(feature, '.acq-feature')}]`)

  return null
}

/**
 * Bring a field into view and say which one it is.
 *
 * A group somebody folded is opened by pressing its own control, so the fold
 * animates exactly as it does by hand and the group's state stays the group's
 * to keep. Finding nothing is not an error: the panel may be showing another
 * screen entirely, and the click simply had nowhere to go.
 */
export function revealField(key: string): boolean {
  const panel = document.querySelector('.demo__panel')
  const field = panel?.querySelector<HTMLElement>(`[data-field="${CSS.escape(key)}"]`)
  if (!field) return false

  const group = field.closest<HTMLElement>('.fg')
  if (group && !group.hasAttribute('data-open')) {
    group.querySelector<HTMLButtonElement>('.fg__toggle')?.click()
  }

  window.setTimeout(() => {
    field.scrollIntoView({ block: 'center', behavior: 'smooth' })
    field.classList.remove('ed-reveal')
    // Read a layout property so removing and adding the class in one frame
    // still restarts the animation rather than being collapsed into no change.
    void field.offsetWidth
    field.classList.add('ed-reveal')
    field.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true })
  }, group ? 180 : 0)
  return true
}
