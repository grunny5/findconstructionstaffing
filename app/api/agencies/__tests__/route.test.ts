/**
 * @jest-environment node
 */
// Import centralized mock first
import {
  configureSupabaseMock,
  supabaseMockHelpers,
  resetSupabaseMock,
} from '@/__tests__/utils/supabase-mock';
import { createMultiTableMock } from '@/__tests__/utils/multi-table-mock';
import { supabase } from '@/lib/supabase';
import {
  isErrorResponse,
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_CODES,
} from '@/types/api';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';

// Mock performance monitoring
jest.mock('@/lib/monitoring/performance');

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

// Helper function to create monitoring mocks
function createMonitoringMocks() {
  const mockMonitor = {
    startQuery: jest.fn(),
    endQuery: jest.fn(),
    complete: jest.fn().mockReturnValue({
      responseTime: 50,
      queryTime: 30,
    }),
  };

  const mockErrorTracker = {
    recordRequest: jest.fn(),
  };

  return { mockMonitor, mockErrorTracker };
}

describe('GET /api/agencies', () => {
  let mockMonitor: any;
  let mockErrorTracker: any;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Setup monitoring mocks
    const mocks = createMonitoringMocks();
    mockMonitor = mocks.mockMonitor;
    mockErrorTracker = mocks.mockErrorTracker;

    (PerformanceMonitor as jest.Mock).mockImplementation(() => mockMonitor);
    (ErrorRateTracker.getInstance as jest.Mock).mockReturnValue(
      mockErrorTracker
    );

    // Setup default successful response
    configureSupabaseMock(supabase, {
      defaultData: [],
      defaultCount: 0,
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      const mockError = {
        message: 'Database query failed',
        code: 'PGRST116',
      };

      // Configure mock to return an error
      configureSupabaseMock(supabase, {
        error: mockError,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
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
            { trade: { id: 't1', name: 'Electricians', slug: 'electricians' } },
          ],
          regions: [{ region: { id: 'r1', name: 'Texas', state_code: 'TX' } }],
        },
      ];

      // Configure mock with test data
      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

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
        hasMore: false,
      });
    });

    it('should handle empty results', async () => {
      // Configure mock with empty data
      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: 0,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
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
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect((supabase as any).eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should apply default pagination', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect((supabase as any).range).toHaveBeenCalledWith(
        0,
        API_CONSTANTS.DEFAULT_LIMIT - 1
      );
    });

    it('should order by name ascending', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect((supabase as any).order).toHaveBeenCalledWith('name', {
        ascending: true,
      });
    });
  });

  describe('Performance Monitoring', () => {
    // Using mockMonitor and mockErrorTracker from parent scope

    it('should initialize performance monitoring', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect(PerformanceMonitor).toHaveBeenCalledWith('/api/agencies', 'GET');
      expect(ErrorRateTracker.getInstance).toHaveBeenCalled();
    });

    it('should track query performance', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      // Should track both main query and count query
      expect(mockMonitor.startQuery).toHaveBeenCalledTimes(2);
      expect(mockMonitor.endQuery).toHaveBeenCalledTimes(2);
    });

    it('should complete monitoring with success metrics', async () => {
      const mockAgencies = [
        {
          id: '1',
          name: 'Test Agency',
          trades: [],
          regions: [],
        },
      ];

      // Configure mock with test data
      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?search=test',
      });

      await GET(mockRequest);

      expect(mockMonitor.complete).toHaveBeenCalledWith(
        HTTP_STATUS.OK,
        undefined,
        expect.objectContaining({
          resultCount: 1,
          totalCount: 1,
          hasFilters: true,
        })
      );
      expect(mockErrorTracker.recordRequest).toHaveBeenCalledWith(
        '/api/agencies',
        false
      );
    });

    it('should track errors in monitoring', async () => {
      // Configure mock to return an error
      configureSupabaseMock(supabase, {
        error: { message: 'Database error', code: 'TEST_ERROR' },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect(mockMonitor.complete).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to fetch agencies'
      );
      expect(mockErrorTracker.recordRequest).toHaveBeenCalledWith(
        '/api/agencies',
        true
      );
    });

    it('should log performance warning when approaching target', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockMonitor.complete.mockReturnValue({
        responseTime: 85,
        queryTime: 30,
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies',
      });

      await GET(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Performance Warning] /api/agencies approaching 100ms target: 85ms'
        )
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Compliance Filtering', () => {
    it('should filter agencies by single compliance type', async () => {
      const mockAgencies = [
        {
          id: '1',
          name: 'OSHA Certified Agency',
          slug: 'osha-agency',
          is_active: true,
          trades: [],
          regions: [],
        },
      ];

      const mockComplianceData = [
        { agency_id: '1', compliance_type: 'osha_certified' },
      ];

      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      // Use helper to create multi-table mock
      createMultiTableMock(supabase, {
        agency_compliance: { data: mockComplianceData },
        agencies: { data: mockAgencies, count: 1 },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?compliance=osha_certified',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveLength(1);
      expect((supabase as any).in).toHaveBeenCalledWith('compliance_type', [
        'osha_certified',
      ]);
      expect((supabase as any).eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter agencies by multiple compliance types (AND logic)', async () => {
      const mockAgencies = [
        {
          id: '1',
          name: 'Fully Compliant Agency',
          slug: 'compliant-agency',
          is_active: true,
          trades: [],
          regions: [],
        },
      ];

      // Agency 1 has both compliance types, Agency 2 only has OSHA, Agency 3 only has drug testing
      const mockComplianceData = [
        { agency_id: '1', compliance_type: 'osha_certified' },
        { agency_id: '1', compliance_type: 'drug_testing' },
        { agency_id: '2', compliance_type: 'osha_certified' },
        { agency_id: '3', compliance_type: 'drug_testing' },
      ];

      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      // Use helper to create multi-table mock
      createMultiTableMock(supabase, {
        agency_compliance: { data: mockComplianceData },
        agencies: { data: mockAgencies, count: 1 },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?compliance[]=osha_certified&compliance[]=drug_testing',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Should only return agency 1 which has both compliance types
      expect(data.data).toHaveLength(1);
    });

    it('should combine compliance filter with trade filter', async () => {
      const mockAgencies = [
        {
          id: '1',
          name: 'Compliant Electrician Agency',
          slug: 'compliant-electrician',
          is_active: true,
          trades: [
            {
              trade: { id: 't1', name: 'Electricians', slug: 'electricians' },
            },
          ],
          regions: [],
        },
      ];

      const mockTradeData = [{ id: 't1' }];
      const mockAgencyTradeData = [{ agency_id: '1' }, { agency_id: '2' }];
      const mockComplianceData = [
        { agency_id: '1', compliance_type: 'osha_certified' },
        { agency_id: '3', compliance_type: 'osha_certified' },
      ];

      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 1,
      });

      // Use helper to create multi-table mock
      createMultiTableMock(supabase, {
        trades: { data: mockTradeData },
        agency_trades: { data: mockAgencyTradeData },
        agency_compliance: { data: mockComplianceData },
        agencies: { data: mockAgencies, count: 1 },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?trades=electricians&compliance=osha_certified',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Should only return agency 1 which has both electrician trade and OSHA compliance
      expect(data.data).toHaveLength(1);
    });

    it('should reject invalid compliance type', async () => {
      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?compliance=invalid_type',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(isErrorResponse(data)).toBe(true);
      expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
    });

    it('should return empty results when no agencies match compliance filter', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: 0,
      });

      // Use helper to create multi-table mock
      createMultiTableMock(supabase, {
        agency_compliance: { data: [] },
        agencies: { data: [], count: 0 },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?compliance=osha_certified',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should handle multiple compliance filters with no intersection', async () => {
      // Agency 1 only has OSHA, Agency 2 only has drug testing - no overlap
      const mockComplianceData = [
        { agency_id: '1', compliance_type: 'osha_certified' },
        { agency_id: '2', compliance_type: 'drug_testing' },
      ];

      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: 0,
      });

      // Use helper to create multi-table mock
      createMultiTableMock(supabase, {
        agency_compliance: { data: mockComplianceData },
        agencies: { data: [], count: 0 },
      });

      const mockRequest = createMockNextRequest({
        url: 'http://localhost:3000/api/agencies?compliance[]=osha_certified&compliance[]=drug_testing',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });
});
