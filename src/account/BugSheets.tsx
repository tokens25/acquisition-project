import { useEffect, useState } from 'react'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { clickedAway } from '../components/dismiss'
import { Icon } from '../components/Icon'
import { ACCOUNT, type BugReport } from './account'
import { useDialog } from './useDialog'
import './account.css'

/**
 * Reading the reports back.
 *
 * Writing one is the overlay's job — the screen, marked up. This is the other
 * half, and it is a table because three separate things are being compared
 * down the list: the picture, what was said about it, and who said it. Keeping
 * the words out of the picture is the point; a caption under a thumbnail is
 * read as belonging to it, and this reads as a row.
 *
 * The picture expands in place. A thumbnail cannot show a mark somebody drew,
 * which is the whole reason the picture exists — and opening it in a tab of
 * its own would throw the reader out of the list they are working through.
 * Expanding keeps the list behind it and gives them back the same row.
 *
 * The hero studio's version files these in Jira as well. There is no server
 * here to file anything with, so they live in this browser: a run through the
 * tool leaves a list behind, and the list is still there tomorrow.
 */
export function ReportedBugsSheet({
  open,
  bugs,
  onForget,
  onClose,
}: {
  open: boolean
  bugs: BugReport[]
  onForget: (id: string) => void
  onClose: () => void
}) {
  const ref = useDialog(open)
  /** The report whose picture is expanded, or nothing. */
  const [shown, setShown] = useState<BugReport | null>(null)

  /* Escape closes the picture rather than the sheet under it, while one is
     open. Bound only then, so this never competes with the sheet's own. */
  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setShown(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [shown])

  /* Forgetting the report whose picture is open would leave a picture on
     screen with nothing behind it. */
  const forget = (id: string) => {
    onForget(id)
    setShown((open) => (open?.id === id ? null : open))
  }

  return (
    <dialog
      ref={ref}
      className="coach-goal acc-sheet"
      onClose={onClose}
      onClick={(e) => clickedAway(e) && onClose()}
      aria-labelledby="bugs-title"
    >
      <form method="dialog" className="coach-goal__sheet">
        <header className="coach-goal__head">
          <h2 id="bugs-title" className="coach-goal__title">
            Reported bugs
          </h2>
          <button
            type="button"
            className="coach-goal__close"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <Icon svg={closeIcon} size={24} />
          </button>
        </header>

        <div className="coach-goal__body">
          {bugs.length === 0 ? (
            <p className="acc-bugs__empty">
              Nothing reported yet. Report a bug photographs the screen you are on and lets you
              draw on it.
            </p>
          ) : (
            <div className="acc-bugs">
              <table className="acc-bugs__table">
                <thead>
                  <tr>
                    <th>Screen</th>
                    <th>What they reported</th>
                    <th>Reported by</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {bugs.map((bug) => (
                    <tr key={bug.id}>
                      <td>
                        <button
                          type="button"
                          className="acc-bugs__thumb"
                          title="Expand the screenshot"
                          aria-label="Expand the screenshot"
                          onClick={() => setShown(bug)}
                        >
                          <img src={bug.shot} alt="" draggable={false} />
                        </button>
                      </td>
                      <td>
                        <p className="acc-bugs__note">
                          {bug.note || (
                            <span className="acc-bugs__note--none">No description given</span>
                          )}
                        </p>
                        <p className="acc-bugs__meta">
                          {new Date(bug.at).toLocaleString()} · <code>{bug.where}</code>
                        </p>
                      </td>
                      {/* A report written before reports said who wrote them
                          belongs to the only account there is. */}
                      <td className="acc-bugs__by">{bug.by ?? ACCOUNT.name}</td>
                      <td className="acc-bugs__end">
                        <button
                          type="button"
                          className="acc-bugs__forget"
                          aria-label="Delete this report"
                          title="Delete this report"
                          onClick={() => forget(bug.id)}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="acc-bugs__foot">
            Reports are stored in this browser, so they are visible to you rather than the whole
            team.
          </p>
        </div>
      </form>

      {/* Inside the sheet's own element so it draws over it, and stopping the
          click there: the sheet closes on a click outside itself, and the
          whole point of this is that it covers everything. */}
      {shown && (
        <div
          className="acc-zoom"
          role="dialog"
          aria-modal="true"
          aria-label="The reported screen, full size"
          onClick={(e) => {
            e.stopPropagation()
            setShown(null)
          }}
        >
          <img
            src={shown.shot}
            alt="The reported screen with the reporter's marks"
            /* Clicking the picture must not dismiss it — only the space around
               it, which is what a hand reaches for. */
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          <p className="acc-zoom__note">
            {shown.note || 'No description given'}
            <button type="button" className="acc-zoom__close" onClick={() => setShown(null)}>
              Close
            </button>
          </p>
        </div>
      )}
    </dialog>
  )
}

/* The icon set carries no bin, so it is drawn — the lid, the body, and the two
   lines down it that say what kind of thing it is. */
function TrashIcon() {
  return (
    <svg
      className="acc-bugs__bin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  )
}
