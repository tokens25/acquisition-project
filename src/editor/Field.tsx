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

export function NumberField({
  label,
  hint,
  value,
  onChange,
  step = 1,
  min,
}: BaseProps & { value: number; onChange: (value: number) => void; step?: number; min?: number }) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <input
        className="ed-field__input"
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const next = Number.parseFloat(e.target.value)
          onChange(Number.isFinite(next) ? next : 0)
        }}
      />
      {hint && <span className="ed-field__hint">{hint}</span>}
    </label>
  )
}

/** A value the editor may see but never set. */
export function DerivedRow({
  label,
  value,
  source,
  note,
}: {
  label: string
  value: string
  source: 'derived' | 'static'
  note: string
}) {
  return (
    <div className="ed-derived" data-source={source}>
      <span className="ed-derived__label">
        {label}
        <span className="ed-derived__tag">{source}</span>
      </span>
      <span className="ed-derived__value">{value || '—'}</span>
      <span className="ed-field__hint">{note}</span>
    </div>
  )
}
