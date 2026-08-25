import './togglefield.css'

import type { ReactNode } from 'react'
import { useId } from 'react'

/**
 * The DS radio mark, on a control that is really a toggle.
 *
 * The design uses RadioButton for "Ultimate Treatment" and "Apply discount".
 * Neither is a choice between options — each is on or off — so the input stays
 * a checkbox and only the appearance is the radio's. A real radio would trap
 * keyboard users in a group of one they could never switch off.
 *
 * Geometry from the component: a 24px box, a 20px ring, a 10px centre when on.
 */
export function ToggleField({
  label,
  checked,
  onChange,
  tone = 'default',
  hint,
  leading,
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  /** `ultimate` paints the label in the brand gradient; `success` in green. */
  tone?: 'default' | 'ultimate' | 'success'
  hint?: ReactNode
  leading?: ReactNode
}) {
  const id = useId()
  return (
    <div className="tg">
      <label className="tg__row" htmlFor={id}>
        <input
          id={id}
          className="tg__input"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="tg__mark" aria-hidden="true" />
        {leading && <span className="tg__leading">{leading}</span>}
        <span className="tg__label" data-tone={tone}>
          {label}
        </span>
      </label>
      {hint && <p className="tg__hint">{hint}</p>}
    </div>
  )
}
