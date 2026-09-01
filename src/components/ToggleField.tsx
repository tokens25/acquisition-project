import './togglefield.css'

import type { ReactNode } from 'react'
import { Toggle } from './Toggle'

/**
 * A labelled row with the design system's switch at its right.
 *
 * "Highlighted Tier" and "Apply discount" are each on or off rather than a
 * choice between options, so the control is the DS `Toggle` — the same switch
 * the rest of the product uses for a setting that takes effect immediately.
 *
 * It used to draw the radio mark from the design's RadioButton on the left,
 * which said "pick one of these" about a control with nothing to pick between.
 *
 * `Toggle` is a `button role="switch"`, so this row is a div rather than a
 * label: a button inside a label gives two competing click targets and a
 * control the keyboard lands on twice.
 */
export function ToggleField({
  label,
  checked,
  onChange,
  tone = 'default',
  hint,
  leading,
  name,
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  /** `ultimate` paints the label in the brand gradient; `success` in green. */
  tone?: 'default' | 'ultimate' | 'success'
  hint?: ReactNode
  leading?: ReactNode
  /**
   * The switch's accessible name. Defaults to the label where that is a string,
   * which it is at every call site — this exists so a rich label cannot leave
   * the switch unnamed.
   */
  name?: string
}) {
  return (
    <div className="tg">
      <div className="tg__row">
        {leading && <span className="tg__leading">{leading}</span>}
        <span className="tg__label" data-tone={tone}>
          {label}
        </span>
        <Toggle
          active={checked}
          onChange={onChange}
          label={name ?? (typeof label === 'string' ? label : 'Toggle')}
        />
      </div>
      {hint && <p className="tg__hint">{hint}</p>}
    </div>
  )
}
