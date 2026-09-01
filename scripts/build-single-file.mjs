// Builds the app into one self-contained HTML file (dist-single/index.html):
// every script, stylesheet, font and image inlined, so the page can be opened
// from disk or published anywhere that serves a single document.
//
//   node scripts/build-single-file.mjs            # full document
//   node scripts/build-single-file.mjs --fragment # head/body contents only,
//                                                 # for hosts that supply the
//                                                 # <html> skeleton themselves
import { build } from 'vite'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const fragment = process.argv.includes('--fragment')
const outDir = 'dist-single'

await build({
  configFile: 'vite.config.ts',
  logLevel: 'warn',
  build: {
    outDir,
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})

let html = readFileSync(join(outDir, 'index.html'), 'utf8')
const assets = join(outDir, 'assets')

for (const file of readdirSync(assets)) {
  const content = readFileSync(join(assets, file), 'utf8')
  if (file.endsWith('.js')) {
    html = html.replace(
      new RegExp(`<script[^>]*src="/assets/${file}"[^>]*></script>`),
      () => `<script type="module">${content.replace(/<\/script/g, '<\\/script')}</script>`,
    )
  } else if (file.endsWith('.css')) {
    html = html.replace(
      new RegExp(`<link[^>]*href="/assets/${file}"[^>]*>`),
      () => `<style>${content}</style>`,
    )
  }
}

if (fragment) {
  // Keep the pieces of <head> worth keeping plus the <body> contents. Routing
  // falls back to `#/path`, and the host owns the path, so anchors that point
  // at an app route become hash links.
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
  const keep = head
    .replace(/<meta[^>]*>/g, '')
    .replace(/<script type="module" crossorigin>/g, '<script type="module">')
    .trim()
  html = `${keep}
<script>
  document.documentElement.dataset.theme = 'dark'
  document.addEventListener('click', (event) => {
    const a = event.target instanceof Element ? event.target.closest('a[href^="/"]') : null
    if (!a || a.target === '_blank' || event.defaultPrevented) return
    event.preventDefault()
    window.location.hash = '#' + a.getAttribute('href')
  })
</script>
${body.trim()}
`
}

const out = join(outDir, fragment ? 'fragment.html' : 'index.html')
mkdirSync(outDir, { recursive: true })
writeFileSync(out, html)
console.log(`${out}: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`)
