import { useEffect, useState } from 'react'
import './gate.css'

/**
 * The password screen, for a deployment that asks for one.
 *
 * Vercel's own Password Protection is an add-on this plan does not carry, and
 * its Vercel Authentication admits only people who are on the team — no use
 * for showing the tool to someone who is not. So the deployment asks for one
 * shared password, the way a preview link is usually shared.
 *
 * The screen is the softer half of it. The hard half is in the API routes,
 * which refuse a stranger whatever this component decides to draw: someone who
 * skips the screen still cannot reach the GitHub token or the Anthropic key.
 * This is here so that a person meets a door rather than a broken tool.
 *
 * A deployment with no password set never draws it — the check answers that it
 * is not required and the tool comes straight up, which is what happens on the
 * dev server and on any deployment where the variable is unset.
 */
export function Gate({ children }: { children: React.ReactNode }) {
  /** undefined while asking; true once the tool may be drawn. */
  const [open, setOpen] = useState<boolean | undefined>(undefined)
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/gate')
      .then((r) => (r.ok ? r.json() : { required: false, admitted: true }))
      .then((a: { required?: boolean; admitted?: boolean }) => {
        if (alive) setOpen(!a.required || Boolean(a.admitted))
      })
      /*
       * No route at all means no gate: the built app is also opened from a
       * file and from an artifact, where nothing answers and asking for a
       * password nobody can check would lock the tool for good.
       */
      .catch(() => alive && setOpen(true))
    return () => {
      alive = false
    }
  }, [])

  if (open === undefined) return null
  if (open) return <>{children}</>

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setWrong(false)
    const answer = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    setSending(false)
    if (answer?.ok) setOpen(true)
    else {
      setWrong(true)
      setPassword('')
    }
  }

  return (
    <main className="gate">
      <form className="gate__form" onSubmit={send}>
        <h1 className="gate__title">Agentic acquisition</h1>
        <p className="gate__note">
          {wrong ? 'That password did not match. Try again.' : 'Enter the password to view this preview.'}
        </p>
        <input
          className="gate__input"
          data-wrong={wrong || undefined}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          aria-label="Password"
          autoFocus
        />
        <button className="gate__cta" type="submit" disabled={sending || password.length === 0}>
          {sending ? 'Checking…' : 'View'}
        </button>
      </form>
    </main>
  )
}
