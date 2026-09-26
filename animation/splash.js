/* ── Water Splash Header ─────────────────────────────────────
   Drop this into your project and include via:
   <script src="splash.js" defer></script>

   Expects this markup in your HTML:

     <header class="site-header">
       <canvas id="splashCanvas"></canvas>
       <div class="header-content"> ...your nav... </div>
     </header>

   ─────────────────────────────────────────────────────────── */
(() => {
  const canvas = document.getElementById('splashCanvas');
  if (!canvas) return;                       // nothing to do
  const header = canvas.closest('.site-header') || canvas.parentElement;
  const ctx = canvas.getContext('2d');

  let W, H, dpr, raf;

  /* ── CONFIG: tweak to taste ── */
  const CFG = {
    jets: [
      { x: 0.04, y: 0.95, angle: -72,  spread: 10, power: 9.5 },  // left nozzle
      { x: 0.96, y: 0.95, angle: -108, spread: 10, power: 9.5 },  // right nozzle
      { x: 0.22, y: 1.0,  angle: -85,  spread: 14, power: 7.0 },  // center-left
      { x: 0.78, y: 1.0,  angle: -95,  spread: 14, power: 7.0 },  // center-right
    ],
    dropletColor: 'rgba(96, 190, 250, ',
    mistColor:    'rgba(125, 211, 252, ',
    rippleColor:  'rgba(56, 189, 248, ',
    gravity: 0.28,
    drag: 0.995,
    emitRate: 3,
    maxDroplets: 450,
    maxRipples: 60,
    maxMist: 120,
  };

  const droplets = [];
  const ripples  = [];
  const mist     = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = header.clientWidth;
    H = header.clientHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  /* ── SPAWN ── */

  function spawnDroplet(jet) {
    const rad = (jet.angle + (Math.random() - 0.5) * jet.spread * 2) * Math.PI / 180;
    const speed = jet.power * (0.75 + Math.random() * 0.5);
    droplets.push({
      x: jet.x * W,
      y: jet.y * H,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      r: 0.8 + Math.random() * 1.8,
      life: 1,
      decay: 0.004 + Math.random() * 0.010,
      bounce: Math.random() < 0.3 ? 1 : 0,
    });
  }

  function spawnRipple(x, y) {
    ripples.push({ x, y, r: 1, maxR: 8 + Math.random() * 18, alpha: 0.45, lineW: 1 + Math.random() });
  }

  function spawnMist(x, y) {
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

  /* ── UPDATE ── */

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
        if (d.bounce > 0) {
          d.vy *= -0.35;
          d.vx *= 0.6;
          d.bounce--;
          spawnRipple(d.x, H - 2);
        } else {
          spawnRipple(d.x, H - 2);
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

  /* ── DRAW ── */

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const m of mist) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = CFG.mistColor + (m.life * 0.12) + ')';
      ctx.fill();
    }

    for (const d of droplets) {
      const a = Math.min(d.life * 1.4, 1);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = CFG.dropletColor + a + ')';
      ctx.fill();

      if (d.r > 1.8) {
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.5) + ')';
        ctx.fill();
      }
    }

    for (const r of ripples) {
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = CFG.rippleColor + r.alpha + ')';
      ctx.lineWidth = r.lineW;
      ctx.stroke();
    }
  }

  /* ── LOOP ── */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function frame() {
    update();
    draw();
    raf = requestAnimationFrame(frame);
  }

  if (reduceMotion.matches) {
    for (let i = 0; i < 80; i++) update();
    draw();
  } else {
    frame();
  }

  // pause when header off-screen (perf)
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!raf && !reduceMotion.matches) frame();
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  io.observe(header);
})();
