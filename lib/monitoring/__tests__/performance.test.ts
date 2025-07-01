/**
 * Tests for performance monitoring utilities
 */

import { PerformanceMonitor, ErrorRateTracker } from '../performance';

// Mock console methods
const originalConsole = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log
};

beforeEach(() => {
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.log = jest.fn();
  jest.useFakeTimers();
});

afterEach(() => {
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.log = originalConsole.log;
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('PerformanceMonitor', () => {
  describe('basic monitoring', () => {
    it('should track response time', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      // Simulate some time passing
      jest.advanceTimersByTime(50);
      
      const metrics = monitor.complete(200);
      
      expect(metrics).toMatchObject({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 50,
        queryTime: undefined,
        error: undefined
      });
      
      expect(console.info).toHaveBeenCalled();
    });

    it('should track query time separately', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(10);
      const queryId = monitor.startQuery();
      jest.advanceTimersByTime(30);
      monitor.endQuery(queryId);
      jest.advanceTimersByTime(10);
      
      const metrics = monitor.complete(200);
      
      expect(metrics.responseTime).toBe(50);
      expect(metrics.queryTime).toBe(30);
    });

    it('should track multiple concurrent queries', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      // Start first query at t=10
      jest.advanceTimersByTime(10);
      const query1Id = monitor.startQuery();
      
      // Start second query at t=15 (while first is running)
      jest.advanceTimersByTime(5);
      const query2Id = monitor.startQuery();
      
      // End first query at t=30 (duration: 20ms)
      jest.advanceTimersByTime(15);
      monitor.endQuery(query1Id);
      
      // End second query at t=40 (duration: 25ms)
      jest.advanceTimersByTime(10);
      monitor.endQuery(query2Id);
      
      jest.advanceTimersByTime(10); // Total time: 50ms
      
      const metrics = monitor.complete(200);
      
      expect(metrics.responseTime).toBe(50);
      // Total query time should be sum of both queries: 20ms + 25ms = 45ms
      expect(metrics.queryTime).toBe(45);
    });

    it('should handle out-of-order query completion', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      // Start query 1 at t=0
      const query1Id = monitor.startQuery();
      
      // Start query 2 at t=10
      jest.advanceTimersByTime(10);
      const query2Id = monitor.startQuery();
      
      // End query 2 first at t=20 (duration: 10ms)
      jest.advanceTimersByTime(10);
      monitor.endQuery(query2Id);
      
      // End query 1 later at t=30 (duration: 30ms)
      jest.advanceTimersByTime(10);
      monitor.endQuery(query1Id);
      
      const metrics = monitor.complete(200);
      
      // Total query time should be sum: 30ms + 10ms = 40ms
      expect(metrics.queryTime).toBe(40);
    });

    it('should include error information', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const metrics = monitor.complete(500, 'Database connection failed');
      
      expect(metrics.error).toBe('Database connection failed');
      expect(console.error).toHaveBeenCalled();
    });

    it('should include metadata', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const metadata = { resultCount: 10, hasFilters: true };
      const metrics = monitor.complete(200, undefined, metadata);
      
      expect(metrics.metadata).toEqual(metadata);
    });
  });

  describe('performance alerts', () => {
    const originalDbThreshold = process.env.DB_QUERY_THRESHOLD_MS;

    afterEach(() => {
      if (originalDbThreshold !== undefined) {
        process.env.DB_QUERY_THRESHOLD_MS = originalDbThreshold;
      } else {
        process.env.DB_QUERY_THRESHOLD_MS = undefined;
      }
    });

    it('should warn for slow responses (>200ms)', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(250);
      monitor.complete(200);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE ALERT] Slow API response: /api/test took 250ms')
      );
    });

    it('should use configurable database query threshold', () => {
      // Set custom threshold
      process.env.DB_QUERY_THRESHOLD_MS = '30';
      
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const queryId = monitor.startQuery();
      jest.advanceTimersByTime(40); // 40ms query time
      monitor.endQuery(queryId);
      
      monitor.complete(200);
      
      // Should warn because 40ms > 30ms threshold
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE ALERT] Slow database query: /api/test query took 40ms (threshold: 30ms)')
      );
    });

    it('should use default threshold when not configured', () => {
      process.env.DB_QUERY_THRESHOLD_MS = undefined;
      
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const queryId = monitor.startQuery();
      jest.advanceTimersByTime(60); // 60ms query time
      monitor.endQuery(queryId);
      
      monitor.complete(200);
      
      // Should warn because 60ms > 50ms default threshold
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE ALERT] Slow database query: /api/test query took 60ms (threshold: 50ms)')
      );
    });

    it('should error for very slow responses (>1000ms)', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(1500);
      monitor.complete(200);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL PERFORMANCE] Very slow API response: /api/test took 1500ms')
      );
    });

    it('should alert on errors', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      monitor.complete(500, 'Internal Server Error');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[API ERROR] /api/test: Internal Server Error')
      );
    });
  });

  describe('structured logging', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
    });

    it('should log structured JSON in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const metrics = monitor.complete(200);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"type":"api_performance"')
      );
    });

    it('should log human-readable format in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(50);
      monitor.complete(200);
      
      expect(console.info).toHaveBeenCalledWith(
        '[API Performance] GET /api/test',
        expect.objectContaining({
          responseTime: '50ms',
          status: 200
        })
      );
    });
  });
});

describe('ErrorRateTracker', () => {
  beforeEach(() => {
    // Reset the singleton instance to ensure clean state
    ErrorRateTracker.resetInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    ErrorRateTracker.resetInstance();
  });

  it('should be a singleton', () => {
    const instance1 = ErrorRateTracker.getInstance();
    const instance2 = ErrorRateTracker.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should track request counts', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    tracker.recordRequest('/api/test', false);
    tracker.recordRequest('/api/test', false);
    tracker.recordRequest('/api/test', true);
    
    const errorRate = tracker.getErrorRate('/api/test');
    expect(errorRate).toBe(33.33333333333333); // 1 error out of 3 requests
  });

  it('should reset data when reset() is called', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    // Record some requests
    tracker.recordRequest('/api/test', false);
    tracker.recordRequest('/api/test', true);
    
    // Verify data exists
    expect(tracker.getErrorRate('/api/test')).toBe(50);
    
    // Reset the tracker
    tracker.reset();
    
    // Verify data is cleared
    expect(tracker.getErrorRate('/api/test')).toBe(0);
    const allRates = tracker.getAllErrorRates();
    expect(Object.keys(allRates).length).toBe(0);
  });

  it('should return 0 error rate for endpoints with no requests', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    const errorRate = tracker.getErrorRate('/api/unknown');
    expect(errorRate).toBe(0);
  });

  it('should track multiple endpoints separately', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    tracker.recordRequest('/api/endpoint1', false);
    tracker.recordRequest('/api/endpoint1', true);
    tracker.recordRequest('/api/endpoint2', false);
    tracker.recordRequest('/api/endpoint2', false);
    
    const rates = tracker.getAllErrorRates();
    
    expect(rates['/api/endpoint1']).toEqual({
      errorRate: 50,
      totalRequests: 2
    });
    
    expect(rates['/api/endpoint2']).toEqual({
      errorRate: 0,
      totalRequests: 2
    });
  });

  it('should reset counts after time window', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    tracker.recordRequest('/api/test', true);
    
    // Advance time past the window (1 minute)
    jest.advanceTimersByTime(61000);
    
    tracker.recordRequest('/api/test', false);
    
    const errorRate = tracker.getErrorRate('/api/test');
    expect(errorRate).toBe(0); // Only the recent request counts
  });

  it('should enforce memory limits on tracked endpoints', () => {
    const tracker = ErrorRateTracker.getInstance();
    
    // Record requests for many endpoints to approach the limit
    // We'll create slightly more than MAX_ENDPOINTS (1000) to trigger cleanup
    for (let i = 0; i < 1005; i++) {
      tracker.recordRequest(`/api/endpoint${i}`, false);
    }
    
    const rates = tracker.getAllErrorRates();
    const endpointCount = Object.keys(rates).length;
    
    // Should have removed approximately 10% of endpoints
    expect(endpointCount).toBeLessThanOrEqual(1000);
    expect(endpointCount).toBeGreaterThan(900); // Should keep most endpoints
  });
});