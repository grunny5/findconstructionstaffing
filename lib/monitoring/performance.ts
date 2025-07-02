/**
 * Performance monitoring utilities for API endpoints
 *
 * Provides structured logging and metrics collection for:
 * - API response times
 * - Database query times
 * - Error tracking
 * - Performance alerts
 *
 * Configuration:
 * - DB_QUERY_THRESHOLD_MS: Database query time threshold in milliseconds (default: 50)
 */

/**
 * Performance metrics structure
 */
export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  queryTime?: number;
  error?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Performance monitor class for tracking API metrics
 */
export class PerformanceMonitor {
  private startTime: number;
  private queries: Map<string, { start: number; end?: number }> = new Map();
  private queryCounter: number = 0;
  private endpoint: string;
  private method: string;

  constructor(endpoint: string, method: string) {
    this.startTime = performance.now();
    this.endpoint = endpoint;
    this.method = method;
  }

  /**
   * Mark the start of a database query
   * @returns Query identifier to use when calling endQuery
   */
  startQuery(): string {
    const queryId = `query_${++this.queryCounter}`;
    this.queries.set(queryId, { start: performance.now() });
    return queryId;
  }

  /**
   * Mark the end of a database query
   * @param queryId - The identifier returned by startQuery
   */
  endQuery(queryId: string): void {
    const query = this.queries.get(queryId);
    if (query && !query.end) {
      query.end = performance.now();
    }
  }

  /**
   * Get the total query time in milliseconds
   * Returns the sum of all completed queries
   */
  getQueryTime(): number | undefined {
    const completedQueries = Array.from(this.queries.values()).filter(
      (q) => q.end
    );
    if (completedQueries.length === 0) {
      return undefined;
    }

    const totalTime = completedQueries.reduce((sum, query) => {
      return sum + Math.round(query.end! - query.start);
    }, 0);

    return totalTime;
  }

  /**
   * Complete monitoring and return metrics
   */
  complete(
    statusCode: number,
    error?: string,
    metadata?: Record<string, any>
  ): PerformanceMetrics {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - this.startTime);
    const queryTime = this.getQueryTime();

    const metrics: PerformanceMetrics = {
      endpoint: this.endpoint,
      method: this.method,
      statusCode,
      responseTime,
      queryTime,
      error,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Log the metrics
    this.logMetrics(metrics);

    // Check for performance alerts
    this.checkAlerts(metrics);

    return metrics;
  }

  /**
   * Log metrics in structured format
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    const logLevel = metrics.error
      ? 'error'
      : metrics.responseTime > 80
        ? 'warn'
        : 'info';

    const logData = {
      type: 'api_performance',
      ...metrics,
    };

    // In production, this would send to a logging service
    // For now, we'll use console with structured output
    if (process.env.NODE_ENV === 'production') {
      console[logLevel](JSON.stringify(logData));
    } else {
      // Development-friendly output
      console[logLevel](
        `[API Performance] ${metrics.method} ${metrics.endpoint}`,
        {
          responseTime: `${metrics.responseTime}ms`,
          queryTime: metrics.queryTime ? `${metrics.queryTime}ms` : 'N/A',
          status: metrics.statusCode,
          ...(metrics.error && { error: metrics.error }),
        }
      );
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    // Alert for slow database queries (configurable threshold)
    const queryTimeThreshold = parseInt(
      process.env.DB_QUERY_THRESHOLD_MS || '50',
      10
    );
    if (metrics.queryTime && metrics.queryTime > queryTimeThreshold) {
      console.warn(
        `[PERFORMANCE ALERT] Slow database query: ${metrics.endpoint} query took ${metrics.queryTime}ms (threshold: ${queryTimeThreshold}ms)`
      );

      // In production, this would trigger actual alerts (PagerDuty, Slack, etc.)
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with alerting service
        this.sendAlert({
          severity: 'warning',
          title: 'Slow Database Query',
          description: `${metrics.method} ${metrics.endpoint} database query took ${metrics.queryTime}ms`,
          metrics,
        });
      }
    }

    // Alert for slow API responses (>80ms approaching 100ms target)
    if (metrics.responseTime > 80) {
      console.warn(
        `[PERFORMANCE ALERT] Slow API response: ${metrics.endpoint} took ${metrics.responseTime}ms (approaching 100ms target)`
      );

      // In production, this would trigger actual alerts (PagerDuty, Slack, etc.)
      if (process.env.NODE_ENV === 'production' && metrics.responseTime > 100) {
        // TODO: Integrate with alerting service
        this.sendAlert({
          severity: 'warning',
          title: 'Slow API Response',
          description: `${metrics.method} ${metrics.endpoint} took ${metrics.responseTime}ms`,
          metrics,
        });
      }
    }

    // Alert for very slow queries (>1000ms)
    if (metrics.responseTime > 1000) {
      console.error(
        `[CRITICAL PERFORMANCE] Very slow API response: ${metrics.endpoint} took ${metrics.responseTime}ms`
      );

      if (process.env.NODE_ENV === 'production') {
        this.sendAlert({
          severity: 'critical',
          title: 'Critical API Performance Issue',
          description: `${metrics.method} ${metrics.endpoint} took ${metrics.responseTime}ms`,
          metrics,
        });
      }
    }

    // Alert for errors
    if (metrics.error) {
      console.error(`[API ERROR] ${metrics.endpoint}: ${metrics.error}`);

      if (process.env.NODE_ENV === 'production') {
        this.sendAlert({
          severity: 'error',
          title: 'API Error',
          description: `${metrics.method} ${metrics.endpoint} failed: ${metrics.error}`,
          metrics,
        });
      }
    }
  }

  /**
   * Send alert to monitoring service
   * This is a placeholder for integration with services like PagerDuty, Datadog, etc.
   */
  private sendAlert(alert: {
    severity: 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    metrics: PerformanceMetrics;
  }): void {
    // TODO: Implement actual alert sending
    // For now, just log that we would send an alert
    console.log('[Alert Service]', JSON.stringify(alert));
  }
}

/**
 * Error rate tracker for monitoring API health
 *
 * IMPORTANT: This tracker is per-process and does NOT synchronize across multiple
 * workers or processes. In a multi-worker environment (e.g., cluster mode), each
 * worker maintains its own separate instance with independent metrics.
 *
 * For production environments with multiple workers, consider using:
 * - External metrics storage (Redis, Prometheus, etc.)
 * - Aggregation at the load balancer level
 * - Centralized logging and monitoring solutions
 */
export class ErrorRateTracker {
  private static instance?: ErrorRateTracker;
  private errorCounts: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private windowStart: number = Date.now();
  private readonly WINDOW_SIZE = 60000; // 1 minute window
  private readonly MAX_ENDPOINTS = 1000; // Maximum number of endpoints to track

  private constructor() {}

  static getInstance(): ErrorRateTracker {
    if (!ErrorRateTracker.instance) {
      ErrorRateTracker.instance = new ErrorRateTracker();
    }
    return ErrorRateTracker.instance;
  }

  /**
   * Record a request
   */
  recordRequest(endpoint: string, isError: boolean): void {
    this.checkWindow();
    this.enforceMemoryLimit();

    const key = endpoint;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);

    if (isError) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
  }

  /**
   * Enforce memory limits by removing least recently used endpoints
   */
  private enforceMemoryLimit(): void {
    if (this.requestCounts.size >= this.MAX_ENDPOINTS) {
      // Remove endpoints with the lowest request counts
      const entries = Array.from(this.requestCounts.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      // Remove the bottom 10% of endpoints
      const toRemove = Math.ceil(this.MAX_ENDPOINTS * 0.1);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        const endpoint = entries[i][0];
        this.requestCounts.delete(endpoint);
        this.errorCounts.delete(endpoint);
      }
    }
  }

  /**
   * Get error rate for an endpoint
   */
  getErrorRate(endpoint: string): number {
    const requests = this.requestCounts.get(endpoint) || 0;
    const errors = this.errorCounts.get(endpoint) || 0;

    if (requests === 0) return 0;
    return (errors / requests) * 100;
  }

  /**
   * Get all error rates
   */
  getAllErrorRates(): Record<
    string,
    { errorRate: number; totalRequests: number }
  > {
    const rates: Record<string, { errorRate: number; totalRequests: number }> =
      {};

    for (const [endpoint, requests] of Array.from(
      this.requestCounts.entries()
    )) {
      const errors = this.errorCounts.get(endpoint) || 0;
      rates[endpoint] = {
        errorRate: requests > 0 ? (errors / requests) * 100 : 0,
        totalRequests: requests,
      };
    }

    return rates;
  }

  /**
   * Check if we need to reset the window
   */
  private checkWindow(): void {
    const now = Date.now();
    if (now - this.windowStart > this.WINDOW_SIZE) {
      this.errorCounts.clear();
      this.requestCounts.clear();
      this.windowStart = now;
    }
  }

  /**
   * Reset all tracking data - useful for testing
   */
  reset(): void {
    this.errorCounts.clear();
    this.requestCounts.clear();
    this.windowStart = Date.now();
  }

  /**
   * Reset the singleton instance - primarily for testing
   */
  static resetInstance(): void {
    ErrorRateTracker.instance = undefined;
  }
}

/**
 * Utility function to wrap API handlers with performance monitoring
 */
export function withPerformanceMonitoring<
  T extends (...args: any[]) => Promise<Response>,
>(handler: T, endpoint: string): T {
  return (async (...args: Parameters<T>) => {
    // More robust method extraction with type safety
    const request = args[0] as Request | undefined;
    const method = request?.method || 'GET';
    const monitor = new PerformanceMonitor(endpoint, method);
    const errorTracker = ErrorRateTracker.getInstance();

    try {
      const response = await handler(...args);

      // Record metrics
      const isError = response.status >= 400;
      monitor.complete(
        response.status,
        isError ? `HTTP ${response.status}` : undefined
      );
      errorTracker.recordRequest(endpoint, isError);

      return response;
    } catch (error) {
      // Record error metrics with better error handling
      let errorMessage: string;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        errorMessage = String(error);
      } else {
        errorMessage = 'Unknown error';
      }

      monitor.complete(500, errorMessage);
      errorTracker.recordRequest(endpoint, true);

      throw error;
    }
  }) as T;
}
