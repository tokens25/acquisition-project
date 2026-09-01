import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { iconArtwork } from '../card/assets'

export interface IconOption {
  value: string
  label: string
  /** Key into `iconArtwork`. Omitted draws the row without one. */
  iconId?: string
}

/**
 * A dropdown whose options carry their icon.
 *
 * `SelectField` wraps a native `<select>` on purpose — the menu, the keyboard
 * and the phone behaviour are then the platform's. But an `<option>` renders
 * text and nothing else, and a benefit is its icon as much as its words: two
 * lines that read alike are told apart by the glyph beside them. So this one
 * is hand-built, and pays for it by re-earning the keyboard by hand.
 *
 * Deliberately not a general Select replacement. It exists where the icon is
 * part of the choice; everywhere else the native control is still the right one.
 */
export function IconPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: IconOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="ed-pick" ref={rootRef}>
      <span className="ed-pick__label">{label}</span>
      <button
        type="button"
        className="ed-pick__value"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {current?.iconId && <Icon svg={iconArtwork[current.iconId]} size={20} />}
        <span className="ed-pick__text">{current?.label ?? value}</span>
        <Icon svg={iconArtwork['chevron-down']} size={20} />
      </button>
      {open && (
        <ul className="ed-pick__menu" role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className="ed-pick__option"
                role="option"
                aria-selected={o.value === value}
                data-on={o.value === value || undefined}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {/* The slot is kept even when a row has no icon, so the words
                    still line up down the list. */}
                <span className="ed-pick__mark">
                  {o.iconId && <Icon svg={iconArtwork[o.iconId]} size={20} />}
                </span>
                <span className="ed-pick__text">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
