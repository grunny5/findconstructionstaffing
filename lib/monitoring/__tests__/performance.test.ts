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
      monitor.startQuery();
      jest.advanceTimersByTime(30);
      monitor.endQuery();
      jest.advanceTimersByTime(10);
      
      const metrics = monitor.complete(200);
      
      expect(metrics.responseTime).toBe(50);
      expect(metrics.queryTime).toBe(30);
    });

    it('should track multiple concurrent queries', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      // Start first query
      jest.advanceTimersByTime(10);
      monitor.startQuery();
      
      // Start second query while first is running
      jest.advanceTimersByTime(5);
      monitor.startQuery();
      
      // End first query
      jest.advanceTimersByTime(15);
      monitor.endQuery();
      
      // End second query
      jest.advanceTimersByTime(10);
      monitor.endQuery();
      
      jest.advanceTimersByTime(10);
      
      const metrics = monitor.complete(200);
      
      expect(metrics.responseTime).toBe(50);
      // First query: 20ms (5+15), Second query: 25ms (15+10)
      expect(metrics.queryTime).toBe(45);
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
    it('should warn for slow responses (>200ms)', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(250);
      monitor.complete(200);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE ALERT]'),
        expect.stringContaining('250ms')
      );
    });

    it('should error for very slow responses (>1000ms)', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      jest.advanceTimersByTime(1500);
      monitor.complete(200);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL PERFORMANCE]'),
        expect.stringContaining('1500ms')
      );
    });

    it('should alert on errors', () => {
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      monitor.complete(500, 'Internal Server Error');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[API ERROR]'),
        expect.stringContaining('Internal Server Error')
      );
    });
  });

  describe('structured logging', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log structured JSON in production', () => {
      process.env.NODE_ENV = 'production';
      const monitor = new PerformanceMonitor('/api/test', 'GET');
      
      const metrics = monitor.complete(200);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"type":"api_performance"')
      );
    });

    it('should log human-readable format in development', () => {
      process.env.NODE_ENV = 'development';
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
});