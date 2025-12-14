/**
 * Rate limiter for resend verification email endpoint
 * Tracks requests per email address to prevent abuse
 */

interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
  windowEndsAt: number;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 2;

// In-memory rate limit store (for development/testing only)
// WARNING: This will lose state on Vercel cold starts and doesn't scale across instances
// Production migration: Use Upstash Redis, Vercel KV, or similar external store
// See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
const rateLimitStore = new Map<string, RateLimitEntry>();

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function checkRateLimit(email: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = normalizeEmailKey(email);
  const entry = rateLimitStore.get(key);

  // No previous requests or window expired
  if (!entry || now > entry.windowEndsAt) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequestAt: now,
      windowEndsAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  // Within window, check count
  if (entry.count < MAX_REQUESTS_PER_WINDOW) {
    entry.count += 1;
    rateLimitStore.set(key, entry);
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.windowEndsAt - now) / 1000); // seconds
  return { allowed: false, retryAfter };
}

// Test-only helper to clear rate limits between tests
export function clearRateLimits(): void {
  if (process.env.NODE_ENV === 'test') {
    rateLimitStore.clear();
  }
}
