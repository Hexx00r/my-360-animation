// scripts/render-check.mjs — end-to-end smoke test of the portfolio.
// At 375/768/1440 px: every section renders, no horizontal scroll, no page
// errors or 4xx/5xx, and the 360° hero box is the frames' 720:1030, fully
// visible, centered on black, inside its height cap, with the text below.
// Desktop: the frame follows the cursor (up/right/down/left), turns
// smoothly, snaps to center in the dead zone, recenters when the mouse
// leaves, and the loop pauses off screen. Touch + reduced motion: center
// frame only, no directional frames fetched.
// Then: chat and contact both complete through /api (needs the Worker).
//
// Run:  npm run worker:dev   (terminal 1, API on :8787)
//       npm run dev          (terminal 2, site on :3000, proxies /api)
//       node scripts/render-check.mjs          [BASE_URL=http://localhost:3000]

import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const SHOTS = join(tmpdir(), 'render-check')
mkdirSync(SHOTS, { recursive: true })
const SECTIONS = ['top', 'about', 'stack', 'projects', 'calculator', 'services', 'process', 'contact']
const RATIO = 720 / 1030 // public/frames/*.webp (v2)
const HEIGHT_CAP = { mobile: 0.6, desktop: 0.7 } // × viewport height (svh)
const FACE = { cx: 0.514, cy: 0.291 } // keep in sync with HeroCanvas.tsx

let failures = 0
const check = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ' — ' + detail}`)
  if (!cond) failures++
}

const frame = (page) => page.evaluate(() => Number(document.querySelector('#top canvas').dataset.frame ?? NaN))
const loop = (page) => page.evaluate(() => document.querySelector('#top canvas').dataset.loop ?? '')
/** Circular distance between two frame indices (64 frames). */
const fdist = (a, b) => Math.min(Math.abs(a - b), 64 - Math.abs(a - b))

async function heroGeometry(page) {
  return page.evaluate(() => {
    const box = document.querySelector('#top canvas').parentElement.getBoundingClientRect()
    const h1 = document.querySelector('#top h1').getBoundingClientRect()
    const bg = getComputedStyle(document.querySelector('#top')).backgroundColor
    return {
      left: box.left,
      right: window.innerWidth - box.right,
      top: box.top,
      bottom: box.bottom,
      width: box.width,
      height: box.height,
      textTop: h1.top,
      vw: window.innerWidth,
      vh: window.innerHeight,
      bg,
    }
  })
}

const browser = await chromium.launch()

for (const width of [375, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const bad = []
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })

  for (const id of SECTIONS) {
    const box = await page.locator(`#${id}`).boundingBox()
    check(`[${width}] #${id} renders`, box && box.height > 100, JSON.stringify(box))
  }
  const h1 = await page.locator('h1').innerText()
  check(`[${width}] h1`, h1.replace(/\s+/g, ' ').trim() === 'Full-Stack Web Developer', h1)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(`[${width}] no horizontal scroll`, overflow <= 0, `${overflow}px wider`)

  const g = await heroGeometry(page)
  const cap = (width >= 1024 ? HEIGHT_CAP.desktop : HEIGHT_CAP.mobile) * g.vh
  check(`[${width}] hero box is the frames' 720:1030`, Math.abs(g.width / g.height - RATIO) < 0.01, `${g.width}×${g.height}`)
  check(`[${width}] hero frame fully visible horizontally`, g.left >= 0 && g.right >= 0, JSON.stringify(g))
  check(`[${width}] hero frame centered`, Math.abs(g.left - g.right) <= 2, `left ${g.left} right ${g.right}`)
  check(`[${width}] hero frame within height cap`, g.height <= cap + 1, `${g.height} > ${cap}`)
  check(`[${width}] hero background is black`, g.bg === 'rgb(0, 0, 0)', g.bg)
  check(`[${width}] hero text below the frame`, g.textTop >= g.bottom, `h1 top ${g.textTop} < frame bottom ${g.bottom}`)

  // Canvas painted the center frame (desktop Chromium = fine pointer)
  await page.waitForFunction(() => document.querySelector('#top canvas').dataset.frame !== undefined, null, { timeout: 10000 }).catch(() => {})
  check(`[${width}] canvas shows the center frame at rest`, (await frame(page)) === -1, String(await frame(page)))

  // Scroll through so every Reveal fires (instant: html has smooth scrolling)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 40))
    }
  })
  await page.mouse.move(width / 2, 450) // scroll listener needs an event; also fires rAF once
  await page.waitForTimeout(300)
  check(`[${width}] loop pauses off screen`, (await loop(page)) === 'paused', await loop(page))
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(300)
  check(`[${width}] loop resumes on return`, (await loop(page)) === 'running', await loop(page))
  await page.screenshot({ path: join(SHOTS, `home-${width}.png`), fullPage: true })
  await page.screenshot({ path: join(SHOTS, `hero-${width}.png`) })

  check(`[${width}] no page errors`, errors.length === 0, errors.join(' | '))
  check(`[${width}] no failed requests`, bad.length === 0, bad.join(' | '))
  await page.close()
}

// Desktop cursor behaviour
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const frameReqs = new Set()
  page.on('request', (r) => /frame_\d\d\.webp/.test(r.url()) && frameReqs.add(r.url()))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
  check('[desktop] all 64 directional frames preloaded', frameReqs.size === 64, `${frameReqs.size} requested`)

  const face = await page.evaluate(({ cx, cy }) => {
    const r = document.querySelector('#top canvas').getBoundingClientRect()
    const s = Math.min(r.width / 720, r.height / 1030)
    const w = 720 * s
    const h = 1030 * s
    return { x: r.left + (r.width - w) / 2 + w * cx, y: r.top + (r.height - h) / 2 + h * cy }
  }, FACE)
  const R = 420 // outside the 12%-of-diagonal dead zone (≈204 px at 1440×900)
  const aim = async (dx, dy) => {
    await page.mouse.move(face.x + dx, face.y + dy, { steps: 4 })
    await page.waitForTimeout(700) // lerp settles
    return frame(page)
  }
  const dirs = [
    ['right', R, 0, 16],
    ['down', 0, Math.min(R, 890 - face.y), 32],
    ['left', -R, 0, 48],
    ['up', 0, -Math.min(R, face.y - 10), 0],
  ]
  for (const [name, dx, dy, want] of dirs) {
    const f = await aim(dx, dy)
    check(`[desktop] cursor ${name} → frame ${want}`, fdist(f, want) <= 1, `got ${f}`)
  }

  // Smoothness: right → down should pass through intermediate frames
  await aim(R, 0)
  const seen = new Set()
  await page.mouse.move(face.x, face.y + Math.min(R, 890 - face.y))
  for (let i = 0; i < 20; i++) {
    seen.add(await frame(page))
    await page.waitForTimeout(16)
  }
  const between = [...seen].filter((f) => f > 16 && f < 32)
  check('[desktop] turns smoothly (intermediate frames between right and down)', between.length >= 2, [...seen].join(','))

  // Dead zone → eye contact
  await page.mouse.move(face.x + 30, face.y + 20)
  await page.waitForTimeout(200)
  check('[desktop] dead zone snaps to center', (await frame(page)) === -1, String(await frame(page)))

  // Mouse leaves the window → recenter
  await aim(R, 0)
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: null, bubbles: true })))
  await page.waitForTimeout(200)
  check('[desktop] recenters when the mouse leaves the window', (await frame(page)) === -1, String(await frame(page)))
  await page.screenshot({ path: join(SHOTS, 'hero-cursor.png') })
  await page.close()
}

// Touch (no fine pointer) and reduced motion: center.webp only
for (const [label, opts] of [
  ['touch · iPhone 13', { ...devices['iPhone 13'] }],
  ['reduced motion', { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }],
]) {
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const frameReqs = []
  page.on('request', (r) => /frame_\d\d\.webp/.test(r.url()) && frameReqs.push(r.url()))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.mouse.move(1200, 100).catch(() => {})
  await page.waitForTimeout(500)
  check(`[${label}] center frame only`, (await frame(page)) === -1, String(await frame(page)))
  check(`[${label}] no directional frames fetched`, frameReqs.length === 0, `${frameReqs.length} requested`)
  check(`[${label}] no rAF loop`, (await loop(page)) === '', await loop(page))
  check(`[${label}] no page errors`, errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// Chat + contact through /api
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })

  await page.getByRole('button', { name: 'Open chat' }).click()
  await page.locator('#chat-input').fill('Can you build an AI receptionist for my clinic?')
  await page.locator('#chat-input').press('Enter')
  await page.waitForFunction(
    () => {
      const ps = document.querySelectorAll('#site-chat [role="log"] p')
      const t = ps[ps.length - 1]?.textContent ?? ''
      return t && t !== '…'
    },
    null,
    { timeout: 20000 },
  )
  const text = await page.locator('#site-chat [role="log"] p').last().innerText()
  check('chat answers via /api/chat', /AI chat & voice agents/.test(text), text.slice(0, 120))
  check('chat offers the contact CTA', (await page.locator('#site-chat a[href="#contact"]').count()) > 0)
  await page.screenshot({ path: join(SHOTS, 'chat.png') })
  await page.getByRole('button', { name: 'Close chat' }).first().click()

  await page.locator('#contact-name').fill('Render Check')
  await page.locator('#contact-email').fill('render-check@example.com')
  await page.locator('#contact-projectType').selectOption('API / integration')
  await page.locator('#contact-message').fill('Automated smoke test of the contact form.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByText('Message sent').waitFor({ timeout: 15000 }).catch(() => {})
  check('contact form delivers via /api/contact', (await page.getByText('Message sent').count()) > 0)
  await page.close()
}

await browser.close()
console.log(`\nscreenshots: ${SHOTS}`)
console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed')
process.exit(failures ? 1 : 0)
