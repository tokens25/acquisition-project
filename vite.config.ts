import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

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
          const module = (await server.ssrLoadModule(`/api/${name}.ts`)) as {
            default: (request: Request) => Promise<Response>
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
          const response = await module.default(request)

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
})
