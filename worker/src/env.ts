/** Worker bindings. Secrets are set with `wrangler secret put`, never committed. */

/** Cloudflare Rate Limiting binding (see [[ratelimits]] in wrangler.toml). */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  /** Secret. TypeSafe API key for /api/chat. */
  TYPESAFE_API_KEY?: string

  /** Secret, optional. Contact submissions are POSTed here as JSON (n8n, GHL, Zapier, Make…). */
  CONTACT_WEBHOOK_URL?: string
  /** Secret, optional. Resend API key for emailing contact submissions. */
  RESEND_API_KEY?: string
  /** Var. Inbox that receives contact emails (with RESEND_API_KEY). */
  CONTACT_TO_EMAIL?: string
  /** Var. Verified Resend sender, e.g. "Portfolio <hello@yourdomain.com>". */
  CONTACT_FROM_EMAIL?: string
  /** Local dev only: "true" logs submissions instead of requiring a delivery target. */
  CONTACT_DEV_LOG?: string

  /** Var. Comma-separated origins allowed to call the API cross-origin. */
  ALLOWED_ORIGINS?: string

  CONTACT_LIMITER?: RateLimitBinding
  CHAT_LIMITER?: RateLimitBinding
}
