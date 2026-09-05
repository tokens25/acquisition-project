/**
 * Translating the journey's words into a market's language.
 *
 * Same discipline as the Coach's copy: a translation carries the words across
 * and nothing else. It may not change a number, a price, a date or a brand,
 * and it may not add a claim or an urgency the English did not have. What
 * comes back is machine translation and is labelled as such all the way to the
 * screen: a person promotes it before it can be published.
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required, or a signed-in `claude` on a dev machine
 *   ANTHROPIC_MODEL     optional, defaults to claude-opus-5
 */
import { guard } from './_password'
import { spawn } from 'node:child_process'

/**
 * The environment a spawned `claude` should see.
 *
 * The dev server inherits whatever shell started it, and when that shell is
 * itself a Claude Code session it carries that session's own credentials and
 * flags. A child reading those tries to use a token it does not own, which
 * fails as an expired token rather than as the misconfiguration it is. So the
 * child gets a plain environment and reads the machine's own login.
 */
function cleanEnv(): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {}
  for (const [k, v] of Object.entries(process.env)) {
    // The one Claude variable worth keeping: a long-lived token from
    // `claude setup-token`, which is how this project authenticates when the
    // command's own login has lapsed. Everything else a parent session
    // exports is its own business and confuses the child.
    if (k === 'CLAUDE_CODE_OAUTH_TOKEN') {
      out[k] = v
      continue
    }
    if (/^(CLAUDE|CLAUDECODE|ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN)/.test(k)) continue
    out[k] = v
  }
  return out
}

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const CLI_TIMEOUT_MS = 4 * 60 * 1000
/**
 * Enough for a whole journey's copy in one pass, not enough to be a bill.
 *
 * The journey outgrew the old cap of 120 as more of the screens became things
 * you can write, and the strings past it were quietly dropped: a Spanish
 * journey with an English checkout. The cap is now well clear of the whole
 * journey, and what it does drop is reported rather than swallowed.
 */
const MAX_STRINGS = 400
/**
 * How many strings go in one ask.
 *
 * A whole journey in a single call is the slowest way to get it: the model
 * writes ninety answers one after another while the person watches nothing
 * happen. Split into batches that run at the same time, the wait is roughly
 * the longest batch rather than the sum of all of them. Small enough to be
 * quick, large enough that a screen's strings mostly stay together.
 */
const BATCH = 24
/** How many batches may be in the air at once. */
const LANES = 6

function isDeployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

const TOOL = {
  name: 'return_translation',
  description: 'Return one translation per string, keyed as they were given.',
  input_schema: {
    type: 'object' as const,
    properties: {
      strings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            text: { type: 'string', description: 'The translated words. Nothing else.' },
          },
          required: ['key', 'text'],
        },
      },
    },
    required: ['strings'],
  },
}

/**
 * The same standard the Coach holds every other line to.
 *
 * A translation is not exempt from it. The English was written to these, so a
 * translation that reads worse than the English has lost something even where
 * every word is technically right.
 */
const COPY_CRITERIA = `THE STANDARD THE ENGLISH WAS WRITTEN TO. Your line is read the same way, so write to the same standard:
- CLARITY: understood in one read, no work. The easier a line is to process, the more readily it is believed and acted on. Where a literal translation reads as work, write the line a native speaker would have written.
- SPECIFICITY: whatever the English names concretely, name concretely. Never soften a team, a competition, an offer or a device into a category word.
- VALUE: keep the reason to care. A benefit translated into a description has lost the line's job.
- SELF-CONTAINED: each line is read without the others. Never make it depend on a phrase from another screen to make sense.
- CONSISTENCY: one thing has one name across every screen. Pick the word for a plan, a payment, a sign-in once and use that same word everywhere it appears, in every string you return.
- CONTINUITY: a line keeps the promise the screen before it made. Where two strings are a promise and its answer, translate them so they still answer each other.
- REGISTER: what a sports fan reads, not what a contract says. Plain, short, sentence case, and the conventional wording of the market rather than a word-for-word carry across.`

function systemPrompt(language: string, keep: string[]): string {
  return `You translate the words of a DAZN sign-up journey into ${language}. You are translating a real product, not a document: every string you return goes straight onto a screen.

${COPY_CRITERIA}

WHAT A TRANSLATION MAY DO
- Carry the meaning across in the natural ${language} a sports fan would read. Not word for word where that reads badly.
- Match the register of the English: plain, short, sentence case, no exclamation marks.
- Keep it about as long as the English. A button that no longer fits is a broken button, so prefer the shorter phrasing.
- Use the conventional ${language} wording for the things every subscription screen has: a sign-in, a password, a billing period, a card number, a promo code.

WHAT A TRANSLATION MAY NEVER DO
- Change a number, a price, a currency symbol, a percentage, a date or a duration. Copy them exactly as they appear, in the position the sentence needs.
- Translate a brand or a name. These stay exactly as written: ${keep.join(', ')}. Also leave Apple, Google, Facebook, Google Pay, Paypal, Visa and Mastercard alone.
- Add anything the English does not say: no claim, no urgency, no benefit, no reassurance.
- Drop anything the English does say, including a legal condition or a cancellation term. A shorter legal line is a changed legal line.
- Use a dash of any kind.

HOW IT IS CHECKED
Everything you return is checked before anyone sees it, the same way the Coach checks every other line this tool writes. A string that changes, drops or adds a number, loses one of the names above, uses a dash, or runs far longer than the English is thrown away and the screen keeps the English. So a careful line that fits is worth more than a clever one.

Return one entry per key you were given, with the same key. If a string should stay exactly as it is (a brand on its own, a code), return it unchanged.

Answer only by calling return_translation.`
}

function askViaCli(system: string, user: string): Promise<{ strings: unknown[] } | { error: string }> {
  const prompt = [system, '', user, '', 'Reply with ONE JSON object and nothing else, shaped exactly like this schema:', JSON.stringify(TOOL.input_schema)].join('\n')
  return new Promise((resolve) => {
    const child = spawn('claude', ['-p', '--output-format', 'json'], { cwd: process.cwd(), env: cleanEnv(), stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let done = false
    const finish = (v: { strings: unknown[] } | { error: string }) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(v)
    }
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish({ error: 'The translation took too long.' })
    }, CLI_TIMEOUT_MS)
    child.stdout.on('data', (c) => (out += c))
    child.stderr.on('data', (c) => (err += c))
    child.on('error', (error) =>
      finish({
        error:
          (error as NodeJS.ErrnoException).code === 'ENOENT'
            ? 'The `claude` command is not on PATH for the dev server. Restart it from a shell where `claude` runs.'
            : error.message,
      }),
    )
    child.on('close', () => {
      let parsed: { result?: string; is_error?: boolean } | null = null
      try {
        parsed = JSON.parse(out)
      } catch {
        parsed = null
      }
      if (parsed?.is_error) return finish({ error: (parsed.result ?? '').trim() || err.trim() || 'The translation failed.' })
      const text = (parsed?.result ?? out).trim()
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start < 0 || end < start) return finish({ error: 'The translator did not answer with JSON.' })
      try {
        const obj = JSON.parse(text.slice(start, end + 1)) as { strings?: unknown[] }
        finish({ strings: Array.isArray(obj.strings) ? obj.strings : [] })
      } catch {
        finish({ error: 'The translator answered with JSON that could not be read.' })
      }
    })
    child.stdin.write(prompt)
    child.stdin.end()
  })
}

export default async function handler(request: Request): Promise<Response> {
  // Nothing here answers a stranger while a password is set.
  const shut = await guard(request)
  if (shut) return shut

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

  const key = process.env.ANTHROPIC_API_KEY
  const cli = !key && !isDeployed()
  const token = Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN)
  if (request.method === 'GET') {
    if (key) return json({ configured: true, model: MODEL, via: 'api' })
    if (cli) return json({ configured: true, model: token ? 'claude (project token)' : 'claude (signed-in CLI)', via: 'cli' })
    return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set.' })
  }
  if (request.method !== 'POST') return json({ error: `${request.method} is not supported.` }, 405)
  if (!key && !cli) return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set.' })

  try {
    const body = (await request.json()) as {
      language?: string
      market?: string
      keep?: string[]
      strings?: { key: string; label?: string; text: string }[]
    }
    const asked = body.strings ?? []
    const strings = asked.slice(0, MAX_STRINGS)
    const dropped = asked.length - strings.length
    if (!body.language || strings.length === 0) return json({ error: 'Body must include a language and some strings.' }, 400)

    const userFor = (batch: typeof strings) =>
      [
        `Market: ${body.market ?? 'unknown'}. Language: ${body.language}.`,
        '',
        'The strings, one per line, as key then the English:',
        ...batch.map((s) => `- ${s.key}${s.label ? ` (${s.label})` : ''}: ${JSON.stringify(s.text)}`),
      ].join('\n')
    const user = userFor(strings)

    const system = systemPrompt(body.language, body.keep ?? ['DAZN'])

    if (cli) {
      const batches: typeof strings[] = []
      for (let i = 0; i < strings.length; i += BATCH) batches.push(strings.slice(i, i + BATCH))
      // Six at a time: enough that a journey comes back in seconds, few enough
      // that a long journey does not open twenty processes on the machine.
      const answers: Awaited<ReturnType<typeof askViaCli>>[] = []
      for (let i = 0; i < batches.length; i += LANES) {
        answers.push(...(await Promise.all(batches.slice(i, i + LANES).map((batch) => askViaCli(system, userFor(batch))))))
      }
      const out: unknown[] = []
      const failed: string[] = []
      for (const answer of answers) {
        if ('error' in answer) failed.push(answer.error)
        else out.push(...answer.strings)
      }
      // Some words are better than none: a batch that failed leaves its own
      // strings in English and says so, rather than throwing the rest away.
      if (out.length === 0) return json({ error: failed[0] ?? 'The translation failed.' }, 502)
      const note = failed[0] ?? (dropped > 0 ? `${dropped} strings were past the limit of ${MAX_STRINGS} and stayed in English.` : null)
      return json({ configured: true, via: 'cli', strings: out, note })
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        system,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'return_translation' },
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (!res.ok) return json({ error: `Anthropic returned ${res.status}: ${await res.text()}` }, 502)
    const reply = (await res.json()) as { content: { type: string; name?: string; input?: { strings?: unknown[] } }[] }
    const call = reply.content.find((c) => c.type === 'tool_use' && c.name === 'return_translation')
    return json({ configured: true, strings: Array.isArray(call?.input?.strings) ? call!.input!.strings! : [] })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502)
  }
}
