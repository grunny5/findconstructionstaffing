import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

/**
 * Rate Limiting Middleware for Messaging
 *
 * Protects messaging endpoints from spam and abuse using Upstash Redis.
 * Implements sliding window rate limiting with per-user quotas.
 *
 * Configuration:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 *
 * If not configured, rate limiting is disabled (development mode).
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const RATE_LIMIT_MAX_REQUESTS = 50; // messages per minute
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds

// =============================================================================
// REDIS CLIENT INITIALIZATION
// =============================================================================

let redisClient: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

/**
 * Initialize Redis client and rate limiter (lazy initialization)
 */
function initializeRateLimiter(): Ratelimit | null {
  // Return existing instance if already initialized
  if (rateLimiter) {
    return rateLimiter;
  }

  // Check if Upstash Redis is configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn(
      '[Rate Limit] Upstash Redis not configured. Rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.'
    );
    return null;
  }

  try {
    // Create Redis client
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // Create rate limiter with sliding window algorithm
    rateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_MAX_REQUESTS,
        `${RATE_LIMIT_WINDOW_MS} ms`
      ),
      analytics: true,
      prefix: 'ratelimit:messages',
    });

    console.log('[Rate Limit] Upstash rate limiter initialized successfully');
    return rateLimiter;
  } catch (error) {
    console.error('[Rate Limit] Failed to initialize rate limiter:', error);
    return null;
  }
}

// =============================================================================
// RATE LIMIT RESULT INTERFACE
// =============================================================================

export interface RateLimitResult {
  /**
   * Whether the request is allowed (within rate limit)
   */
  success: boolean;

  /**
   * Number of requests remaining in current window
   */
  remaining: number;

  /**
   * Total requests allowed per window
   */
  limit: number;

  /**
   * Unix timestamp (ms) when the rate limit resets
   */
  reset: number;

  /**
   * Whether rate limiting is enabled (false if Redis not configured)
   */
  enabled: boolean;

  /**
   * Error message if rate limit exceeded
   */
  error?: string;
}

// =============================================================================
// RATE LIMITING FUNCTION
// =============================================================================

/**
 * Rate limit messages for a specific user
 *
 * @param userId - User ID to rate limit (from auth.uid())
 * @returns RateLimitResult with success status and metadata
 *
 * @example
 * ```typescript
 * const result = await rateLimitMessages('user-123');
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: { code: 'RATE_LIMIT_EXCEEDED', message: result.error } },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export async function rateLimitMessages(
  userId: string
): Promise<RateLimitResult> {
  // Get or initialize rate limiter
  const limiter = initializeRateLimiter();

  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      limit: RATE_LIMIT_MAX_REQUESTS,
      reset: Date.now() + RATE_LIMIT_WINDOW_MS,
      enabled: false,
    };
  }

  try {
    // Check rate limit for this user
    const result = await limiter.limit(userId);

    // Return formatted result
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
      enabled: true,
      error: result.success
        ? undefined
        : `Too many requests. Please wait ${Math.ceil((result.reset - Date.now()) / 1000)} seconds before sending more messages.`,
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);

    // On error, allow request but log the issue
    return {
      success: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      limit: RATE_LIMIT_MAX_REQUESTS,
      reset: Date.now() + RATE_LIMIT_WINDOW_MS,
      enabled: false,
      error: 'Rate limiting temporarily unavailable',
    };
  }
}

/**
 * Middleware helper for Next.js API routes
 *
 * Checks rate limit and returns appropriate response if exceeded.
 *
 * @param userId - User ID to rate limit
 * @returns null if allowed, NextResponse with 429 if exceeded
 *
 * @example
 * ```typescript
 * const rateLimitResponse = await checkRateLimit(user.id);
 * if (rateLimitResponse) {
 *   return rateLimitResponse;
 * }
 * ```
 */
export async function checkRateLimit(
  userId: string
): Promise<Response | null> {
  const result = await rateLimitMessages(userId);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: result.error || 'Too many requests',
          details: {
            limit: result.limit,
            reset: result.reset,
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
          'Retry-After': String(
            Math.ceil((result.reset - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  return null;
}

/**
 * Reset rate limit for a user (for testing purposes)
 *
 * @param userId - User ID to reset
 */
export async function resetRateLimit(userId: string): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.del(`ratelimit:messages:${userId}`);
    console.log(`[Rate Limit] Reset rate limit for user ${userId}`);
  } catch (error) {
    console.error('[Rate Limit] Error resetting rate limit:', error);
  }
}
