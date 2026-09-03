import { useEffect, useRef, useState } from 'react'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { clickedAway } from '../components/dismiss'
import { Icon } from '../components/Icon'
import { Toggle } from '../components/Toggle'
import type { TranslationStore } from './useTranslations'
import './translation.css'

/**
 * The languages a market reads.
 *
 * One list, and the switch says whether the market has that language. Its
 * official language is on and cannot be turned off, because the journey is
 * written in it whether or not anyone asks. Turning one on translates the
 * journey into it; turning one off takes it away, with its words.
 */
export function TranslateSheet({ open, tx, onClose }: { open: boolean; tx: TranslationStore; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const has = tx.languages.map((l) => l.code)
  const [on, setOn] = useState<string[]>(has)

  // The native dialog owns focus, Escape and the backdrop; we only tell it when.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // Opening reads the market as it is now, not as it was last time.
  useEffect(() => {
    if (open) setOn(tx.languages.map((l) => l.code))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tx.market.code])

  const rows = [...tx.languages, ...tx.offerable]
  const added = on.filter((c) => !has.includes(c))
  const dropped = has.filter((c) => !on.includes(c) && c !== tx.official.code)
  const changed = added.length + dropped.length > 0

  return (
    <dialog
      ref={ref}
      className="coach-goal tsheet"
      onClose={onClose}
      onClick={(e) => clickedAway(e) && onClose()}
      aria-labelledby="tsheet-title"
    >
      <form
        method="dialog"
        className="coach-goal__sheet"
        onSubmit={(e) => {
          e.preventDefault()
          for (const code of dropped) tx.remove(code)
          if (added.length > 0) {
            tx.translate(added)
            tx.show(added[0])
          }
          onClose()
        }}
      >
        <header className="coach-goal__head">
          <h2 id="tsheet-title" className="coach-goal__title">
            {tx.market.label} languages
          </h2>
          <button type="button" className="coach-goal__close" aria-label="Close" title="Close" onClick={onClose}>
            <Icon svg={closeIcon} size={16} />
          </button>
        </header>

        <div className="coach-goal__body">
          <ul className="coach-goal__inset">
            {rows.map((l) => {
              const official = l.code === tx.official.code
              return (
                <li key={l.code} className="coach-goal__row" data-on={on.includes(l.code) || undefined}>
                  <span className="coach-goal__row-text">
                    {l.name}
                    {official && <small className="coach-goal__row-hint">Official</small>}
                  </span>
                  <Toggle
                    label={l.name}
                    active={on.includes(l.code)}
                    disabled={official}
                    onChange={(want) => setOn((list) => (want ? [...list, l.code] : list.filter((c) => c !== l.code)))}
                  />
                </li>
              )
            })}
          </ul>
        </div>

        <footer className="coach-goal__foot">
          <button type="submit" className="tsheet__go" disabled={!changed}>
            {added.length > 1 ? `Translate into ${added.length} languages` : added.length === 0 && dropped.length > 0 ? 'Save' : 'Translate'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
