# PLAN — full-stack portfolio rebuild

Goal: turn `my-360-animation` into a full-stack web developer portfolio, borrowing the
section flow of [red1-for-hek/portfolio-website](https://github.com/red1-for-hek/portfolio-website)
(cloned read-only into `./_reference`, gitignored) while keeping **this project's stack**.

## 1. Audit (what this repo actually is)

| Area | Finding |
| --- | --- |
| Framework | React 19 + TypeScript 5.9 (strict, `noUnusedLocals`), single page, no router |
| Build tool | Vite 7 (`@vitejs/plugin-react`), `@/` alias → `src/` |
| SSR / SEO | `scripts/prerender.mjs` (postbuild): SSR-bundles `src/entry-server.tsx`, injects HTML into `dist/index.html` |
| Styling | Tailwind CSS 3 + CSS custom properties in `src/index.css` (single dark theme, `apple.*` tokens), `lucide-react` icons |
| Motion | `Reveal.tsx` (IntersectionObserver fade/slide, transform+opacity only). No GSAP / Lenis / Three.js |
| Hero (at audit time; replaced by a video, see §8) | `HeroCanvas.tsx`: 2D canvas, `public/frames/center.webp` + `frame_00…frame_63.webp` (720×1280), pointer angle → frame index, touch follow + idle orbit, reduced-motion = center frame only |
| Chat | `public/chat.js` vanilla widget → external `quote-relay.paulsunny.workers.dev/chat` (Worker source **not** in this repo) |
| Forms | `QuoteCalculatorDemo.tsx` → external quote-relay `/quote/paulsunnydev` |
| Deploy | GitHub Actions → GitHub Pages (`base: '/my-360-animation/'`) |
| Layout (before) | Header, Hero, LatestBuild, WhatIBuild, QuoteCalculatorDemo, CaseStudyDJ, CaseStudyMelbourne, AutomationEngine, Projects, WhyMe, Faq, Footer — GHL/pressure-cleaning niche positioning |

**Decision:** no framework migration. The reference's Three.js/GSAP/Lenis/react-router/Vercel
pieces are *patterns to translate*, not dependencies to add. GSAP stays a listed skill, not a
bundle dependency — `Reveal` already covers scroll-in motion at ~0 KB.

## 2. Reference licence

`_reference/LICENSE` is **MIT (© 2025 the reference author)**. No reference code, copy, images,
models, or branding is copied — only section order/UX ideas. A courtesy credit lives in
`NOTICE.md`. The reference's personal content (name, bio, career, projects, photos, 3D model,
chess engine) is not used anywhere.

## 3. Reference section map

| Reference piece | Decision | Where / how |
| --- | --- | --- |
| `Loading` + `LoadingProvider` (percent loader gate) | **Skipped** | Blocks LCP and hurts Lighthouse. The hero paints its poster immediately (see §8). |
| `Cursor` (custom cursor) | **Skipped** | Hurts a11y/touch; the 360° hero is already the cursor-bound moment. |
| `Navbar` + Lenis smooth scroll | **Adapted** | Existing sticky `Header` with new anchors; native CSS smooth scroll, disabled under `prefers-reduced-motion`. |
| `SocialIcons` floating rail | **Adapted** | Links moved into Contact + Footer (`src/data/profile.ts`). |
| `Landing` + `Character` (Three.js model) | **Adapted** | 360° frame canvas is the centerpiece; headline "Full-Stack Web Developer", value prop, View Projects / Hire Me CTAs. |
| `About` | **Ported** | `sections/About.tsx`: short bio, remote-first, AU/US/global clients. |
| `WhatIDo` (expanding cards) | **Adapted** | `sections/Services.tsx`, driven by `src/data/services.ts`. |
| `Career` timeline | **Adapted** | Timeline visual reused for `sections/Process.tsx` (Discover → Build → Deploy → Support). |
| `Work` (GSAP pinned horizontal scroll) | **Adapted** | `sections/Projects.tsx`: case-study cards (problem → stack → built → result) from `src/data/projects.ts`; plain grid, no scroll-jacking. |
| `TechStackNew` (CDN icon pyramid) | **Adapted** | `sections/Stack.tsx`: grouped skill grid from `src/data/stack.ts`, no third-party icon CDN. |
| `CallToAction` (Play / Hire) | **Adapted** | "Hire Me" band inside Contact; "Play" dropped. |
| `Contact` (static info) | **Adapted** | `sections/Contact.tsx`: working form → `POST /api/contact` + links. |
| `pages/MyWorks` (`/myworks` route) | **Skipped** | All projects live on the one page; no router needed. |
| `pages/Play` + chess engine (wasm) | **Skipped** | Per brief. |
| `api/chat.js` (Groq LLM on Vercel) | **Replaced** | `worker/` → `POST /api/chat`, TypeSafe (Jev) judgments + typed replies built from site data. |
| `vercel.json` security headers | **Adapted** | `public/_headers` (Cloudflare Pages) + headers on Worker responses. |
| Vercel Analytics / SpeedInsights | **Skipped** | Not in this stack. |

### Existing sections of this repo

| Section | Decision |
| --- | --- |
| `Hero` / `HeroCanvas` | Hero copy + CTAs rewritten. `HeroCanvas` later replaced by `HeroVideo` (§8). |
| `QuoteCalculatorDemo` | Kept as the live demo for project (e); still posts to the external quote-relay. |
| `Header`, `Footer` | Kept; nav/links rewritten. |
| `LatestBuild`, `WhatIBuild`, `CaseStudyDJ`, `CaseStudyMelbourne`, `AutomationEngine`, old `Projects`, `WhyMe`, `Faq` | Removed from the page and deleted (niche GHL positioning; content lives on in git history and informs the new project cards). |
| `public/chat.js` | Replaced by typed React `ChatWidget` → `/api/chat`. |
| `lib/splash.ts`, `lib/wall-wash.ts`, `lib/video-modal.ts`, `animation/` | Removed if no longer referenced. |

## 4. Architecture

```
src/
  data/        profile, stack, services, process, projects  ← single source of truth
  api/         types.ts (shared request/response + validation), client.ts (typed fetch)
  sections/    Hero, About, Stack, Projects, Services, Process, QuoteCalculatorDemo, Contact
  components/  HeroCanvas, ChatWidget, Reveal, Section, Shared
worker/
  src/index.ts       router: /api/chat, /api/contact, /api/health, CORS, security headers
  src/chat.ts        TypeSafe judgments → reply composed from src/data
  src/contact.ts     validation, honeypot, rate limit, webhook/email delivery
  src/typesafe.ts    minimal typed client for POST /v1/systemone (retry on 429/529)
  wrangler.toml
```

The Worker imports `src/data/*` and `src/api/types.ts`, so the chat answers from the same
content the page renders and the client/server share one contract.

**Chat design (TypeSafe):** Jev returns typed judgments, not prose. One parallel request asks:
`intent` (Choice), `service` (Choice over `services.ts` + none), `project` (Choice over
`projects.ts` + none), `skill_group` (Choice over `stack.ts` + none), `wants_to_hire` (Noul).
Code composes the answer from site data and nudges toward the contact form when hiring intent
is high. Low-confidence intent → a safe "here's what I can answer" fallback.

## 5. What changed

**Added**
- `src/data/` (profile, stack, services, process, projects): single content source for the page and the chat.
- `src/api/types.ts` (shared contract + `validateContact` / `parseChatRequest`) and `src/api/client.ts` (typed fetch, timeout, no secrets).
- Sections: `About`, `Stack`, `Projects` (case-study cards), `Services`, `Process` (timeline), `Contact` (validated form), plus a shared `Section` shell.
- `components/ChatWidget.tsx`: typed React port of the old `chat.js` (bottom sheet, swipe-to-close, `[data-pdc-chat]`), plus quick replies, contact CTA, Esc/ARIA. Lazy-loaded.
- `worker/`: Cloudflare Worker with `/api/chat` (TypeSafe Jev judgments → reply from site data), `/api/contact` (validation, honeypot, rate limit, webhook and/or Resend email), `/api/health`, CORS allowlist, security headers.
- `public/sitemap.xml`, `public/_headers`, robots `Sitemap:` line, skip link, `NOTICE.md`.
- `scripts/render-check.mjs` rewritten as an E2E smoke test (sections, overflow, hero cursor/touch, chat, contact).

**Changed**
- Hero: headline "Full-Stack Web Developer", value prop, View Projects / Hire Me CTAs; H1 no longer fades in (LCP).
- `HeroCanvas`: turn frames load after idle or first pointer move (center frame preloaded). Superseded by the video hero (§8).
- Header/Footer nav → new anchors; header CTA → Hire Me.
- `QuoteCalculatorDemo`: section H2 + framing as project 05; input labels added.
- `index.html`: new title/description/OG/Twitter/JSON-LD, center-frame preload, `%BASE_URL%` favicon.
- `vite.config.ts`: `base` from `BASE_PATH` (default `/`), dev proxy `/api` → `:8787`. GH Pages workflow sets `BASE_PATH`.
- `tsconfig.json` references `worker/tsconfig.json`, so `npm run build` type-checks the Worker too.
- Smooth scrolling only without `prefers-reduced-motion`; global reduced-motion guard.

**Removed**
- Sections `LatestBuild`, `WhatIBuild`, `CaseStudyDJ`, `CaseStudyMelbourne`, `AutomationEngine`, `WhyMe`, `Faq`; `lib/splash|wall-wash|video-modal|tech-icons`, `TechIcons`, `public/chat.js`, unused `site.config` exports. (All in git history.)
- `animation/` prototypes were **kept**: they are standalone and not part of the build.

## 6. Verification (2026-09-26)

- `npm run build`: passes, zero TS errors (app + node + worker projects), prerender OK. `npm run lint`: clean.
- `wrangler dev` + `vite`: `scripts/render-check.mjs` passes all 41 checks: every section at 375/768/1440, no horizontal scroll, no errors/4xx, hero follows cursor (1440) and auto-rotates on touch (iPhone 13 emulation), chat answers through `/api/chat`, contact form succeeds through `/api/contact`.
- `/api/contact`: 200 valid · 422 field errors · 200 silent drop on honeypot · 415 non-JSON · 429 after 5/min.
- `/api/chat`: 10 sample questions (services, “can you help with X”, known/unknown tech, project, pricing, hiring intent, greeting, off-topic, availability) all routed to the expected intent; follow-ups resolve from history.
- Client bundle scanned: no API keys or auth headers.
- `grep -ri "redoyan|haque"` outside `_reference`: only `NOTICE.md` (attribution).
- Lighthouse 12 mobile on the production build (`vite preview`, local): **Performance 99, Accessibility 100, Best Practices 100, SEO 100** (LCP 1.8 s, CLS 0, TBT 30–60 ms). Re-check on the real host after deploy.

## 7. Remaining TODOs

- **Metrics:** every `result` in `src/data/projects.ts` is `null` (renders a TODO badge in dev only). Add measured outcomes; don't estimate.
- **Screenshots:** every project's `screenshot` is `null`. Candidates already in the repo: `src/assets/melb-calc2.webp`, `src/assets/wf-*.webp` (workflow shots), `public/images/builds/*`. Move into `public/` and set `src`/`width`/`height`.
- **Links:** LinkedIn and Upwork URLs in `src/data/profile.ts`; project links for (b)–(d).
- **AI classifier card:** confirm the real JSON schema fields and downstream routing (see the TODO in `projects.ts`).
- **Deploy:** create the Pages project, set Worker secrets (`TYPESAFE_API_KEY`, `CONTACT_WEBHOOK_URL` and/or `RESEND_API_KEY` + `CONTACT_FROM_EMAIL`), then pick same-origin route vs `VITE_API_BASE` (README → Deploy).
- **Domain:** canonical, OG, sitemap and JSON-LD assume `https://paulsunnydev.com/`. Change them if the portfolio lives elsewhere.
- **Chat tuning:** thresholds in `worker/src/chat.ts` (intent confidence 0.35, option probability 0.4, hire nudge 0.6) are starting points; review against real chat logs.
- **Calculator:** still posts to the external `quote-relay` Worker (source not in this repo), and its error message shows the Melbourne business phone number. Decide whether the demo should keep sending real leads.
- **Old assets:** `src/assets/dj-*`, `melb-*`, `quote-sample.pdf`, `public/images/ig-photos` are no longer referenced. Delete them or reuse them as screenshots.

## 8. Hero video (2026-09-26) — superseded by §9

The 360° frame-sequence canvas was replaced by a looping portrait video, with the hero text stacked below it.

### Source: `public/video/crop.mp4` (not modified)

| Property | Value (ffprobe) |
| --- | --- |
| Container frame | 1080 × 1920, SAR 1:1, DAR 9:16, no rotation |
| Picture inside the frame | **1080 × 1544** at y = 188: 188 px of black is baked in above and below (ffmpeg `cropdetect`, identical on all 320 frames at limit 16 and 24) |
| Aspect ratio used | **1080 : 1544 ≈ 0.6995** (the picture), not 9:16 (the container) |
| Duration | 10.73 s video (10.75 s container), 30 fps |
| Audio | Yes: AAC (~194 kb/s). Stripped from all web encodes. |
| Codec / size | H.264 yuv420p, ~7.9 Mb/s, 10.8 MB |

**Why 1080:1544 and not 9:16:** sizing the frame to the 9:16 container showed the baked-in black
bars inside it, which breaks "never black bars". The web encodes trim only those bars
(`crop=1080:1544:0:188`, checked visually, no picture lost), so the frame matches the picture
exactly and `object-fit: contain` never letterboxes.

### Web encodes (`public/video/`)

| File | Settings | Size |
| --- | --- | --- |
| `hero.webm` | VP9, 2-pass constant quality `-crf 32 -b:v 0`, 720 × 1030, no audio | 366 KB |
| `hero.mp4` | H.264 High, `-crf 26 -preset slow`, 720 × 1030, no audio, `+faststart` | 530 KB |
| `hero-poster.webp` | Frame 0, 720 × 1030, quality 78 | 9 KB |

VP9 was first tried at CRF 36 (266 KB) and looked visibly softer than the MP4; CRF 32 matches it.
`crop.mp4` stays in `public/video/` as the master, but a small build plugin in `vite.config.ts` drops it from `dist/`.

### Implementation

- `src/components/HeroVideo.tsx`: `<video autoplay muted loop playsinline preload="metadata" poster aria-hidden>`
  with webm then mp4 `<source>`s. The box uses `aspect-ratio: 1080/1544` and
  `width: min(100%, cap × 1080/1544)`, with a cap of 60svh on mobile and 70svh from `lg`. The height comes
  from the ratio, so the box is reserved before load (CLS 0), never overflows, and never goes full-width.
  The surround is the page background plus a faint cyan radial glow, with no black bars.
- Behaviour: an IntersectionObserver pauses the video off screen and resumes it on return. With
  `prefers-reduced-motion` there's no autoplay attribute and it's paused on the poster. A blocked
  `play()` promise is swallowed, so the poster stays. The `muted` attribute is set explicitly for iOS autoplay rules.
- `src/sections/Hero.tsx`: stacked and centered, video then kicker / H1 / value prop / CTAs. No text
  overlays the video; the "move your cursor" hint was removed.
- `index.html`: the preload now points at `video/hero-poster.webp` (was `frames/center.webp`). The OG
  image was already `images/portrait.jpg` (not a frame), so it's unchanged.
- `public/_headers`: `/frames/*` cache rule → `/video/*`.
- Frames archived: `public/frames/` (65 webp) → `animation/frames-archive/` via `git mv` (history kept),
  together with the old engine as `HeroCanvas.tsx.txt` for reference. `dist/` contains no `frame_*.webp`.
- Project card (a) and a chat quick-reply updated from "360° frame engine" to the video hero.
- `worker/src/typesafe.ts`: timeouts and network errors are now retried once (6 s per attempt, fits the
  client's 15 s). Prompted by one transient TypeSafe timeout during testing.

### Verification

- `npm run build`: zero TS errors; `npm run lint`: clean; `dist/`: 0 `frame_*.webp`, no `crop.mp4`.
- `node scripts/render-check.mjs`: all checks pass. At 375 / 768 / 1440: box ratio = picture ratio (±1%),
  fully visible horizontally, centered, within the height cap, not full-width, H1 below the video, no
  horizontal scroll, autoplays muted + loops, decodes at the picture ratio, pauses off screen and
  resumes. Also passes under iPhone 13 emulation (Chromium) and poster-only under reduced motion.
- Lighthouse 12 mobile, local `vite preview`, 3 runs: Performance 99 / Accessibility 100 / Best
  Practices 100 / SEO 100; CLS 0, LCP ≈ 1.9 s (the LCP element is the video).
- **Not verified here: real iOS Safari.** Playwright's Windows WebKit build can't decode H.264 or VP9,
  so render-check reports SKIP. The markup follows iOS inline-autoplay rules (muted + playsinline, no
  audio track), but check it on an iPhone.

### Hero-video TODOs

- Test autoplay/loop on a real iPhone (Safari) and Android Chrome, including Low Power Mode (iOS
  blocks autoplay there; the poster should show).
- `kimi-plugin-inspect-react` (pre-existing) injects `code-path="src\…"` attributes into the
  production HTML. Consider enabling it only in dev.

## 9. 360° cursor hero, restored (2026-09-26)

The video hero (§8) was replaced by a cursor-bound 360° canvas on black, text below.

- **Frames:** `animation/frames-archive/` → `public/frames/` via `git mv` (history kept): 64 × `frame_NN.webp` + `center.webp`,
  720 × 1280, transparent background. Not re-extracted from `crop.mp4` (a selfie clip, not a turntable).
- **Engine:** `src/components/HeroCanvas.tsx`, rebuilt from the archived engine (`animation/frames-archive/HeroCanvas.tsx.txt`).
  The technique reference `sunitamishra2704-AI/Cursor_Binded_3dPortfolio` has no LICENSE; none of its code was copied or consulted
  for this build.
  - Canvas 2D `alpha:false`, DPR-aware resize (DPR capped at 2).
  - Preloads center + 64 frames; `onLoaded` fires when all have settled (loaded or errored).
  - `mousemove` → `atan2` from the face point → frame index; shortest-arc angular lerp 0.26; dead zone 12 % of the viewport
    diagonal snaps to `center`; leaving the window (`mouseout` with no `relatedTarget`, or `blur`) recenters.
  - rAF loop stops when the canvas is off screen (`getBoundingClientRect`); scroll/resize restarts it.
  - Draws only when the frame index changes.
  - Fit: **contain**, centered, `#000` fill. Box locked to 720:1280 via `aspect-ratio` + `width: min(100%, cap × 9/16)`,
    cap 60svh mobile / 70svh `lg` → reserved before any frame loads (CLS 0).
  - A prerendered `<img src=center.webp>` sits under the canvas: first paint, no-JS fallback; the canvas fades in once it draws.
- **Face point:** `FACE_CX = 0.5`, `FACE_CY = 0.52`. Checked on `center.webp`: eye line y ≈ 0.50, mid-nose ≈ 0.53, nose on x = 0.50.
- **Calibration:** frames checked visually: `frame_00` up, `16` right, `32` down, `48` left. **Offset = 0** (`FRAME_OFFSET` in
  `HeroCanvas.tsx`; change it rather than renaming files if a re-shot set starts elsewhere). Confirmed in the browser by
  render-check (cursor right/down/left/up → 16/32/48/0 ± 1).
- **Fallbacks:** `prefers-reduced-motion` or no fine hover pointer (touch) → center frame only: no directional preload,
  no rAF loop, no listeners except resize.
- **Video hero removed:** `HeroVideo.tsx` deleted; `hero.mp4`, `hero.webm`, `hero-poster.webp` → `animation/video-archive/`
  (never committed, so no history to keep). `crop.mp4` untouched in `public/video/`; the build plugin still drops it
  and now removes the empty `dist/video/`.
- **Refs updated:** `index.html` preload → `frames/center.webp`; `_headers` cache rule → `/frames/*`; project card (a) and a
  chat quick-reply back to the 360° hero. OG image stays `images/portrait.jpg` (1 photo, not a frame; unchanged).
- **Tests:** `scripts/render-check.mjs` rewritten for the canvas: box ratio/centering/cap/black background/text below at
  375/768/1440, loop pauses off screen and resumes, 64 frames preloaded on desktop, cursor direction → frame, smooth
  intermediate frames, dead zone, recenter on leave, touch + reduced motion fetch no directional frames and run no loop.
  The canvas exposes `data-frame` / `data-loop` for this.

### Verification

- `npm run build`: zero TS errors. `npm run lint`: clean. `node scripts/render-check.mjs`: all 82 checks pass.
- `dist/frames/`: 64 `frame_NN.webp` + `center.webp`. No `hero.mp4` / `hero.webm` / `hero-poster.webp`, no `dist/video/`.
- Lighthouse 12 mobile, local preview, 3 runs: Performance 98–99, Accessibility / Best Practices / SEO 100, CLS 0, LCP ≈ 1.9–2.0 s.
- Not verified here: real mobile Safari/Chrome devices (emulation only).

## 10. Contact-form triage with TypeSafe (2026-09-27)

`worker/src/triage.ts`: one parallel TypeSafe request per contact submission, before delivery.

| Question | Primitive | Meaning |
| --- | --- | --- |
| service | Choice over `src/data/services.ts` + `none` | What the enquiry is really about (the dropdown value is given as a hint that may be wrong) |
| readiness | Score, 4 concrete levels | Just curious → vague idea → specific requirements → specific + wants to start / quote / timeline / budget |
| budget | Noul | A budget, price range or limit is stated |
| deadline | Noul | A deadline, date or timeframe is stated |
| spam | Noul | Spam, mass mail, or a pitch selling to Paul rather than asking for help |

Policy (code, not model): `spam ≥ 0.8` → `spam`; else readiness `≥ 2` → `hot`, `≥ 1` → `warm`, else `cold`. Service below 0.4
probability → `null`. Raw judgments stay in the payload so n8n/GHL can apply different rules without re-running inference.
Email subject gets a `[HOT]`/`[WARM]`/`[COLD]`/`[SPAM]` prefix and a triage block. Likely spam is tagged, never dropped.

Reliability: triage returns `null` on any failure and delivery continues. Two attempts × 2.5 s (the visitor is waiting on
submit). During local testing, TypeSafe requests sometimes stalled after ~60 s idle (3 timeouts in a row, then instant);
a retry on a fresh request recovers. Not reproduced against the deployed Worker yet.

### Tested (local `wrangler dev`, real TypeSafe)

| Enquiry | priority | service | readiness | budget | deadline | spam |
| --- | --- | --- | --- | --- | --- | --- |
| Plumber: booking site → GHL, 3–4k AUD, live by 1 Nov | hot | websites | 3.00 | 0.99 | 0.99 | 0.03 |
| Shopify orders → Zoho, "not sure what's involved" | warm | integrations | 1.12 | 0.03 | 0.03 | 0.03 |
| "What tech is the spinning head?" | cold | websites | 0.00 | 0.02 | 0.02 | 0.12 |
| SEO agency pitch, 99 USD/month | spam | — | 0.73 | 0.89 | 0.08 | 0.99 |
| Dental AI receptionist, start next month | hot | ai-agents | 2.99 | 0.03 | 0.98 | 0.03 |
| Existing client wants a monthly retainer | hot | retainer | 2.40 | 0.04 | 0.17 | 0.03 |
| Offshore agency white-label offer, 15 USD/h | spam | — | 0.33 | 0.93 | 0.03 | 0.97 |
| "Need help with my project, contact me asap" | warm | — | 1.23 | 0.03 | 0.29 | 0.24 |

Notes: `budgetMentioned` also fires on prices quoted *by* pitches (harmless: those are `spam`). The vague message landing
`warm` is arguable; revisit the readiness cut-offs once real enquiries arrive.

### TODO
- Tune thresholds on the first ~30 real submissions (log `triage` next to what you actually did with each lead).
- In n8n / GHL: route `hot` to an instant alert, `spam` to a review folder.

## 11. New 360° frame set, v2 (2026-09-27)

- `public/frames/` (v1: 720×1280, transparent background) → `animation/frames-archive-v1/` via `git mv` (history kept).
- New set from `animation/new-frames/frames/` → `public/frames/`: 64 × `frame_NN.webp` + `center.webp`, **720×1030**,
  opaque, pre-calibrated and un-mirrored. Not renumbered, flipped or re-encoded.
- Calibration re-checked on the files and in the browser: `frame_00` up, `16` right, `32` down, `48` left.
  **FRAME_OFFSET stays 0.**
- Aspect ratio 720:1280 → **720:1030** everywhere: the canvas box (`aspect-[720/1030]`, width `min(100%, cap × 720/1030)`),
  `FRAME_H`, the prerendered `center.webp` placeholder's width/height attributes (from `FRAME_W`/`FRAME_H`), and render-check.
- Face point (between the eyes), measured on the new `center.webp`: pupils at x≈302 and x≈442, eye line y≈300 →
  **FACE_CX 0.514, FACE_CY 0.291** (was 0.50 / 0.52 for v1).
- Unchanged: contain fit, `#000`, lerp 0.26, 12 % dead zone, recenter on leave, off-screen pause, touch / reduced-motion
  fallbacks, text below.
- Verified: build (0 TS errors), lint clean, `node scripts/render-check.mjs` all pass (cursor right/down/left/up → 16/32/48/0,
  screenshots confirm the head turns toward the cursor), CLS 0 at 375 / 768 / 1440; `dist/frames/` = the 65 v2 files only.
