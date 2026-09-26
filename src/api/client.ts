/**
 * Typed browser client for the Worker API. No secrets live here: the browser
 * only ever talks to our own /api routes, and the Worker holds every key.
 *
 * API_BASE is empty by default (same origin — Pages + a Worker route on the
 * same domain, or `wrangler dev` behind the Vite proxy). Set VITE_API_BASE at
 * build time to call a Worker on another origin, e.g. *.workers.dev.
 */
import type { ApiError, ChatRequest, ChatResponse, ContactRequest, ContactResponse } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 15_000

export type ApiResult<T> = T | ApiError

async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = (await res.json().catch(() => null)) as ApiResult<T> | null
    if (data && typeof data === 'object' && 'ok' in data) return data
    return { ok: false, error: `Unexpected response (HTTP ${res.status}).` }
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError'
    return { ok: false, error: aborted ? 'The server took too long to answer.' : 'Network error — please try again.' }
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  chat: (req: ChatRequest) => post<ChatResponse>('/api/chat', req),
  contact: (req: ContactRequest) => post<ContactResponse>('/api/contact', req),
}
