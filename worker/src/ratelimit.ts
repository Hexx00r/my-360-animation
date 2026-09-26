import type { RateLimitBinding } from './env'

/**
 * Per-key rate limiting. Uses the Cloudflare Rate Limiting binding when it is
 * configured; otherwise falls back to a per-isolate sliding window, which is
 * weaker (each isolate counts separately) but still blunts a single client.
 */
const windows = new Map<string, number[]>()

export async function allow(
  binding: RateLimitBinding | undefined,
  key: string,
  fallback: { limit: number; periodMs: number },
): Promise<boolean> {
  if (binding) {
    try {
      return (await binding.limit({ key })).success
    } catch {
      // Binding unavailable (e.g. older local runtime): use the fallback below.
    }
  }

  const now = Date.now()
  const hits = (windows.get(key) ?? []).filter((t) => now - t < fallback.periodMs)
  if (hits.length >= fallback.limit) {
    windows.set(key, hits)
    return false
  }
  hits.push(now)
  windows.set(key, hits)
  if (windows.size > 5000) windows.clear() // keep memory bounded
  return true
}
