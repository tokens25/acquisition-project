/**
 * The shared password, and the cookie that stands in for it.
 *
 * Underscored so Vercel treats it as a module rather than a route: everything
 * else in this folder answers a URL, and this answers the other files.
 *
 * The five routes here hold a GitHub token with write access to this
 * repository and an Anthropic key that bills per call, and none of them used
 * to ask who was calling. A deployment anyone can open is therefore a
 * repository anyone can commit to. This is what closes that.
 *
 * Silent until it is switched on: with no SITE_PASSWORD set every check
 * passes, so the routes behave exactly as they did. Setting the variable in
 * Vercel is what starts the asking, and removing it stops.
 */

import { createHmac } from 'node:crypto'

export const COOKIE = 'acq_gate'
export const WEEK = 60 * 60 * 24 * 7

/**
 * What the browser is given: a signature of the password, never the password.
 *
 * Node's own crypto rather than the Web Crypto global. `crypto.subtle` is not
 * dependable in the runtime these functions run in, and reaching for it is
 * what crashed this deployment twice: the code only touched it once a password
 * was set, so the deployment worked until the moment it was switched on. Both
 * produce the same digest — this one is just always there.
 */
export function stamp(password: string): string {
  return createHmac('sha256', password).update(COOKIE).digest('hex')
}

/** Compared to the end either way, so how long it takes says nothing. */
export function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** The password this deployment is asking for, or nothing if it asks for none. */
export function required(): string | undefined {
  const set = process.env.SITE_PASSWORD
  return set && set.length > 0 ? set : undefined
}

/** Whether this request carries a cookie minted from the current password. */
export async function admitted(request: Request): Promise<boolean> {
  const password = required()
  if (!password) return true
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  return Boolean(cookie && same(cookie, stamp(password)))
}

/**
 * The refusal a route returns when it is not going to answer.
 *
 * JSON rather than a page: whatever called this is code, and an HTML login
 * screen in place of the answer is a worse error than the one being reported.
 */
export function refuse(): Response {
  return new Response(JSON.stringify({ error: 'This preview is password protected.' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/** `const no = await guard(request); if (no) return no` at the top of a route. */
export async function guard(request: Request): Promise<Response | null> {
  return (await admitted(request)) ? null : refuse()
}
