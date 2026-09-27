/**
 * Case studies (problem → stack → what I built → result). Shared by the
 * Projects section and the chat Worker.
 *
 * `result` stays null where there is no measured outcome yet (the Result block
 * is then hidden) — do not replace it with estimates. Fill `links` and
 * `screenshot` as they exist.
 */

export type ProjectLink = { label: string; href: string }

export type Project = {
  id: 'portfolio-360' | 'melbourne-quote-booking' | 'ai-enquiry-classifier' | 'worker-relay'
  title: string
  /** Short label shown above the title. */
  category: string
  problem: string
  stack: string[]
  built: string[]
  /** Measured outcome. With no `resultImage` either, the Result block is hidden. */
  result: string | null
  /** Photo evidence shown under Result. Path under public/ (no leading slash). */
  resultImage?: { src: string; alt: string; width: number; height: number }
  links: ProjectLink[]
  /** Path under public/ (no leading slash), or null until a screenshot exists. */
  screenshot: { src: string; alt: string; width: number; height: number } | null
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
    resultImage: {
      src: 'images/projects/portfolio-chat.webp',
      alt: 'Site chat answering "Can you connect my website form to a CRM?" from the page content and linking a related case study',
      width: 1896,
      height: 985,
    },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Hexx00r/my-360-animation' }],
    screenshot: {
      src: 'images/projects/portfolio-360.jpg',
      alt: 'Portfolio hero with the 360° cursor-tracking portrait facing the viewer',
      width: 1600,
      height: 900,
    },
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
    resultImage: {
      src: 'images/melbourne-hpc-photos/maps-02.jpg',
      alt: 'Melbourne High Pressure Cleaning technician surface-cleaning a concrete path beside a bowls green',
      width: 1200,
      height: 800,
    },
    links: [{ label: 'Sample quote (PDF)', href: '/docs/melbourne-hpc-quote-sample.pdf' }],
    screenshot: {
      src: 'images/projects/melbourne-quote.webp',
      alt: 'Melbourne High Pressure Cleaning instant-estimate form showing a $450 driveway quote',
      width: 1600,
      height: 807,
    },
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
    result: null,
    links: [],
    screenshot: null,
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
    result: null,
    links: [],
    screenshot: null,
  },
]
