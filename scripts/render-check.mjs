// scripts/render-check.mjs — renders the homepage from `vite preview` at
// 360/768/1440, asserts the Latest Build + demo fleet content is present,
// images decoded, and demo links resolve. Prints PASS/FAIL per check.
// Run: node scripts/render-check.mjs  (expects preview on :4173)

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.PREVIEW_URL || 'http://localhost:4173'
const SHOTS = join(tmpdir(), 'render-check')
mkdirSync(SHOTS, { recursive: true })

let failures = 0
const check = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ' — ' + detail}`)
  if (!cond) failures++
}

const browser = await chromium.launch()

for (const width of [360, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  const failed = []
  page.on('pageerror', (e) => failed.push(String(e)))
  const bad = []
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })

  const texts = ['Gawler Place Dental', 'Demo fleet', 'Sydney Jet Wash', '13 service pages', 'gawler-dental-demo.pages.dev']
  for (const t of texts) check(`${width}: text "${t}"`, (await page.textContent('body')).includes(t))

  check(`${width}: fleet pill x1 (featured build excluded)`, (await page.locator('text=Demo build — fictional business').count()) === 1)
  check(`${width}: honesty pill`, (await page.locator('text=Fictional business · real system').count()) === 1)

  const imgs = await page.$$eval('#latest-build img', (els) =>
    els.map((e) => ({ src: e.src, ok: e.complete && e.naturalWidth > 0 }))
  )
  check(`${width}: latest-build images decoded`, imgs.length >= 2 && imgs.every((i) => i.ok), JSON.stringify(imgs))

  const links = await page.$$eval('#latest-build a[href]', (els) => els.map((e) => e.href))
  check(`${width}: no broken responses`, bad.length === 0, bad.join('; '))
  check(`${width}: no page errors`, failed.length === 0, failed.join('; '))

  await page.locator('#latest-build').scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(SHOTS, `latest-build-${width}.png`) })
  await page.close()
}
await browser.close()

// demo links resolve
for (const url of ['https://gawler-dental-demo.pages.dev', 'https://sydney-jet-wash.pages.dev']) {
  const res = await fetch(url, { method: 'HEAD' }).catch(() => null)
  check(`link ${url}`, res && res.ok, res ? String(res.status) : 'fetch failed')
}

console.log(failures ? `\nrender-check: ${failures} FAILED` : '\nrender-check: all checks passed')
process.exit(failures ? 1 : 0)
