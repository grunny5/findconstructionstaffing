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

// In-memory rate limit store (for development)
// In production, use Redis or database
const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(email: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(email);

  // No previous requests or window expired
  if (!entry || now > entry.windowEndsAt) {
    rateLimitStore.set(email, {
      count: 1,
      firstRequestAt: now,
      windowEndsAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  // Within window, check count
  if (entry.count < MAX_REQUESTS_PER_WINDOW) {
    entry.count += 1;
    rateLimitStore.set(email, entry);
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
