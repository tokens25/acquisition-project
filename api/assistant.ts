/**
 * Content assistant — a proxy to the Anthropic Messages API.
 *
 * It exists as a server route for one reason: the key. An API key in the
 * browser is readable by anyone with the page open, and this is a company tool
 * on a company deployment.
 *
 * The model is given the content and the rules that govern it, and answers with
 * prose, a proposal, or both. It never writes anything: a proposal comes back
 * as structured changes for a person to read and apply. The publish gate then
 * checks the result exactly as it checks anything typed by hand — which is why
 * letting a model draft copy here is safe in a way it would not be in a
 * document.
 *
 * Configuration (Vercel environment variables):
 *   ANTHROPIC_API_KEY   required
 *   ANTHROPIC_MODEL     optional, defaults to claude-opus-5
 */

import { spawn } from 'node:child_process'

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

/** Vercel sets these; a laptop does not. */
function isDeployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

/**
 * The icon question, asked of the `claude` CLI instead of the API.
 *
 * A dev machine that has never been given an API key still has Claude Code
 * signed in — which is the difference between this button working on a laptop
 * and being permanently greyed out there. Only for the small ask: it answers
 * with one word from a list we supply, so there is nothing to review.
 *
 * No permission mode is passed, so the default applies and tool use is denied
 * rather than prompted. It can answer the question and nothing else.
 */
function suggestViaCli(
  ask: { text: string; icons: { id: string; means: string }[] },
  json: (body: unknown, status?: number) => Response,
): Promise<Response> {
  const prompt = [
    'Pick the icon that best matches this line of copy on a sports streaming',
    'subscription card. Reply with the id alone and nothing else.',
    '',
    `Line: ${ask.text.trim()}`,
    '',
    'Icons:',
    ...ask.icons.map((i) => `- ${i.id}: ${i.means}`),
  ].join('\n')

  return new Promise((resolve) => {
    const child = spawn('claude', ['-p', '--output-format', 'json'], {
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
      finish({ error: 'The assistant took too long to answer.' }, 504)
    }, 90_000)

    child.stdout.on('data', (c) => (out += c))
    child.stderr.on('data', (c) => (err += c))
    child.on('error', (error) =>
      finish(
        {
          error:
            (error as NodeJS.ErrnoException).code === 'ENOENT'
              ? 'The `claude` command is not on PATH for the dev server. Restart it from a shell where `claude` runs.'
              : error.message,
        },
        500,
      ),
    )

    child.on('close', (code) => {
      // stdout first: a failed run still prints JSON carrying the only useful
      // sentence, and the exit code alone would throw that away.
      let parsed: { result?: string; is_error?: boolean } | null = null
      try {
        parsed = JSON.parse(out)
      } catch {
        parsed = null
      }
      if (parsed?.is_error) {
        return finish({ error: (parsed.result ?? '').trim() || 'The assistant failed.' }, 502)
      }
      const answer = (parsed?.result ?? out).trim()
      const ids = ask.icons.map((i) => i.id)
      // The id alone is what was asked for, and the last line is where an
      // answer that explained itself first puts it. Only if neither is a clean
      // match does it fall back to "exactly one id appears anywhere" —
      // scanning for the first mention would read "not multiview, but
      // download" as multiview.
      const lastLine = answer.split('\n').pop()?.trim() ?? ''
      const mentioned = ids.filter((id) => new RegExp(`\\b${id}\\b`).test(answer))
      const iconId =
        ids.find((id) => id === answer) ??
        ids.find((id) => id === lastLine) ??
        (mentioned.length === 1 ? mentioned[0] : undefined)

      if (!iconId) {
        return finish(
          {
            error:
              err.trim() ||
              (mentioned.length > 1
                ? `The assistant named more than one icon: ${mentioned.join(', ')}.`
                : code === 0
                  ? 'The assistant did not name one of the icons offered.'
                  : `claude exited with code ${code}.`),
          },
          502,
        )
      }
      // No reason: the prompt asked for the id alone, so anything else here
      // would be inventing one. The note then reads "Chose discount."
      finish({ configured: true, iconId, why: null })
    })

    child.stdin.write(prompt)
    child.stdin.end()
  })
}

const PROPOSE_TOOL = {
  name: 'propose_changes',
  description:
    'Propose content changes for the person to review. Never assume they are applied — they are shown as a list the person accepts or discards.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: { type: 'string', description: 'One sentence on what this proposal does.' },
      tiers: {
        type: 'array',
        description: 'Per-plan content changes. Omit a field to leave it as it is.',
        items: {
          type: 'object',
          properties: {
            tierId: { type: 'string' },
            market: {
              type: 'string',
              description: 'Market code for a market-specific change, or omit for the base.',
            },
            planName: { type: 'string' },
            description: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Feature catalogue ids, in display order.',
            },
          },
          required: ['tierId'],
        },
      },
      offers: {
        type: 'array',
        description: 'Per-plan, per-cadence pricing changes.',
        items: {
          type: 'object',
          properties: {
            tierId: { type: 'string' },
            cadence: { type: 'string' },
            market: { type: 'string' },
            standardPrice: { type: 'number' },
            discount: { type: 'boolean' },
            introPrice: { type: 'number' },
          },
          required: ['tierId', 'cadence'],
        },
      },
    },
    required: ['summary'],
  },
}

function systemPrompt(setJson: string, failing: string): string {
  return `You help a product team author the content for DAZN's acquisition plan cards.

You are looking at the live content of their editor. Answer questions about it,
and when they ask for content, propose it with the propose_changes tool.

The rules that govern this content, which their app enforces:
- A plan's description is shown on the card at a maximum of two lines and is
  truncated with "… more" beyond that. Roughly 150 characters is the practical
  budget; every plan in a set shares one description height, so one long
  description pulls the whole set to two lines.
- Exactly one plan per set may have the Ultimate treatment.
- Features are references to catalogue ids, never free text. Use only ids that
  exist in featureCatalog. If a line they want does not exist, say so rather
  than inventing an id.
- A plan with no offer at a cadence is not sold that way. Do not invent a price
  to fill a gap; a missing price is a commercial fact, not an omission.
- A discount price must be below the standard price.
- Prices are commercial decisions. Never invent one. If asked to fill prices,
  ask what they should be, or propose a structure and leave the numbers to them.

Write plan descriptions in the market's own language, matching the voice of any
descriptions already written. Be concrete about what the plan includes.

Current content:
${setJson}

Contexts currently failing validation:
${failing || '(none)'}`
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

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  const key = process.env.ANTHROPIC_API_KEY

  if (request.method === 'GET') {
    return key
      ? json({ configured: true, model: MODEL })
      : json({
          configured: false,
          reason: 'ANTHROPIC_API_KEY is not set.',
          // The small asks do not need the key — they can go through the
          // `claude` CLI on a dev machine, which is already signed in.
          icons: !isDeployed(),
        })
  }
  if (request.method !== 'POST') return json({ error: `${request.method} is not supported.` }, 405)

  try {
    const body = (await request.json()) as {
      messages?: { role: 'user' | 'assistant'; content: string }[]
      set?: unknown
      failing?: string
      suggestIcon?: { text: string; icons: { id: string; means: string }[] }
    }

    // Handled before the key check: choosing one word from a list is small
    // enough to ask the signed-in CLI when there is no key to spend.
    if (body.suggestIcon && !key) {
      if (isDeployed()) {
        return json({ error: 'ANTHROPIC_API_KEY is not set on this deployment.' }, 503)
      }
      return suggestViaCli(body.suggestIcon, json)
    }

    if (!key) return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set.' })

    /**
     * The small ask: which of these icons suits this line?
     *
     * Handled before the conversation branch because it is not a conversation
     * — no set, no proposal, one word back. The choice is constrained to the
     * ids sent, so the answer is always an icon that exists.
     */
    if (body.suggestIcon) {
      const { text, icons } = body.suggestIcon
      if (!text?.trim() || !Array.isArray(icons) || icons.length === 0) {
        return json({ error: 'suggestIcon needs a line and some icons to choose from.' }, 400)
      }
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 256,
          system:
            'You pick the icon that best matches one line of copy on a sports ' +
            'streaming subscription card. Answer only by calling pick_icon.',
          tools: [
            {
              name: 'pick_icon',
              description: 'Choose the icon that best matches the line.',
              input_schema: {
                type: 'object' as const,
                properties: {
                  iconId: { type: 'string', enum: icons.map((i) => i.id) },
                  why: { type: 'string', description: 'A few words on the match.' },
                },
                required: ['iconId'],
              },
            },
          ],
          tool_choice: { type: 'tool', name: 'pick_icon' },
          messages: [
            {
              role: 'user',
              content: `Line: ${text.trim()}\n\nIcons:\n${icons
                .map((i) => `- ${i.id}: ${i.means}`)
                .join('\n')}`,
            },
          ],
        }),
      })
      if (!res.ok) {
        return json({ error: `Anthropic returned ${res.status}: ${await res.text()}` }, 502)
      }
      const reply = (await res.json()) as {
        content: { type: string; name?: string; input?: { iconId?: string; why?: string } }[]
      }
      const picked = reply.content.find((c) => c.type === 'tool_use' && c.name === 'pick_icon')
      const iconId = picked?.input?.iconId
      // A model can only answer with an id from the enum, but the enum is ours
      // to trust and the response is not — so it is checked either way.
      if (!iconId || !icons.some((i) => i.id === iconId)) {
        return json({ error: 'The assistant did not choose one of the icons offered.' }, 502)
      }
      return json({ configured: true, iconId, why: picked?.input?.why ?? null })
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'Body must include messages.' }, 400)
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt(JSON.stringify(body.set ?? {}), body.failing ?? ''),
        tools: [PROPOSE_TOOL],
        messages: body.messages,
      }),
    })

    if (!res.ok) return json({ error: `Anthropic returned ${res.status}: ${await res.text()}` }, 502)

    const reply = (await res.json()) as {
      content: ({ type: 'text'; text: string } | { type: 'tool_use'; name: string; input: unknown })[]
    }
    const text = reply.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim()
    const proposal =
      reply.content.find(
        (c): c is { type: 'tool_use'; name: string; input: unknown } =>
          c.type === 'tool_use' && c.name === 'propose_changes',
      )?.input ?? null

    return json({ configured: true, text, proposal })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502)
  }
}
