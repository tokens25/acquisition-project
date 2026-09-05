import { next } from '@vercel/edge'

/**
 * A password on the door.
 *
 * Vercel's own Password Protection is an add-on this plan does not carry, and
 * its Vercel Authentication only admits people who are on the team — which is
 * no use for showing the tool to someone who is not. This asks for one shared
 * password instead, the way a preview link is usually shared.
 *
 * It runs at the edge, before anything else: the pages, the assets and the API
 * routes all sit behind it. That last part is the point. The functions in
 * `api/` carry a GitHub token with write access to this repository and an
 * Anthropic key that bills per call, and nothing in them checks who is asking
 * — so leaving them reachable is a worse hole than an open preview.
 *
 * Silent until it is switched on: with no SITE_PASSWORD set it lets everything
 * through. Deploying it therefore changes nothing, and setting the variable in
 * Vercel is what closes the door — which means the door can be closed without
 * a deploy, and opened again the same way.
 */

export const config = {
  /*
   * Everything except the gate itself and the favicon — the favicon so the
   * password page has one, the gate so the form has somewhere to post to.
   */
  matcher: ['/((?!api/gate|favicon).*)'],
}

const COOKIE = 'acq_gate'

/** The cookie's value: a signature of the password, not the password. */
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

/** Compared byte by byte to the end, so the answer takes the same time either way. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function page(wrong: boolean): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agentic acquisition</title>
<style>
  :root { color-scheme: dark }
  body {
    display: grid; place-items: center; min-height: 100svh; margin: 0;
    background: #080e12; color: #f9fafa;
    font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  form { display: grid; gap: 16px; width: min(320px, calc(100vw - 48px)) }
  h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em }
  p { margin: 0; color: #b3b9bb; font-size: 14px }
  input {
    box-sizing: border-box; width: 100%; height: 48px; padding: 0 16px;
    border: 1px solid ${wrong ? '#d12424' : '#3d4549'}; border-radius: 10px;
    background: #0c161c; color: #f9fafa; font: inherit;
  }
  input:focus-visible { outline: 2px solid #f2af3d; outline-offset: 2px }
  button {
    height: 48px; border: 0; border-radius: 8px; background: #f9fafa;
    color: #080e12; font: inherit; font-weight: 700; cursor: pointer;
  }
</style>
</head>
<body>
  <form method="POST" action="/api/gate">
    <h1>Agentic acquisition</h1>
    <p>${wrong ? 'That password did not match. Try again.' : 'Enter the password to view this preview.'}</p>
    <input type="password" name="password" autocomplete="current-password" autofocus aria-label="Password">
    <button type="submit">View</button>
  </form>
</body>
</html>`,
    { status: wrong ? 401 : 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  )
}

export default async function middleware(request: Request) {
  const password = process.env.SITE_PASSWORD
  // Nothing set, nothing guarded. The variable is the switch.
  if (!password) return next()

  const expected = await stamp(password)
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)

  if (cookie && same(cookie, expected)) return next()

  /*
   * An API route answers 401 rather than a login page: whatever called it is
   * not a person who can type, and an HTML page in place of JSON is a worse
   * error than the one it is reporting.
   */
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'This preview is password protected.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  return page(url.searchParams.has('wrong'))
}
