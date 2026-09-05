/**
 * Where the password page posts.
 *
 * Sits outside the middleware's matcher, because a door needs a handle on the
 * outside. It checks the password, and on a match sets the cookie the
 * middleware looks for — a signature of the password rather than the password,
 * so what is stored in the browser cannot be read back out and used elsewhere.
 *
 * The cookie is httpOnly and secure: script on the page cannot read it, and it
 * does not travel over plain http. A week is long enough that somebody
 * demoing the tool is not asked twice in an afternoon, and short enough that
 * access lapses on its own.
 */

const COOKIE = 'acq_gate'
const WEEK = 60 * 60 * 24 * 7

async function stamp(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(COOKIE))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Use POST.', { status: 405 })
  }

  const password = process.env.SITE_PASSWORD
  // No password set means no gate; nothing here has anything to check.
  if (!password) return Response.redirect(new URL('/', request.url), 303)

  const form = await request.formData()
  const given = String(form.get('password') ?? '')

  if (!same(given, password)) {
    return Response.redirect(new URL('/?wrong=1', request.url), 303)
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: new URL('/', request.url).toString(),
      'set-cookie': `${COOKIE}=${await stamp(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${WEEK}`,
    },
  })
}
