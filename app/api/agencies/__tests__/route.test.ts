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
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }
}));

describe('GET /api/agencies', () => {
  const { supabase } = require('@/lib/supabase');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      const mockError = {
        message: 'Database query failed',
        code: 'PGRST116'
      };

      supabase.order.mockResolvedValueOnce({
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
      supabase.order.mockResolvedValueOnce({
        data: mockAgencies,
        error: null,
        count: null
      });

      // Mock the count query chain - set up for second call
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            count: 1,
            error: null
          })
        })
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
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      supabase.select.mockResolvedValueOnce({
        count: 0,
        error: null
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
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      supabase.select.mockResolvedValueOnce({
        count: 0,
        error: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should apply default pagination', async () => {
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      supabase.select.mockResolvedValueOnce({
        count: 0,
        error: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(supabase.range).toHaveBeenCalledWith(0, API_CONSTANTS.DEFAULT_LIMIT - 1);
    });

    it('should order by name ascending', async () => {
      supabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      supabase.select.mockResolvedValueOnce({
        count: 0,
        error: null
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies'
      });

      await GET(mockRequest);

      expect(supabase.order).toHaveBeenCalledWith('name', { ascending: true });
    });
  });
});