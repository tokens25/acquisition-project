import './toggle.css'

export interface ToggleProps {
  /** On / off. Figma `Active`. */
  active?: boolean
  onChange?: (active: boolean) => void
  /** Accessible name — the toggle has no visible label in the design. */
  label: string
  disabled?: boolean
}

/** Binary switch that takes effect immediately. Figma: `Toggle` (Active). */
export function Toggle({ active = false, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      className="dazn-toggle"
      disabled={disabled}
      onClick={() => onChange?.(!active)}
    >
      <span className="dazn-toggle__knob" />
    </button>
  )
}
