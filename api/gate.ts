/**
 * The door.
 *
 * GET says whether a password is wanted and whether this browser is already
 * through, so the app knows whether to draw the tool or the password screen.
 * POST takes a password and, on a match, sets the cookie the other routes
 * look for.
 *
 * Standing alone, like every other route here. Nothing in this folder imported
 * a sibling before tonight, and the deployment stopped answering the moment
 * they all did.
 *
 * The cookie holds the password rather than a signature of it. Every crypto
 * call available in this runtime has failed in production — the Web Crypto
 * global and Node's own, one after the other — and the cookie is httpOnly so
 * no script can read it, Secure so it never travels in the clear, and
 * SameSite so it is not sent from anywhere else. The person holding it typed
 * the password to get it. A gate that works beats a gate with a nicer cookie.
 */

const COOKIE = 'acq_gate'
const WEEK = 60 * 60 * 24 * 7

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra },
  })

function admitted(request: Request, password: string): boolean {
  const mine = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  return Boolean(mine && mine === encodeURIComponent(password))
}

export default async function handler(request: Request): Promise<Response> {
  const password = process.env.SITE_PASSWORD

  if (request.method === 'GET') {
    return json({
      required: Boolean(password),
      admitted: password ? admitted(request, password) : true,
    })
  }

  if (request.method !== 'POST') {
    return json({ error: `${request.method} is not supported here.` }, 405)
  }

  // Nothing to check against, so nothing to refuse.
  if (!password) return json({ admitted: true })

  const body = (await request.json().catch(() => ({}))) as { password?: unknown }
  const given = typeof body.password === 'string' ? body.password : ''

  if (given !== password) return json({ admitted: false }, 401)

  /*
   * A week: long enough not to ask someone twice in an afternoon, short enough
   * that access lapses on its own. Changing the password in Vercel invalidates
   * every cookie already handed out, which is how access is taken back.
   */
  return json({ admitted: true }, 200, {
    'set-cookie': `${COOKIE}=${encodeURIComponent(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${WEEK}`,
  })
}
