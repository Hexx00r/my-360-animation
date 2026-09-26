# my-360-animation: full-stack portfolio

Portfolio of **Paul Sunny Isogon Jr, full-stack web developer** (Philippines, remote).
A cursor-bound 360° portrait hero, case-study projects, and a contact form plus chat served
by a Cloudflare Worker.

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 3, lucide-react. Prerendered to static HTML at build time.
- **Backend:** Cloudflare Worker (`worker/`), routes `/api/chat`, `/api/contact`, `/api/health`.
- **AI:** TypeSafe (Jev) typed judgments route chat questions; replies are composed from `src/data/*`.
- **Hosting:** Cloudflare Pages (static site) + Cloudflare Worker (API). GitHub Pages workflow kept as a mirror.

## Project layout

```
src/
  data/          profile, stack, services, process, projects  ← edit content here
  api/           types.ts (shared contract + validation), client.ts (typed fetch)
  sections/      Hero, About, Stack, Projects, QuoteCalculatorDemo, Services, Process, Contact
  components/    HeroCanvas (360° engine), ChatWidget, Section, Reveal
worker/
  src/           index.ts (router), chat.ts, contact.ts, triage.ts, typesafe.ts, ratelimit.ts, env.ts
  wrangler.toml
public/frames/   center.webp + frame_00…frame_63.webp (720×1280, transparent)
public/video/    crop.mp4 (selfie master, not shipped)
animation/       prototypes, archived engine, retired video hero (not shipped)
scripts/         prerender.mjs (postbuild SSR), render-check.mjs (E2E smoke test)
```

The Worker imports `src/data` and `src/api/types.ts` directly, so the chat answers from the
same content the page renders, and client and server share one request/response contract.

## Setup

Requires Node 20+.

```bash
npm install
cp worker/.dev.vars.example worker/.dev.vars   # then fill in TYPESAFE_API_KEY
npm run worker:dev    # terminal 1: API on http://127.0.0.1:8787
npm run dev           # terminal 2: site on http://localhost:3000 (proxies /api → :8787)
```

Smoke test (with both dev servers running): `node scripts/render-check.mjs`. It checks every
section at 375/768/1440 px, horizontal overflow, the 360° hero's fit, cursor direction, dead
zone, recenter and off-screen pause, the touch/reduced-motion fallback, and that chat and
contact both succeed through `/api`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (:3000) |
| `npm run build` | Type-checks app **and Worker** (`tsc -b`), builds, prerenders `dist/index.html` |
| `npm run preview` | Serves `dist/` (:4173) |
| `npm run lint` | ESLint |
| `npm run worker:dev` | `wrangler dev` for the API (:8787) |
| `npm run worker:deploy` | Deploys the Worker |
| `npm run worker:typecheck` | Type-checks the Worker only |

## Environment variables

No secret is ever bundled into the client. The browser only calls `/api/*`, and every key lives in the Worker.

### Worker (`worker/wrangler.toml` vars, `wrangler secret put`, or `worker/.dev.vars` locally)

| Name | Kind | Required | Purpose |
| --- | --- | --- | --- |
| `TYPESAFE_API_KEY` | secret | for chat | TypeSafe API key. Without it `/api/chat` returns 503 and the widget says so. |
| `CONTACT_WEBHOOK_URL` | secret | one delivery target | Contact submissions are POSTed here as JSON (n8n, GoHighLevel inbound webhook, Zapier, Make…). |
| `RESEND_API_KEY` | secret | one delivery target | Email delivery via [Resend](https://resend.com). Needs the two vars below. |
| `CONTACT_TO_EMAIL` | var | with Resend | Inbox that receives enquiries. |
| `CONTACT_FROM_EMAIL` | var | with Resend | Verified sender, e.g. `Portfolio <hello@yourdomain.com>`. |
| `ALLOWED_ORIGINS` | var | cross-origin only | Comma-separated origins allowed via CORS (e.g. a `*.pages.dev` preview calling `*.workers.dev`). |
| `CONTACT_DEV_LOG` | var | local only | `true` logs submissions instead of delivering. Never set in production. |

If both a webhook and email are configured, both are used, and the request succeeds if at least one delivers.

**Contact triage.** With `TYPESAFE_API_KEY` set, each submission is judged before delivery (one
parallel TypeSafe request, typically ~0.3–0.8 s) and the result is added to the webhook JSON as
`triage` and to the email subject/body:

```json
"triage": {
  "priority": "hot",                       // hot | warm | cold | spam (Worker policy, see triage.ts)
  "service": { "id": "ai-agents", "title": "AI chat & voice agents", "probability": 0.98 },
  "readiness": { "score": 2.99, "level": "Describes a specific project and also wants to start soon…", "confidence": 0.99 },
  "budgetMentioned": 0.03,                 // probability a budget/price is stated
  "deadlineMentioned": 0.98,               // probability a deadline/timeframe is stated
  "spamProbability": 0.03
}
```

Route on `priority`, or apply your own rules to the raw fields in n8n / GoHighLevel. Triage never
blocks delivery: if TypeSafe is slow or down, the message is delivered with `"triage": null`.
Likely spam is tagged, not dropped.
Rate limits (per IP, via the Cloudflare Rate Limiting binding, with an in-memory fallback): contact 5/min, chat 20/min.

### Frontend (build time)

| Name | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE` | *(empty = same origin)* | Absolute Worker origin when the API is not on the site's domain, e.g. `https://portfolio-api.<you>.workers.dev`. |
| `BASE_PATH` | `/` | Vite `base`. The GitHub Pages workflow sets `/my-360-animation/`. |

## Deploy: Cloudflare Pages + Worker

1. **Worker (API)**
   ```bash
   npx wrangler login
   npx wrangler secret put TYPESAFE_API_KEY --config worker/wrangler.toml
   npx wrangler secret put CONTACT_WEBHOOK_URL --config worker/wrangler.toml   # and/or RESEND_API_KEY
   npm run worker:deploy
   ```
2. **Pages (site):** Cloudflare dashboard → Workers & Pages → Create → Pages → connect this repo.
   Build command `npm run build`, output directory `dist`, env var `NODE_VERSION=20`.
   `public/_headers` sets security and cache headers.
3. **Connect them** (pick one):
   - **Same origin (recommended):** add the custom domain to Pages, then uncomment the `routes`
     line in `worker/wrangler.toml` (`yourdomain.com/api/*`) and redeploy the Worker. The browser
     calls `/api/*` with no CORS.
   - **Separate origin:** set `VITE_API_BASE` on the Pages project to the Worker's `workers.dev`
     URL, and add the Pages origin to `ALLOWED_ORIGINS` in `wrangler.toml`.
4. Check `https://<api-host>/api/health`. It reports which integrations are configured (booleans only).

## Hero animation

`src/components/HeroCanvas.tsx` draws one of 64 frames based on the pointer's angle around the face
(`frame_00` = up, 16 = right, 32 = down, 48 = left; `FRAME_OFFSET` = 0), with a 0.26 shortest-arc lerp,
a dead zone (12 % of the viewport diagonal) that snaps to `center.webp`, and a recenter when the mouse
leaves the window. The loop pauses while the hero is off screen and only redraws on a frame change.

The frame is contain-fitted and centered on black in a 9:16 box (height cap 60svh mobile, 70svh `lg`),
so the head is never cropped. Tune the face point with `FACE_CX` / `FACE_CY` at the top of the file.
Touch devices and `prefers-reduced-motion` get `center.webp` only (no directional frames downloaded).

## Credits

Section flow inspired by an MIT-licensed open-source portfolio; see [NOTICE.md](NOTICE.md).
No code, content or assets were copied from it.
