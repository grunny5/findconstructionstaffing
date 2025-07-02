import { NextRequest, NextResponse } from 'next/server';
import { ErrorRateTracker } from '@/lib/monitoring/performance';
import { HTTP_STATUS } from '@/types/api';
import { getClientIp, hashIpForRateLimiting } from '@/lib/utils/ip-extraction';

/**
 * Rate limiting for failed authentication attempts
 *
 * WARNING: This in-memory implementation is NOT suitable for production use:
 * - Data is lost on server restart
 * - Does not work across multiple server instances
 * - No persistence between deployments
 *
 * For production, use a persistent store like Redis:
 * - Redis SET with EX (expiration) for automatic cleanup
 * - Redis INCR for atomic counter increments
 * - Shared across all server instances
 *
 * Example Redis implementation:
 * ```
 * const redis = new Redis();
 * const key = `rate_limit:monitoring:${clientIp}`;
 * const count = await redis.incr(key);
 * if (count === 1) {
 *   await redis.expire(key, 900); // 15 minutes
 * }
 * ```
 */
const failedAuthAttempts = new Map<
  string,
  { count: number; resetTime: number; firstAttemptTime: number }
>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

/**
 * GET /api/monitoring/metrics
 *
 * Returns current performance metrics and error rates
 * Protected by API key authentication in production
 *
 * PRODUCTION CONSIDERATIONS:
 * - Replace in-memory rate limiting with Redis or similar
 * - Implement distributed rate limiting for multi-instance deployments
 * - Consider using a proper API gateway for authentication and rate limiting
 */
export async function GET(request: NextRequest) {
  // Authentication is implemented via API key
  const monitoringKey = process.env.MONITORING_API_KEY;
  const providedKey = request.headers.get('x-monitoring-key');

  // Securely extract and validate client IP
  const clientIp = getClientIp(request);
  const rateLimitKey = hashIpForRateLimiting(clientIp);

  // Check rate limiting for this IP using the hashed key
  const now = Date.now();
  const authAttempt = failedAuthAttempts.get(rateLimitKey);

  if (
    authAttempt &&
    authAttempt.resetTime > now &&
    authAttempt.count >= MAX_FAILED_ATTEMPTS
  ) {
    const retryAfter = Math.ceil((authAttempt.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error:
          'Too many failed authentication attempts. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': MAX_FAILED_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(authAttempt.resetTime).toISOString(),
        },
      }
    );
  }

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    // 10% chance to cleanup
    failedAuthAttempts.forEach((attempt, key) => {
      if (attempt.resetTime <= now) {
        failedAuthAttempts.delete(key);
      }
    });
  }

  // Explicit authorization check with clear conditions
  const isProduction = process.env.NODE_ENV === 'production';
  const hasValidApiKey = monitoringKey && providedKey === monitoringKey;
  const isAuthorized = !isProduction || hasValidApiKey;

  if (!isAuthorized) {
    // Track failed authentication attempt using the hashed key
    let attempt = failedAuthAttempts.get(rateLimitKey);

    if (!attempt) {
      // First failed attempt - set the reset time
      attempt = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
        firstAttemptTime: now,
      };
    } else {
      // Subsequent attempts - increment count but don't extend reset time
      attempt.count++;
    }

    failedAuthAttempts.set(rateLimitKey, attempt);

    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Valid API key required in x-monitoring-key header',
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'ApiKey',
          'X-RateLimit-Limit': MAX_FAILED_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': Math.max(
            0,
            MAX_FAILED_ATTEMPTS - attempt.count
          ).toString(),
          'X-RateLimit-Reset': new Date(attempt.resetTime).toISOString(),
        },
      }
    );
  }

  const errorTracker = ErrorRateTracker.getInstance();
  const errorRates = errorTracker.getAllErrorRates();

  const metrics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    errorRates,
    // In a real implementation, we would aggregate performance data from logs
    // For now, we'll return the structure that would be populated
    performance: {
      agencies: {
        p50: 0, // Would be calculated from logged metrics
        p95: 0,
        p99: 0,
        avgResponseTime: 0,
        avgQueryTime: 0,
        requestCount: errorRates['/api/agencies']?.totalRequests || 0,
      },
    },
    alerts: {
      // Would be populated from alert history
      recent: [],
      active: [],
    },
  };

  return NextResponse.json(metrics, {
    status: HTTP_STATUS.OK,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
