import type { CardSet } from '../rules/content'

/**
 * Client for the shared content store (`/api/content`).
 *
 * Every call is allowed to fail. The editor works offline, on a local dev
 * server with no token, and on a deployment where the token has not been set —
 * in each case it falls back to the browser's own copy and says which it is
 * using, rather than pretending to be shared when it is not.
 */

/** Where the shared copy lives when there is no write API: a file in the repo. */
export const CONTENT_FILE = '/content/card-set.json'

export type RemoteState =
  | { kind: 'file'; set: CardSet }
  | { kind: 'unconfigured'; reason: string }
  | { kind: 'unpublished' }
  | { kind: 'published'; sha: string; set: CardSet }
  | { kind: 'unreachable'; reason: string }

/**
 * The content file committed to the repository.
 *
 * This is the shared copy in its simplest form: everyone who opens the URL
 * fetches the same bytes from the same commit, with no token, no API and no
 * account. Publishing is committing the file — by hand for now, or by the
 * route above once a token exists.
 */
async function loadFile(): Promise<RemoteState | null> {
  try {
    const res = await fetch(CONTENT_FILE, { headers: { accept: 'application/json' } })
    if (!res.ok) return null
    // A dev server answers unknown paths with the app's own HTML, so the
    // content type is what distinguishes "no file" from "a file".
    if (!res.headers.get('content-type')?.includes('json')) return null
    return { kind: 'file', set: (await res.json()) as CardSet }
  } catch {
    return null
  }
}

export async function loadRemote(): Promise<RemoteState> {

  try {
    const res = await fetch('/api/content', { headers: { accept: 'application/json' } })
    if (!res.ok) return (await loadFile()) ?? { kind: 'unreachable', reason: `The content store returned ${res.status}.` }
    const body = (await res.json()) as {
      configured: boolean
      published?: boolean
      reason?: string
      sha?: string
      set?: CardSet
    }
    if (!body.configured) {
      return (
        (await loadFile()) ?? {
          kind: 'unconfigured',
          reason: body.reason ?? 'No content store on this deployment.',
        }
      )
    }
    if (!body.published || !body.set || !body.sha) return (await loadFile()) ?? { kind: 'unpublished' }
    return { kind: 'published', sha: body.sha, set: body.set }
  } catch (error) {
    // A dev server with no API routes answers with the app's own HTML, which
    // fails to parse. That is the ordinary local case, not a fault.
    return (
      (await loadFile()) ?? {
        kind: 'unreachable',
        reason: error instanceof Error ? error.message : String(error),
      }
    )
  }
}

export type PublishResult =
  | { ok: true; sha: string; commit: string }
  | { ok: false; conflict: boolean; error: string }

export async function publishRemote(
  set: CardSet,
  sha: string | null,
  message: string,
): Promise<PublishResult> {
  try {
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ set, sha, message }),
    })
    const body = (await res.json()) as {
      sha?: string
      commit?: string
      error?: string
      conflict?: boolean
      configured?: boolean
      reason?: string
    }
    if (!res.ok || !body.sha || !body.commit) {
      // The route answers 200 with { configured: false } when it has no token,
      // so reporting the status alone said "returned 200" — true, and no use
      // to anyone. Its own reason says what is missing.
      const unconfigured =
        body.configured === false
          ? `Nothing was published — ${body.reason ?? 'the content store is not set up here.'}`
          : null
      return {
        ok: false,
        conflict: Boolean(body.conflict) || res.status === 409,
        error: body.error ?? unconfigured ?? `The content store returned ${res.status}.`,
      }
    }
    return { ok: true, sha: body.sha, commit: body.commit }
  } catch (error) {
    return {
      ok: false,
      conflict: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
