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

describe('GET /api/agencies - State/Region Filtering', () => {
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

  describe('State Parameter Parsing', () => {
    it('should parse single state parameter correctly', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' }
      });

      await GET(mockRequest);

      // Verify that in() was called for state filtering
      expect(supabase.in).toHaveBeenCalledWith(
        'id',
        expect.any(Object)
      );
    });

    it('should parse multiple state parameters correctly', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': ['TX', 'CA', 'FL']
        }
      });

      await GET(mockRequest);

      // Verify that filtering was applied
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should handle states without bracket notation', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { states: 'CA' }
      });

      await GET(mockRequest);

      // Should still apply the filter
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should not apply state filter when no states specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      // Verify that in() was not called
      expect(supabase.in).not.toHaveBeenCalled();
    });
  });

  describe('State Code Validation', () => {
    it('should validate state codes are 2 letters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': 'TEXAS' // Invalid - too long
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe('INVALID_PARAMS');
        expect(data.error.details?.issues).toBeDefined();
      }
    });

    it('should accept valid 2-letter state codes', async () => {
      const validStates = ['TX', 'CA', 'NY', 'FL'];
      
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': validStates
        }
      });

      const response = await GET(mockRequest);
      
      // Should not return validation error
      expect(response.status).not.toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should convert state codes to uppercase', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': 'tx' // lowercase
        }
      });

      await GET(mockRequest);

      // Should still apply the filter (validation passes)
      expect(supabase.in).toHaveBeenCalled();
    });

    it('should limit number of state filters', async () => {
      const tooManyStates = ['TX', 'CA', 'NY', 'FL', 'AZ', 'NV', 'OR', 'WA', 'UT', 'CO', 'NM'];
      
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': tooManyStates
        }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should return validation error
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });
  });

  describe('State Filtering Logic', () => {
    it('should filter agencies by state code', async () => {
      const mockAgencies = [
        {
          id: '123',
          name: 'Texas Construction Staffing',
          regions: [{
            region: {
              id: '456',
              name: 'Dallas-Fort Worth',
              state_code: 'TX'
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
        searchParams: { 'states[]': 'TX' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].regions[0].code).toBe('TX');
      }
    });

    it('should apply state filter to count query as well', async () => {
      const countQuery = {
        in: jest.fn().mockResolvedValue({ count: 5, error: null })
      };
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(countQuery)
        })
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'CA' }
      });

      await GET(mockRequest);

      // Verify count query also has state filter
      expect(countQuery.in).toHaveBeenCalled();
    });

    it('should handle OR logic for multiple states', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': ['TX', 'CA', 'NY']
        }
      });

      await GET(mockRequest);

      // The subquery should filter by all three state codes
      expect(supabase.in).toHaveBeenCalledWith(
        'id',
        expect.any(Object)
      );
    });

    it('should handle agencies with multiple regions', async () => {
      const mockAgencies = [
        {
          id: '123',
          name: 'National Staffing Solutions',
          regions: [
            {
              region: {
                id: '456',
                name: 'Dallas-Fort Worth',
                state_code: 'TX'
              }
            },
            {
              region: {
                id: '789',
                name: 'Los Angeles',
                state_code: 'CA'
              }
            }
          ]
        }
      ];

      supabase.order.mockResolvedValueOnce({
        data: mockAgencies,
        error: null,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' }
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].regions).toHaveLength(2);
      }
    });
  });

  describe('Combined Filters', () => {
    it('should combine state filter with search filter', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'construction',
          'states[]': 'TX'
        }
      });

      await GET(mockRequest);

      // Both filters should be applied
      expect(supabase.or).toHaveBeenCalled(); // Search filter
      expect(supabase.in).toHaveBeenCalled(); // State filter
    });

    it('should combine state and trade filters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          'states[]': ['TX', 'CA'],
          'trades[]': 'electricians'
        }
      });

      await GET(mockRequest);

      // Both filters should be applied
      expect(supabase.in).toHaveBeenCalledTimes(2); // Once for trades, once for states
    });

    it('should combine all filters together', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 
          search: 'elite',
          'trades[]': ['electricians', 'plumbers'],
          'states[]': ['TX', 'CA'],
          limit: '5',
          offset: '10'
        }
      });

      await GET(mockRequest);

      // All filters should be applied
      expect(supabase.or).toHaveBeenCalled(); // Search
      expect(supabase.in).toHaveBeenCalledTimes(2); // Trades and states
      expect(supabase.range).toHaveBeenCalledWith(10, 14); // Pagination
    });
  });
});