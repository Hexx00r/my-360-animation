// scripts/render-check.mjs — end-to-end smoke test of the portfolio.
// At 375/768/1440 px: every section renders, no horizontal scroll, no page
// errors or 4xx/5xx, and the 360° hero box is the frames' 720:1030, fully
// visible, on black, inside its height cap. Below 1024 px the frame is
// centered with the text below; at 1024+ image and text sit side by side,
// vertically centered on one line, and the pair is centered in the page.
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
import { inflateSync } from 'node:zlib'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const SHOTS = join(tmpdir(), 'render-check')
mkdirSync(SHOTS, { recursive: true })
const SECTIONS = ['top', 'about', 'stack', 'projects', 'services', 'process', 'contact']
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
    const text = document.querySelector('#top h1').parentElement.parentElement.getBoundingClientRect()
    const bg = getComputedStyle(document.querySelector('#top')).backgroundColor
    return {
      left: box.left,
      right: window.innerWidth - box.right,
      top: box.top,
      bottom: box.bottom,
      width: box.width,
      height: box.height,
      textTop: h1.top,
      textLeft: text.left,
      textRight: window.innerWidth - text.right,
      textMid: (text.top + text.bottom) / 2,
      vw: window.innerWidth,
      vh: window.innerHeight,
      bg,
    }
  })
}

/** Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Playwright writes). */
function decodePng(buf) {
  let pos = 8
  let width = 0
  let height = 0
  let channels = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      channels = { 2: 3, 6: 4 }[data[9]]
    } else if (type === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const px = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x]
      const a = x >= channels ? px[y * stride + x - channels] : 0
      const b = y > 0 ? px[(y - 1) * stride + x] : 0
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0
      const p = a + b - c
      const pr = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c
      px[y * stride + x] = (v + [0, a, b, (a + b) >> 1, pr][f]) & 255
    }
  }
  return { width, height, at: (x, y) => [...px.subarray(y * stride + x * channels, y * stride + x * channels + 3)] }
}

/** Screenshot of the hero frame box; true if every sampled edge pixel is black. */
async function frameEdgesBlack(page) {
  const box = await page.evaluate(() => {
    const r = document.querySelector('#top canvas').getBoundingClientRect()
    return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height }
  })
  const img = decodePng(await page.screenshot({ clip: box, fullPage: true }))
  const pts = []
  const W = img.width - 1
  const H = img.height - 1
  for (let i = 0; i <= 10; i++) {
    pts.push([Math.round((W * i) / 10), 1], [1, Math.round((H * i) / 20)], [W - 1, Math.round((H * i) / 20)])
  }
  const bad = pts.map(([x, y]) => [x, y, img.at(x, y)]).filter(([, , [r, g, b]]) => r + g + b > 9)
  return { ok: bad.length === 0, bad: bad.slice(0, 5) }
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
  const sideBySide = width >= 1024
  if (sideBySide) {
    check(`[${width}] hero image + text centered as a pair`, Math.abs(g.left - g.textRight) <= 2, `left ${g.left} right ${g.textRight}`)
    check(`[${width}] hero text beside the frame`, g.textLeft >= g.left + g.width, `text left ${g.textLeft} < frame right ${g.left + g.width}`)
    check(`[${width}] hero image and text share a vertical center`, Math.abs((g.top + g.bottom) / 2 - g.textMid) <= 2, `frame ${(g.top + g.bottom) / 2} text ${g.textMid}`)
  } else {
    check(`[${width}] hero frame centered`, Math.abs(g.left - g.right) <= 2, `left ${g.left} right ${g.right}`)
    check(`[${width}] hero text below the frame`, g.textTop >= g.bottom, `h1 top ${g.textTop} < frame bottom ${g.bottom}`)
  }
  check(`[${width}] hero frame within height cap`, g.height <= cap + 1, `${g.height} > ${cap}`)
  check(`[${width}] hero background is black`, g.bg === 'rgb(0, 0, 0)', g.bg)
  await page.waitForFunction(() => document.querySelector('#top canvas').dataset.frame !== undefined, null, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(300)
  const edges = await frameEdgesBlack(page)
  check(`[${width}] no frame edge: transparent areas render black`, edges.ok, JSON.stringify(edges.bad))

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

// Every frame file is a transparent cutout
{
  const page = await browser.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const res = await page.evaluate(async (framesUrl) => {
    const names = ['center', ...Array.from({ length: 64 }, (_, i) => `frame_${String(i).padStart(2, '0')}`)]
    const out = []
    for (const n of names) {
      const img = new Image()
      img.src = `${framesUrl}${n}.webp`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      let translucent = 0
      let zero = 0
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 255) translucent++
        if (d[i] === 0) zero++
      }
      out.push({ n, w: c.width, h: c.height, translucent, zero })
    }
    return out
  }, new URL('frames/', BASE.endsWith('/') ? BASE : `${BASE}/`).href)
  check('[frames] 65 frames decoded', res.length === 65, String(res.length))
  const opaque = res.filter((r) => r.translucent === 0).map((r) => r.n)
  check('[frames] every frame has alpha < 255 somewhere', opaque.length === 0, opaque.join(','))
  const noZero = res.filter((r) => r.zero === 0).map((r) => r.n)
  check('[frames] every frame has fully transparent background', noZero.length === 0, noZero.join(','))
  const size = res.filter((r) => r.w !== 720 || r.h !== 1030).map((r) => `${r.n} ${r.w}x${r.h}`)
  check('[frames] all 720×1030', size.length === 0, size.join(','))
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
    // Horizontal aims are clamped to the window (the frame sits left of center).
    ['right', Math.min(R, 1430 - face.x), 0, 16],
    ['down', 0, Math.min(R, 890 - face.y), 32],
    ['left', -Math.min(R, face.x - 10), 0, 48],
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
