/**
 * Production-ready rate limiter using Upstash Redis
 *
 * Fixes security issues:
 * - RL-003: Persistent storage survives serverless cold starts
 * - RL-004: IP-based rate limiting prevents distributed attacks
 *
 * Uses Upstash Redis for:
 * - Persistence across serverless function invocations
 * - Low latency (~50ms) with edge-compatible REST API
 * - No connection pooling required (HTTP-based)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured (optional in development)
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client (only if configured)
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Email-based rate limiter
 * Limits: 2 requests per 10 minutes per email address
 */
export const emailRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '10 m'),
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : null;

/**
 * IP-based rate limiter
 * Limits: 10 requests per 10 minutes per IP address
 * Prevents distributed attacks using different email addresses
 */
export const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : null;

/**
 * Check rate limits for email verification resend
 * Checks both email-based and IP-based limits
 *
 * @param email - Email address requesting verification
 * @param ip - IP address of the request
 * @returns Rate limit result with allowed status and retry info
 */
export async function checkResendVerificationRateLimit(
  email: string,
  ip: string
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  reason?: 'email' | 'ip';
}> {
  // In development/test without Redis, allow all requests
  if (!emailRateLimiter || !ipRateLimiter) {
    console.warn(
      '[Rate Limit] Redis not configured - rate limiting disabled (development only)'
    );
    return {
      allowed: true,
      limit: 2,
      remaining: 2,
      reset: Date.now() + 600000,
    };
  }

  // Check email-based rate limit first
  const emailKey = normalizeEmailKey(email);
  const emailResult = await emailRateLimiter.limit(emailKey);

  if (!emailResult.success) {
    const retryAfter = Math.ceil((emailResult.reset - Date.now()) / 1000);
    return {
      allowed: false,
      limit: emailResult.limit,
      remaining: emailResult.remaining,
      reset: emailResult.reset,
      retryAfter,
      reason: 'email',
    };
  }

  // Check IP-based rate limit
  const ipResult = await ipRateLimiter.limit(ip);

  if (!ipResult.success) {
    const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
    return {
      allowed: false,
      limit: ipResult.limit,
      remaining: ipResult.remaining,
      reset: ipResult.reset,
      retryAfter,
      reason: 'ip',
    };
  }

  // Both limits passed
  return {
    allowed: true,
    limit: emailResult.limit,
    remaining: emailResult.remaining,
    reset: emailResult.reset,
  };
}

/**
 * Normalize email for rate limiting
 * Prevents bypassing limits with email+tag@domain.com
 */
function normalizeEmailKey(email: string): string {
  const normalized = email.trim().toLowerCase();

  // Remove Gmail-style + aliases (user+tag@gmail.com -> user@gmail.com)
  const [localPart, domain] = normalized.split('@');
  if (!domain) return normalized;

  const cleanLocal = localPart.split('+')[0];
  return `${cleanLocal}@${domain}`;
}

/**
 * Get client IP from Next.js request
 * Handles Vercel and other proxy headers
 */
export function getClientIp(request: Request): string {
  // Try Vercel-specific header first
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Try real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return '127.0.0.1';
}
