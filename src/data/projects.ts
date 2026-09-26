/**
 * Case studies (problem → stack → what I built → result). Shared by the
 * Projects section and the chat Worker.
 *
 * `result` is intentionally TODO where there is no measured outcome yet — do
 * not replace it with estimates. Fill `links` and `screenshot` as they exist.
 */

export type ProjectLink = { label: string; href: string }

export type Project = {
  id: 'portfolio-360' | 'melbourne-quote-booking' | 'ai-enquiry-classifier' | 'worker-relay' | 'quote-calculator'
  title: string
  /** Short label shown above the title. */
  category: string
  problem: string
  stack: string[]
  built: string[]
  /** Measured outcome. `null` renders as a visible TODO. */
  result: string | null
  links: ProjectLink[]
  /** Path under public/ (no leading slash), or null until a screenshot exists. */
  screenshot: { src: string; alt: string; width: number; height: number } | null
  /** In-page anchor for a live demo on this site, if there is one. */
  demoAnchor?: string
}

export const projects: Project[] = [
  {
    id: 'portfolio-360',
    title: 'This portfolio: 360° cursor-bound hero + AI chat on the edge',
    category: 'Frontend · Edge API · AI',
    problem:
      'A developer portfolio needs to prove frontend craft and backend skills in the first few seconds, and still score well on mobile Lighthouse.',
    stack: ['React', 'TypeScript', 'Vite', 'Canvas 2D', 'Cloudflare Workers', 'TypeSafe (Jev)'],
    built: [
      'Cursor-bound 360° portrait: 64 directional frames picked from the pointer angle around the face, with smoothing, an eye-contact dead zone and a paused loop when off screen',
      'Prerendered React sections so crawlers and slow phones get real content before any JavaScript runs',
      'Typed API layer shared by the React client and a Cloudflare Worker serving /api/chat and /api/contact',
      'Chat that routes each question with typed TypeSafe judgments and answers from the same data this page renders',
    ],
    result: null, // TODO: Lighthouse scores + chat → contact conversion once live
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Hexx00r/my-360-animation' }],
    screenshot: null, // TODO
  },
  {
    id: 'melbourne-quote-booking',
    title: 'Quote & booking system for a Melbourne cleaning business',
    category: 'CRM · Custom quote logic',
    problem:
      'A high-pressure cleaning business was losing leads between the first enquiry and a confirmed booking, and pricing every job by hand.',
    stack: ['GoHighLevel', 'JavaScript', 'Webhooks', 'Cloudflare Workers'],
    built: [
      'Instant-quote funnel with per-m² and flat-rate pricing, condition surcharges, bundle discount and minimum-job rules',
      'Webhook hand-off from the quote form into the GoHighLevel pipeline with tagging and stage automation',
      'Follow-up and booking automation plus a branded PDF quote',
    ],
    result: null, // TODO: enquiry → booking rate, response time
    links: [], // TODO: live site / write-up link
    screenshot: null, // TODO: public/images/melbourne-hpc-photos has site photos; add a UI screenshot
    demoAnchor: '#calculator',
  },
  {
    id: 'ai-enquiry-classifier',
    title: 'AI enquiry classifier',
    category: 'Automation · AI',
    problem:
      'Free-text enquiries arrived in every shape, so someone had to read each one before it could be routed or answered.',
    stack: ['n8n', 'Anthropic API', 'Webhooks', 'JSON Schema'],
    built: [
      'n8n workflow that receives enquiries by webhook and sends them to the Anthropic API for a structured JSON intake',
      'Fixed JSON output shape checked before anything downstream runs, so later steps work from typed fields instead of raw text',
    ], // TODO: list the actual schema fields and downstream routing
    result: null, // TODO: volume handled, accuracy spot-check, time saved
    links: [], // TODO
    screenshot: null, // TODO: n8n workflow screenshot
  },
  {
    id: 'worker-relay',
    title: 'Cloudflare Worker API relay & webhook proxy',
    category: 'Backend · Edge',
    problem:
      "Static sites and a CRM without full API access needed a secure place to receive form posts, keep secrets off the client, and fan out notifications.",
    stack: ['Cloudflare Workers', 'D1', 'TypeScript', 'Webhooks', 'Telegram Bot API'],
    built: [
      'Edge endpoint that validates and stores submissions, with per-client routing',
      'Fan-out to CRM inbound webhooks and Telegram notifications, with secrets held in Worker environment variables',
      'Runs on the Cloudflare free tier with no servers to maintain',
    ],
    result: null, // TODO: uptime / submissions processed
    links: [], // TODO
    screenshot: null, // TODO
  },
  {
    id: 'quote-calculator',
    title: 'Instant quote calculator (live demo)',
    category: 'Frontend · Pricing logic',
    problem:
      'Visitors want a price before they will hand over their details, and the business still needs a qualified lead with the job details attached.',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Cloudflare Workers'],
    built: [
      'Live estimate from multiple services, area inputs, condition surcharge, bundle discount and a minimum job',
      'Quote request form with a honeypot that posts the full breakdown to an edge Worker',
    ],
    result: null, // TODO
    links: [],
    screenshot: null,
    demoAnchor: '#calculator',
  },
]
