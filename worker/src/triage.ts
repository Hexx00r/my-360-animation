/**
 * Contact-form triage. One parallel TypeSafe request judges a submission so
 * the webhook / email that follows is already sorted: which service it is
 * really about, how ready the sender is, whether a budget or deadline is
 * stated, and whether it looks like spam or a sales pitch.
 *
 * Raw judgments are kept in the payload (so n8n / GHL can apply their own
 * rules); `priority` is this Worker's default policy on top of them.
 * Triage never blocks delivery: on any failure it returns null.
 */
import type { ContactRequest } from '../../src/api/types'
import { services, type Service } from '../../src/data/services'
import { systemOne, type ChoiceQuestion, type NoulQuestion, type ScoreQuestion } from './typesafe'

/* Policy thresholds — starting points; review against real enquiries. */
const SPAM_FLAG = 0.8 // at or above: tagged likely spam (still delivered)
const HOT_READINESS = 2 // score ≥ this (0–3 scale) and not spam → hot
const WARM_READINESS = 1
const MIN_SERVICE_PROBABILITY = 0.4

export type Priority = 'hot' | 'warm' | 'cold' | 'spam'

export type ContactTriage = {
  priority: Priority
  service: { id: Service['id']; title: string; probability: number } | null
  /** 0 = just curious … 3 = ready to start; probability-weighted. */
  readiness: { score: number; level: string; confidence: number }
  budgetMentioned: number
  deadlineMentioned: number
  spamProbability: number
}

const READINESS_LEVELS = [
  'Only curious or asking a general question; no project or need of their own is described.',
  'Has a rough idea or problem of their own, but the scope is still vague or undecided.',
  'Describes a specific project or problem with clear requirements for what should be built or fixed.',
  'Describes a specific project and also wants to start soon, asks for a quote or call, or gives a timeline or budget.',
]

function buildQuestions() {
  const service: ChoiceQuestion = {
    type: 'choice',
    instructions:
      'This is an enquiry sent through the contact form on Paul’s web developer portfolio. Which one of Paul’s `services` is the enquiry in `enquiry.message` really about? `enquiry.selected_type` is what the sender picked from a dropdown and may be wrong. Choose "none" if no service fits.',
    criteria: {
      ...Object.fromEntries(services.map((s) => [s.id, `${s.title}. Covers things like: ${s.examples.join(', ')}.`])),
      none: 'Not a request for any of these services (for example spam, a sales pitch, or an unrelated question).',
    },
  }

  const readiness: ScoreQuestion = {
    type: 'score',
    instructions: 'How ready is the sender of `enquiry.message` to start a project with Paul?',
    criteria: READINESS_LEVELS,
  }

  const budget: NoulQuestion = {
    type: 'noul',
    instructions: 'Does `enquiry.message` state a budget, price range, or spending limit for the work?',
    criteria: {
      true: 'Gives an amount, range, or explicit spending limit.',
      false: 'No amount or limit is stated (asking “how much?” does not count).',
    },
  }

  const deadline: NoulQuestion = {
    type: 'noul',
    instructions: 'Does `enquiry.message` state a deadline, launch date, or timeframe for the work?',
    criteria: {
      true: 'Names a date, a timeframe such as “within 2 weeks”, or an event the work must be ready for.',
      false: 'No timing is stated.',
    },
  }

  const spam: NoulQuestion = {
    type: 'noul',
    instructions:
      'Is `enquiry.message` spam, an automated or mass-sent message, or a pitch selling something to Paul, rather than someone asking Paul for help with their own project?',
    criteria: {
      true: 'Spam, SEO/marketing/outsourcing offers, link drops, crypto, or generic mass-mailed text.',
      false: 'A real person asking about getting their own website, integration, automation, or AI work done.',
    },
  }

  return { service, readiness, budget, deadline, spam }
}

const QUESTIONS = buildQuestions()

export async function triageContact(apiKey: string, c: ContactRequest): Promise<ContactTriage | null> {
  try {
    const a = await systemOne(
      apiKey,
      {
        enquiry: {
          selected_type: c.projectType,
          message: c.message,
          sender_email_domain: c.email.split('@')[1] ?? '',
        },
        services: services.map(({ id, title, examples }) => ({ id, title, examples })),
      },
      QUESTIONS,
      // The visitor is waiting on the submit button: two short attempts. A
      // stalled request (seen after idle periods) usually succeeds on retry.
      { maxAttempts: 2, timeoutMs: 2_500 },
    )

    const serviceP = a.service.probabilities[a.service.choice] ?? 0
    const svc = a.service.choice !== 'none' && serviceP >= MIN_SERVICE_PROBABILITY
      ? services.find((s) => s.id === a.service.choice) ?? null
      : null

    const readinessScore = a.readiness.score
    const level = READINESS_LEVELS[Math.round(readinessScore)] ?? ''
    const spamP = a.spam.noul

    const priority: Priority =
      spamP >= SPAM_FLAG ? 'spam' : readinessScore >= HOT_READINESS ? 'hot' : readinessScore >= WARM_READINESS ? 'warm' : 'cold'

    return {
      priority,
      service: svc ? { id: svc.id, title: svc.title, probability: round(serviceP) } : null,
      readiness: { score: round(readinessScore), level, confidence: round(a.readiness.confidence) },
      budgetMentioned: round(a.budget.noul),
      deadlineMentioned: round(a.deadline.noul),
      spamProbability: round(spamP),
    }
  } catch (err) {
    console.error('[contact] triage skipped:', String(err))
    return null
  }
}

const round = (n: number) => Math.round(n * 100) / 100
