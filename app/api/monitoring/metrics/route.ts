import { NextRequest, NextResponse } from 'next/server';
import { ErrorRateTracker } from '@/lib/monitoring/performance';
import { HTTP_STATUS } from '@/types/api';

// Rate limiting for failed authentication attempts
const failedAuthAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

/**
 * GET /api/monitoring/metrics
 * 
 * Returns current performance metrics and error rates
 * Protected by API key authentication in production
 */
export async function GET(request: NextRequest) {
  // Authentication is implemented via API key
  const monitoringKey = process.env.MONITORING_API_KEY;
  const providedKey = request.headers.get('x-monitoring-key');
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // Check rate limiting for this IP
  const now = Date.now();
  const authAttempt = failedAuthAttempts.get(clientIp);
  
  if (authAttempt && authAttempt.resetTime > now && authAttempt.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfter = Math.ceil((authAttempt.resetTime - now) / 1000);
    return NextResponse.json(
      { error: 'Too many failed authentication attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': MAX_FAILED_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(authAttempt.resetTime).toISOString()
        }
      }
    );
  }
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    failedAuthAttempts.forEach((attempt, ip) => {
      if (attempt.resetTime <= now) {
        failedAuthAttempts.delete(ip);
      }
    });
  }
  
  // Explicit authorization check with clear conditions
  const isProduction = process.env.NODE_ENV === 'production';
  const hasValidApiKey = monitoringKey && providedKey === monitoringKey;
  const isAuthorized = !isProduction || hasValidApiKey;
  
  if (!isAuthorized) {
    // Track failed authentication attempt
    const attempt = failedAuthAttempts.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    attempt.count++;
    attempt.resetTime = Math.max(attempt.resetTime, now + RATE_LIMIT_WINDOW);
    failedAuthAttempts.set(clientIp, attempt);
    
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        message: 'Valid API key required in x-monitoring-key header'
      },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'ApiKey',
          'X-RateLimit-Limit': MAX_FAILED_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': Math.max(0, MAX_FAILED_ATTEMPTS - attempt.count).toString(),
          'X-RateLimit-Reset': new Date(attempt.resetTime).toISOString()
        }
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
        requestCount: errorRates['/api/agencies']?.totalRequests || 0
      }
    },
    alerts: {
      // Would be populated from alert history
      recent: [],
      active: []
    }
  };

  return NextResponse.json(metrics, {
    status: HTTP_STATUS.OK,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}