/**
 * WallWash — pressure-washed headline engine, adapted from the fullscreen
 * demo at animation/wall-wash/wall-wash.js to the CONTAINED version:
 *
 *   - The canvas overlays exactly the hero H1 box; the site's real DOM
 *     headline is the "clean wall" underneath. The demo's painted text,
 *     wall background, and vignette are gone (no paintClean/vigC).
 *   - Demo chrome stripped: no HUD, no % meter, no reset button, no R key.
 *     The wall re-grimes itself after a long idle (REGRIME_AFTER_MS).
 *   - All coordinates are local to the canvas box. Pointer/touch listeners
 *     hang off the canvas only, so the lance can never aim — or intercept
 *     events — outside the headline zone. touch-action is scoped via CSS
 *     (.wall-wash-canvas).
 *   - DPR is capped at 2. initWallWash() returns a destroy() cleanup and
 *     never draws for users who prefer reduced motion (the caller skips
 *     init in that case).
 *
 * DOM contract:
 *   <div relative>    — the headline container (sizing box, no padding)
 *     <h1>…</h1>      — real text, always in the markup (SEO/no-JS safe)
 *     <canvas>        — absolute inset-0, class .wall-wash-canvas
 */

const IDLE_AFTER_MS = 2400 // pointer silence before the auto-sweep takes over
const REGRIME_AFTER_MS = 60_000 // idle streak that triggers a re-grime
const MAX_DPR = 2

/* Water-stream endpoint math (used by frameLoop): grime is erased where
   the water LANDS, not where the pointer points. Drops leave the nozzle
   tip at R(2300,3100) px/s (mean 2700) and live R(0.16,0.28)s (mean 0.22),
   so the visible stream ends ~594px out, sagging under gravity. If the
   drop update's gravity figure changes, keep DROP_GRAVITY in sync. */
const DROP_GRAVITY = 3400
const STREAM_T = 0.22 // mean drop lifetime, seconds
const STREAM_LEN = 2700 * STREAM_T // mean speed × lifetime ≈ 594px
const STREAM_SAG = 0.5 * DROP_GRAVITY * STREAM_T * STREAM_T // ≈ 82px

/* Corridor erase (used by frameLoop): the water cleans everything from the
   nozzle tip to the impact point, not just the endpoint. Spacing ≈ the mean
   erase diameter, so consecutive passes overlap without striping. Power
   fades with distance; the endpoint erase stays full strength so the
   landing spot remains the single brightest point. */
const CORRIDOR_STEP = 56 // px between samples (erase diameter ≈ 40–72px)
const MAX_CORRIDOR_SAMPLES = 10
const CORRIDOR_START = 0.9 // erase power at the tip
const CORRIDOR_END = 0.65 // erase power just before the impact point

type Drop = { x: number; y: number; vx: number; vy: number; life: number; ml: number }
type Splash = Drop
type Mist = { x: number; y: number; r: number; vr: number; life: number; ml: number }

export function initWallWash(canvas: HTMLCanvasElement): { destroy: () => void } {
  const host = canvas.parentElement
  const ctx = canvas.getContext('2d')
  if (!host || !ctx) return { destroy: () => {} }
  // Hoisted function declarations don't inherit narrowing — bind non-null refs.
  const c2d: CanvasRenderingContext2D = ctx

  let W = 0
  let H = 0
  let DPR = 1
  let dirtC: HTMLCanvasElement | null = null
  let dctx: CanvasRenderingContext2D | null = null
  let wetC: HTMLCanvasElement | null = null
  let wctx: CanvasRenderingContext2D | null = null
  const drops: Drop[] = []
  const splashes: Splash[] = []
  const mists: Mist[] = []
  const mouse = { x: 0, y: 0 }
  let lastMove = -1e9 // start idle so the wall cleans itself on load
  let T = 0
  let last = performance.now()
  let raf: number | null = null
  const frame = { nx: 0, ny: 0 }
  // Corridor sample positions, reused every frame (no per-frame allocations).
  const corridor = new Float64Array(MAX_CORRIDOR_SAMPLES * 2)

  const R = (a: number, b: number) => a + Math.random() * (b - a)

  function mkCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const c = document.createElement('canvas')
    c.width = Math.round(W * DPR)
    c.height = Math.round(H * DPR)
    const g = c.getContext('2d') as CanvasRenderingContext2D
    g.setTransform(DPR, 0, 0, DPR, 0, 0)
    return [c, g]
  }

  /** Nozzle scale — keeps the lance proportional inside small boxes. */
  function nozzleScale(): number {
    return Math.max(0.6, Math.min(1, W / 900))
  }

  function sizeAll(): void {
    DPR = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    W = canvas.clientWidth
    H = canvas.clientHeight
    if (W < 2 || H < 2) return
    canvas.width = Math.round(W * DPR)
    canvas.height = Math.round(H * DPR)
    c2d.setTransform(DPR, 0, 0, DPR, 0, 0)
    let t = mkCanvas()
    dirtC = t[0]
    dctx = t[1]
    t = mkCanvas()
    wetC = t[0]
    wctx = t[1]
    paintDirt()
  }

  function paintDirt(): void {
    const g = dctx
    if (!g || !wctx) return
    g.clearRect(0, 0, W, H)
    g.fillStyle = '#2a2e28'
    g.fillRect(0, 0, W, H)
    // irregular grime blotches
    for (let i = 0; i < 46; i++) {
      const x = R(0, W)
      const y = R(0, H)
      const r = R(60, 260)
      const col = Math.random() < 0.7 ? '0,0,0' : '84,102,74'
      const sg = g.createRadialGradient(x, y, 0, x, y, r)
      sg.addColorStop(0, `rgba(${col},${R(0.06, 0.18)})`)
      sg.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = sg
      g.beginPath()
      g.arc(x, y, r, 0, 7)
      g.fill()
    }
    // drips
    for (let d = 0; d < 30; d++) {
      const dx = R(0, W)
      const dy = R(0, H * 0.7)
      const len = R(120, 520)
      const w = R(5, 22)
      const dg = g.createLinearGradient(0, dy, 0, dy + len)
      dg.addColorStop(0, `rgba(10,12,9,${R(0.1, 0.22)})`)
      dg.addColorStop(1, 'rgba(10,12,9,0)')
      g.fillStyle = dg
      g.fillRect(dx, dy, w, len)
    }
    // moss patches
    for (let m = 0; m < 26; m++) {
      const mx = R(0, W)
      const my = R(H * 0.3, H)
      const mr = R(18, 70)
      const mg = g.createRadialGradient(mx, my, 0, mx, my, mr)
      mg.addColorStop(0, `rgba(96,124,74,${R(0.1, 0.22)})`)
      mg.addColorStop(1, 'rgba(96,124,74,0)')
      g.fillStyle = mg
      g.beginPath()
      g.arc(mx, my, mr, 0, 7)
      g.fill()
    }
    // spores
    const n = Math.round((W * H) / 60)
    for (let s = 0; s < n; s++) {
      const a = R(0.05, 0.25)
      g.fillStyle =
        Math.random() < 0.85
          ? `rgba(12,14,11,${a})`
          : `rgba(120,126,110,${a * 0.6})`
      g.fillRect(R(0, W), R(0, H), R(1, 2.4), R(1, 2.4))
    }
    // Ragged edges: the dirt is an opaque slab the size of the headline box
    // (unlike the fullscreen demo, its rim is visible) — eat a soft border
    // so it reads as grime, not a rectangle.
    g.globalCompositeOperation = 'destination-out'
    const eatEdge = (count: number, place: () => [number, number]) => {
      for (let i = 0; i < count; i++) {
        const [x, y] = place()
        const r = R(24, 70)
        const rg = g.createRadialGradient(x, y, r * 0.2, x, y, r)
        rg.addColorStop(0, 'rgba(0,0,0,.9)')
        rg.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = rg
        g.beginPath()
        g.arc(x, y, r, 0, 7)
        g.fill()
      }
    }
    eatEdge(10, () => [R(-16, 24), R(0, H)]) // left
    eatEdge(10, () => [R(W - 24, W + 16), R(0, H)]) // right
    eatEdge(8, () => [R(0, W), R(-16, 24)]) // top
    eatEdge(8, () => [R(0, W), R(H - 24, H + 16)]) // bottom
    g.globalCompositeOperation = 'source-over'

    drops.length = 0
    splashes.length = 0
    mists.length = 0
    wctx.clearRect(0, 0, W, H)
  }

  function erase(x: number, y: number, pow: number): void {
    const g = dctx
    if (!g || !wctx) return
    g.globalCompositeOperation = 'destination-out'
    // Impact head — the single round clean spot where the water lands.
    const r = (20 + Math.random() * 16) * pow * 1.2
    const rg = g.createRadialGradient(x, y, r * 0.15, x, y, r)
    rg.addColorStop(0, 'rgba(0,0,0,.95)')
    rg.addColorStop(0.65, 'rgba(0,0,0,.6)')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg
    g.beginPath()
    g.arc(x, y, r, 0, 7)
    g.fill()
    // Downspill — the sheet of water sheeting down the wall under the
    // impact point: a few tapered vertical streaks, alpha fading to 0
    // at the bottom, slight horizontal wander so they read organic.
    const streaks = 2 + (Math.random() < 0.5 ? 1 : 0)
    for (let i = 0; i < streaks; i++) {
      const len = R(120, 260)
      const sx = x + R(-r * 0.5, r * 0.5)
      const ex = sx + R(-9, 9)
      const w0 = R(7, 14)
      const w1 = w0 * R(0.15, 0.35)
      const a = R(0.35, 0.6)
      const sg = g.createLinearGradient(0, y, 0, y + len)
      sg.addColorStop(0, `rgba(0,0,0,${a})`)
      sg.addColorStop(0.7, `rgba(0,0,0,${a * 0.4})`)
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = sg
      g.beginPath()
      g.moveTo(sx - w0 / 2, y)
      g.quadraticCurveTo(sx - w0 * 0.4 + R(-3, 3), y + len * 0.55, ex - w1 / 2, y + len)
      g.lineTo(ex + w1 / 2, y + len)
      g.quadraticCurveTo(sx + w0 * 0.4 + R(-3, 3), y + len * 0.55, sx + w0 / 2, y)
      g.closePath()
      g.fill()
    }
    // One short faded drip at high power only (near-nozzle corridor
    // samples) — secondary detail, not the main look.
    if (pow > 0.8) {
      const len = R(40, 90)
      const sx = x + R(-10, 10)
      const w = R(2, 5)
      const dg = g.createLinearGradient(0, y, 0, y + len)
      dg.addColorStop(0, 'rgba(0,0,0,.28)')
      dg.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = dg
      g.fillRect(sx - w / 2, y, w, len)
    }
    g.globalCompositeOperation = 'source-over'
    wctx.fillStyle = 'rgba(110,155,195,.15)'
    wctx.beginPath()
    wctx.arc(x, y, r * 1.2, 0, 7)
    wctx.fill()
  }

  function rr(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    g.beginPath()
    if (g.roundRect) {
      g.roundRect(x, y, w, h, r)
    } else {
      g.moveTo(x + r, y)
      g.arcTo(x + w, y, x + w, y + h, r)
      g.arcTo(x + w, y + h, x, y + h, r)
      g.arcTo(x, y + h, x, y, r)
      g.arcTo(x, y, x + w, y, r)
      g.closePath()
    }
  }

  function drawNozzle(g: CanvasRenderingContext2D, x: number, y: number, ang: number): void {
    const s = nozzleScale()
    g.save()
    g.translate(x, y)
    g.rotate(ang)
    g.scale(s, s)
    const gl = g.createRadialGradient(0, 0, 0, 0, 0, 26)
    gl.addColorStop(0, 'rgba(170,220,255,.5)')
    gl.addColorStop(1, 'rgba(170,220,255,0)')
    g.fillStyle = gl
    g.beginPath()
    g.arc(0, 0, 26, 0, 7)
    g.fill()
    const tube = g.createLinearGradient(0, -6, 0, 6)
    tube.addColorStop(0, '#eef3f7')
    tube.addColorStop(0.5, '#9aa6b1')
    tube.addColorStop(1, '#525d66')
    g.fillStyle = tube
    rr(g, 6, -5, 96, 10, 5)
    g.fill()
    g.fillStyle = '#f6821f'
    rr(g, 58, -6, 26, 12, 4)
    g.fill()
    g.fillStyle = '#2c3138'
    rr(g, 96, -9, 34, 18, 6)
    g.fill()
    g.fillStyle = '#f6821f'
    rr(g, 100, -14, 16, 6, 2)
    g.fill()
    g.strokeStyle = '#1d2126'
    g.lineWidth = 7
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(128, 0)
    g.quadraticCurveTo(152, 20, 176, 30)
    g.stroke()
    g.restore()
  }

  function frameLoop(now: number): void {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    T += dt
    if (!dctx || !wctx) return
    const wg = wctx

    // Long-idle → re-grime the wall, then restart the idle clock.
    if (now - lastMove > REGRIME_AFTER_MS) {
      paintDirt()
      lastMove = now
    }

    const idle = now - lastMove > IDLE_AFTER_MS
    let tx: number
    let ty: number
    if (idle) {
      tx = W * 0.5 + Math.sin(T * 0.55) * W * 0.33
      ty = H * 0.42 + Math.sin(T * 0.87 + 1.3) * H * 0.2
    } else {
      tx = mouse.x
      ty = mouse.y
    }
    tx = Math.max(10, Math.min(W - 10, tx))
    ty = Math.max(10, Math.min(H - 10, ty))

    // Nozzle trails behind the aim point, clamped so the sprite doesn't
    // hard-clip at the canvas rim on a box this small.
    const s = nozzleScale()
    const wantX = tx - 230 * s
    const wantY = ty + 170 * s
    frame.nx += (wantX - frame.nx) * Math.min(1, dt * 6)
    frame.ny += (wantY - frame.ny) * Math.min(1, dt * 6)
    frame.nx = Math.max(0, Math.min(W - 190 * s, frame.nx))
    frame.ny = Math.max(6, Math.min(H - 42 * s, frame.ny))
    const ang = Math.atan2(ty - frame.ny, tx - frame.nx) + R(-0.012, 0.012)
    const tipX = frame.nx + Math.cos(ang) * 70 * s
    const tipY = frame.ny + Math.sin(ang) * 70 * s

    // Erase along the whole stream — tip → impact — so the water cleans
    // everything it touches: a sweep covers the full headline box, left
    // edge included. Sample count is bounded by MAX_CORRIDOR_SAMPLES and
    // shrinks for a shorter stream; spacing matches the erase diameter so
    // passes overlap without striping. Power fades with distance and the
    // endpoint erase is full strength, so the corridor fades INTO the
    // landing spot, which stays the single brightest point.
    const impactX = tipX + Math.cos(ang) * STREAM_LEN
    const impactY = tipY + Math.sin(ang) * STREAM_LEN + STREAM_SAG
    const cdx = impactX - tipX
    const cdy = impactY - tipY
    const cn = Math.min(
      MAX_CORRIDOR_SAMPLES,
      Math.max(2, Math.ceil(Math.sqrt(cdx * cdx + cdy * cdy) / CORRIDOR_STEP)),
    )
    for (let i = 0; i < cn; i++) {
      const t = i / (cn - 1)
      corridor[i * 2] = tipX + cdx * t
      corridor[i * 2 + 1] = tipY + cdy * t
    }
    for (let i = 0; i < cn - 1; i++) {
      const t = i / (cn - 1)
      erase(corridor[i * 2], corridor[i * 2 + 1], CORRIDOR_START + (CORRIDOR_END - CORRIDOR_START) * t)
    }
    erase(corridor[(cn - 1) * 2], corridor[(cn - 1) * 2 + 1], 1)

    const cnt = Math.max(1, Math.round(26 * dt * 60))
    for (let i = 0; i < cnt; i++) {
      const a = ang + R(-0.045, 0.045)
      const sp = R(2300, 3100)
      drops.push({ x: tipX, y: tipY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R(0.16, 0.28), ml: 0.28 })
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const p = drops[i]
      p.life -= dt
      if (p.life <= 0) {
        for (let k = 0; k < 3; k++) {
          const sa = ang + R(-1.1, 1.1)
          const ss = R(180, 760)
          splashes.push({ x: p.x, y: p.y, vx: Math.cos(sa) * ss, vy: Math.sin(sa) * ss - R(0, 220), life: R(0.12, 0.3), ml: 0.3 })
        }
        if (Math.random() < 0.3) mists.push({ x: p.x, y: p.y, r: R(6, 14), vr: R(30, 80), life: R(0.3, 0.6), ml: 0.6 })
        drops.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += DROP_GRAVITY * dt
    }
    if (drops.length > 900) drops.splice(0, drops.length - 900)

    for (let i = splashes.length - 1; i >= 0; i--) {
      const q = splashes[i]
      q.life -= dt
      if (q.life <= 0 || q.y > H + 20) {
        splashes.splice(i, 1)
        continue
      }
      q.x += q.vx * dt
      q.y += q.vy * dt
      q.vy += 3000 * dt
    }

    for (let i = mists.length - 1; i >= 0; i--) {
      const m = mists[i]
      m.life -= dt
      if (m.life <= 0) {
        mists.splice(i, 1)
        continue
      }
      m.r += m.vr * dt
      m.y -= 14 * dt
    }
    if (mists.length > 140) mists.splice(0, mists.length - 140)

    wg.globalCompositeOperation = 'destination-out'
    wg.fillStyle = 'rgba(0,0,0,0.012)'
    wg.fillRect(0, 0, W, H)
    wg.globalCompositeOperation = 'source-over'

    c2d.clearRect(0, 0, W, H)
    c2d.drawImage(dirtC as HTMLCanvasElement, 0, 0, W, H)
    c2d.drawImage(wetC as HTMLCanvasElement, 0, 0, W, H)

    for (const m2 of mists) {
      const ma = Math.max(0, m2.life / m2.ml) * 0.16
      const mg2 = c2d.createRadialGradient(m2.x, m2.y, 0, m2.x, m2.y, m2.r)
      mg2.addColorStop(0, `rgba(225,240,250,${ma})`)
      mg2.addColorStop(1, 'rgba(225,240,250,0)')
      c2d.fillStyle = mg2
      c2d.beginPath()
      c2d.arc(m2.x, m2.y, m2.r, 0, 7)
      c2d.fill()
    }

    c2d.lineCap = 'round'
    c2d.lineWidth = 1.6
    for (const d2 of drops) {
      const da = Math.max(0, d2.life / d2.ml) * 0.55
      c2d.strokeStyle = `rgba(198,230,252,${da})`
      c2d.beginPath()
      c2d.moveTo(d2.x, d2.y)
      c2d.lineTo(d2.x - d2.vx * 0.012, d2.y - d2.vy * 0.012)
      c2d.stroke()
    }
    c2d.lineWidth = 1.2
    for (const s2 of splashes) {
      const sa2 = Math.max(0, s2.life / s2.ml) * 0.5
      c2d.strokeStyle = `rgba(214,240,252,${sa2})`
      c2d.beginPath()
      c2d.moveTo(s2.x, s2.y)
      c2d.lineTo(s2.x - s2.vx * 0.01, s2.y - s2.vy * 0.01)
      c2d.stroke()
    }

    drawNozzle(c2d, frame.nx, frame.ny, ang)

    raf = requestAnimationFrame(frameLoop)
  }

  function start(): void {
    if (raf !== null) return
    raf = requestAnimationFrame(frameLoop)
  }

  function stop(): void {
    if (raf === null) return
    cancelAnimationFrame(raf)
    raf = null
  }

  const aim = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect()
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
    lastMove = performance.now()
  }
  canvas.addEventListener('pointermove', aim)
  canvas.addEventListener('pointerdown', aim)

  const ro = new ResizeObserver(sizeAll)
  ro.observe(host)

  // Pause when scrolled off-screen or the tab is hidden (mirrors splash.ts).
  let inView = true
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting
    if (inView && !document.hidden) start()
    else stop()
  })
  io.observe(host)
  const onVisibility = (): void => {
    if (!document.hidden && inView) start()
    else stop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  sizeAll()
  start()

  return {
    destroy() {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointermove', aim)
      canvas.removeEventListener('pointerdown', aim)
    },
  }
}
