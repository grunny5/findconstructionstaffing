import { NextRequest } from 'next/server';
import { GET } from '../route';
import { ErrorRateTracker } from '@/lib/monitoring/performance';

// Mock ErrorRateTracker
jest.mock('@/lib/monitoring/performance', () => ({
  ErrorRateTracker: {
    getInstance: jest.fn()
  }
}));

describe('GET /api/monitoring/metrics', () => {
  let mockErrorTracker: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockErrorTracker = {
      getAllErrorRates: jest.fn().mockReturnValue({
        '/api/agencies': {
          errorRate: 2.5,
          totalRequests: 1000
        },
        '/api/trades': {
          errorRate: 0,
          totalRequests: 50
        }
      })
    };

    (ErrorRateTracker.getInstance as jest.Mock).mockReturnValue(mockErrorTracker);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should allow access in development', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('should deny access in production without auth key', async () => {
      process.env.NODE_ENV = 'production';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow access in production with auth key', async () => {
      process.env.NODE_ENV = 'production';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics', {
        headers: {
          'x-monitoring-key': 'test-key'
        }
      });
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Metrics Response', () => {
    it('should return error rates from tracker', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.errorRates).toEqual({
        '/api/agencies': {
          errorRate: 2.5,
          totalRequests: 1000
        },
        '/api/trades': {
          errorRate: 0,
          totalRequests: 50
        }
      });
    });

    it('should include environment and timestamp', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.environment).toBe('development');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should include performance metrics structure', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.performance).toBeDefined();
      expect(data.performance.agencies).toMatchObject({
        p50: expect.any(Number),
        p95: expect.any(Number),
        p99: expect.any(Number),
        avgResponseTime: expect.any(Number),
        avgQueryTime: expect.any(Number),
        requestCount: 1000
      });
    });

    it('should include alerts structure', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.alerts).toBeDefined();
      expect(data.alerts.recent).toEqual([]);
      expect(data.alerts.active).toEqual([]);
    });

    it('should have no-cache headers', async () => {
      process.env.NODE_ENV = 'development';

      const mockRequest = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(mockRequest);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });
});