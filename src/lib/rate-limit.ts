// Simple in-memory sliding-window rate limiter.
// NOTE: state is per-serverless-instance, so limits reset on cold starts and
// are not shared across instances. Good enough to stop basic abuse / runaway
// loops. For production-grade limiting, swap this for Upstash Redis.

type Hit = { count: number; resetAt: number }
const store = new Map<string, Hit>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key   unique identifier (e.g. `generate:${userId}`)
 * @param limit max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const hit = store.get(key)

  if (!hit || now > hit.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (hit.count >= limit) {
    return { success: false, remaining: 0, resetAt: hit.resetAt }
  }

  hit.count += 1
  return { success: true, remaining: limit - hit.count, resetAt: hit.resetAt }
}

// Opportunistic cleanup so the map doesn't grow unbounded.
let lastSweep = Date.now()
export function sweepExpired() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  store.forEach((v, k) => {
    if (now > v.resetAt) store.delete(k)
  })
}
