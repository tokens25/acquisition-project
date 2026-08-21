import type { ChangeEvent, ReactNode } from 'react'

interface BaseProps {
  label: ReactNode
  hint?: string
  /**
   * Why this control changes nothing in the context on screen.
   *
   * Left editable, not disabled: a value that does nothing here still does
   * something somewhere, and that is usually the reason it is being set. What
   * it must not do is look live while having no effect — the preview would
   * simply not move, and the honest reading of that is that the app is broken.
   */
  inert?: string
}

/** Renders a control's hint, or the reason it is inert in this context. */
function Foot({ hint, inert }: { hint?: string; inert?: string }) {
  if (inert) return <span className="ed-field__inert">{inert}</span>
  if (hint) return <span className="ed-field__hint">{hint}</span>
  return null
}

export function TextField({
  label,
  hint,
  inert,
  value,
  onChange,
  placeholder,
}: BaseProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="ed-field" data-inert={inert ? '' : undefined}>
      <span className="ed-field__label">{label}</span>
      <input
        className="ed-field__input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      <Foot hint={hint} inert={inert} />
    </label>
  )
}

export function TextArea({
  label,
  hint,
  inert,
  value,
  onChange,
  rows = 3,
}: BaseProps & { value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="ed-field" data-inert={inert ? '' : undefined}>
      <span className="ed-field__label">{label}</span>
      <textarea
        className="ed-field__input ed-field__input--area"
        rows={rows}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
      <Foot hint={hint} inert={inert} />
    </label>
  )
}

export function SelectField<T extends string>({
  label,
  hint,
  inert,
  value,
  options,
  onChange,
}: BaseProps & {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="ed-field" data-inert={inert ? '' : undefined}>
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
      <Foot hint={hint} inert={inert} />
    </label>
  )
}

export function CheckField({
  label,
  hint,
  inert,
  checked,
  onChange,
}: BaseProps & { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="ed-field ed-field--check" data-inert={inert ? '' : undefined}>
      <input
        className="ed-field__check"
        type="checkbox"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
      />
      <span>
        <span className="ed-field__label">{label}</span>
        <Foot hint={hint} inert={inert} />
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
  inert,
  value,
  onChange,
  step = 1,
  min,
  max,
}: BaseProps & {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <label className="ed-field" data-inert={inert ? '' : undefined}>
      <span className="ed-field__label">{label}</span>
      <input
        className="ed-field__input"
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        min={min}
        max={max}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const next = Number.parseFloat(e.target.value)
          onChange(Number.isFinite(next) ? next : 0)
        }}
      />
      <Foot hint={hint} inert={inert} />
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
