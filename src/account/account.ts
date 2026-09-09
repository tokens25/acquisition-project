import { useCallback, useEffect, useState } from 'react'

/**
 * Who is signed in, and the two or three things they can do about it.
 *
 * Ported in shape from the hero studio's `AppUserMenu`, which reads a real
 * session out of an auth provider. There is no auth here and nothing to sign
 * in to, so the account is a stated fact rather than a lookup: one name, one
 * address, written down once below.
 *
 * What is real is everything the menu does with it. The language sticks, the
 * bugs are kept, signing out signs out — all in this browser, under the same
 * keys the rest of the tool uses for the things it holds outside content.
 * Nothing here is a stub that swallows a click.
 */

export interface Account {
  name: string
  email: string
}

/**
 * The account the tool is used under.
 *
 * One place, because it is the one thing here that is genuinely made up: a
 * real session would arrive from whatever signs people in, and until there is
 * one this is what the menu shows.
 */
export const ACCOUNT: Account = {
  name: 'Alex Osipov',
  email: 'Alex.Osipov@ext.dazn.com',
}

/**
 * The letters on the avatar.
 *
 * First and last, which is what a two-word name gives; a one-word name gives
 * its first letter and nothing invented to keep it company.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

/** The languages the tool offers to be read in — the hero studio's own list. */
export const UI_LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇧🇪' },
]

export const DEFAULT_LANGUAGE = 'en'

/**
 * One thing somebody hit, kept so it can be looked at again.
 *
 * A picture and a sentence. The picture is the screen as it was, with whatever
 * was drawn on it burnt in — one flat PNG rather than a photograph and a layer
 * of marks to line up again later.
 */
export interface BugReport {
  id: string
  /** When it was written, as an ISO stamp. */
  at: string
  /** The route it was written from, which is most of what makes it findable. */
  where: string
  /** What they said. A report with a picture and no words is still a report. */
  note: string
  /** Who wrote it. One account here, but a report says who filed it. */
  by: string
  /** The marked-up screen, as a data URL. */
  shot: string
}

interface Session {
  signedIn: boolean
  language: string
}

const SESSION_KEY = 'acquisition-account-v1'
const BUGS_KEY = 'acquisition-bugs-v1'

const DEFAULT_SESSION: Session = { signedIn: true, language: DEFAULT_LANGUAGE }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback
  } catch {
    return fallback
  }
}

function readBugs(): BugReport[] {
  try {
    const raw = localStorage.getItem(BUGS_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? (list as BugReport[]) : []
  } catch {
    return []
  }
}

/**
 * Kept, or not — and the caller is told which.
 *
 * Screenshots are the one thing here big enough to fill a browser's store, and
 * a report that silently failed to save is worse than one that was refused out
 * loud: the reporter walks away believing they have filed it.
 */
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export interface AccountStore {
  account: Account
  /** Signed out, the menu offers the way back in and nothing else. */
  signedIn: boolean
  signIn: () => void
  signOut: () => void
  language: string
  setLanguage: (code: string) => void
  bugs: BugReport[]
  /**
   * Write one down, against wherever the reader is.
   *
   * False means the browser refused to keep it, which for a picture this size
   * is a thing that actually happens — see `write`.
   */
  report: (note: string, shot: string, where: string) => boolean
  forget: (id: string) => void
}

export function useAccount(): AccountStore {
  const [session, setSession] = useState<Session>(() => readJson(SESSION_KEY, DEFAULT_SESSION))
  const [bugs, setBugs] = useState<BugReport[]>(readBugs)

  const save = useCallback((next: Session) => {
    setSession(next)
    write(SESSION_KEY, next)
  }, [])


  /*
   * Another tab is the same person.
   *
   * Signing out in one window and staying signed in in the next is the kind of
   * thing that reads as a bug rather than as two windows, so the one event the
   * browser already sends is listened for.
   */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) setSession(readJson(SESSION_KEY, DEFAULT_SESSION))
      if (e.key === BUGS_KEY) setBugs(readBugs())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const keep = useCallback((next: BugReport[]) => {
    if (!write(BUGS_KEY, next)) return false
    setBugs(next)
    return true
  }, [])

  return {
    account: ACCOUNT,
    signedIn: session.signedIn,
    signIn: () => save({ ...session, signedIn: true }),
    signOut: () => save({ ...session, signedIn: false }),
    language: session.language,
    setLanguage: (code) => save({ ...session, language: code }),
    bugs,
    report: (note, shot, where) =>
      keep([
        {
          id: `bug-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          where,
          note: note.trim(),
          by: ACCOUNT.name,
          shot,
        },
        ...bugs,
      ]),
    forget: (id) => keep(bugs.filter((b) => b.id !== id)),
  }
}
