import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ChevronIcon } from './pipeline/icons'

/**
 * One titled group of fields in the edit panel.
 *
 * The title stays put at the top of the panel while its fields scroll under
 * it, so a long page always says which part of the screen the field in front
 * of you belongs to. Clicking the title folds the group — a page with six
 * groups is worked one group at a time.
 *
 * The fold animates the grid track rather than a measured height, so the
 * fields inside never have to be sized. While it moves, the inner box clips;
 * at rest it does not, so a picker's menu can open past its group.
 */
export function FieldGroup({
  title,
  aside,
  children,
  defaultOpen = true,
}: {
  title: ReactNode
  /** Sits at the right of the title — a chip, a count. */
  aside?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [moving, setMoving] = useState(false)
  const id = useId()

  return (
    <section className="fg" data-open={open || undefined}>
      <div className="fg__head">
        <button
          type="button"
          className="fg__toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setMoving(true)
            setOpen((v) => !v)
          }}
        >
          <span className="fg__chevron" aria-hidden="true">
            <ChevronIcon size={12} />
          </span>
          <span className="fg__title">{title}</span>
        </button>
        {aside}
      </div>
      <div
        className="fg__body"
        id={id}
        aria-hidden={!open}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget) setMoving(false)
        }}
      >
        <div className="fg__inner" data-clip={moving || !open ? '' : undefined}>
          {children}
        </div>
      </div>
    </section>
  )
}
