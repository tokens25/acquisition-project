import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, ChevronIcon } from './pipeline/icons'
import type { CardSetStore } from '../editor/useCardSet'
import './file-menu.css'

/**
 * The file: what it is called, and what can be done to it as a file.
 *
 * The name was the product's until now — a heading saying which of the two
 * tools you were in. It is the file's own from here, because two landing pages
 * for two campaigns are two files and a heading that calls them both "Landing
 * page" is a heading that cannot tell them apart. Nothing resolves by the name:
 * it is what the strip says and what an export is called, and that is all.
 *
 * Untouched, it still says the product's name. That is the honest default — a
 * file nobody has named has no name, and "Untitled 1" would be a name in every
 * place that matters while meaning nothing.
 */

/**
 * The name, as the heading — until it is being changed, when it is a box.
 *
 * Whether it is being changed is held above rather than here, because there
 * are two ways in and they are not near each other: clicking the name, and
 * Rename in the menu beside it. One flag both can set beats the menu reaching
 * into this component to press a button nobody can see.
 */
export function FileName({
  store,
  /** What the strip said before files had names, and what an unnamed one says. */
  fallback,
  renaming,
  setRenaming,
}: {
  store: CardSetStore
  fallback: string
  renaming: boolean
  setRenaming: (on: boolean) => void
}) {
  const { set, updateSet } = store
  const name = set.name ?? fallback

  /**
   * Committing a rename.
   *
   * A name trimmed to nothing is not a name, so it falls back to the product's:
   * a strip with an empty heading looks broken, and emptying it is the one
   * state a person reaches by holding backspace. Typing the fallback word for
   * word stores no name at all, so it goes on following the product.
   */
  const commit = (typed: string) => {
    const next = typed.trim()
    updateSet({ name: !next || next === fallback ? undefined : next })
    setRenaming(false)
  }

  if (!renaming) {
    return (
      <button
        type="button"
        className="fm__name"
        title="Rename this file"
        onClick={() => setRenaming(true)}
      >
        {name}
      </button>
    )
  }

  return (
    <input
      className="fm__rename"
      defaultValue={name}
      aria-label="Name this file"
      /* Sized by its content where that is understood, and by the character
         count where it is not — either way the strip does not hold a box the
         width of a name nobody is typing. */
      size={Math.max(name.length, 4)}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => commit(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(e.currentTarget.value)
        // Escape puts back what was there, which the blur must then not undo.
        if (e.key === 'Escape') {
          e.currentTarget.value = name
          setRenaming(false)
        }
      }}
    />
  )
}

export interface FileAction {
  id: string
  label: string
  /** The glyph at the head of the row. Same box for every item, so they line up. */
  icon: ReactNode
  /**
   * What it does. Returning a word shows it in place of the label, briefly.
   *
   * It may take its time: copying asks the clipboard, which can refuse, and a
   * menu that says "Copied" before the answer comes back is a menu that
   * sometimes says it of a link nobody has.
   */
  run: () => string | void | Promise<string | void>
  /** Under a rule from the item above, the way a file menu groups its verbs. */
  breaks?: boolean
}

/** What can be done to the file, under the chevron beside its name. */
export function FileMenu({ actions }: { actions: FileAction[] }) {
  const [open, setOpen] = useState(false)
  /** The word an action left behind — "Saved", "Copied" — until the menu shuts. */
  const [said, setSaid] = useState<{ id: string; word: string } | null>(null)
  const box = useRef<HTMLDivElement>(null)

  /* Clicking anywhere else is how a menu like this is dismissed. Only while it
     is open: a listener that outlives the menu is a listener firing on every
     click in the tool. */
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  const choose = async (action: FileAction) => {
    const word = await action.run()
    if (!word) {
      setOpen(false)
      return
    }
    // Said where it was asked for, and then the menu closes itself: a
    // confirmation that has to be dismissed is worse than the doubt it answers.
    setSaid({ id: action.id, word })
    window.setTimeout(() => {
      setSaid(null)
      setOpen(false)
    }, 1100)
  }

  return (
    <div className="fm" ref={box}>
      <button
        type="button"
        className="fm__chev"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="What you can do with this file"
        title="What you can do with this file"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        <ChevronIcon size={14} />
      </button>

      {open && (
        <ul className="fm__menu" role="menu" aria-label="File">
          {actions.map((action) => (
            <li key={action.id} className="fm__row" data-break={action.breaks || undefined}>
              <button
                type="button"
                className="fm__item"
                role="menuitem"
                onClick={() => void choose(action)}
              >
                {/* The word an action left behind takes the icon's place as
                    well as the label's, so the row does not say "duplicate"
                    beside "Copy downloaded". */}
                <span className="fm__glyph" aria-hidden="true">
                  {said?.id === action.id ? <CheckIcon size={13} /> : action.icon}
                </span>
                {said?.id === action.id ? said.word : action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
