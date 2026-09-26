import { useEffect, useRef } from 'react'

const TOTAL_FRAMES = 64
const LERP_FACTOR = 0.26
const DEADZONE_RADIUS = 0.12 // fraction of the viewport diagonal
const TWO_PI = Math.PI * 2
// Pure black: the cut-out frames keep a few near-black wall shadows around the
// head (luminance ~1–2), which would show as darker patches on #0a0a0a.
const BG_COLOR = '#000'

// Face center as a fraction of the frame image
const FACE_CX = 0.5
const FACE_CY = 0.5

// Where the face lands on screen, and how big the frame is drawn.
// zoom: 0 = whole frame fits the hero (contain), 1 = fills edge to edge (cover).
// size: extra multiplier on top of that — below 1 shrinks the frame further.
// Desktop puts the face right of center so the headline has room on the left.
const LAYOUT = {
  desktop: { faceX: 0.7, faceY: 0.5, zoom: 0, size: 0.65 },
  mobile: { faceX: 0.5, faceY: 0.34, zoom: 0, size: 0.75 },
}
const DESKTOP_MIN_WIDTH = 1024

const framePath = (i: number) =>
  `${import.meta.env.BASE_URL}frames/frame_${String(i).padStart(2, '0')}.webp`
const CENTER_PATH = `${import.meta.env.BASE_URL}frames/center.webp`

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((((b - a + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI
  return a + diff * t
}

// Cursor angle -> frame index (0 = up, 16 = right, 32 = down, 48 = left)
function angleToFrameIndex(angle: number) {
  const shifted = (((angle + Math.PI / 2) % TWO_PI) + TWO_PI) % TWO_PI
  return Math.round((shifted / TWO_PI) * TOTAL_FRAMES) % TOTAL_FRAMES
}

function layoutFor(width: number) {
  return width >= DESKTOP_MIN_WIDTH ? LAYOUT.desktop : LAYOUT.mobile
}

/** Scale between contain and cover, then place the face at the layout target. */
function heroFit(imgW: number, imgH: number, cw: number, ch: number, cssWidth: number) {
  const { faceX, faceY, zoom, size } = layoutFor(cssWidth)
  const contain = Math.min(cw / imgW, ch / imgH)
  const cover = Math.max(cw / imgW, ch / imgH)
  const scale = (contain + (cover - contain) * zoom) * size
  const dw = imgW * scale
  const dh = imgH * scale
  // Frame smaller than the canvas on an axis: follow the face target freely.
  // Larger: clamp so the frame always covers that axis.
  const place = (target: number, size: number, canvas: number) =>
    size <= canvas ? target : Math.min(0, Math.max(canvas - size, target))
  const dx = place(cw * faceX - imgW * FACE_CX * scale, dw, cw)
  const dy = place(ch * faceY - imgH * FACE_CY * scale, dh, ch)
  return { scale, dx, dy, dw, dh }
}

/** Soft black fade on any frame edge that sits inside the canvas. */
function fadeEdges(ctx: CanvasRenderingContext2D, f: ReturnType<typeof heroFit>, cw: number, ch: number) {
  const fx = f.dw * 0.18
  const fy = f.dh * 0.12
  const band = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, BG_COLOR)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(rx, ry, rw, rh)
  }
  const right = f.dx + f.dw
  const bottom = f.dy + f.dh
  if (f.dx > 0) band(f.dx, 0, f.dx + fx, 0, f.dx, 0, fx, ch)
  if (right < cw) band(right, 0, right - fx, 0, right - fx, 0, fx, ch)
  if (f.dy > 0) band(0, f.dy, 0, f.dy + fy, 0, f.dy, cw, fy)
  if (bottom < ch) band(0, bottom, 0, bottom - fy, 0, bottom - fy, cw, fy)
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frames: HTMLImageElement[] = []
    const center = new Image()
    center.src = CENTER_PATH
    if (!reduced) {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image()
        img.src = framePath(i)
        frames.push(img)
      }
    }

    const mouse = { x: 0, y: 0, active: false }
    let smoothAngle = -Math.PI / 2
    let current = -2 // forces the first draw
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
    }
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      current = -2
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      if (!center.complete || !center.naturalWidth) return

      const rect = canvas!.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return // off screen

      const imgW = center.naturalWidth
      const imgH = center.naturalHeight
      const cssFit = heroFit(imgW, imgH, rect.width, rect.height, rect.width)
      const faceX = rect.left + cssFit.dx + imgW * FACE_CX * cssFit.scale
      const faceY = rect.top + cssFit.dy + imgH * FACE_CY * cssFit.scale

      let target = -1
      if (!reduced && mouse.active) {
        const dx = mouse.x - faceX
        const dy = mouse.y - faceY
        smoothAngle = lerpAngle(smoothAngle, Math.atan2(dy, dx), LERP_FACTOR)
        const diag = Math.hypot(window.innerWidth, window.innerHeight)
        if (Math.hypot(dx, dy) >= diag * DEADZONE_RADIUS) target = angleToFrameIndex(smoothAngle)
      }

      if (target === current) return
      const img = target === -1 ? center : frames[target]
      if (!img.complete || !img.naturalWidth) return // not loaded yet; retry next tick
      current = target

      const cw = canvas!.width
      const ch = canvas!.height
      const fit = heroFit(imgW, imgH, cw, ch, rect.width)
      ctx!.globalAlpha = 1
      ctx!.fillStyle = BG_COLOR
      ctx!.fillRect(0, 0, cw, ch)
      // One crisp frame at full opacity — no crossfade between frames
      ctx!.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh)
      fadeEdges(ctx!, fit, cw, ch)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 block h-full w-full"
      style={{ backgroundColor: BG_COLOR }}
    />
  )
}
