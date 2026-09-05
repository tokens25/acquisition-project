import { guard } from './_password'

/**
 * The shared content store: one JSON file in the repository, read and written
 * over the GitHub contents API.
 *
 * This exists so two people editing are editing the same thing. Content used to
 * live in each browser's localStorage, which meant a PM and a product owner
 * could open the same URL and disagree about what it said, with no way to tell.
 *
 * Publishing and sharing are deliberately the same mechanism rather than two:
 * what Product opens is what the PM last published, because it is the same
 * commit.
 *
 * Configuration, all as Vercel environment variables:
 *   GITHUB_TOKEN   a token with contents:write on the repo (required)
 *   GITHUB_REPO    "owner/name" (defaults to this repository)
 *   GITHUB_BRANCH  branch to commit on (defaults to main)
 *   CONTENT_PATH   file to read and write (defaults to content/card-set.json)
 *
 * With no token the route reports itself unconfigured rather than failing
 * obscurely, and the app falls back to local editing and says so.
 */

const REPO = process.env.GITHUB_REPO ?? 'tokens25/acquisition-project'
const BRANCH = process.env.GITHUB_BRANCH ?? 'main'
const PATH = process.env.CONTENT_PATH ?? 'content/card-set.json'
const API = 'https://api.github.com'

interface GitHubFile {
  content: string
  sha: string
}

function headers(token: string) {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
  }
}

async function readFile(token: string): Promise<GitHubFile | null> {
  const url = `${API}/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`
  const res = await fetch(url, { headers: headers(token) })
  // Nothing published yet is a normal state, not an error — the app starts from
  // the shipped defaults and the first publish creates the file.
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`)
  const body = (await res.json()) as { content: string; sha: string }
  return { content: Buffer.from(body.content, 'base64').toString('utf8'), sha: body.sha }
}

async function writeFile(token: string, text: string, sha: string | null, message: string) {
  const url = `${API}/repos/${REPO}/contents/${PATH}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      branch: BRANCH,
      content: Buffer.from(text, 'utf8').toString('base64'),
      // Omitted only when creating the file. Sending the sha we read is what
      // makes a concurrent publish fail loudly instead of overwriting someone.
      ...(sha ? { sha } : {}),
    }),
  })
  if (res.status === 409 || res.status === 422) {
    return { conflict: true as const, detail: await res.text() }
  }
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`)
  const body = (await res.json()) as { content: { sha: string }; commit: { sha: string } }
  return { conflict: false as const, sha: body.content.sha, commit: body.commit.sha }
}

export default async function handler(request: Request): Promise<Response> {
  // Nothing here answers a stranger while a password is set.
  const shut = await guard(request)
  if (shut) return shut

  const token = process.env.GITHUB_TOKEN
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })

  if (!token) {
    return json({ configured: false, reason: 'GITHUB_TOKEN is not set.' }, 200)
  }

  try {
    if (request.method === 'GET') {
      const file = await readFile(token)
      if (!file) return json({ configured: true, published: false })
      return json({ configured: true, published: true, sha: file.sha, set: JSON.parse(file.content) })
    }

    if (request.method === 'PUT') {
      const body = (await request.json()) as { set?: unknown; sha?: string | null; message?: string }
      if (!body.set) return json({ error: 'Body must include a "set".' }, 400)

      const text = `${JSON.stringify(body.set, null, 2)}\n`
      const result = await writeFile(
        token,
        text,
        body.sha ?? null,
        body.message?.trim() || 'content: publish from the editor',
      )
      if (result.conflict) {
        return json(
          {
            conflict: true,
            error:
              'Someone else published since this page loaded. Reload to take their version, then re-apply your changes.',
          },
          409,
        )
      }
      return json({ configured: true, published: true, sha: result.sha, commit: result.commit })
    }

    return json({ error: `${request.method} is not supported here.` }, 405)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502)
  }
}
