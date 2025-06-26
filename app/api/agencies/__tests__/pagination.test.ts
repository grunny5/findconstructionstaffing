import { GET } from '../route';
import { 
  isErrorResponse, 
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
      headers: new Headers(init?.headers)
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
    order: jest.fn()
  }
}));

describe('GET /api/agencies - Pagination', () => {
  const { supabase } = require('@/lib/supabase');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful responses
    supabase.order.mockResolvedValue({
      data: [],
      error: null,
      count: null
    });
    
    // Mock for count query
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: 0,
          error: null
        })
      })
    });
  });

  describe('Pagination Parameter Defaults', () => {
    it('should apply default limit when not specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      // Should use default limit (20)
      expect(supabase.range).toHaveBeenCalledWith(0, API_CONSTANTS.DEFAULT_LIMIT - 1);
    });

    it('should apply default offset when not specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      // Should start from offset 0
      expect(supabase.range).toHaveBeenCalledWith(0, expect.any(Number));
    });

    it('should use custom limit when provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '50' }
      });

      await GET(mockRequest);

      // Should use custom limit
      expect(supabase.range).toHaveBeenCalledWith(0, 49);
    });

    it('should use custom offset when provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          offset: '40',
          limit: '20'
        }
      });

      await GET(mockRequest);

      // Should use custom offset
      expect(supabase.range).toHaveBeenCalledWith(40, 59);
    });
  });

  describe('Pagination Parameter Validation', () => {
    it('should enforce maximum limit', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '150' } // Over max of 100
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });

    it('should enforce minimum limit of 1', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '0' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });

    it('should enforce non-negative offset', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { offset: '-10' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });

    it('should handle non-numeric limit gracefully', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: 'abc' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });

    it('should handle non-numeric offset gracefully', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { offset: 'xyz' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });
  });

  describe('Pagination Metadata', () => {
    it('should include correct pagination metadata in response', async () => {
      const totalAgencies = 50;
      const limit = 20;
      const offset = 0;

      // Mock count query to return total
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: totalAgencies,
            error: null
          })
        })
      });

      // Mock data query
      supabase.order.mockResolvedValueOnce({
        data: Array(limit).fill({ id: '123', name: 'Test Agency' }),
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: String(limit), offset: String(offset) }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination).toEqual({
          total: totalAgencies,
          limit,
          offset,
          hasMore: true
        });
      }
    });

    it('should calculate hasMore correctly for last page', async () => {
      const totalAgencies = 45;
      const limit = 20;
      const offset = 40; // Last page with only 5 items

      // Mock count query
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: totalAgencies,
            error: null
          })
        })
      });

      // Mock data query
      supabase.order.mockResolvedValueOnce({
        data: Array(5).fill({ id: '123', name: 'Test Agency' }),
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: String(limit), offset: String(offset) }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination.hasMore).toBe(false);
      }
    });

    it('should handle empty results correctly', async () => {
      // Mock count query returning 0
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        })
      });

      // Mock empty data
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination).toEqual({
          total: 0,
          limit: API_CONSTANTS.DEFAULT_LIMIT,
          offset: 0,
          hasMore: false
        });
        expect(data.data).toEqual([]);
      }
    });
  });

  describe('Pagination with Filters', () => {
    it('should apply pagination after search filter', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'construction',
          limit: '10',
          offset: '20'
        }
      });

      await GET(mockRequest);

      // Both search and pagination should be applied
      expect(supabase.or).toHaveBeenCalled(); // Search
      expect(supabase.range).toHaveBeenCalledWith(20, 29); // Pagination
    });

    it('should apply pagination after all filters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'elite',
          'trades[]': 'electricians',
          'states[]': 'TX',
          limit: '5',
          offset: '10'
        }
      });

      await GET(mockRequest);

      // All filters and pagination should be applied
      expect(supabase.or).toHaveBeenCalled(); // Search
      expect(supabase.in).toHaveBeenCalled(); // Trade/State filters
      expect(supabase.range).toHaveBeenCalledWith(10, 14); // Pagination
    });

    it('should count total with filters applied', async () => {
      const filteredTotal = 25;
      
      // Mock count query with filters
      const countQuery = {
        or: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ count: filteredTotal, error: null })
      };
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(countQuery)
        })
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'construction',
          'trades[]': 'electricians',
          limit: '10'
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Count should reflect filtered total, not all agencies
      if (!isErrorResponse(data)) {
        expect(data.pagination.total).toBe(filteredTotal);
      }
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle offset beyond total count', async () => {
      const totalAgencies = 30;
      
      // Mock count query
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: totalAgencies,
            error: null
          })
        })
      });

      // Mock empty data (offset too high)
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          offset: '100', // Beyond total
          limit: '20'
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toEqual([]);
        expect(data.pagination.hasMore).toBe(false);
        expect(data.pagination.total).toBe(totalAgencies);
      }
    });

    it('should handle exactly at limit boundary', async () => {
      const totalAgencies = 100;
      
      // Mock count query
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: totalAgencies,
            error: null
          })
        })
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          offset: '80',
          limit: '20' // Exactly reaches 100
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      if (!isErrorResponse(data)) {
        expect(data.pagination.hasMore).toBe(false);
      }
    });
  });
});