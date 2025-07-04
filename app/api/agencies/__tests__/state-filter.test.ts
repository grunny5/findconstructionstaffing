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
import { isErrorResponse, HTTP_STATUS } from '@/types/api';
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

// Helper to create a custom mock that tracks specific calls
function createFilterMockWithTracking(
  config: {
    trades?: { slugs: string[]; ids: string[]; agencyIds: string[] };
    states?: { codes: string[]; regionIds: string[]; agencyIds: string[] };
  },
  onCall?: (table: string, method: string, args: any[]) => void
) {
  return (table: any) => {
    // Use configureMockForFilters logic but with tracking
    if (
      table === 'trades' ||
      table === 'agency_trades' ||
      table === 'regions' ||
      table === 'agency_regions'
    ) {
      const filterMock: any = {
        select: jest.fn(),
        in: jest.fn(),
        eq: jest.fn(),
        or: jest.fn(),
        range: jest.fn(),
        order: jest.fn(),
      };

      let result: any = { data: null, error: null };

      // Return appropriate data based on table and configuration
      if (table === 'trades' && config.trades) {
        result.data = config.trades.ids.map((id) => ({ id }));
      } else if (table === 'agency_trades' && config.trades) {
        result.data = config.trades.agencyIds.map((agency_id) => ({
          agency_id,
        }));
      } else if (table === 'regions' && config.states) {
        result.data = config.states.regionIds.map((id) => ({ id }));
      } else if (table === 'agency_regions' && config.states) {
        result.data = config.states.agencyIds.map((agency_id) => ({
          agency_id,
        }));
      }

      const promise = Promise.resolve(result);

      // Set up method chaining with tracking
      Object.keys(filterMock).forEach((key) => {
        (promise as any)[key] = jest.fn((...args: any[]) => {
          if (onCall) {
            onCall(table, key, args);
          }
          return promise;
        });
      });

      return promise;
    }

    // For main agencies query
    const queryChain: any = {};
    const methods = ['select', 'eq', 'in', 'or', 'range', 'order'];

    methods.forEach((method) => {
      queryChain[method] = jest.fn((...args: any[]) => {
        if (jest.isMockFunction((supabase as any)[method])) {
          (supabase as any)[method](...args);
        }
        return queryChain;
      });
    });

    const result = {
      data: (supabase as any)._defaultData || [],
      error: null,
      count: (supabase as any)._defaultCount || 0,
    };

    const promise = Promise.resolve(result);

    Object.keys(queryChain).forEach((key) => {
      (promise as any)[key] = jest.fn((...args: any[]) => {
        queryChain[key](...args);
        return promise;
      });
    });

    return promise;
  };
}

describe('GET /api/agencies - State/Region Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Setup default successful response
    configureSupabaseMock(supabase, {
      defaultData: [],
      defaultCount: 0,
    });
  });

  describe('State Parameter Parsing', () => {
    it('should parse single state parameter correctly', async () => {
      // Setup mocks for state filtering
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify the response is successful
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Verify multi-table queries were made
      expect(supabase.from).toHaveBeenCalledWith('regions');
      expect(supabase.from).toHaveBeenCalledWith('agency_regions');
    });

    it('should parse multiple state parameters correctly', async () => {
      // Setup mocks for multi-state filtering
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX', 'CA', 'FL'],
          regionIds: ['region-1', 'region-2', 'region-3'],
          agencyIds: ['agency-1', 'agency-2'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': ['TX', 'CA', 'FL'],
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify successful response
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Verify regions query was made with multiple states
      expect(supabase.from).toHaveBeenCalledWith('regions');
    });

    it('should handle states without bracket notation', async () => {
      // Setup mocks for state filtering
      configureMockForFilters(supabase, {
        states: {
          codes: ['CA'],
          regionIds: ['region-ca'],
          agencyIds: ['agency-ca'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { states: 'CA' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should still work without bracket notation
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);
      expect(supabase.from).toHaveBeenCalledWith('regions');
    });

    it('should not apply state filter when no states specified', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify no state filtering queries were made
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Should not query regions or agency_regions tables
      const fromCalls = (supabase.from as any).mock.calls.map(
        (call: any) => call[0]
      );
      expect(fromCalls).not.toContain('regions');
      expect(fromCalls).not.toContain('agency_regions');
    });
  });

  describe('State Code Validation', () => {
    it('should validate state codes are 2 letters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': 'TEXAS', // Invalid - too long
        },
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
          'states[]': validStates,
        },
      });

      const response = await GET(mockRequest);

      // Should not return validation error
      expect(response.status).not.toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should convert state codes to uppercase', async () => {
      // Use centralized mock
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'], // Will be uppercase in actual query
          regionIds: ['region-tx'],
          agencyIds: ['agency-tx'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': 'tx', // lowercase
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Should convert to uppercase and work
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Verify that the filter worked (confirming uppercase conversion happened)
      // The centralized mock abstracts the state_code query, but we can verify
      // that the correct agency IDs were used in the final filter
      supabaseMockHelpers.expectFilterApplied(supabase, 'in', 'id', [
        'agency-tx',
      ]);
    });

    it('should limit number of state filters', async () => {
      const tooManyStates = [
        'TX',
        'CA',
        'NY',
        'FL',
        'AZ',
        'NV',
        'OR',
        'WA',
        'UT',
        'CO',
        'NM',
      ];

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': tooManyStates,
        },
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
          trades: [],
          regions: [],
        },
      ];

      // Configure mock for filtered data
      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      // Setup state filter mocks
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['123'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('Texas Construction Staffing');
      }
    });

    it('should apply state filter to count query as well', async () => {
      // Configure mock with specific count
      configureSupabaseMock(supabase, {
        defaultData: Array(5).fill({
          id: '123',
          name: 'Test Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: 5,
      });

      // Setup state filter mocks
      configureMockForFilters(supabase, {
        states: {
          codes: ['CA'],
          regionIds: ['region-ca'],
          agencyIds: Array(5).fill('123'),
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'CA' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify the response includes filtered count
      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.pagination.total).toBe(5);
        expect(data.data).toHaveLength(5);
      }
    });

    it('should handle OR logic for multiple states', async () => {
      // Track the regions query
      let regionsInCall: any;

      // Use helper with tracking
      (supabase.from as any).mockImplementation(
        createFilterMockWithTracking(
          {
            states: {
              codes: ['TX', 'CA', 'NY'],
              regionIds: ['region-tx', 'region-ca', 'region-ny'],
              agencyIds: ['agency-1', 'agency-2', 'agency-3'],
            },
          },
          (table, method, args) => {
            if (table === 'regions' && method === 'in') {
              regionsInCall = { column: args[0], values: args[1] };
            }
          }
        )
      );

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': ['TX', 'CA', 'NY'],
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify OR logic - all three states should be in the regions query
      expect(response.status).toBe(200);
      expect(regionsInCall).toBeDefined();
      expect(regionsInCall.column).toBe('state_code');
      expect(regionsInCall.values).toEqual(['TX', 'CA', 'NY']);
    });

    it('should handle agencies with multiple regions', async () => {
      const mockAgencies = [
        {
          id: '123',
          name: 'National Staffing Solutions',
          trades: [],
          regions: [],
        },
      ];

      // Configure mock
      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      // Setup state filter mocks
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['123'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('National Staffing Solutions');
        // Note: The actual regions data comes from the main query join,
        // not from our filter logic
      }
    });
  });

  describe('Combined Filters', () => {
    it('should combine state filter with search filter', async () => {
      // Setup state filter mocks
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'construction',
          'states[]': 'TX',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify successful response
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Verify both filters were applied
      expect((supabase as any).or).toHaveBeenCalled(); // Search filter
      expect(supabase.from).toHaveBeenCalledWith('regions'); // State filter queries
    });

    it('should combine state and trade filters', async () => {
      // Configure mock with combined filters
      configureMockForFilters(supabase, {
        states: {
          codes: ['TX', 'CA'],
          regionIds: ['region-tx', 'region-ca'],
          agencyIds: ['agency-1'],
        },
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          'states[]': ['TX', 'CA'],
          'trades[]': 'electricians',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify both filter chains were executed
      expect(response.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('trades');
      expect(supabase.from).toHaveBeenCalledWith('regions');
      expect(supabase.from).toHaveBeenCalledWith('agency_trades');
      expect(supabase.from).toHaveBeenCalledWith('agency_regions');
    });

    it('should combine all filters together', async () => {
      // Configure mock with data
      configureSupabaseMock(supabase, {
        defaultData: Array(5).fill({
          id: '123',
          name: 'Elite Agency',
          trades: [],
          regions: [],
        }),
        defaultCount: 15,
      });

      // Setup complex filter mocks using centralized helper
      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians', 'plumbers'],
          ids: ['trade-1', 'trade-2'],
          agencyIds: ['123'],
        },
        states: {
          codes: ['TX', 'CA'],
          regionIds: ['region-tx', 'region-ca'],
          agencyIds: ['123'],
        },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'elite',
          'trades[]': ['electricians', 'plumbers'],
          'states[]': ['TX', 'CA'],
          limit: '5',
          offset: '10',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verify all filters were applied
      expect(response.status).toBe(200);
      expect(isErrorResponse(data)).toBe(false);

      // Check key methods were called
      expect((supabase as any).or).toHaveBeenCalled(); // Search
      expect(supabase.from).toHaveBeenCalledWith('trades'); // Trade filter
      expect(supabase.from).toHaveBeenCalledWith('regions'); // State filter
      expect((supabase as any).range).toHaveBeenCalledWith(10, 14); // Pagination

      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(5);
        expect(data.pagination.limit).toBe(5);
        expect(data.pagination.offset).toBe(10);
      }
    });
  });
});
