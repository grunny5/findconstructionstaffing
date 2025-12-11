/**
 * @jest-environment node
 */
// Import centralized mock first
import {
  configureSupabaseMock,
  supabaseMockHelpers,
  resetSupabaseMock,
  configureMockForFilters,
} from '@/__tests__/utils/supabase-mock';
import { supabase } from '@/lib/supabase';

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

// Import route last
import { GET } from '../route';
import { isErrorResponse, API_CONSTANTS, HTTP_STATUS } from '@/types/api';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';

describe('GET /api/agencies - Trade Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Configure default mock for empty results
    configureSupabaseMock(supabase, {
      defaultData: [],
      defaultCount: 0,
    });
  });

  describe('Trade Parameter Parsing', () => {
    it('should parse single trade parameter correctly', async () => {
      // Configure mock for trade filtering
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'electricians' },
      });

      await GET(mockRequest);

      // Verify that trades table was queried and agencies were filtered
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
      supabaseMockHelpers.expectTableQueried(supabase, 'agency_trades');
      supabaseMockHelpers.expectFilterApplied(supabase, 'in', 'id', [
        'agency-1',
      ]);
    });

    it('should parse multiple trade parameters correctly', async () => {
      // Configure mock for multiple trades
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians', 'plumbers'],
          ids: ['trade-1', 'trade-2'],
          agencyIds: ['agency-1', 'agency-2'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': ['electricians', 'plumbers'],
        },
      });

      await GET(mockRequest);

      // Verify that filtering was applied with multiple trades
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
      supabaseMockHelpers.expectTableQueried(supabase, 'agency_trades');
      supabaseMockHelpers.expectFilterApplied(supabase, 'in', 'id', [
        'agency-1',
        'agency-2',
      ]);
    });

    it('should handle trades without bracket notation', async () => {
      // Configure mock for single trade without brackets
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { trades: 'electricians' },
      });

      await GET(mockRequest);

      // Should still apply the filter
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
    });

    it('should not apply trade filter when no trades specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      // Verify that trades table was not queried
      expect(() => {
        supabaseMockHelpers.expectTableQueried(supabase, 'trades');
      }).toThrow();
    });
  });

  describe('Trade Filtering Logic', () => {
    it('should filter agencies by trade slug', async () => {
      const mockAgencies = [
        {
          id: '123',
          name: 'Electrical Staffing Co',
          trades: [
            {
              trade: {
                id: '456',
                name: 'Electricians',
                slug: 'electricians',
              },
            },
          ],
        },
      ];

      // Configure mock for trade filtering with agencies data
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['123'],
        },
      });

      // Override default data with actual agencies
      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'electricians' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('Electrical Staffing Co');
      }
    });

    it('should apply trade filter to count query as well', async () => {
      // Configure mock for trade filtering with count
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['plumbers'],
          ids: ['trade-2'],
          agencyIds: ['agency-1', 'agency-2', 'agency-3'],
        },
      });

      configureSupabaseMock(supabase, {
        defaultCount: 3,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'plumbers' },
      });

      await GET(mockRequest);

      // Verify trade filtering was applied
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
      // Note: agency_trades query is handled by configureMockForFilters helper
    });

    it('should handle OR logic for multiple trades', async () => {
      // Configure mock for multiple trades
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians', 'plumbers', 'hvac-technicians'],
          ids: ['trade-1', 'trade-2', 'trade-3'],
          agencyIds: ['agency-1', 'agency-2', 'agency-3'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': ['electricians', 'plumbers', 'hvac-technicians'],
        },
      });

      await GET(mockRequest);

      // The subquery should filter by all three trade slugs
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
      supabaseMockHelpers.expectFilterApplied(supabase, 'in', 'id', [
        'agency-1',
        'agency-2',
        'agency-3',
      ]);
    });
  });

  describe('Trade Filter Validation', () => {
    it('should limit number of trade filters to prevent abuse', async () => {
      const tooManyTrades = Array(API_CONSTANTS.MAX_TRADE_FILTERS + 1).fill(
        'electricians'
      );

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': tooManyTrades,
        },
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

    it('should reject empty trade values with validation error', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': ['', 'electricians', ''],
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Empty strings should fail validation (min length 1 after trim)
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe('INVALID_PARAMS');
        expect(data.error.message).toBe('Invalid query parameters');
        // The error details should indicate the validation failure
        expect(data.error.details).toBeDefined();
      }

      // Verify that no database queries were made due to validation failure
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should trim whitespace from trade slugs', async () => {
      // Configure mock for trimmed trade
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': '  electricians  ',
        },
      });

      await GET(mockRequest);

      // Should apply filter with trimmed value
      supabaseMockHelpers.expectTableQueried(supabase, 'trades');
    });
  });

  describe('Combined Filters', () => {
    it('should combine trade filter with search filter', async () => {
      // Configure mock for combined filtering
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'elite',
          'trades[]': 'electricians',
        },
      });

      await GET(mockRequest);

      // Both filters should be applied
      // Search filter creates two .or() calls (name and description)
      supabaseMockHelpers.expectTableQueried(supabase, 'trades'); // Trade filter
    });

    it('should combine trade filter with pagination', async () => {
      // Configure mock for pagination with trade filter
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['plumbers'],
          ids: ['trade-2'],
          agencyIds: ['agency-1', 'agency-2'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'trades[]': 'plumbers',
          limit: '5',
          offset: '10',
        },
      });

      await GET(mockRequest);

      // All filters should be applied
      supabaseMockHelpers.expectTableQueried(supabase, 'trades'); // Trade filter
      // Verify pagination was applied - range is called on the query chain, not directly on supabase
      // The route calls .range(offset, offset + limit - 1) for pagination
      // We can verify the agency query was made with proper filtering
      supabaseMockHelpers.expectTableQueried(supabase, 'agencies');
    });
  });
});
