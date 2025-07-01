/**
 * @jest-environment node
 */
// Import centralized mock first
import { configureSupabaseMock, supabaseMockHelpers, resetSupabaseMock } from '@/__tests__/utils/supabase-mock';
import { supabase } from '@/lib/supabase';
import { 
  API_CONSTANTS,
  HTTP_STATUS 
} from '@/types/api';
import { 
  createMockNextRequest 
} from '@/__tests__/utils/api-mocks';

// Mock the crypto module to generate consistent ETags for testing
const mockDigest = jest.fn();
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: mockDigest
  }))
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    status: number;
    headers: Headers;
    body: any;
    
    constructor(body: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }
    
    static json(data: any, init?: ResponseInit) {
      const response = new MockNextResponse(data, init);
      response.json = async () => data;
      return response;
    }
    
    json() {
      return Promise.resolve(this.body);
    }
  }
}));

// Mock performance monitoring to avoid console logs in tests
jest.mock('@/lib/monitoring/performance', () => ({
  PerformanceMonitor: jest.fn().mockImplementation(() => ({
    startQuery: jest.fn(),
    endQuery: jest.fn(),
    complete: jest.fn().mockReturnValue({
      responseTime: 0,
      queryTime: undefined
    })
  })),
  ErrorRateTracker: {
    getInstance: jest.fn().mockReturnValue({
      recordRequest: jest.fn()
    })
  }
}));

// Import the route AFTER mocks are set up
import { GET } from '../route';

describe('GET /api/agencies - Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);
    
    // Reset crypto mock to return consistent ETags by default
    mockDigest.mockReturnValue('consistent-etag-for-testing');
    
    // Setup default successful response
    configureSupabaseMock(supabase, {
      defaultData: [
        {
          id: '1',
          name: 'Test Agency',
          trades: [],
          regions: []
        }
      ],
      defaultCount: 1
    });
  });

  describe('Cache Headers', () => {
    it('should include proper cache headers in successful response', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(HTTP_STATUS.OK);
      
      const headers = response.headers;
      expect(headers.get('Cache-Control')).toContain('public');
      expect(headers.get('Cache-Control')).toContain(`max-age=${API_CONSTANTS.CACHE_MAX_AGE}`);
      expect(headers.get('Cache-Control')).toContain('must-revalidate');
      expect(headers.get('ETag')).toBeDefined();
      expect(headers.get('Vary')).toBe('Accept-Encoding');
    });

    it('should include no-cache headers in error responses', async () => {
      // Configure mock to return an error
      configureSupabaseMock(supabase, {
        error: { message: 'Database error', code: 'PGRST001' }
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      
      const headers = response.headers;
      expect(headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(headers.get('Pragma')).toBe('no-cache');
      expect(headers.get('Expires')).toBe('0');
    });

    it('should generate consistent ETags for identical responses', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response1 = await GET(mockRequest);
      const response2 = await GET(mockRequest);

      const etag1 = response1.headers.get('ETag');
      const etag2 = response2.headers.get('ETag');
      
      expect(etag1).toBeDefined();
      expect(etag2).toBeDefined();
      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different responses', async () => {
      // Configure crypto to return different ETags
      mockDigest
        .mockReturnValueOnce('etag-for-agency-1')
        .mockReturnValueOnce('etag-for-agency-2');
      
      // First request
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Agency 1', trades: [], regions: [] }],
        defaultCount: 1
      });

      const mockRequest1 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response1 = await GET(mockRequest1);

      // Second request with different data
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '2', name: 'Agency 2', trades: [], regions: [] }],
        defaultCount: 1
      });

      const mockRequest2 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response2 = await GET(mockRequest2);

      const etag1 = response1.headers.get('ETag');
      const etag2 = response2.headers.get('ETag');
      
      expect(etag1).not.toBe(etag2);
    });
  });

  describe('Conditional Requests', () => {
    it('should return 304 when ETag matches', async () => {
      // First request to get ETag
      const mockRequest1 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response1 = await GET(mockRequest1);
      const etag = response1.headers.get('ETag');

      // Second request with If-None-Match header
      const mockRequest2 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        headers: {
          'if-none-match': etag!
        }
      });

      const response2 = await GET(mockRequest2);

      expect(response2.status).toBe(304);
      expect(response2.headers.get('ETag')).toBe(etag);
      expect(response2.headers.get('Cache-Control')).toContain('public');
    });

    it('should return full response when ETag does not match', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        headers: {
          'if-none-match': 'different-etag'
        }
      });

      const response = await GET(mockRequest);

      expect(response.status).toBe(HTTP_STATUS.OK);
      
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.pagination).toBeDefined();
    });
  });

  describe('Cache Configuration', () => {
    it('should use correct cache max-age from constants', () => {
      expect(API_CONSTANTS.CACHE_MAX_AGE).toBe(300); // 5 minutes
    });

    it('should set appropriate cache directives', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public'); // Publicly cacheable
      expect(cacheControl).toContain('must-revalidate'); // Must check with server
      expect(cacheControl).toContain(`max-age=${API_CONSTANTS.CACHE_MAX_AGE}`);
    });
  });
});