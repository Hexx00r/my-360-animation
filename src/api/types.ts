/**
 * Request/response contract shared by the React client (src/api/client.ts) and
 * the Cloudflare Worker (worker/src). Plain TypeScript only — no DOM, no Vite
 * APIs — so both runtimes can import it.
 */

/* --------------------------------- Errors --------------------------------- */

export type ApiError = {
  ok: false
  error: string
  /** Per-field messages for form validation failures (HTTP 422). */
  fieldErrors?: Record<string, string>
  /** Seconds until the client may retry (HTTP 429). */
  retryAfter?: number
}

/* ---------------------------------- Chat ---------------------------------- */

export const CHAT_MAX_MESSAGE = 600
export const CHAT_MAX_HISTORY = 6

export type ChatTurn = { role: 'user' | 'assistant'; text: string }

export type ChatRequest = {
  message: string
  sessionId: string
  /** Most recent turns, oldest first, at most CHAT_MAX_HISTORY. */
  history?: ChatTurn[]
}

export type ChatIntent =
  | 'services_overview'
  | 'can_you_help'
  | 'project_question'
  | 'stack_question'
  | 'pricing'
  | 'process_availability'
  | 'hire_contact'
  | 'greeting'
  | 'off_topic'
  | 'unclear'

export type ChatResponse = {
  ok: true
  reply: string
  intent: ChatIntent
  /** When set, the widget shows a button that jumps to the contact form. */
  cta: { label: string; href: string } | null
  /** Follow-up prompts the widget renders as quick replies. */
  suggestions: string[]
}

export function parseChatRequest(input: unknown): { ok: true; value: ChatRequest } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'Expected a JSON object.' }
  const message = typeof input.message === 'string' ? input.message.trim() : ''
  if (!message) return { ok: false, error: 'Message is required.' }
  if (message.length > CHAT_MAX_MESSAGE) return { ok: false, error: `Keep messages under ${CHAT_MAX_MESSAGE} characters.` }
  const sessionId = typeof input.sessionId === 'string' ? input.sessionId.slice(0, 64) : ''
  if (!/^[A-Za-z0-9-]{8,64}$/.test(sessionId)) return { ok: false, error: 'Invalid session id.' }

  const history: ChatTurn[] = []
  if (Array.isArray(input.history)) {
    for (const t of input.history.slice(-CHAT_MAX_HISTORY)) {
      if (isRecord(t) && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string') {
        history.push({ role: t.role, text: t.text.slice(0, CHAT_MAX_MESSAGE) })
      }
    }
  }
  return { ok: true, value: { message, sessionId, history } }
}

/* -------------------------------- Contact --------------------------------- */

export const PROJECT_TYPES = [
  'Website or web app',
  'API / integration',
  'CRM / automation',
  'AI chat or voice agent',
  'Ongoing support',
  'Something else',
] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export type ContactRequest = {
  name: string
  email: string
  projectType: ProjectType
  message: string
  /** Honeypot: hidden from people, must arrive empty. */
  website: string
}

export type ContactResponse = { ok: true }

export const CONTACT_LIMITS = { name: 100, email: 254, message: 4000, minMessage: 10 } as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Validates a contact submission. The client runs it for instant feedback;
 * the Worker runs it again because only the server's verdict counts.
 */
export function validateContact(
  input: unknown,
): { ok: true; value: ContactRequest } | { ok: false; fieldErrors: Record<string, string> } {
  const r = isRecord(input) ? input : {}
  const str = (k: string) => (typeof r[k] === 'string' ? (r[k] as string).trim() : '')
  const value: ContactRequest = {
    name: str('name'),
    email: str('email'),
    projectType: str('projectType') as ProjectType,
    message: str('message'),
    website: str('website'),
  }

  const fieldErrors: Record<string, string> = {}
  if (!value.name) fieldErrors.name = 'Please add your name.'
  else if (value.name.length > CONTACT_LIMITS.name) fieldErrors.name = 'That name is too long.'

  if (!value.email) fieldErrors.email = 'Please add your email.'
  else if (value.email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(value.email))
    fieldErrors.email = 'That email address doesn’t look right.'

  if (!PROJECT_TYPES.includes(value.projectType)) fieldErrors.projectType = 'Pick the closest option.'

  if (value.message.length < CONTACT_LIMITS.minMessage)
    fieldErrors.message = 'A sentence or two about the project helps.'
  else if (value.message.length > CONTACT_LIMITS.message)
    fieldErrors.message = `Please keep it under ${CONTACT_LIMITS.message} characters.`

  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, value }
}

/* --------------------------------- Helpers -------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
