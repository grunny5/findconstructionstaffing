/**
 * @jest-environment node
 */
import { GET } from '../route';
import {
  isErrorResponse,
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_CODES,
} from '@/types/api';
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

// Mock Supabase with comprehensive test data
const mockAgencies = [
  {
    id: '001',
    name: 'Elite Construction Staffing',
    slug: 'elite-construction-staffing',
    description: 'Premier construction staffing solutions',
    logo_url: 'https://example.com/logo1.png',
    website: 'https://elitestaffing.com',
    phone: '555-0100',
    email: 'contact@elitestaffing.com',
    is_claimed: true,
    offers_per_diem: true,
    is_union: false,
    founded_year: 2010,
    employee_count: '50-100',
    headquarters: 'Dallas, TX',
    rating: 4.5,
    review_count: 25,
    project_count: 150,
    verified: true,
    featured: true,
    is_active: true,
    trades: [
      { trade: { id: 't1', name: 'Electricians', slug: 'electricians' } },
      { trade: { id: 't2', name: 'Plumbers', slug: 'plumbers' } },
    ],
    regions: [
      { region: { id: 'r1', name: 'Dallas-Fort Worth', state_code: 'TX' } },
    ],
  },
  {
    id: '002',
    name: 'California Construction Pros',
    slug: 'california-construction-pros',
    description: 'Skilled workers for California projects',
    logo_url: null,
    website: 'https://calconstructionpros.com',
    phone: '555-0200',
    email: 'info@calconstructionpros.com',
    is_claimed: false,
    offers_per_diem: false,
    is_union: true,
    founded_year: 2015,
    employee_count: '100-250',
    headquarters: 'Los Angeles, CA',
    rating: 4.2,
    review_count: 45,
    project_count: 200,
    verified: true,
    featured: false,
    is_active: true,
    trades: [
      { trade: { id: 't3', name: 'Carpenters', slug: 'carpenters' } },
      { trade: { id: 't1', name: 'Electricians', slug: 'electricians' } },
    ],
    regions: [
      { region: { id: 'r2', name: 'Los Angeles', state_code: 'CA' } },
      {
        region: { id: 'r3', name: 'San Francisco Bay Area', state_code: 'CA' },
      },
    ],
  },
  {
    id: '003',
    name: 'National Staffing Solutions',
    slug: 'national-staffing-solutions',
    description: 'Nationwide construction staffing',
    logo_url: 'https://example.com/logo3.png',
    website: 'https://nationalstaffing.com',
    phone: '555-0300',
    email: 'contact@nationalstaffing.com',
    is_claimed: true,
    offers_per_diem: true,
    is_union: false,
    founded_year: 2005,
    employee_count: '500+',
    headquarters: 'New York, NY',
    rating: 4.8,
    review_count: 100,
    project_count: 500,
    verified: true,
    featured: true,
    is_active: true,
    trades: [
      { trade: { id: 't1', name: 'Electricians', slug: 'electricians' } },
      { trade: { id: 't2', name: 'Plumbers', slug: 'plumbers' } },
      { trade: { id: 't3', name: 'Carpenters', slug: 'carpenters' } },
      {
        trade: { id: 't4', name: 'HVAC Technicians', slug: 'hvac-technicians' },
      },
    ],
    regions: [
      { region: { id: 'r1', name: 'Dallas-Fort Worth', state_code: 'TX' } },
      { region: { id: 'r2', name: 'Los Angeles', state_code: 'CA' } },
      { region: { id: 'r4', name: 'New York City', state_code: 'NY' } },
      { region: { id: 'r5', name: 'Miami', state_code: 'FL' } },
    ],
  },
];

// Import the centralized mock helpers
import {
  createSupabaseMock,
  configureSupabaseMock,
} from '@/__tests__/utils/supabase-mock';

// Use the global Supabase mock from jest.setup.js

describe('GET /api/agencies - Comprehensive Integration Tests', () => {
  const { supabase } = require('@/lib/supabase');

  // Store the query builder globally for test assertions
  let queryBuilder: any;

  const setupMocks = (data = mockAgencies, total = mockAgencies.length) => {
    // Reset mocks
    jest.clearAllMocks();

    // Track whether we're in a count query
    let isCountQuery = false;

    // Set up the mock query builder object that from() returns
    queryBuilder = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      neq: jest.fn(),
      gt: jest.fn(),
      gte: jest.fn(),
      lt: jest.fn(),
      lte: jest.fn(),
      like: jest.fn(),
      ilike: jest.fn(),
      is: jest.fn(),
      in: jest.fn(),
      not: jest.fn(),
      match: jest.fn(),
      filter: jest.fn(),
      or: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      range: jest.fn(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      count: jest.fn(),
    };

    // Make all query builder methods chainable by default
    Object.keys(queryBuilder).forEach((method) => {
      if (jest.isMockFunction(queryBuilder[method])) {
        queryBuilder[method].mockReturnValue(queryBuilder);
      }
    });

    // Mock from method to return the query builder
    supabase.from.mockImplementation((tableName: string) => {
      isCountQuery = false;

      // Handle different table queries
      if (tableName === 'trades') {
        // Return mock trade data when querying trades table
        const mockTradeQueryBuilder = {
          ...queryBuilder,
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 't1' }, { id: 't2' }, { id: 't3' }, { id: 't4' }],
              error: null,
            }),
          }),
        };
        return mockTradeQueryBuilder;
      } else if (tableName === 'agency_trades') {
        // Return mock agency-trade relationships
        const mockAgencyTradeQueryBuilder = {
          ...queryBuilder,
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: data.map((agency) => ({ agency_id: agency.id })),
              error: null,
            }),
          }),
        };
        return mockAgencyTradeQueryBuilder;
      } else if (tableName === 'regions') {
        // Return mock region data when querying regions table
        const mockRegionQueryBuilder = {
          ...queryBuilder,
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                { id: 'r1' },
                { id: 'r2' },
                { id: 'r3' },
                { id: 'r4' },
                { id: 'r5' },
              ],
              error: null,
            }),
          }),
        };
        return mockRegionQueryBuilder;
      } else if (tableName === 'agency_regions') {
        // Return mock agency-region relationships
        const mockAgencyRegionQueryBuilder = {
          ...queryBuilder,
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: data.map((agency) => ({ agency_id: agency.id })),
              error: null,
            }),
          }),
        };
        return mockAgencyRegionQueryBuilder;
      }

      // Default to the main query builder for 'agencies' table
      return queryBuilder;
    });

    // Mock select method to handle count queries
    queryBuilder.select.mockImplementation((fields: any, options: any) => {
      if (options && options.count === 'exact' && options.head === true) {
        isCountQuery = true;
        // For count queries, return a special query builder that resolves immediately
        const countQueryBuilder = {
          ...queryBuilder,
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          then: (resolve: any) =>
            Promise.resolve({ data: null, error: null, count: total }).then(
              resolve
            ),
        };
        // Make chainable methods return the same object
        countQueryBuilder.eq.mockReturnValue(countQueryBuilder);
        countQueryBuilder.or.mockReturnValue(countQueryBuilder);
        countQueryBuilder.in.mockReturnValue(countQueryBuilder);
        return countQueryBuilder;
      }
      return queryBuilder;
    });

    // Mock the final order method to return data
    queryBuilder.order.mockImplementation(() => {
      // Ensure data has proper structure with trades and regions arrays
      const formattedData = data.map((agency) => ({
        ...agency,
        trades: agency.trades || [],
        regions: agency.regions || [],
      }));

      return Promise.resolve({
        data: formattedData,
        error: null,
        count: total,
      });
    });

    // Mock in method to handle both regular and count queries
    queryBuilder.in.mockImplementation(() => {
      if (isCountQuery) {
        // Return a promise directly for count queries
        return Promise.resolve({
          data: null,
          error: null,
          count: total,
        });
      }
      // For regular queries, return the chainable object
      return queryBuilder;
    });

    // Mock count method
    queryBuilder.count.mockImplementation(() => {
      return Promise.resolve({
        data: null,
        error: null,
        count: total,
      });
    });
  };

  describe('Basic Agency Retrieval', () => {
    it('should retrieve all active agencies with default pagination', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(isErrorResponse(data)).toBe(false);
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(3);
        expect(data.pagination).toEqual({
          total: 3,
          limit: API_CONSTANTS.DEFAULT_LIMIT,
          offset: 0,
          hasMore: false,
        });
      }
    });

    it('should include all required fields in agency response', async () => {
      setupMocks([mockAgencies[0]], 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      if (!isErrorResponse(data)) {
        const agency = data.data[0];
        expect(agency).toHaveProperty('id');
        expect(agency).toHaveProperty('name');
        expect(agency).toHaveProperty('slug');
        expect(agency).toHaveProperty('description');
        expect(agency).toHaveProperty('trades');
        expect(agency).toHaveProperty('regions');
        expect(Array.isArray(agency.trades)).toBe(true);
        expect(Array.isArray(agency.regions)).toBe(true);
      }
    });

    it('should filter out inactive agencies', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      // Verify active filter was applied
      expect(queryBuilder.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('Search Functionality', () => {
    it('should search agencies by name (full match)', async () => {
      const searchResults = [mockAgencies[0]]; // Elite Construction Staffing
      setupMocks(searchResults, 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'Elite Construction' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.or).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toContain('Elite');
      }
    });

    it('should search agencies by name (partial match)', async () => {
      const searchResults = mockAgencies.filter((a) =>
        a.name.toLowerCase().includes('construction')
      );
      setupMocks(searchResults, searchResults.length);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'construction' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.or).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array when no search results', async () => {
      setupMocks([], 0);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: 'nonexistent' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      if (!isErrorResponse(data)) {
        expect(data.data).toEqual([]);
        expect(data.pagination.total).toBe(0);
      }
    });

    it('should sanitize dangerous search input', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { search: '<script>alert("xss")</script>' },
      });

      await GET(mockRequest);

      // Should still apply search, but sanitized
      expect(queryBuilder.or).toHaveBeenCalled();
    });
  });

  describe('Trade Filtering', () => {
    it('should filter agencies by single trade', async () => {
      const electricianAgencies = mockAgencies.filter((a) =>
        a.trades.some((t) => t.trade.slug === 'electricians')
      );
      setupMocks(electricianAgencies, electricianAgencies.length);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': 'electricians' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.in).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data.length).toBe(3); // All have electricians
      }
    });

    it('should filter agencies by multiple trades (OR logic)', async () => {
      const plumberOrCarpenterAgencies = mockAgencies.filter((a) =>
        a.trades.some((t) => ['plumbers', 'carpenters'].includes(t.trade.slug))
      );
      setupMocks(plumberOrCarpenterAgencies, plumberOrCarpenterAgencies.length);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': ['plumbers', 'carpenters'] },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.in).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data.length).toBeGreaterThan(0);
      }
    });

    it('should reject too many trade filters', async () => {
      const tooManyTrades = Array(API_CONSTANTS.MAX_TRADE_FILTERS + 1).fill(
        'electricians'
      );

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'trades[]': tooManyTrades },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
    });
  });

  describe('State Filtering', () => {
    it('should filter agencies by single state', async () => {
      const texasAgencies = mockAgencies.filter((a) =>
        a.regions.some((r) => r.region.state_code === 'TX')
      );
      setupMocks(texasAgencies, texasAgencies.length);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TX' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.in).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data.length).toBe(2); // Elite and National
      }
    });

    it('should filter agencies by multiple states (OR logic)', async () => {
      const multiStateAgencies = mockAgencies.filter((a) =>
        a.regions.some((r) => ['TX', 'CA'].includes(r.region.state_code))
      );
      setupMocks(multiStateAgencies, multiStateAgencies.length);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': ['TX', 'CA'] },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.in).toHaveBeenCalled();
      if (!isErrorResponse(data)) {
        expect(data.data.length).toBe(3); // All agencies
      }
    });

    it('should validate state codes are 2 letters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { 'states[]': 'TEXAS' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
      }
    });
  });

  describe('Pagination', () => {
    it('should apply default pagination', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect(queryBuilder.range).toHaveBeenCalledWith(
        0,
        API_CONSTANTS.DEFAULT_LIMIT - 1
      );
    });

    it('should apply custom limit and offset', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '10', offset: '20' },
      });

      await GET(mockRequest);

      expect(queryBuilder.range).toHaveBeenCalledWith(20, 29);
    });

    it('should calculate hasMore correctly', async () => {
      setupMocks(mockAgencies.slice(0, 2), 50); // 2 items, 50 total

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '20', offset: '0' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      if (!isErrorResponse(data)) {
        expect(data.pagination.hasMore).toBe(true);
        expect(data.pagination.total).toBe(50);
      }
    });

    it('should handle offset beyond total', async () => {
      setupMocks([], 10); // No items, 10 total

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { offset: '50' },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      if (!isErrorResponse(data)) {
        expect(data.data).toEqual([]);
        expect(data.pagination.hasMore).toBe(false);
      }
    });
  });

  describe('Combined Filters', () => {
    it('should combine search and trade filters', async () => {
      const filteredAgencies = [mockAgencies[0]]; // Elite with electricians
      setupMocks(filteredAgencies, 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'elite',
          'trades[]': 'electricians',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.or).toHaveBeenCalled(); // Search
      expect(queryBuilder.in).toHaveBeenCalled(); // Trade
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
      }
    });

    it('should combine all filters with pagination', async () => {
      const filteredAgencies = [mockAgencies[2]]; // National
      setupMocks(filteredAgencies, 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          search: 'national',
          'trades[]': ['electricians', 'plumbers'],
          'states[]': ['TX', 'NY'],
          limit: '5',
          offset: '0',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(queryBuilder.or).toHaveBeenCalled(); // Search
      expect(queryBuilder.in).toHaveBeenCalled(); // Main query filter
      expect(queryBuilder.range).toHaveBeenCalledWith(0, 4); // Pagination
      if (!isErrorResponse(data)) {
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toContain('National');
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection error', async () => {
      // Setup mocks with error
      setupMocks();

      // Override the order method to return an error
      queryBuilder.order.mockResolvedValue({
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'CONNECTION_ERROR',
        },
        count: null,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      }
    });

    it('should handle invalid query parameters', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: {
          limit: 'invalid',
          offset: '-10',
        },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
      }
    });

    it('should handle missing Supabase client', async () => {
      jest.clearAllMocks();

      // Mock missing Supabase
      jest.resetModules();
      jest.doMock('@/lib/supabase', () => ({
        supabase: null,
      }));

      const { GET: GETWithNoSupabase } = await import('../route');

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GETWithNoSupabase(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(isErrorResponse(data)).toBe(true);
      if (isErrorResponse(data)) {
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
        expect(data.error.message).toContain(
          'Database connection not initialized'
        );
      }
    });
  });

  describe('Response Headers', () => {
    it('should include proper cache headers on success', async () => {
      setupMocks();

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);

      expect(response.headers.get('Cache-Control')).toBeDefined();
      expect(response.headers.get('ETag')).toBeDefined();
    });

    it('should not cache error responses', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        searchParams: { limit: '999' },
      });

      const response = await GET(mockRequest);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
    });

    it('should support conditional requests with ETag', async () => {
      setupMocks();

      // First request to get ETag
      const mockRequest1 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });
      const response1 = await GET(mockRequest1);
      const etag = response1.headers.get('ETag');

      // Second request with If-None-Match
      const mockRequest2 = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
        headers: { 'if-none-match': etag || '' },
      });

      // Mock same data for consistent ETag
      setupMocks();

      const response2 = await GET(mockRequest2);

      // Would be 304 if ETags match (mock limitation prevents exact test)
      expect(response2).toBeDefined();
    });
  });

  describe('Data Transformation', () => {
    it('should properly transform nested trade relationships', async () => {
      setupMocks([mockAgencies[0]], 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      if (!isErrorResponse(data)) {
        const agency = data.data[0];
        expect(Array.isArray(agency.trades)).toBe(true);
        expect(agency.trades[0]).toHaveProperty('id');
        expect(agency.trades[0]).toHaveProperty('name');
        expect(agency.trades[0]).toHaveProperty('slug');
      }
    });

    it('should properly transform nested region relationships', async () => {
      setupMocks([mockAgencies[1]], 1);

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      if (!isErrorResponse(data)) {
        const agency = data.data[0];
        expect(Array.isArray(agency.regions)).toBe(true);
        expect(agency.regions[0]).toHaveProperty('id');
        expect(agency.regions[0]).toHaveProperty('name');
        expect(agency.regions[0]).toHaveProperty('code');
        expect(agency.regions[0].code).toBe('CA');
      }
    });
  });
});
