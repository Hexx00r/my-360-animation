/**
 * POST /api/contact — delivers a validated enquiry to a webhook and/or email.
 */
import type { ContactRequest } from '../../src/api/types'
import type { Env } from './env'
import type { ContactTriage } from './triage'

export type Delivery = 'webhook' | 'email' | 'log'

export class DeliveryError extends Error {}

export async function deliverContact(
  env: Env,
  c: ContactRequest,
  meta: { ip: string; userAgent: string },
  triage: ContactTriage | null,
) {
  const submittedAt = new Date().toISOString()
  const payload = {
    source: 'portfolio-contact',
    submittedAt,
    name: c.name,
    email: c.email,
    projectType: c.projectType,
    message: c.message,
    ip: meta.ip,
    userAgent: meta.userAgent,
    // TypeSafe judgments (null if triage was unavailable). Route on these in n8n / GHL.
    triage,
  }

  const jobs: Promise<Delivery>[] = []

  if (env.CONTACT_WEBHOOK_URL) {
    jobs.push(
      fetch(env.CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8_000),
      }).then((r) => {
        if (!r.ok) throw new DeliveryError(`webhook HTTP ${r.status}`)
        return 'webhook' as const
      }),
    )
  }

  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
    jobs.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.CONTACT_FROM_EMAIL,
          to: [env.CONTACT_TO_EMAIL],
          reply_to: c.email,
          subject: `${triage ? `[${triage.priority.toUpperCase()}] ` : ''}Portfolio enquiry: ${c.projectType} — ${c.name}`,
          text: `${c.message}\n\n—\nName: ${c.name}\nEmail: ${c.email}\nType: ${c.projectType}\nSent: ${submittedAt}${triageText(triage)}`,
        }),
        signal: AbortSignal.timeout(8_000),
      }).then((r) => {
        if (!r.ok) throw new DeliveryError(`email HTTP ${r.status}`)
        return 'email' as const
      }),
    )
  }

  if (!jobs.length) {
    if (env.CONTACT_DEV_LOG === 'true') {
      console.log('[contact:dev-log]', JSON.stringify(payload))
      return ['log'] as Delivery[]
    }
    throw new DeliveryError('No delivery target configured (set CONTACT_WEBHOOK_URL or RESEND_API_KEY + emails).')
  }

  // Succeed if at least one channel accepted it; log the rest.
  const results = await Promise.allSettled(jobs)
  const delivered = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  for (const r of results) if (r.status === 'rejected') console.error('[contact] delivery failed:', String(r.reason))
  if (!delivered.length) throw new DeliveryError('All delivery channels failed.')
  return delivered
}

function triageText(t: ContactTriage | null) {
  if (!t) return '\n\nTriage: unavailable'
  const pct = (n: number) => `${Math.round(n * 100)}%`
  return [
    '',
    '',
    `Triage (TypeSafe): ${t.priority.toUpperCase()}`,
    `Service: ${t.service ? `${t.service.title} (${pct(t.service.probability)})` : 'unclear'}`,
    `Readiness: ${t.readiness.score}/3, ${t.readiness.level}`,
    `Budget stated: ${pct(t.budgetMentioned)} | Deadline stated: ${pct(t.deadlineMentioned)} | Spam: ${pct(t.spamProbability)}`,
  ].join('\n')
}
