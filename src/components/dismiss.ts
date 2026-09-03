import type { MouseEvent } from 'react'

/**
 * Clicking away from a sheet closes it.
 *
 * A `dialog` fills the window even when the sheet inside it is a column down
 * one side, so a click on the dark area lands on the dialog rather than on any
 * of its content. Comparing against the click target is not enough on its own,
 * because a click that starts inside the sheet and ends outside it would count
 * too, so the pointer is checked against the sheet's own box.
 */
export function clickedAway(event: MouseEvent<HTMLDialogElement>): boolean {
  const sheet = (event.currentTarget.firstElementChild as HTMLElement | null) ?? null
  if (!sheet) return false
  const box = sheet.getBoundingClientRect()
  const { clientX: x, clientY: y } = event
  // A keyboard-driven click reports no coordinates, and is never a click away.
  if (x === 0 && y === 0) return false
  return x < box.left || x > box.right || y < box.top || y > box.bottom
}
