import { COOKIE, WEEK, admitted, required, same, stamp } from './_password'

/**
 * The door.
 *
 * GET says whether this browser is already through, so the app knows whether
 * to draw the tool or the password screen. POST takes a password and, if it
 * matches, sets the cookie the other routes look for.
 *
 * The one route that does not guard itself — a door with a lock on the outside
 * is not a door.
 */
export default async function handler(request: Request): Promise<Response> {
  const password = required()

  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({ required: Boolean(password), admitted: await admitted(request) }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: `${request.method} is not supported here.` }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Nothing to check against, so nothing to refuse.
  if (!password) {
    return new Response(JSON.stringify({ admitted: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown }
  const given = typeof body.password === 'string' ? body.password : ''

  if (!same(given, password)) {
    return new Response(JSON.stringify({ admitted: false }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  /*
   * httpOnly so script on the page cannot read it back out, secure so it does
   * not travel in the clear, and a week long — long enough not to ask someone
   * twice in an afternoon, short enough that access lapses on its own.
   *
   * Because the value is derived from the password, changing the password in
   * Vercel invalidates every cookie already handed out. That is the way to
   * revoke access from someone you would rather did not have it.
   */
  return new Response(JSON.stringify({ admitted: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': `${COOKIE}=${stamp(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${WEEK}`,
    },
  })
}
