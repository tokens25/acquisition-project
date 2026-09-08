import './studio.css'

/**
 * The studio's switch, from Project A.
 *
 * Its colours and sizes were read off the DAZN Figma toggle (node 43:15470)
 * and scaled for panel density: a 30×18 track with 2px padding and a 14px
 * knob, so the knob travels 12px. On is green — not the brand yellow, which
 * this control deliberately does not use.
 *
 * The acquisition app already has `ToggleField` over the design system's own
 * switch, and that stays the one to use in the editor panels. This is the
 * denser sibling, for a column of settings rather than a form.
 *
 * The switch is a `button role="switch"`. With a visible label the row is a
 * `<label>`, which is what makes the words themselves clickable.
 */
export function StudioToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  compact,
  id,
  ariaLabel,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  /** No row padding, for use inline. */
  compact?: boolean
  id?: string
  /** Names the bare switch when there is no visible label to name it. */
  ariaLabel?: string
}) {
  const sw = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label ?? ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="st-switch"
    >
      <span className="st-switch__knob" />
    </button>
  )

  if (!label) return sw

  return (
    <label htmlFor={id} className="st-switch-row" data-compact={compact || undefined}>
      <span className="st-switch-row__text">
        <span className="st-switch-row__label">{label}</span>
        {description && <span className="st-switch-row__hint">{description}</span>}
      </span>
      {sw}
    </label>
  )
}
