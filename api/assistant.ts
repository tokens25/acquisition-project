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

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

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

export default async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set on this deployment.' })
  }
  if (request.method === 'GET') return json({ configured: true, model: MODEL })
  if (request.method !== 'POST') return json({ error: `${request.method} is not supported.` }, 405)

  try {
    const body = (await request.json()) as {
      messages?: { role: 'user' | 'assistant'; content: string }[]
      set?: unknown
      failing?: string
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
