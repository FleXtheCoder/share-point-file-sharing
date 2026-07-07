type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 60_000

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key)
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number }

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanupExpired(now)

  const entry = store.get(key)
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }

  entry.count += 1
  return { ok: true }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "unknown"
}
