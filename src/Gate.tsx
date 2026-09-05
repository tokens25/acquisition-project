import { useState } from 'react'
import './gate.css'

/**
 * The password screen.
 *
 * The password comes from VITE_SITE_PASSWORD, which Vite reads at build time
 * and writes into the bundle. Set it in Vercel and redeploy; change it and
 * redeploy to change it; remove it and the screen never appears again.
 *
 * A curtain, not a lock, and worth being plain about: the password is in the
 * JavaScript this page downloads, so anyone who opens the bundle and looks can
 * find it. It stops the link being opened by whoever happens to have it. It
 * would not stop somebody who wanted in.
 *
 * The lock would have been the API routes refusing a stranger, and those still
 * carry the check — but no function on this deployment runs, so nothing could
 * be built on one answering. That is why this asks nobody anything and decides
 * on its own.
 */

/** What the build was given, if anything. */
const EXPECTED = (import.meta.env.VITE_SITE_PASSWORD as string | undefined) ?? ''
const REMEMBERED = 'acq-gate'

/**
 * Whether this browser has already been let in.
 *
 * What is kept is the password itself, which is no secret from this page — it
 * is in the bundle either way. Keeping it rather than a marker means changing
 * the password in Vercel turns everyone out, because what they kept no longer
 * matches what the build expects.
 */
function remembered(): boolean {
  if (!EXPECTED) return true
  try {
    return window.localStorage.getItem(REMEMBERED) === EXPECTED
  } catch {
    // A browser that refuses storage still gets to type the password.
    return false
  }
}

export function Gate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(remembered)
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)

  if (open) return <>{children}</>

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== EXPECTED) {
      setWrong(true)
      setPassword('')
      return
    }
    try {
      window.localStorage.setItem(REMEMBERED, EXPECTED)
    } catch {
      // Not remembering is survivable; being let in is the point.
    }
    setOpen(true)
  }

  return (
    <main className="gate">
      <form className="gate__form" onSubmit={send}>
        <h1 className="gate__title">Agentic acquisition</h1>
        <p className="gate__note">
          {wrong
            ? 'That password did not match. Try again.'
            : 'Enter the password to view this preview.'}
        </p>
        <input
          className="gate__input"
          data-wrong={wrong || undefined}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setWrong(false)
          }}
          autoComplete="current-password"
          aria-label="Password"
          autoFocus
        />
        <button className="gate__cta" type="submit" disabled={password.length === 0}>
          View
        </button>
      </form>
    </main>
  )
}
