import { useEffect, useRef, useState } from 'react'

/**
 * Cursor-bound 360° portrait. Rebuilt from the archived engine
 * (animation/frames-archive/HeroCanvas.tsx.txt).
 *
 * Frames (v2): public/frames/center.webp + frame_00…frame_63.webp, 720×1030,
 * opaque. frame_00 = looking up, 16 = right, 32 = down, 48 = left
 * (verified against the files: FRAME_OFFSET = 0). The v1 set (720×1280,
 * transparent) is archived in animation/frames-archive-v1/.
 *
 * Fit is CONTAIN inside a box locked to the frame ratio, on solid black, so
 * the head is never cropped. The box is sized by CSS before any frame loads
 * (no layout shift).
 *
 * Reduced motion, or no fine hover pointer (touch): center.webp only — no
 * frame preload, no rAF loop, no cursor tracking.
 */

const TOTAL_FRAMES = 64
/** Index of the "looking up" frame. Change if a re-shot set starts elsewhere. */
const FRAME_OFFSET = 0
const LERP = 0.26
const DEADZONE = 0.12 // fraction of the viewport diagonal
const TWO_PI = Math.PI * 2
const BG = '#000'

/** Point between the eyes, as fractions of the frame. Measured on the v2
 *  center.webp: pupils at x≈302 and x≈442, eye line y≈300 (of 720×1030). */
const FACE_CX = 0.514
const FACE_CY = 0.291

const FRAME_W = 720
const FRAME_H = 1030

const base = import.meta.env.BASE_URL
const CENTER_SRC = `${base}frames/center.webp`
const frameSrc = (i: number) => `${base}frames/frame_${String(i).padStart(2, '0')}.webp`

/** Shortest-arc angular lerp. */
function lerpAngle(a: number, b: number, t: number) {
  const d = ((((b - a + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI
  return a + d * t
}

/** Screen angle (atan2, 0 = right, +y down) → frame index, 0 = up. */
function angleToIndex(angle: number) {
  const fromUp = (((angle + Math.PI / 2) % TWO_PI) + TWO_PI) % TWO_PI
  return (Math.round((fromUp / TWO_PI) * TOTAL_FRAMES) + FRAME_OFFSET) % TOTAL_FRAMES
}

/** Contain-fit rect for an image in a canvas, centered. */
function containRect(iw: number, ih: number, cw: number, ch: number) {
  const s = Math.min(cw / iw, ch / ih)
  const w = iw * s
  const h = ih * s
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h }
}

export default function HeroCanvas({ onLoaded }: { onLoaded?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onLoadedRef = useRef(onLoaded)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const interactive = !reduced && finePointer

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = img.onerror = () => resolve(img)
        img.src = src
      })

    const center = load(CENTER_SRC)
    const frames = interactive ? Array.from({ length: TOTAL_FRAMES }, (_, i) => load(frameSrc(i))) : []
    const images: (HTMLImageElement | null)[] = Array(TOTAL_FRAMES).fill(null)
    let centerImg: HTMLImageElement | null = null
    let disposed = false
    let current = -2 // -1 = center, 0..63 = directional, -2 = nothing drawn
    let target = -1


    frames.forEach((p, i) => p.then((img) => (images[i] = img.naturalWidth ? img : null)))
    center.then((img) => {
      if (disposed) return
      centerImg = img.naturalWidth ? img : null
      current = -2 // force a draw now that the center frame exists
      draw()
      if (!interactive) onLoadedRef.current?.()
    })
    if (interactive) {
      Promise.all([center, ...frames]).then(() => !disposed && onLoadedRef.current?.())
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(canvas!.clientWidth * dpr)
      const h = Math.round(canvas!.clientHeight * dpr)
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w
        canvas!.height = h
        current = -2
      }
    }

    /** Draws `target` if it differs from what's on the canvas and is loaded. */
    function draw() {
      if (target === current) return
      const img = target === -1 ? centerImg : images[target]
      if (!img) return // not loaded yet; the next tick retries
      const { width: cw, height: ch } = canvas!
      ctx!.fillStyle = BG
      ctx!.fillRect(0, 0, cw, ch)
      const r = containRect(img.naturalWidth || FRAME_W, img.naturalHeight || FRAME_H, cw, ch)
      ctx!.drawImage(img, r.x, r.y, r.w, r.h)
      current = target
      canvas!.dataset.frame = String(current) // read by scripts/render-check.mjs
      setDrawn(true)
    }

    resize()

    if (!interactive) {
      const onResize = () => {
        resize()
        draw()
      }
      window.addEventListener('resize', onResize)
      return () => {
        disposed = true
        window.removeEventListener('resize', onResize)
      }
    }

    /* ----------------------------- interactive ----------------------------- */

    const mouse = { x: 0, y: 0, inside: false }
    let smooth = -Math.PI / 2 // start looking up-ish; only used once the cursor moves
    let raf = 0
    let running = false

    const onScreen = () => {
      const r = canvas.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight
    }

    function tick() {
      // Pause the loop while the hero is scrolled off screen; onScroll restarts it.
      if (!onScreen()) {
        running = false
        canvas!.dataset.loop = 'paused'
        return
      }
      raf = requestAnimationFrame(tick)

      if (!mouse.inside) {
        target = -1
      } else {
        const rect = canvas!.getBoundingClientRect()
        const fit = containRect(FRAME_W, FRAME_H, rect.width, rect.height)
        const fx = rect.left + fit.x + fit.w * FACE_CX
        const fy = rect.top + fit.y + fit.h * FACE_CY
        const dx = mouse.x - fx
        const dy = mouse.y - fy
        const diag = Math.hypot(window.innerWidth, window.innerHeight)
        if (Math.hypot(dx, dy) < diag * DEADZONE) {
          target = -1 // eye contact
        } else {
          smooth = lerpAngle(smooth, Math.atan2(dy, dx), LERP)
          target = angleToIndex(smooth)
        }
      }
      draw()
    }

    const start = () => {
      if (running || disposed) return
      running = true
      canvas.dataset.loop = 'running'
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      if (!mouse.inside) smooth = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2)
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.inside = true
    }
    // Leaving the window recenters (relatedTarget null = left the document).
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) mouse.inside = false
    }
    const onBlur = () => (mouse.inside = false)
    const onResize = () => {
      resize()
      start()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseout', onOut)
    window.addEventListener('blur', onBlur)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', start, { passive: true })
    start()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', start)
    }
  }, [])

  return (
    <div className="relative mx-auto aspect-[720/1030] w-[min(100%,calc(60svh*720/1030))] bg-black lg:w-[min(100%,calc(70svh*720/1030))]">
      {/* Prerendered still: paints before JS and stays for no-JS visitors.
          The canvas takes over once it has drawn a frame. */}
      <img
        src={CENTER_SRC}
        alt=""
        width={FRAME_W}
        height={FRAME_H}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Portrait of Paul that turns to follow your cursor"
        className={`absolute inset-0 block h-full w-full ${drawn ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
