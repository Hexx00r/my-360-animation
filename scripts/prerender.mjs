// scripts/prerender.mjs — postbuild step: SSR-render the / route and inject the
// HTML into dist/index.html so crawlers see real content without executing JS.
// Zero new runtime deps: reuses react-dom/server through a one-off vite SSR
// bundle (vite handles the TSX transform, output is plain ESM importable here).
// Must run BEFORE scripts/build.mjs so the sitemap generator scans final HTML.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// 1. Server-bundle the app (client dist/ is left untouched)
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules/vite/bin/vite.js'),
    'build',
    '--ssr',
    'src/entry-server.tsx',
    '--outDir',
    'dist-ssr',
    '--emptyOutDir',
    '--logLevel',
    'warn',
  ],
  { cwd: root, stdio: 'inherit' },
)

// 2. Render the / route to HTML
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')
const { render } = await import(pathToFileURL(ssrEntry).href)
const html = render()

// 3. Inject into the client-built shell
const indexPath = join(root, 'dist', 'index.html')
const shell = readFileSync(indexPath, 'utf8')
if (!shell.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html: expected an empty #root div — has the shell changed?')
}
writeFileSync(indexPath, shell.replace('<div id="root"></div>', () => `<div id="root">${html}</div>`))
console.log(`prerendered / -> ${html.length} chars into dist/index.html`)
