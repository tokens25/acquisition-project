/**
 * The Coach's AI reading of an acquisition journey.
 *
 * The deterministic brains (src/demo/coach/review) find what the content
 * proves. This route asks the model for what needs judgement, is the copy
 * saying what the reader gets, does the promise carry from screen to screen
 *, under the same discipline: Observation → Evidence → Interpretation →
 * Recommendation → Confidence, and "I don't have enough evidence" is a valid
 * answer. Everything it returns is evidence level 6 (AI inference) and can
 * never be more than a `check`; the client's evidence guard enforces that
 * again on arrival.
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required, without it the route says so and the
 *                       review runs on the rules alone
 *   ANTHROPIC_MODEL     optional, defaults to claude-opus-5
 */

import { spawn } from 'node:child_process'

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MAX_FINDINGS = 8
const CLI_TIMEOUT_MS = 4 * 60 * 1000

/** Vercel sets these; a laptop does not. */
function isDeployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

/**
 * No key on a dev machine: ask the signed-in `claude` command instead, the
 * way the assistant already does for its small asks. Same brief, same
 * schema; the answer is plain JSON rather than a tool call, so it is parsed
 * and checked the same way on the client.
 */
function askViaCli(system: string, user: string, schema: unknown = REPORT_TOOL.input_schema, key = 'findings'): Promise<{ findings: unknown[] } | { error: string }> {
  const prompt = [
    system,
    '',
    user,
    '',
    'Reply with ONE JSON object and nothing else, shaped exactly like this schema:',
    JSON.stringify(schema),
  ].join('\n')

  return new Promise((resolve) => {
    const child = spawn('claude', ['-p', '--output-format', 'json'], { cwd: process.cwd(), env: process.env, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let done = false
    const finish = (v: { findings: unknown[] } | { error: string }) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(v)
    }
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish({ error: 'The Coach took too long to answer.' })
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
      if (parsed?.is_error) return finish({ error: (parsed.result ?? '').trim() || err.trim() || 'The Coach failed.' })
      const text = (parsed?.result ?? out).trim()
      // The object may arrive fenced or with a sentence around it: take the
      // outermost braces.
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start < 0 || end < start) return finish({ error: 'The Coach did not answer with JSON.' })
      try {
        const obj = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
        const list = obj[key]
        finish({ findings: Array.isArray(list) ? list : [] })
      } catch {
        finish({ error: 'The Coach answered with JSON that could not be read.' })
      }
    })
    child.stdin.write(prompt)
    child.stdin.end()
  })
}

const CRITERIA = [
  'completion',
  'decision-clarity',
  'package-comparison',
  'decision-friction',
  'purchase-confidence',
  'offer-comprehension',
  'journey-consistency',
  'informed-choice',
  'goal-alignment',
] as const

const SCIENCES = [
  'jdm', 'behavioral-decision-theory', 'choice-architecture', 'default-effect', 'status-quo-bias',
  'choice-overload', 'madm', 'attribute-based-choice', 'elimination-by-aspects', 'prospect-theory',
  'loss-aversion', 'reference-dependence', 'framing', 'anchoring', 'mental-accounting', 'reference-price',
  'compromise-effect', 'cognitive-load', 'processing-fluency', 'hick-hyman', 'information-foraging',
  'information-scent', 'mental-models', 'recognition-over-recall', 'expectation-confirmation',
  'persuasion-knowledge', 'reactance', 'perceived-risk', 'signaling', 'social-proof',
  'progressive-disclosure', 'sludge', 'search-costs', 'means-end-chain', 'commitment-consistency',
  'goal-gradient',
] as const

const BRAINS = ['decision', 'choice', 'clarity', 'trust', 'journey', 'goal', 'copy'] as const

const REPORT_TOOL = {
  name: 'report_findings',
  description: 'Report what you found. Only findings the content supports; fewer is better.',
  input_schema: {
    type: 'object' as const,
    properties: {
      findings: {
        type: 'array',
        maxItems: MAX_FINDINGS,
        items: {
          type: 'object',
          properties: {
            brain: { type: 'string', enum: [...BRAINS] },
            criterion: { type: 'string', enum: [...CRITERIA] },
            sciences: { type: 'array', items: { type: 'string', enum: [...SCIENCES] }, minItems: 1, maxItems: 3 },
            screen: { type: 'string', description: 'A screen id from the snapshot, or "journey".' },
            element: { type: 'string', description: 'Short key for what on the screen, e.g. "auth:subtitle".' },
            observation: { type: 'string', description: 'A fact. Quote the exact strings. No judgement here.' },
            interpretation: { type: 'string', description: 'What the science says this MAY do to a reader. Never a number, never a prediction.' },
            recommendation: { type: ['string', 'null'], description: 'What to change, or null when there is not enough evidence to recommend a change.' },
            nextStep: { type: 'string', description: 'How to get the evidence that would settle it.' },
            expectedMechanism: { type: 'string', description: 'Why the change could help: the mechanism, never an outcome.' },
            confidence: { type: 'string', enum: ['low', 'medium'], description: 'Confidence in the DIAGNOSIS only.' },
            severity: { type: 'string', enum: ['check', 'note'] },
            goals: {
              type: 'object',
              description: 'Business goals this likely touches: +1 helps, -1 hurts.',
              additionalProperties: { type: 'number', enum: [1, -1] },
            },
          },
          required: ['brain', 'criterion', 'sciences', 'screen', 'observation', 'interpretation', 'recommendation', 'confidence', 'severity'],
        },
      },
    },
    required: ['findings'],
  },
}

const SUGGEST_TOOL = {
  name: 'suggest_copy',
  description: 'Propose replacement copy for each field asked about. One suggestion per id.',
  input_schema: {
    type: 'object' as const,
    properties: {
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'The finding id the suggestion answers.' },
            after: { type: 'string', description: 'The full replacement text for the field. Only the copy, nothing else.' },
          },
          required: ['id', 'after'],
        },
      },
    },
    required: ['suggestions'],
  },
}

function suggestPrompt(): string {
  return `You are the Copy brain of the DAZN acquisition Coach. For each field you are given, write the replacement copy the Coach's recommendation asks for.

Rules, every one of them hard:
- Use only facts already on the screens you are shown. Never add a price, a number, a date, a team, a competition or a benefit that is not there.
- No claims ("best", "most popular", "unmissable"), no urgency ("hurry", "only today"), no exclamation marks, no dashes.
- Match the voice of the copy around it: short, plain, first person plural where the screens use it.
- Respect the allowed terms and the length limit given for each field. Shorter is better.
- Write the field only. No quotes around it, no explanation.
- If you cannot write it within these rules, return the current text unchanged.

Answer only by calling suggest_copy.`
}

function systemPrompt(): string {
  return `You are the Coach: an expert reviewer of DAZN acquisition journeys. You are one voice in a review, deterministic rules have already found every contradiction the content proves. Your job is the part that needs judgement: does the copy say what the reader gets, does each step keep the promise the last one made, is information arriving when the decision needs it, does anything push rather than inform.

You do not redesign the UI. You do not invent optimisation ideas. You observe, you say what a science suggests it MAY do, and you are honest about what you do not know.

Every finding is: Observation → Evidence → Interpretation → Recommendation → Confidence.
- Observation quotes the exact strings from the snapshot. If you cannot quote it, you did not observe it.
- Interpretation names what a science suggests may happen. It never states a number or predicts a lift.
- Recommendation is null whenever you lack evidence that a change would help here. "I don't have enough evidence to recommend changing this" is a strength.
- Confidence is at most "medium", and it is confidence in the DIAGNOSIS. Never state a business outcome: whether a change moves conversion, revenue, ARPU, retention, package uptake or churn is UNKNOWN without a DAZN experiment. Never give a number or a percentage.
- You are AI inference, the weakest kind of evidence. Never dress inference as science.
- Science CAN support a recommendation about clarity, comprehension, consistency or trust. It cannot support a claim about a business result.
- Severity is "check" (a science says this may matter; evidence needed) or "note" (worth knowing, including what works). Never "fix", only content that contradicts itself earns that, and the rules already have those.

Hard rules:
- Never recommend raising, lowering or inventing a price. You may judge how a price is communicated, compared or positioned.
- Never recommend changing a default or a "most popular" label to another option. You may observe that it carries an advantage and ask what supports it.
- Do not repeat a finding already listed under "Already found". Add only what those miss.
- The business goals, prioritised package, constraints and available evidence are given. A recommendation that helps one stated goal and hurts another is a trade-off: say so and withhold the recommendation.
- At most ${MAX_FINDINGS} findings. Fewer, well-grounded, beats many.

The baseline questions, always: completion; decision clarity; package comprehension & comparison; decision friction; purchase confidence; offer comprehension; journey consistency; informed choice & trust; goal alignment. Tag each finding with the one it answers.

Answer only by calling report_findings.`
}

export default async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  const key = process.env.ANTHROPIC_API_KEY
  const cli = !key && !isDeployed()
  if (request.method === 'GET') {
    if (key) return json({ configured: true, model: MODEL, via: 'api' })
    if (cli) return json({ configured: true, model: 'claude (signed-in CLI)', via: 'cli' })
    return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set.' })
  }
  if (request.method !== 'POST') return json({ error: `${request.method} is not supported.` }, 405)
  if (!key && !cli) return json({ configured: false, reason: 'ANTHROPIC_API_KEY is not set.' })

  try {
    const body = (await request.json()) as {
      snapshot?: unknown
      context?: unknown
      already?: string[]
      mode?: 'review' | 'suggest'
      asks?: { id: string; label: string; current: string; recommendation: string; allowedTerms?: string[]; maxLength?: number }[]
    }
    if (!body.snapshot || !body.context) return json({ error: 'Body must include snapshot and context.' }, 400)

    // Copy suggestions: the Coach has said what each field should do; the
    // Copy brain writes it. Approval happens on the client, in the open.
    if (body.mode === 'suggest') {
      const asks = Array.isArray(body.asks) ? body.asks.slice(0, 12) : []
      if (asks.length === 0) return json({ configured: true, suggestions: [] })
      const user = [
        'The screens (every string exactly as shown):',
        JSON.stringify(body.snapshot, null, 2),
        '',
        'Fields to write, with what the Coach asked for:',
        ...asks.map((a) => `- id: ${a.id}\n  field: ${a.label}\n  now: "${a.current}"\n  asked: ${a.recommendation}\n  allowed terms: ${a.allowedTerms?.join(', ') ?? 'as on screen'}\n  max length: ${a.maxLength ?? 'as now'} characters`),
      ].join('\n')
      if (cli) {
        const answer = await askViaCli(suggestPrompt(), user, SUGGEST_TOOL.input_schema, 'suggestions')
        if ('error' in answer) return json({ error: answer.error }, 502)
        return json({ configured: true, via: 'cli', suggestions: answer.findings })
      }
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 2048, system: suggestPrompt(), tools: [SUGGEST_TOOL], tool_choice: { type: 'tool', name: 'suggest_copy' }, messages: [{ role: 'user', content: user }] }),
      })
      if (!res.ok) return json({ error: `Anthropic returned ${res.status}: ${await res.text()}` }, 502)
      const reply = (await res.json()) as { content: { type: string; name?: string; input?: { suggestions?: unknown[] } }[] }
      const call = reply.content.find((c) => c.type === 'tool_use' && c.name === 'suggest_copy')
      return json({ configured: true, suggestions: Array.isArray(call?.input?.suggestions) ? call!.input!.suggestions : [] })
    }

    const user = [
      'Business context (from the team):',
      JSON.stringify(body.context, null, 2),
      '',
      'The journey, screen by screen (every string is exactly what is on screen):',
      JSON.stringify(body.snapshot, null, 2),
      '',
      'Already found by the rules, do not repeat:',
      ...(body.already ?? []).map((a) => `- ${a}`),
    ].join('\n')

    if (cli) {
      const answer = await askViaCli(systemPrompt(), user)
      if ('error' in answer) return json({ error: answer.error }, 502)
      return json({ configured: true, model: 'claude (signed-in CLI)', via: 'cli', findings: answer.findings.slice(0, MAX_FINDINGS) })
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt(),
        tools: [REPORT_TOOL],
        tool_choice: { type: 'tool', name: 'report_findings' },
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (!res.ok) return json({ error: `Anthropic returned ${res.status}: ${await res.text()}` }, 502)

    const reply = (await res.json()) as { content: { type: string; name?: string; input?: { findings?: unknown[] } }[] }
    const call = reply.content.find((c) => c.type === 'tool_use' && c.name === 'report_findings')
    const findings = Array.isArray(call?.input?.findings) ? call!.input!.findings! : []
    return json({ configured: true, model: MODEL, findings: findings.slice(0, MAX_FINDINGS) })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502)
  }
}
