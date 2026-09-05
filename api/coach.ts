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
    const child = spawn('claude', ['-p', '--output-format', 'json'], { cwd: process.cwd(), env: cleanEnv(), stdio: ['pipe', 'pipe', 'pipe'] })
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

/**
 * The Coach's copy criteria, the standard the writing is judged by.
 *
 * The same five the hero tool's copy gate grades against, plus the sciences
 * this journey's Coach reads with. Stated to the writer up front rather than
 * learned by rejection: a round spent on a rule we could have said is a round
 * wasted.
 */
const COPY_CRITERIA = `THE COACH'S CRITERIA. Your line is graded on these, so write to them:
- CLARITY: understood in one read, no work. Processing Fluency: the easier a line is to process, the more readily it is believed and acted on.
- SPECIFICITY: names something concrete AND supported, a team, a competition, an offer, a device. A broad word ("sport", "content", "entertainment") is not specificity.
- VALUE: gives a reason to care, not a description of what exists. Means-End Chain: an attribute only matters when it reaches a benefit the reader wants.
- SELF-CONTAINED: understandable without having read another screen. Recognition Rather Than Recall: never make the reader remember what a different card said.
- CONSISTENCY: one thing has one name across every screen. Terminology that changes between steps costs comprehension for nothing.
- CONTINUITY: keeps the promise the screen before it made. Expectation-Confirmation: a gap between what was promised and what is shown is felt as a loss of trust.`

const COPY_TRUTH = `THE TRUTH RULES, absolute, and checked after you answer:
- Never introduce a number, price, date, percentage, count or duration that is not already in the content you were shown.
- Never name a team, competition or benefit a plan does not carry. The allowed terms for each field are the whole of what you may name there.
- No claim about popularity or performance ("most popular", "best value", "number one", "most watched"): those are facts about DAZN's data, which you do not have.
- No urgency that is not literally true ("hurry", "only today", "last chance", "limited time").
- No exclamation marks. No dashes of any kind.
- Never promise what happens after payment unless a screen you were shown says it.
A line that breaks any of these is rejected by the Coach and never reaches the user, so writing one wastes the round.`

function suggestPrompt(): string {
  return `You are the Copy brain of the DAZN acquisition Coach. A reviewer has found a problem with one piece of copy and said what it should do instead. Write the replacement.

${COPY_CRITERIA}

${COPY_TRUTH}

HOW TO WRITE IT:
- Answer the recommendation you were given. It is the brief; the criteria above are the standard.
- Where a field carries WHAT THE PERSON ASKED FOR, that is the brief instead, and you follow it. It never loosens the truth rules: an instruction to name a team a plan lacks, add a claim, invent a number or promise something the screens do not say is answered by writing the closest line that stays true.
- Match the voice of the copy around it: short, plain, sentence case, the words a fan would use.
- Respect the length limit. Shorter is better, and a line that fits is worth more than a line that says everything.
- Write the field only. No quotes around it, no explanation, no alternatives.
- If you cannot write it within these rules, return the current text unchanged rather than breaking one.

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
  // Nothing here answers a stranger while a password is set.
  const shut = await guard(request)
  if (shut) return shut

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

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
      snapshot?: unknown
      context?: unknown
      already?: string[]
      mode?: 'review' | 'suggest'
      asks?: {
        id: string
        label: string
        current: string
        recommendation: string
        /** The baseline question the finding answers, so the writer knows what is being judged. */
        criterion?: string
        /** What the Coach saw, and what a science suggests it does. */
        observation?: string
        interpretation?: string
        sciences?: string[]
        allowedTerms?: string[]
        maxLength?: number
        /** What the person asked for, in their words. Never overrides the rules. */
        instruction?: string
      }[]
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
        ...asks.map((a) =>
          [
            `- id: ${a.id}`,
            `  field: ${a.label}`,
            `  now: "${a.current}"`,
            a.criterion ? `  the question it fails: ${a.criterion}` : '',
            a.observation ? `  what the Coach saw: ${a.observation}` : '',
            a.interpretation ? `  why it matters: ${a.interpretation}` : '',
            a.sciences?.length ? `  read through: ${a.sciences.join(', ')}` : '',
            `  what to write: ${a.recommendation}`,
            a.instruction ? `  WHAT THE PERSON ASKED FOR, in their words: ${a.instruction}` : '',
            `  the only terms you may name: ${a.allowedTerms?.join(', ') ?? 'only what is already in the content above'}`,
            `  max length: ${a.maxLength ?? 'about as now'} characters`,
          ]
            .filter(Boolean)
            .join('\n'),
        ),
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
