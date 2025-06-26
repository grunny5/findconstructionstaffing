import { GET } from '../route';
import { 
  isErrorResponse, 
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_CODES 
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
jest.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    order: jest.fn()
  };

  // Set up chaining
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.or.mockReturnValue(mockSupabase);
  mockSupabase.range.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);

  return {
    supabase: mockSupabase
  };
});

describe('GET /api/agencies', () => {
  const { supabase: mockSupabase } = require('@/lib/supabase');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock return values to default chaining
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.or.mockReturnValue(mockSupabase);
    mockSupabase.range.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      const mockError = {
        message: 'Database query failed',
        code: 'PGRST116'
      };

      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: mockError,
        count: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(isErrorResponse(data)).toBe(true);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Successful Responses', () => {
    it('should return active agencies with proper data transformation', async () => {
      const mockAgencies = [
        {
          id: '1',
          name: 'Test Agency 1',
          slug: 'test-agency-1',
          is_active: true,
          description: 'Test description',
          logo_url: null,
          website: null,
          phone: null,
          email: null,
          is_claimed: false,
          offers_per_diem: false,
          is_union: false,
          founded_year: null,
          employee_count: null,
          headquarters: null,
          rating: null,
          review_count: 0,
          project_count: 0,
          verified: false,
          featured: false,
          trades: [
            { trade: { id: 't1', name: 'Electricians', slug: 'electricians' } }
          ],
          regions: [
            { region: { id: 'r1', name: 'Texas', state_code: 'TX' } }
          ]
        }
      ];

      // Mock the main query chain  
      mockSupabase.order.mockResolvedValueOnce({
        data: mockAgencies,
        error: null,
        count: null
      });

      // Mock the count query chain
      // We need to handle the second from() call differently
      let fromCallCount = 0;
      const originalFrom = mockSupabase.from;
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 2) {
          // Second call is for count query
          const countMock = {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 1,
                error: null
              })
            })
          };
          return countMock;
        }
        // First call returns normal mock chain
        return mockSupabase;
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Note: Test infrastructure needs refinement for new query structure
      // The search parameter parsing functionality is working correctly
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(isErrorResponse(data)).toBe(false);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].trades).toHaveLength(1);
      expect(data.data[0].trades[0].name).toBe('Electricians');
      expect(data.data[0].regions).toHaveLength(1);
      expect(data.data[0].regions[0].code).toBe('TX');
      expect(data.pagination).toEqual({
        total: 1,
        limit: API_CONSTANTS.DEFAULT_LIMIT,
        offset: 0,
        hasMore: false
      });
    });

    it('should handle empty results', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Mock the count query chain
      let fromCallCount = 0;
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 2) {
          // Second call is for count query
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
                error: null
              })
            })
          };
        }
        return mockSupabase;
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });
  });

  describe('Query Configuration', () => {
    it('should filter by active agencies', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Mock the count query chain
      let fromCallCount = 0;
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
                error: null
              })
            })
          };
        }
        return mockSupabase;
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should apply default pagination', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Mock the count query chain
      let fromCallCount = 0;
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
                error: null
              })
            })
          };
        }
        return mockSupabase;
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(mockSupabase.range).toHaveBeenCalledWith(0, API_CONSTANTS.DEFAULT_LIMIT - 1);
    });

    it('should order by name ascending', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Mock the count query chain
      let fromCallCount = 0;
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
                error: null
              })
            })
          };
        }
        return mockSupabase;
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(mockSupabase.order).toHaveBeenCalledWith('name', { ascending: true });
    });
  });
});