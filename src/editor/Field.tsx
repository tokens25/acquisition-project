import type { ChangeEvent, ReactNode } from 'react'

interface BaseProps {
  label: string
  hint?: string
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: BaseProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <input
        className="ed-field__input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      {hint && <span className="ed-field__hint">{hint}</span>}
    </label>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: BaseProps & { value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <textarea
        className="ed-field__input ed-field__input--area"
        rows={rows}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
      {hint && <span className="ed-field__hint">{hint}</span>}
    </label>
  )
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: BaseProps & {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <select
        className="ed-field__input"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="ed-field__hint">{hint}</span>}
    </label>
  )
}

export function CheckField({
  label,
  hint,
  checked,
  onChange,
}: BaseProps & { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="ed-field ed-field--check">
      <input
        className="ed-field__check"
        type="checkbox"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
      />
      <span>
        <span className="ed-field__label">{label}</span>
        {hint && <span className="ed-field__hint">{hint}</span>}
      </span>
    </label>
  )
}

/** A titled group of fields; `when` false collapses it away entirely. */
export function FieldGroup({
  title,
  children,
  when = true,
}: {
  title: string
  children: ReactNode
  when?: boolean
}) {
  if (!when) return null
  return (
    <fieldset className="ed-group">
      <legend className="ed-group__title">{title}</legend>
      {children}
    </fieldset>
  )
}
