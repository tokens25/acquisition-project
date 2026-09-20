import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Which commit a bundle was made from, baked in as a literal.
 *
 * More than one of this tool is up at once — a Vercel alias per branch, and a
 * production alias pointing at whichever branch is configured — and they are
 * all behind team sign-in. So the only way to tell what a deployment is
 * serving is for the page to say, which means the answer has to be decided
 * here, where the bundle is made, and not looked up later.
 *
 * Vercel's own variables first, because on Vercel they are the truth and the
 * checkout is a detached head that would report no branch. Git second, for a
 * local build. Neither, and the stamp says so rather than claiming a version
 * nobody can check.
 */
function buildStamp() {
  const git = (...args: string[]) => {
    try {
      return execFileSync('git', args, { encoding: 'utf8' }).trim()
    } catch {
      return ''
    }
  }
  const env = process.env
  return {
    sha: env.VERCEL_GIT_COMMIT_SHA || git('rev-parse', 'HEAD') || 'unknown',
    ref: env.VERCEL_GIT_COMMIT_REF || git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown',
    at: new Date().toISOString(),
  }
}

/**
 * Runs the `api/` handlers on the dev server.
 *
 * Those files are Vercel functions, which `vite dev` does not know about — so
 * without this every API route 404s locally and the features that depend on
 * them can only be tested by deploying. That is a slow way to find out you were
 * wrong, and it means nobody can run the assistant on their own machine.
 *
 * The handlers take a web `Request` and return a `Response`, which is what
 * Vercel gives them in production, so the same code runs in both places.
 *
 * Exported by method or by default. Vercel reads the Web signature only from a
 * handler exported under its HTTP method — a default export is taken for the
 * older Node style, handed a relative URL, and its returned Response ignored.
 * So a route written today exports `GET`, and the ones written before this was
 * known still export `default`: this looks for the method first and falls back,
 * which lets the two kinds sit side by side while they are brought into line.
 */
function apiRoutes(): Plugin {
  return {
    name: 'local-api-routes',
    configureServer(server) {
      // Vercel injects environment variables; locally they come from .env,
      // which Vite does not put on process.env for server code.
      try {
        for (const line of readFileSync('.env', 'utf8').split('\n')) {
          const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
          if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
          }
        }
      } catch {
        // No .env is the ordinary case — the routes report themselves
        // unconfigured, which is exactly what they should do.
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const name = url.pathname.slice('/api/'.length).replace(/\/$/, '')
        if (!/^[a-z0-9-]+$/.test(name)) return next()

        try {
          type Handler = (request: Request) => Promise<Response>
          const module = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<string, Handler | undefined>
          const handler = module[(req.method ?? 'GET').toUpperCase()] ?? module.default
          if (typeof handler !== 'function') {
            res.statusCode = 405
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: `/api/${name} does not handle ${req.method}.` }))
            return
          }

          const body =
            req.method === 'GET' || req.method === 'HEAD'
              ? undefined
              : await new Promise<string>((resolve) => {
                  let text = ''
                  req.on('data', (chunk) => (text += chunk))
                  req.on('end', () => resolve(text))
                })

          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: Object.entries(req.headers).flatMap(([k, v]) =>
              typeof v === 'string' ? [[k, v] as [string, string]] : [],
            ),
            body,
          })
          const response = await handler(request)

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (error) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiRoutes()],
  // Read once when the config loads, so every module sees the same build and
  // a long build does not stamp its own chunks with different times.
  define: { __BUILD__: JSON.stringify(buildStamp()) },
})
