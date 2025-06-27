import { GET } from '../route';
import { 
  API_CONSTANTS,
  HTTP_STATUS 
} from '@/types/api';
import { 
  createMockNextRequest 
} from '@/__tests__/utils/api-mocks';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: init?.headers || new Headers()
    }))
  }
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Test Agency',
          trades: [],
          regions: []
        }
      ],
      error: null,
      count: 1
    })
  }
}));

describe('GET /api/agencies - Caching', () => {
  const { supabase } = require('@/lib/supabase');
  let fromCallCount: number;

  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    
    // Reset all mocks to return supabase for chaining
    supabase.from.mockReturnValue(supabase);
    supabase.select.mockReturnValue(supabase);
    supabase.eq.mockReturnValue(supabase);
    supabase.or.mockReturnValue(supabase);
    supabase.in.mockReturnValue(supabase);
    supabase.range.mockReturnValue(supabase);
    
    // Set up a counter to handle the count query (second from() call)
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 2) {
        // This is the count query
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
              error: null
            })
          })
        };
      }
      return supabase;
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
      // Force an error
      supabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'PGRST001' },
        count: null
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
      // First request
      supabase.order.mockResolvedValueOnce({
        data: [{ id: '1', name: 'Agency 1', trades: [], regions: [] }],
        error: null,
        count: 1
      });

      const mockRequest1 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response1 = await GET(mockRequest1);

      // Second request with different data
      supabase.order.mockResolvedValueOnce({
        data: [{ id: '2', name: 'Agency 2', trades: [], regions: [] }],
        error: null,
        count: 1
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