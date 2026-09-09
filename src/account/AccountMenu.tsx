import { useEffect, useRef, useState } from 'react'
import { initialsOf, useAccount, UI_LANGUAGES } from './account'
import { BugReportOverlay } from './BugReportOverlay'
import { ReportedBugsSheet } from './BugSheets'
import { captureScreen } from './capture'
import './account.css'

/**
 * The account, in the top right corner of everything.
 *
 * Ported from the hero studio's `AppUserMenu`: an avatar that opens a card
 * with who you are, what language you read in, the two bug entries and the way
 * out. It is mounted once beside the route rather than by each screen — every
 * page has a top right corner and this is what is in it, so no screen should
 * have to remember to draw it.
 *
 * Fixed rather than laid into each screen's own bar, for the same reason
 * theirs is: the four screens here have four different bars, and a corner is
 * a corner. What the bars do is leave room for it, which they do by reading
 * `--account-slot`.
 */
export function AccountMenu() {
  const store = useAccount()
  const [open, setOpen] = useState(false)
  /** The screen as it was, held here because the entry that took it is gone. */
  const [shot, setShot] = useState<string | null>(null)
  const [taking, setTaking] = useState(false)
  const [listing, setListing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /*
   * Close the menu, let it paint, then photograph.
   *
   * The picture has to be of the screen being complained about, not of the
   * menu used to complain — and the entry that starts this unmounts with the
   * menu, so what it takes is handed up here, which outlives it.
   */
  const reportBug = async () => {
    if (taking) return
    setTaking(true)
    setOpen(false)
    try {
      setShot(await captureScreen())
    } finally {
      setTaking(false)
    }
  }

  /* Clicking anywhere else closes it, which is what every other menu on the
     page does and what a pointer expects. Escape too: the card takes focus,
     and a thing that takes focus has to give it back. */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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

  /* Moving between routes closes it. The route is a pathname or a hash here,
     so both are listened for — the same two the router itself reads. */
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('popstate', close)
    window.addEventListener('hashchange', close)
    return () => {
      window.removeEventListener('popstate', close)
      window.removeEventListener('hashchange', close)
    }
  }, [])

  const { account, signedIn } = store
  const initials = initialsOf(account.name)

  return (
    <div className="acc" ref={ref}>
      <button
        type="button"
        className="acc__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={signedIn ? `Account — ${account.name}` : 'Signed out'}
        title={signedIn ? account.name : 'Signed out'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="acc__avatar" data-out={!signedIn || undefined} aria-hidden="true">
          {signedIn ? initials : '—'}
        </span>
      </button>

      {open && (
        <div className="acc__card" role="menu">
          {signedIn ? (
            <>
              <div className="acc__who">
                <span className="acc__avatar acc__avatar--lg" aria-hidden="true">
                  {initials}
                </span>
                <span className="acc__name">{account.name}</span>
                <span className="acc__email">{account.email}</span>
              </div>

              <span className="acc__rule" aria-hidden="true" />

              <div className="acc__row">
                <span className="acc__row-name">Language</span>
                <select
                  className="acc__lang"
                  aria-label="Language"
                  value={store.language}
                  onChange={(e) => store.setLanguage(e.target.value)}
                >
                  {UI_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="acc__rule" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                className="acc__item"
                disabled={taking}
                onClick={() => void reportBug()}
              >
                <BugIcon />
                {taking ? 'Taking a screenshot…' : 'Report a bug'}
              </button>
              <button
                type="button"
                role="menuitem"
                className="acc__item"
                onClick={() => {
                  setOpen(false)
                  setListing(true)
                }}
              >
                <ListIcon />
                Reported bugs
                {store.bugs.length > 0 && <span className="acc__count">{store.bugs.length}</span>}
              </button>

              <span className="acc__rule" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                className="acc__item acc__item--out"
                onClick={() => {
                  setOpen(false)
                  store.signOut()
                }}
              >
                Log out
              </button>
            </>
          ) : (
            /* Signed out, there is one thing to say and one thing to do. The
               way back in is here rather than behind a screen of its own:
               there is nothing to sign in to, and a mock that cannot be
               undone is a worse mock than one that can. */
            <>
              <div className="acc__who">
                <span className="acc__name">Signed out</span>
                <span className="acc__email">Nobody is reading this tool.</span>
              </div>
              <span className="acc__rule" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                className="acc__item"
                onClick={() => {
                  setOpen(false)
                  store.signIn()
                }}
              >
                Log back in
              </button>
            </>
          )}
        </div>
      )}

      {/* Outside the card's own condition on purpose: the entries that open
          these unmount with the card the moment they are pressed, so what they
          open has to be held by something that outlives them. */}
      {shot && (
        <BugReportOverlay shot={shot} onSend={store.report} onClose={() => setShot(null)} />
      )}
      <ReportedBugsSheet
        open={listing}
        bugs={store.bugs}
        onForget={store.forget}
        onClose={() => setListing(false)}
      />
    </div>
  )
}

/* Two glyphs the icon set does not carry, drawn rather than imported — the
   same call the hero studio makes for its own list icon. */

function BugIcon() {
  return (
    <svg
      className="acc__glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 6a3 3 0 0 1 6 0" />
      <rect x="7" y="8" width="10" height="12" rx="5" />
      <path d="M3 11h4M17 11h4M3 16h4M17 16h4M5 7l2 2M19 7l-2 2M5 20l2-2M19 20l-2-2" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg
      className="acc__glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}
