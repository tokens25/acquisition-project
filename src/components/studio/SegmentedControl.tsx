import './studio.css'

import type { ReactNode } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

/**
 * Pick one of a few, from Project A.
 *
 * A filled track that recedes until it is used, so the chosen option is the
 * only thing the eye finds. There is no border on the control and none on the
 * options — the raised face of the active one is the whole of the state.
 *
 * `radiogroup` rather than tabs: these choose a value, they do not reveal a
 * panel. Icon-only keeps the label for screen readers and moves it to the
 * tooltip, so nothing is lost by hiding it.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  vertical,
  fullWidth,
  iconOnly,
  size = 'md',
  ariaLabel,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  vertical?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="st-seg"
      data-vertical={vertical || undefined}
      data-full={fullWidth || undefined}
      data-size={size}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            title={iconOnly && opt.icon ? opt.label : undefined}
            onClick={() => onChange(opt.value)}
            className="st-seg__opt"
            data-active={active || undefined}
            data-icon-only={(iconOnly && Boolean(opt.icon)) || undefined}
          >
            {opt.icon && <span className="st-seg__icon">{opt.icon}</span>}
            <span className="st-seg__label">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
