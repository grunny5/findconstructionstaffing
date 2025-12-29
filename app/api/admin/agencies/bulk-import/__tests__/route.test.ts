/**
 * Tests for Bulk Import Execution API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/formatting', () => ({
  createSlug: jest.fn((name: string) =>
    name.toLowerCase().replace(/\s+/g, '-')
  ),
}));

const mockedCreateClient = jest.mocked(createClient);

const mockTrades = [
  { id: 'trade-1', name: 'Electrician', slug: 'electrician' },
  { id: 'trade-2', name: 'Plumber', slug: 'plumber' },
  { id: 'trade-3', name: 'Carpenter', slug: 'carpenter' },
];

const mockRegions = [
  { id: 'region-1', code: 'TX', name: 'Texas' },
  { id: 'region-2', code: 'CA', name: 'California' },
  { id: 'region-3', code: 'NY', name: 'New York' },
];

// Helper to setup standard successful mocks
function setupSuccessfulMocks(
  mockClient: any,
  options: {
    existingAgencies?: any[];
    agencyInsertResult?: any;
    trades?: any[];
    regions?: any[];
  } = {}
) {
  const agenciesCalls: string[] = [];
  const {
    existingAgencies = [],
    agencyInsertResult = { id: 'agency-1' },
    trades = mockTrades,
    regions = mockRegions,
  } = options;

  mockClient.from.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
    }

    if (table === 'agencies') {
      const callType = agenciesCalls.length;
      agenciesCalls.push('call');

      if (callType === 0) {
        return {
          select: jest.fn().mockResolvedValue({
            data: existingAgencies,
            error: null,
          }),
        };
      } else if (callType % 2 === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      } else {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: agencyInsertResult,
            error: null,
          }),
        };
      }
    }

    if (table === 'trades') {
      return {
        select: jest.fn().mockResolvedValue({
          data: trades,
          error: null,
        }),
      };
    }

    if (table === 'regions') {
      return {
        select: jest.fn().mockResolvedValue({
          data: regions,
          error: null,
        }),
      };
    }

    if (table === 'agency_trades' || table === 'agency_regions') {
      return {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
    }

    return {};
  });
}

describe('POST /api/admin/agencies/bulk-import', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient as never);
  });

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({ rows: [] }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 403 if user is not an admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({ rows: [] }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  // ========================================================================
  // REQUEST VALIDATION TESTS
  // ========================================================================

  describe('Request Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for missing rows array', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle empty rows array', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({ rows: [] }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.summary).toEqual({
        total: 0,
        created: 0,
        skipped: 0,
        failed: 0,
      });
    });
  });

  // ========================================================================
  // SUCCESSFUL IMPORT TESTS
  // ========================================================================

  describe('Successful Import', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should successfully import a single agency', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      setupSuccessfulMocks(mockSupabaseClient);

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              {
                _rowNumber: 2,
                name: 'Test Agency',
                description: 'A test agency',
                trades: ['Electrician', 'Plumber'],
                regions: ['TX', 'CA'],
              },
            ],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.summary.created).toBe(1);
      expect(data.results[0].status).toBe('created');
      expect(data.results[0].agencyId).toBe('agency-1');
    });

    it('should create trade associations for imported agencies', async () => {
      let insertTradesCalled = false;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'agency-1' },
                error: null,
              }),
            };
          }
        }

        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades') {
          insertTradesCalled = true;
          return {
            insert: jest.fn((associations) => {
              expect(associations).toHaveLength(2);
              expect(associations[0].trade_id).toBe('trade-1');
              expect(associations[1].trade_id).toBe('trade-2');
              return { data: null, error: null };
            }),
          };
        }

        if (table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              {
                _rowNumber: 2,
                name: 'Test Agency',
                trades: ['Electrician', 'Plumber'],
              },
            ],
          }),
        }
      );
      await POST(request);

      expect(insertTradesCalled).toBe(true);
    });

    it('should create region associations for imported agencies', async () => {
      let insertRegionsCalled = false;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'agency-1' },
                error: null,
              }),
            };
          }
        }

        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === 'agency_regions') {
          insertRegionsCalled = true;
          return {
            insert: jest.fn((associations) => {
              expect(associations).toHaveLength(2);
              expect(associations[0].region_id).toBe('region-1');
              expect(associations[1].region_id).toBe('region-2');
              return { data: null, error: null };
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              {
                _rowNumber: 2,
                name: 'Test Agency',
                regions: ['TX', 'CA'],
              },
            ],
          }),
        }
      );
      await POST(request);

      expect(insertRegionsCalled).toBe(true);
    });

    it('should import multiple agencies in a single request', async () => {
      let agencyInsertCount = 0;

      // Use helper but override agency insert to track count
      const agenciesCalls: string[] = [];
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn(() => {
                agencyInsertCount++;
                return Promise.resolve({
                  data: { id: `agency-${agencyInsertCount}` },
                  error: null,
                });
              }),
            };
          }
        }

        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' || table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              { _rowNumber: 2, name: 'Agency One' },
              { _rowNumber: 3, name: 'Agency Two' },
              { _rowNumber: 4, name: 'Agency Three' },
            ],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.summary.total).toBe(3);
      expect(data.summary.created).toBe(3);
      expect(agencyInsertCount).toBe(3);
    });

    it('should set is_active=true and is_claimed=false for created agencies', async () => {
      let insertData: any = null;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            return {
              insert: jest.fn((data) => {
                insertData = data;
                return {
                  select: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'agency-1' },
                    error: null,
                  }),
                };
              }),
            };
          }
        }

        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' || table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'Test Agency' }],
          }),
        }
      );
      await POST(request);

      expect(insertData.is_active).toBe(true);
      expect(insertData.is_claimed).toBe(false);
    });
  });

  // ========================================================================
  // DUPLICATE HANDLING TESTS
  // ========================================================================

  describe('Duplicate Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should skip agencies with duplicate names', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [{ name: 'Existing Agency' }],
              error: null,
            }),
          };
        }

        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              { _rowNumber: 2, name: 'Existing Agency' },
              { _rowNumber: 3, name: 'New Agency' },
            ],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.summary.skipped).toBe(1);
      expect(data.results[0].status).toBe('skipped');
      expect(data.results[0].reason).toBe(
        'Agency with this name already exists'
      );
    });

    it('should handle case-insensitive duplicate detection', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [{ name: 'existing agency' }],
              error: null,
            }),
          };
        }

        if (table === 'trades' || table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'EXISTING AGENCY' }],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(data.results[0].status).toBe('skipped');
    });
  });

  // ========================================================================
  // SLUG GENERATION TESTS
  // ========================================================================

  describe('Slug Generation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should generate unique slugs for agencies', async () => {
      let insertedSlug: string | null = null;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            return {
              insert: jest.fn((data) => {
                insertedSlug = data.slug;
                return {
                  select: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'agency-1' },
                    error: null,
                  }),
                };
              }),
            };
          }
        }

        if (table === 'trades' || table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' || table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'Test Agency' }],
          }),
        }
      );
      await POST(request);

      expect(insertedSlug).toBe('test-agency');
    });

    it('should handle slug uniqueness by appending numbers', async () => {
      let checkCount = 0;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            // First call: fetch existing agencies
            return {
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          } else if (callType === 1 || callType === 2) {
            // Two slug uniqueness checks (test-agency, then test-agency-2)
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn(() => {
                checkCount++;
                // First check returns existing, second check returns null
                return Promise.resolve({
                  data: checkCount === 1 ? { id: 'existing' } : null,
                  error: null,
                });
              }),
            };
          } else {
            // Insert with slug test-agency-2
            return {
              insert: jest.fn((data) => {
                expect(data.slug).toBe('test-agency-2');
                return {
                  select: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'agency-1' },
                    error: null,
                  }),
                };
              }),
            };
          }
        }

        if (table === 'trades' || table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' || table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'Test Agency' }],
          }),
        }
      );
      await POST(request);

      expect(checkCount).toBe(2);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should mark rows as failed when agency insertion fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValueOnce({
              data: [],
              error: null,
            }),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }

        if (table === 'trades' || table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'Test Agency' }],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.failed).toBe(1);
      expect(data.results[0].status).toBe('failed');
    });

    it('should return 500 if fetching existing agencies fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [{ _rowNumber: 2, name: 'Test' }],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  // ========================================================================
  // MIXED RESULTS TESTS
  // ========================================================================

  describe('Mixed Results', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should handle mixed results (created, skipped, failed)', async () => {
      let insertAttempt = 0;
      const agenciesCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (table === 'agencies') {
          const callType = agenciesCalls.length;
          agenciesCalls.push('call');

          if (callType === 0) {
            // First call: fetch existing agencies
            return {
              select: jest.fn().mockResolvedValue({
                data: [{ name: 'Duplicate Agency' }],
                error: null,
              }),
            };
          } else if (callType % 2 === 1) {
            // Odd calls: check slug uniqueness
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          } else {
            // Even calls: insert agency
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn(() => {
                insertAttempt++;
                if (insertAttempt === 1) {
                  // First insert succeeds (New Agency 1)
                  return Promise.resolve({
                    data: { id: `agency-${insertAttempt}` },
                    error: null,
                  });
                } else {
                  // Second insert fails (Failed Agency)
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Insert failed' },
                  });
                }
              }),
            };
          }
        }

        if (table === 'trades' || table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' || table === 'agency_regions') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import',
        {
          method: 'POST',
          body: JSON.stringify({
            rows: [
              { _rowNumber: 2, name: 'New Agency 1' },
              { _rowNumber: 3, name: 'Duplicate Agency' },
              { _rowNumber: 4, name: 'Failed Agency' },
            ],
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.total).toBe(3);
      expect(data.summary.created).toBe(1);
      expect(data.summary.skipped).toBe(1);
      expect(data.summary.failed).toBe(1);
    });
  });
});
