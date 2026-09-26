/**
 * Portfolio API Worker.
 *
 *   GET  /api/health    liveness + which integrations are configured (no secrets)
 *   POST /api/chat      TypeSafe-routed chat about services and projects
 *   POST /api/contact   validated, rate-limited contact form delivery
 */
import {
  parseChatRequest,
  validateContact,
  type ApiError,
  type ChatResponse,
  type ContactResponse,
} from '../../src/api/types'
import { answerChat } from './chat'
import { deliverContact } from './contact'
import { triageContact } from './triage'
import type { Env } from './env'
import { allow } from './ratelimit'

const MAX_BODY_BYTES = 16 * 1024

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(req: Request, env: Env, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, ...corsHeaders(req, env), ...extra },
  })
}

function fail(req: Request, env: Env, status: number, error: string, more: Partial<ApiError> = {}) {
  const body: ApiError = { ok: false, error, ...more }
  const extra: Record<string, string> = more.retryAfter ? { 'Retry-After': String(more.retryAfter) } : {}
  return json(req, env, body, status, extra)
}

async function readJson(req: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number; error: string }> {
  if (!(req.headers.get('Content-Type') ?? '').includes('application/json'))
    return { ok: false, status: 415, error: 'Send JSON (Content-Type: application/json).' }
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) return { ok: false, status: 413, error: 'Request body too large.' }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON.' }
  }
}

const clientIp = (req: Request) => req.headers.get('CF-Connecting-IP') ?? 'local'

/* --------------------------------- Routes ---------------------------------- */

async function handleChat(req: Request, env: Env): Promise<Response> {
  if (!(await allow(env.CHAT_LIMITER, `chat:${clientIp(req)}`, { limit: 20, periodMs: 60_000 })))
    return fail(req, env, 429, 'Too many messages — give it a minute.', { retryAfter: 60 })

  const body = await readJson(req)
  if (!body.ok) return fail(req, env, body.status, body.error)
  const parsed = parseChatRequest(body.value)
  if (!parsed.ok) return fail(req, env, 400, parsed.error)

  if (!env.TYPESAFE_API_KEY) {
    console.error('[chat] TYPESAFE_API_KEY is not set')
    return fail(req, env, 503, 'Chat isn’t configured yet — please use the contact form.')
  }

  try {
    const answer = await answerChat(env.TYPESAFE_API_KEY, parsed.value)
    const res: ChatResponse = { ok: true, ...answer }
    return json(req, env, res)
  } catch (err) {
    console.error('[chat] TypeSafe request failed:', String(err))
    return fail(req, env, 502, 'The assistant is having a moment — try again, or use the contact form.')
  }
}

async function handleContact(req: Request, env: Env): Promise<Response> {
  if (!(await allow(env.CONTACT_LIMITER, `contact:${clientIp(req)}`, { limit: 5, periodMs: 60_000 })))
    return fail(req, env, 429, 'Too many submissions — please wait a minute and try again.', { retryAfter: 60 })

  const body = await readJson(req)
  if (!body.ok) return fail(req, env, body.status, body.error)

  const result = validateContact(body.value)
  if (!result.ok) return fail(req, env, 422, 'Please fix the highlighted fields.', { fieldErrors: result.fieldErrors })

  // Honeypot filled → a bot. Answer like a success so it learns nothing.
  if (result.value.website) {
    console.log('[contact] honeypot hit from', clientIp(req))
    const res: ContactResponse = { ok: true }
    return json(req, env, res)
  }

  try {
    // Triage never blocks delivery: it returns null on any failure.
    const triage = env.TYPESAFE_API_KEY ? await triageContact(env.TYPESAFE_API_KEY, result.value) : null
    await deliverContact(
      env,
      result.value,
      { ip: clientIp(req), userAgent: (req.headers.get('User-Agent') ?? '').slice(0, 200) },
      triage,
    )
    const res: ContactResponse = { ok: true }
    return json(req, env, res)
  } catch (err) {
    console.error('[contact]', String(err))
    return fail(req, env, 502, 'Your message couldn’t be delivered. Please email me directly instead.')
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) })

    switch (pathname) {
      case '/api/health':
        return json(req, env, {
          ok: true,
          chat: Boolean(env.TYPESAFE_API_KEY),
          triage: Boolean(env.TYPESAFE_API_KEY),
          contact: {
            webhook: Boolean(env.CONTACT_WEBHOOK_URL),
            email: Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL),
            devLog: env.CONTACT_DEV_LOG === 'true',
          },
        })
      case '/api/chat':
        return req.method === 'POST' ? handleChat(req, env) : fail(req, env, 405, 'Use POST.')
      case '/api/contact':
        return req.method === 'POST' ? handleContact(req, env) : fail(req, env, 405, 'Use POST.')
      default:
        return fail(req, env, 404, 'Not found.')
    }
  },
} satisfies ExportedHandler<Env>
