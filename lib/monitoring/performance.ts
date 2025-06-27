/**
 * Performance monitoring utilities for API endpoints
 * 
 * Provides structured logging and metrics collection for:
 * - API response times
 * - Database query times
 * - Error tracking
 * - Performance alerts
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
  private queryStartTime?: number;
  private queryEndTime?: number;
  private endpoint: string;
  private method: string;

  constructor(endpoint: string, method: string) {
    this.startTime = performance.now();
    this.endpoint = endpoint;
    this.method = method;
  }

  /**
   * Mark the start of a database query
   */
  startQuery(): void {
    this.queryStartTime = performance.now();
  }

  /**
   * Mark the end of a database query
   */
  endQuery(): void {
    if (this.queryStartTime) {
      this.queryEndTime = performance.now();
    }
  }

  /**
   * Get the total query time in milliseconds
   */
  getQueryTime(): number | undefined {
    if (this.queryStartTime && this.queryEndTime) {
      return Math.round(this.queryEndTime - this.queryStartTime);
    }
    return undefined;
  }

  /**
   * Complete monitoring and return metrics
   */
  complete(statusCode: number, error?: string, metadata?: Record<string, any>): PerformanceMetrics {
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
      metadata
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
    const logLevel = metrics.error ? 'error' : 
                    metrics.responseTime > 80 ? 'warn' : 'info';

    const logData = {
      type: 'api_performance',
      ...metrics
    };

    // In production, this would send to a logging service
    // For now, we'll use console with structured output
    if (process.env.NODE_ENV === 'production') {
      console[logLevel](JSON.stringify(logData));
    } else {
      // Development-friendly output
      console[logLevel](`[API Performance] ${metrics.method} ${metrics.endpoint}`, {
        responseTime: `${metrics.responseTime}ms`,
        queryTime: metrics.queryTime ? `${metrics.queryTime}ms` : 'N/A',
        status: metrics.statusCode,
        ...(metrics.error && { error: metrics.error })
      });
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    // Alert for slow database queries (>50ms as per performance requirements)
    if (metrics.queryTime && metrics.queryTime > 50) {
      console.warn(`[PERFORMANCE ALERT] Slow database query: ${metrics.endpoint} query took ${metrics.queryTime}ms`);
      
      // In production, this would trigger actual alerts (PagerDuty, Slack, etc.)
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with alerting service
        this.sendAlert({
          severity: 'warning',
          title: 'Slow Database Query',
          description: `${metrics.method} ${metrics.endpoint} database query took ${metrics.queryTime}ms`,
          metrics
        });
      }
    }

    // Alert for slow API responses (>80ms approaching 100ms target)
    if (metrics.responseTime > 80) {
      console.warn(`[PERFORMANCE ALERT] Slow API response: ${metrics.endpoint} took ${metrics.responseTime}ms (approaching 100ms target)`);
      
      // In production, this would trigger actual alerts (PagerDuty, Slack, etc.)
      if (process.env.NODE_ENV === 'production' && metrics.responseTime > 100) {
        // TODO: Integrate with alerting service
        this.sendAlert({
          severity: 'warning',
          title: 'Slow API Response',
          description: `${metrics.method} ${metrics.endpoint} took ${metrics.responseTime}ms`,
          metrics
        });
      }
    }

    // Alert for very slow queries (>1000ms)
    if (metrics.responseTime > 1000) {
      console.error(`[CRITICAL PERFORMANCE] Very slow API response: ${metrics.endpoint} took ${metrics.responseTime}ms`);
      
      if (process.env.NODE_ENV === 'production') {
        this.sendAlert({
          severity: 'critical',
          title: 'Critical API Performance Issue',
          description: `${metrics.method} ${metrics.endpoint} took ${metrics.responseTime}ms`,
          metrics
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
          metrics
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
 */
export class ErrorRateTracker {
  private static instance: ErrorRateTracker;
  private errorCounts: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private windowStart: number = Date.now();
  private readonly WINDOW_SIZE = 60000; // 1 minute window

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

    const key = endpoint;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    if (isError) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
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
  getAllErrorRates(): Record<string, { errorRate: number; totalRequests: number }> {
    const rates: Record<string, { errorRate: number; totalRequests: number }> = {};
    
    for (const [endpoint, requests] of Array.from(this.requestCounts.entries())) {
      const errors = this.errorCounts.get(endpoint) || 0;
      rates[endpoint] = {
        errorRate: requests > 0 ? (errors / requests) * 100 : 0,
        totalRequests: requests
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
    ErrorRateTracker.instance = undefined as any;
  }
}

/**
 * Utility function to wrap API handlers with performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const method = args[0]?.method || 'GET';
    const monitor = new PerformanceMonitor(endpoint, method);
    const errorTracker = ErrorRateTracker.getInstance();

    try {
      const response = await handler(...args);
      
      // Record metrics
      const isError = response.status >= 400;
      monitor.complete(response.status, isError ? `HTTP ${response.status}` : undefined);
      errorTracker.recordRequest(endpoint, isError);
      
      return response;
    } catch (error) {
      // Record error metrics
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      monitor.complete(500, errorMessage);
      errorTracker.recordRequest(endpoint, true);
      
      throw error;
    }
  }) as T;
}