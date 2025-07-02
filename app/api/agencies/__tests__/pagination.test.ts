/**
 * @jest-environment node
 */
// Import centralized mock first
import {
  configureSupabaseMock,
  supabaseMockHelpers,
  resetSupabaseMock,
} from '@/__tests__/utils/supabase-mock';
import { supabase } from '@/lib/supabase';
import { isErrorResponse, API_CONSTANTS, HTTP_STATUS } from '@/types/api';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers),
    })),
  },
}));

// Import the route AFTER mocks are set up
import { GET } from '../route';

describe('GET /api/agencies - Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Setup default successful response
    configureSupabaseMock(supabase, {
      defaultData: [],
      defaultCount: 0,
    });
  });

  describe('Pagination Parameter Defaults', () => {
    it('should apply default limit when not specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      // Should use default limit (20)
      expect(supabase.range).toHaveBeenCalledWith(
        0,
        API_CONSTANTS.DEFAULT_LIMIT - 1
      );
    });

    it('should apply default offset when not specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      // Should use default offset (0)
      expect(supabase.range).toHaveBeenCalledWith(0, expect.any(Number));
    });

    it('should use custom limit when provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '10' },
      });

      await GET(mockRequest);

      // Should use custom limit
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('should use custom offset when provided', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          offset: '40',
          limit: '20',
        },
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
        searchParams: { limit: '150' }, // Over max of 100
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
        searchParams: { limit: '0' },
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
        searchParams: { offset: '-10' },
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
        searchParams: { limit: 'abc' },
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
        searchParams: { offset: 'xyz' },
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

      // Configure mock with specific data and count
      configureSupabaseMock(supabase, {
        defaultData: Array(limit).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: totalAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: String(limit), offset: String(offset) },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination).toEqual({
          total: totalAgencies,
          limit,
          offset,
          hasMore: true,
        });
      }
    });

    it('should calculate hasMore correctly for last page', async () => {
      const totalAgencies = 45;
      const limit = 20;
      const offset = 40; // Last page with only 5 items

      // Configure mock with specific data and count
      configureSupabaseMock(supabase, {
        defaultData: Array(5).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: totalAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: String(limit), offset: String(offset) },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination).toEqual({
          total: totalAgencies,
          limit,
          offset,
          hasMore: false,
        });
      }
    });

    it('should handle empty results correctly', async () => {
      const totalAgencies = 0;
      const limit = 20;
      const offset = 0;

      // Configure mock with empty data
      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: totalAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: String(limit), offset: String(offset) },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toEqual([]);
        expect(data.pagination).toEqual({
          total: 0,
          limit,
          offset,
          hasMore: false,
        });
      }
    });
  });

  describe('Pagination with Filters', () => {
    it('should apply pagination after search filter', async () => {
      configureSupabaseMock(supabase, {
        defaultData: Array(5).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: 5,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'test',
          limit: '5',
          offset: '0',
        },
      });

      await GET(mockRequest);

      // Should apply search first, then pagination
      expect(supabase.or).toHaveBeenCalled();
      expect(supabase.range).toHaveBeenCalledWith(0, 4);
    });

    it('should apply pagination after all filters', async () => {
      // For this complex test, we'll just verify the response is correct
      // The detailed mock tracking is complex due to multiple table queries
      configureSupabaseMock(supabase, {
        defaultData: Array(5).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: 5,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'test',
          trade: 'electrician',
          state: 'TX',
          limit: '5',
          offset: '10',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify the response structure is correct
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(5);
        expect(data.pagination.limit).toBe(5);
        expect(data.pagination.offset).toBe(10);
        expect(data.pagination.total).toBe(5);
      }

      // Verify key methods were called
      expect(supabase.from).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.range).toHaveBeenCalledWith(10, 14); // Pagination
    });

    it('should count total with filters applied', async () => {
      const totalFilteredAgencies = 15;

      configureSupabaseMock(supabase, {
        defaultData: Array(10).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: totalFilteredAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          trade: 'electrician',
          limit: '10',
          offset: '0',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        // Total should reflect filtered count, not total agencies
        expect(data.pagination.total).toBe(totalFilteredAgencies);
      }
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle offset beyond total count', async () => {
      const totalAgencies = 10;

      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: totalAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          limit: '20',
          offset: '100', // Way beyond total
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toEqual([]);
        expect(data.pagination).toEqual({
          total: totalAgencies,
          limit: 20,
          offset: 100,
          hasMore: false,
        });
      }
    });

    it('should handle exactly at limit boundary', async () => {
      const totalAgencies = 100;

      configureSupabaseMock(supabase, {
        defaultData: Array(20).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: totalAgencies,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          limit: '20',
          offset: '80', // Exactly 20 items left
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination.hasMore).toBe(false);
      }
    });
  });
});
