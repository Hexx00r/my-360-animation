/**
 * Water Splash header engine — adapted from animation/splash.js to the site's
 * design tokens (electric cyan #00d4ff on #0a0a0a) and React lifecycle.
 *
 * DOM contract (unchanged from the demo):
 *   <header>            — positioned ancestor, overflow hidden (clips splash)
 *     <canvas>          — this module's drawing surface (absolute, inset 0,
 *                         pointer-events none, rendered by SplashCanvas)
 *     <div content>     — nav content, must stack above (relative + z-index)
 *
 * initSplash() returns a destroy() cleanup; it never draws for users who
 * prefer reduced motion, and pauses via IntersectionObserver when the header
 * is off-screen.
 */

interface Jet {
  x: number;
  y: number;
  angle: number;
  spread: number;
  power: number;
}

/* Colors remapped from the demo's sky-blues to the site cyan tokens:
   droplet #60befa -> #00d4ff, mist #7dd3fc -> #33e0ff, ripple #38bdf8 -> #00d4ff. */
const CFG = {
  jets: [
    { x: 0.04, y: 0.95, angle: -72, spread: 10, power: 9.5 }, // left nozzle
    { x: 0.96, y: 0.95, angle: -108, spread: 10, power: 9.5 }, // right nozzle
    { x: 0.22, y: 1.0, angle: -85, spread: 14, power: 7.0 }, // center-left
    { x: 0.78, y: 1.0, angle: -95, spread: 14, power: 7.0 }, // center-right
  ] as Jet[],
  dropletColor: "rgba(0, 212, 255, ",
  mistColor: "rgba(51, 224, 255, ",
  rippleColor: "rgba(0, 212, 255, ",
  gravity: 0.28,
  drag: 0.995,
  emitRate: 2,
  /* Demo was tuned for a 72px bar; the site header is 48px. */
  maxDroplets: 240,
  maxRipples: 40,
  maxMist: 60,
};

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  decay: number;
  bounce: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  lineW: number;
}

interface Mist {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
}

export function initSplash(canvas: HTMLCanvasElement): { destroy: () => void } {
  const header = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!header || !ctx) return { destroy: () => {} };
  // Hoisted function declarations don't inherit narrowing — bind non-null refs.
  const host: HTMLElement = header;
  const context: CanvasRenderingContext2D = ctx;

  let W = 0;
  let H = 0;
  let raf: number | null = null;
  let disposed = false;

  const droplets: Droplet[] = [];
  const ripples: Ripple[] = [];
  const mist: Mist[] = [];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = host.clientWidth;
    H = host.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnDroplet(jet: Jet) {
    const rad = (jet.angle + (Math.random() - 0.5) * jet.spread * 2) * (Math.PI / 180);
    const speed = jet.power * (0.75 + Math.random() * 0.5);
    droplets.push({
      x: jet.x * W,
      y: jet.y * H,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      r: 0.8 + Math.random() * 1.8,
      life: 1,
      decay: 0.004 + Math.random() * 0.01,
      bounce: Math.random() < 0.3 ? 1 : 0,
    });
  }

  function spawnRipple(x: number, y: number) {
    ripples.push({
      x,
      y,
      r: 1,
      maxR: 8 + Math.random() * 18,
      alpha: 0.45,
      lineW: 1 + Math.random(),
    });
  }

  function spawnMist(x: number, y: number) {
    mist.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y - Math.random() * 8,
      r: 3 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.3,
      life: 1,
      decay: 0.006 + Math.random() * 0.012,
    });
  }

  function update() {
    for (const jet of CFG.jets) {
      for (let i = 0; i < CFG.emitRate; i++) {
        if (droplets.length < CFG.maxDroplets) spawnDroplet(jet);
      }
    }

    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.vy += CFG.gravity * (d.r / 2);
      d.vx *= CFG.drag;
      d.vy *= CFG.drag;
      d.x += d.vx;
      d.y += d.vy;
      d.life -= d.decay;

      // floor
      if (d.y >= H - 1) {
        d.y = H - 1;
        spawnRipple(d.x, H - 2);
        if (d.bounce > 0) {
          d.vy *= -0.35;
          d.vx *= 0.6;
          d.bounce--;
        } else {
          if (Math.random() < 0.25 && mist.length < CFG.maxMist) spawnMist(d.x, H - 4);
          droplets.splice(i, 1);
          continue;
        }
      }

      // side walls
      if (d.x <= 0 || d.x >= W) {
        spawnRipple(d.x < 0 ? 1 : W - 1, d.y);
        droplets.splice(i, 1);
        continue;
      }

      // ceiling
      if (d.y <= 0) {
        d.y = 0;
        d.vy *= -0.3;
        spawnRipple(d.x, 1);
      }

      if (d.life <= 0) droplets.splice(i, 1);
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += (r.maxR - r.r) * 0.18;
      r.alpha *= 0.92;
      if (r.alpha < 0.01) ripples.splice(i, 1);
    }

    for (let i = mist.length - 1; i >= 0; i--) {
      const m = mist[i];
      m.x += m.vx;
      m.y += m.vy;
      m.r += 0.06;
      m.life -= m.decay;
      if (m.life <= 0) mist.splice(i, 1);
    }
  }

  function draw() {
    context.clearRect(0, 0, W, H);

    for (const m of mist) {
      context.beginPath();
      context.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      context.fillStyle = CFG.mistColor + m.life * 0.12 + ")";
      context.fill();
    }

    for (const d of droplets) {
      const a = Math.min(d.life * 1.4, 1);
      context.beginPath();
      context.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      context.fillStyle = CFG.dropletColor + a + ")";
      context.fill();

      if (d.r > 1.8) {
        context.beginPath();
        context.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255," + a * 0.5 + ")";
        context.fill();
      }
    }

    for (const r of ripples) {
      context.beginPath();
      context.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, Math.PI * 2);
      context.strokeStyle = CFG.rippleColor + r.alpha + ")";
      context.lineWidth = r.lineW;
      context.stroke();
    }
  }

  function frame() {
    if (disposed) return;
    update();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf === null && !disposed && !reduceMotion.matches) {
      raf = requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  resize();
  window.addEventListener("resize", resize);

  // Pause when the header scrolls off-screen.
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) start();
    else stop();
  });
  io.observe(host);

  const onMotionPreference = () => {
    if (reduceMotion.matches) {
      stop();
      context.clearRect(0, 0, W, H);
      droplets.length = 0;
      ripples.length = 0;
      mist.length = 0;
    } else {
      start();
    }
  };
  reduceMotion.addEventListener("change", onMotionPreference);

  // Static users (reduced motion) never get a running loop; everyone else
  // starts on the next frame after hydration — no first-paint blocking work.
  if (!reduceMotion.matches) start();

  return {
    destroy() {
      disposed = true;
      stop();
      window.removeEventListener("resize", resize);
      io.disconnect();
      reduceMotion.removeEventListener("change", onMotionPreference);
    },
  };
}
