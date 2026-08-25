import './textfield.css'

import type { ReactNode } from 'react'
import { useId } from 'react'
import { iconArtwork } from '../card/assets'
import { Icon } from './Icon'

/**
 * A dropdown on the TextField shell.
 *
 * The design system has no Form/Select — searching the library returns a TV
 * nav menu and nothing else — which is why the design mocks dropdowns with
 * Form/PasswordField instances plus a chevron. This builds the thing that
 * shortcut implies: the same 56px shell, border states, floating label and
 * help text as TextField, with nav-chevron-down-md as the trailing element.
 *
 * The control underneath is a native <select>, so the menu, keyboard handling
 * and mobile behaviour are the platform's. A hand-built listbox would have to
 * re-earn all of that and would still be the wrong thing on a phone.
 */

export interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  helpText?: ReactNode
  error?: boolean
  disabled?: boolean
  inputId?: string
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  helpText,
  error,
  disabled,
  inputId,
}: SelectFieldProps<T>) {
  const generated = useId()
  const id = inputId ?? generated
  // A select always shows something, so the label always floats — there is no
  // empty state to fall back to the way a text input has.
  return (
    <div className="dz-field dz-field--select" data-error={error || undefined}>
      {/* The control fills the shell rather than sitting inside it, so the
          whole 56px is clickable — including the chevron, which a native
          select would otherwise leave dead. Label and chevron are painted over
          it and take no pointer events. */}
      <div className="dz-field__input dz-field__input--select">
        <label className="dz-field__label dz-field__label--select" htmlFor={id}>
          {label}
        </label>
        <select
          id={id}
          className="dz-field__control dz-field__control--select"
          value={value}
          disabled={disabled}
          aria-invalid={error || undefined}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="dz-field__trailing dz-field__trailing--select" aria-hidden="true">
          <Icon svg={iconArtwork['chevron-down']} size={24} />
        </span>
      </div>

      {helpText && <p className="dz-field__help">{helpText}</p>}
    </div>
  )
}
