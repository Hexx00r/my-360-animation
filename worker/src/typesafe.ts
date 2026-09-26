/**
 * Minimal typed client for TypeSafe's System One endpoint
 * (POST https://api.typesafe.ai/v1/systemone). Plain fetch so it runs on the
 * Workers runtime without Node APIs. Retries 429/529, timeouts and network
 * errors with short backoff.
 */

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MODEL = 'jev-latest'
const RETRY_STATUSES = new Set([429, 529])
const MAX_ATTEMPTS = 2
// Two attempts plus backoff must fit inside the browser client's 15 s timeout.
const TIMEOUT_MS = 6_000

type Instructions = string | Record<string, unknown> | unknown[]

export type ChoiceQuestion<K extends string = string> = {
  type: 'choice'
  instructions: Instructions
  criteria: Record<K, string | null>
}
export type NoulQuestion = {
  type: 'noul'
  instructions: Instructions
  criteria: { true: string; false: string }
}
export type ScoreQuestion = {
  type: 'score'
  instructions: Instructions
  criteria: string[]
}
export type Question = ChoiceQuestion | NoulQuestion | ScoreQuestion

export type ChoiceAnswer<K extends string = string> = {
  type: 'choice'
  choice: K
  probabilities: Record<K, number>
  confidence: number
}
export type NoulAnswer = { type: 'noul'; noul: number }
export type ScoreAnswer = {
  type: 'score'
  score: number
  legend: Record<string, string>
  probabilities: Record<string, number>
  confidence: number
}

/** Maps each question's type to its answer type, so callers get typed answers back. */
export type AnswersFor<Q extends Record<string, Question>> = {
  [K in keyof Q]: Q[K] extends ChoiceQuestion<infer C>
    ? ChoiceAnswer<C>
    : Q[K] extends NoulQuestion
      ? NoulAnswer
      : ScoreAnswer
}

export class TypeSafeError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function systemOne<Q extends Record<string, Question>>(
  apiKey: string,
  state: unknown,
  questions: Q,
  opts: { maxAttempts?: number; timeoutMs?: number } = {},
): Promise<AnswersFor<Q>> {
  const maxAttempts = opts.maxAttempts ?? MAX_ATTEMPTS
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS
  const body = JSON.stringify({ model: MODEL, state, questions })

  const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)))

  for (let attempt = 1; ; attempt++) {
    let res: Response
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      // Timeout or network error: transient, worth one more try.
      if (attempt < maxAttempts) {
        await backoff(attempt)
        continue
      }
      throw err
    }
    if (res.ok) {
      const data = (await res.json()) as { answers: AnswersFor<Q> }
      return data.answers
    }
    if (RETRY_STATUSES.has(res.status) && attempt < maxAttempts) {
      await backoff(attempt)
      continue
    }
    const detail = await res.text().catch(() => '')
    throw new TypeSafeError(res.status, `TypeSafe HTTP ${res.status}: ${detail.slice(0, 300)}`)
  }
}
