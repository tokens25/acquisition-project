import { spawn } from 'node:child_process'

/**
 * Runs Claude Code against this repo, from the feedback console.
 *
 * The console lists every named part of the tool with a box to write what
 * should change. This is what that box is wired to: press send and the
 * instruction goes straight to an agent working in this checkout, instead of
 * being copied into a chat by hand.
 *
 * **Local development only.** It spawns a process that edits files, so it must
 * never answer on a deployed host — the guard below is the whole reason this
 * file is safe to keep in `api/`, which Vercel builds and serves.
 *
 * Edits land in the working tree and nothing is committed, so `git diff` is
 * always the review step. The default permission mode lets the agent write
 * files but not run commands; set CONSOLE_PERMISSION_MODE in .env to widen it.
 */

/** Vercel sets these; a laptop does not. */
function isDeployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

const MODE = process.env.CONSOLE_PERMISSION_MODE ?? 'acceptEdits'
const TIMEOUT_MS = 10 * 60 * 1000
const MAX_PROMPT = 8000

/** One at a time. Two agents editing the same files would fight. */
let running: Promise<Response> | null = null

type Ask = {
  /** What to do. Assembled by the console from one row, or from all of them. */
  prompt?: string
  /** Where the note came from, so the agent does not have to rediscover it. */
  name?: string
  anchor?: string
  section?: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/**
 * Frames one row's note as an instruction.
 *
 * The console knows which component the note is about and what it is called in
 * the code, so it says so rather than making the agent infer it from a
 * sentence fragment.
 */
function framePrompt(ask: Ask): string {
  const note = (ask.prompt ?? '').trim()
  if (!note) return ''
  if (!ask.name) return note

  return [
    'Feedback on the acquisition tool, sent from the feedback console.',
    '',
    `Component: **${ask.name}**${ask.anchor ? ` (\`${ask.anchor}\`)` : ''}`,
    ask.section ? `Where: ${ask.section}` : '',
    '',
    'What should change:',
    note,
    '',
    'NAMING.md maps every component name to where it lives. Make the change,',
    'keep the build passing, and do not commit — leave it in the working tree.',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

/**
 * The shared password, if this deployment asks for one.
 *
 * Written out in each route rather than shared from one module. Nothing in
 * this folder imported a sibling before, and the deployment stopped answering
 * the moment they all did — so the routes go back to standing alone, which is
 * the arrangement that has always worked here.
 *
 * No hashing either. The cookie holds the password, which the person holding
 * it typed in the first place; it is httpOnly so no script can read it back,
 * Secure so it never travels in the clear, and SameSite so it is not sent from
 * anywhere else. Every crypto call available here has now failed in
 * production, and a gate that works beats a gate with a nicer cookie.
 */
function shut(request: Request): Response | null {
  const password = process.env.SITE_PASSWORD
  if (!password) return null
  const mine = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('acq_gate='))
    ?.slice('acq_gate='.length)
  if (mine && mine === encodeURIComponent(password)) return null
  return new Response(JSON.stringify({ error: 'This preview is password protected.' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  // Nothing here answers a stranger while a password is set.
  const closed = shut(request)
  if (closed) return closed

  // Availability probe. The console calls this on load and hides its send
  // buttons when it gets no answer — which is what happens when the page is
  // opened as a published artifact rather than from the dev server.
  if (request.method === 'GET') {
    if (isDeployed()) return json({ available: false, reason: 'deployed' }, 404)
    return json({ available: true, mode: MODE, busy: Boolean(running) })
  }

  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  if (isDeployed()) {
    return json({ error: 'This route only runs on a local dev server.' }, 404)
  }

  let ask: Ask
  try {
    ask = (await request.json()) as Ask
  } catch {
    return json({ error: 'Body must be JSON.' }, 400)
  }

  const prompt = framePrompt(ask)
  if (!prompt) return json({ error: 'Nothing to send — the note is empty.' }, 400)
  if (prompt.length > MAX_PROMPT) {
    return json(
      { error: `Note is too long — ${prompt.length} characters, and the limit is ${MAX_PROMPT}.` },
      400,
    )
  }

  if (running) {
    return json({ error: 'Claude is already working on something. Wait for that to finish.' }, 409)
  }

  const work = run(prompt)
  running = work
  try {
    return await work
  } finally {
    running = null
  }
}

function run(prompt: string): Promise<Response> {
  return new Promise((resolve) => {
    const started = Date.now()
    const child = spawn('claude', ['-p', '--output-format', 'json', '--permission-mode', MODE], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let out = ''
    let err = ''
    let done = false

    const finish = (body: unknown, status = 200) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(json(body, status))
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish({ error: `Timed out after ${TIMEOUT_MS / 60000} minutes.` }, 504)
    }, TIMEOUT_MS)

    child.stdout.on('data', (chunk) => (out += chunk))
    child.stderr.on('data', (chunk) => (err += chunk))

    child.on('error', (error) => {
      const missing = (error as NodeJS.ErrnoException).code === 'ENOENT'
      finish(
        {
          error: missing
            ? 'The `claude` command is not on PATH for the dev server. Restart it from a shell where `claude` runs.'
            : error.message,
        },
        500,
      )
    })

    child.on('close', (code) => {
      const seconds = Math.round((Date.now() - started) / 1000)

      // Parse stdout before looking at the exit code. A run that fails —
      // expired credentials, a refused tool — still prints its JSON and exits
      // non-zero, and that JSON holds the only useful sentence. Reporting the
      // exit code instead would say "exited with code 1" and throw the reason
      // away.
      let parsed:
        | { result?: string; is_error?: boolean; total_cost_usd?: number; num_turns?: number }
        | null = null
      try {
        parsed = JSON.parse(out)
      } catch {
        parsed = null
      }

      if (parsed) {
        const message = (parsed.result ?? '').trim()
        if (parsed.is_error) {
          return finish({ error: message || `claude exited with code ${code}.`, seconds }, 502)
        }
        return finish({
          ok: true,
          result: message,
          cost: parsed.total_cost_usd ?? null,
          turns: parsed.num_turns ?? null,
          seconds,
        })
      }

      if (code !== 0) {
        return finish({ error: err.trim() || `claude exited with code ${code}.`, seconds }, 500)
      }
      // Zero exit with unparseable stdout: pass it through rather than guess.
      finish({ ok: true, result: out.trim(), seconds })
    })

    child.stdin.write(prompt)
    child.stdin.end()
  })
}
