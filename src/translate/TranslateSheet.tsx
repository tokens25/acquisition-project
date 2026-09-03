import { useEffect, useRef, useState } from 'react'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { Icon } from '../components/Icon'
import { Toggle } from '../components/Toggle'
import type { TranslationStore } from './useTranslations'
import './translation.css'

/**
 * "Read this market in another language", the languages a market may be given.
 *
 * A market's official language is not in the list, because it is not a choice:
 * the journey is written in it whether or not anyone asks. What this sheet adds
 * is every other language somebody needs to read the same market in, and they
 * belong to this market alone.
 *
 * The same sheet as the Coach's, on the same side of the window, because it is
 * the same kind of thing: a few choices, then one action that takes a while.
 */
export function TranslateSheet({ open, tx, onClose }: { open: boolean; tx: TranslationStore; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [picked, setPicked] = useState<string[]>([])

  // The native dialog owns focus, Escape and the backdrop; we only tell it when.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // A fresh sheet each time it opens, so last time's ticks are not this time's.
  useEffect(() => {
    if (open) setPicked([])
  }, [open])

  const added = tx.languages.filter((l) => l.code !== tx.official.code)
  const ready = picked.length > 0

  return (
    <dialog ref={ref} className="coach-goal tsheet" onClose={onClose} aria-labelledby="tsheet-title">
      <form
        method="dialog"
        className="coach-goal__sheet"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready) return
          tx.translate(picked)
          tx.show(picked[0])
          onClose()
        }}
      >
        <header className="coach-goal__head">
          <h2 id="tsheet-title" className="coach-goal__title">
            Read {tx.market.label} in another language
          </h2>
          <button type="button" className="coach-goal__close" aria-label="Close" title="Close" onClick={onClose}>
            <Icon svg={closeIcon} size={16} />
          </button>
        </header>
        <p className="coach-goal__lede">
          {tx.market.label} is written in {tx.official.name}, which it reads officially. Pick any other language you need to
          read it in and every screen is translated into it.
        </p>

        <div className="coach-goal__body">
          {added.length > 0 && (
            <section className="coach-goal__group">
              <h3 className="coach-goal__heading">Already here</h3>
              <ul className="tsheet__have">
                {added.map((l) => (
                  <li key={l.code}>
                    {l.name}
                    <button type="button" onClick={() => tx.remove(l.code)} title={`Take ${l.name} away from ${tx.market.label}`}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="coach-goal__group">
            <h3 className="coach-goal__heading">Add a language</h3>
            <ul className="coach-goal__inset">
              {tx.offerable.map((l) => (
                <li key={l.code} className="coach-goal__row" data-on={picked.includes(l.code) || undefined}>
                  <span className="coach-goal__row-text">{l.name}</span>
                  <Toggle
                    label={l.name}
                    active={picked.includes(l.code)}
                    onChange={(on) => setPicked((list) => (on ? [...list, l.code] : list.filter((c) => c !== l.code)))}
                  />
                </li>
              ))}
              {tx.offerable.length === 0 && <li className="tsheet__none">Every language this tool knows is already here.</li>}
            </ul>
            <p className="tsheet__foot">
              Each one is the whole journey, about half a minute, one language after another. The words are written to the
              same standard as every other line here, and checked the same way: nothing added, nothing dropped, and a
              price, a plan name or a team stays exactly as it is. Anything that breaks one of those keeps its English.
            </p>
          </section>
        </div>

        <footer className="coach-goal__foot">
          <button type="submit" className="tsheet__go" disabled={!ready}>
            {picked.length > 1 ? `Translate into ${picked.length} languages` : 'Translate'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
