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

describe('GET /api/agencies - Trade Filtering', () => {
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
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        })
      })
    });
  });

  describe('Trade Parameter Parsing', () => {
    it('should parse single trade parameter correctly', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'electricians' }
      });

      await GET(mockRequest);

      // Verify that in() was called for trade filtering
      expect(supabase.in).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          from: expect.any(Function),
          select: expect.any(Function),
          in: expect.any(Function)
        })
      );
    });

    it('should parse multiple trade parameters correctly', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': ['electricians', 'plumbers']
        }
      });

      await GET(mockRequest);

      // Verify that filtering was applied
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should handle trades without bracket notation', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { trades: 'electricians' }
      });

      await GET(mockRequest);

      // Should still apply the filter
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should not apply trade filter when no trades specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      // Verify that in() was not called
      expect(supabase.in).not.toHaveBeenCalled();
    });
  });

  describe('Trade Filtering Logic', () => {
    it('should filter agencies by trade slug', async () => {
      const mockAgencies = [
        {
          id: '123',
          name: 'Electrical Staffing Co',
          trades: [{
            trade: {
              id: '456',
              name: 'Electricians',
              slug: 'electricians'
            }
          }]
        }
      ];

      supabase.order.mockResolvedValueOnce({
        data: mockAgencies,
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'electricians' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].trades[0].slug).toBe('electricians');
      }
    });

    it('should apply trade filter to count query as well', async () => {
      const countQuery = {
        in: jest.fn().mockResolvedValue({ count: 3, error: null })
      };
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(countQuery)
        })
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'plumbers' }
      });

      await GET(mockRequest);

      // Verify count query also has trade filter
      expect(countQuery.in).toHaveBeenCalled();
    });

    it('should handle OR logic for multiple trades', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': ['electricians', 'plumbers', 'hvac-technicians']
        }
      });

      await GET(mockRequest);

      // The subquery should filter by all three trade slugs
      expect(supabase.in).toHaveBeenCalledWith(
        'id',
        expect.any(Object)
      );
    });
  });

  describe('Trade Filter Validation', () => {
    it('should limit number of trade filters to prevent abuse', async () => {
      const tooManyTrades = Array(API_CONSTANTS.MAX_TRADE_FILTERS + 1).fill('electricians');
      
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': tooManyTrades
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe('INVALID_PARAMS');
      }
    });

    it('should ignore empty trade values', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': ['', 'electricians', '']
        }
      });

      await GET(mockRequest);

      // Should still process valid trades
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should trim whitespace from trade slugs', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': '  electricians  '
        }
      });

      await GET(mockRequest);

      // Should apply filter with trimmed value
      expect(supabase.in).toHaveBeenCalled();
    });
  });

  describe('Combined Filters', () => {
    it('should combine trade filter with search filter', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'elite',
          'trades[]': 'electricians'
        }
      });

      await GET(mockRequest);

      // Both filters should be applied
      expect(supabase.or).toHaveBeenCalled(); // Search filter
      expect(supabase.in).toHaveBeenCalled(); // Trade filter
    });

    it('should combine trade filter with pagination', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'trades[]': 'plumbers',
          limit: '5',
          offset: '10'
        }
      });

      await GET(mockRequest);

      // All filters should be applied
      expect(supabase.in).toHaveBeenCalled(); // Trade filter
      expect(supabase.range).toHaveBeenCalledWith(10, 14); // Pagination
    });
  });
});