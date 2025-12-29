/**
 * Tests for Admin Agencies API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

const mockAgencies = [
  {
    id: '1',
    name: 'Alpha Staffing',
    slug: 'alpha-staffing',
    is_active: true,
    is_claimed: true,
    claimed_by: 'user-1',
    created_at: '2024-01-15T00:00:00Z',
    profile_completion_percentage: 85,
  },
  {
    id: '2',
    name: 'Beta Recruiting',
    slug: 'beta-recruiting',
    is_active: false,
    is_claimed: false,
    claimed_by: null,
    created_at: '2024-02-20T00:00:00Z',
    profile_completion_percentage: 30,
  },
  {
    id: '3',
    name: 'Gamma Solutions',
    slug: 'gamma-solutions',
    is_active: true,
    is_claimed: true,
    claimed_by: 'user-2',
    created_at: '2024-03-10T00:00:00Z',
    profile_completion_percentage: 55,
  },
];

const mockProfiles = [
  { id: 'user-1', email: 'owner@alpha.com', full_name: 'John Owner' },
  { id: 'user-2', email: 'contact@gamma.com', full_name: null },
];

describe('GET /api/admin/agencies', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

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

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to access this endpoint'
      );
    });

    it('should return 401 if auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  // ========================================================================
  // ADMIN ROLE VERIFICATION TESTS
  // ========================================================================

  describe('Admin Role Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'user@example.com' },
        },
        error: null,
      });
    });

    it('should return 403 if user is not an admin', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Forbidden: Admin access required');
    });

    it('should return 403 if profile does not exist', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should return 403 if profile query fails', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  // ========================================================================
  // SUCCESS RESPONSE TESTS
  // ========================================================================

  describe('Success Responses', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });
    });

    const setupAdminMock = () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockAgencies,
            count: mockAgencies.length,
            error: null,
          }),
        };
      });
    };

    it('should return all agencies for admin user', async () => {
      setupAdminMock();

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveLength(3);
      expect(data.pagination).toMatchObject({
        total: 3,
        limit: 25,
        offset: 0,
        hasMore: false,
        page: 1,
        totalPages: 1,
      });
    });

    it('should include owner profile for claimed agencies', async () => {
      setupAdminMock();

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      const alphaAgency = data.data.find(
        (a: { name: string }) => a.name === 'Alpha Staffing'
      );
      expect(alphaAgency.owner_profile).toEqual({
        email: 'owner@alpha.com',
        full_name: 'John Owner',
      });

      const betaAgency = data.data.find(
        (a: { name: string }) => a.name === 'Beta Recruiting'
      );
      expect(betaAgency.owner_profile).toBeNull();
    });

    it('should include all required fields in response', async () => {
      setupAdminMock();

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      const agency = data.data[0];
      expect(agency).toHaveProperty('id');
      expect(agency).toHaveProperty('name');
      expect(agency).toHaveProperty('slug');
      expect(agency).toHaveProperty('is_active');
      expect(agency).toHaveProperty('is_claimed');
      expect(agency).toHaveProperty('claimed_by');
      expect(agency).toHaveProperty('created_at');
      expect(agency).toHaveProperty('profile_completion_percentage');
      expect(agency).toHaveProperty('owner_profile');
    });
  });

  // ========================================================================
  // QUERY PARAMETER TESTS
  // ========================================================================

  describe('Query Parameters', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should filter by status=active', async () => {
      const activeAgencies = mockAgencies.filter((a) => a.is_active);
      let capturedEqCall: string | null = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest
              .fn()
              .mockResolvedValue({ data: mockProfiles, error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn((field: string, value: boolean) => {
            if (field === 'is_active') capturedEqCall = `is_active:${value}`;
            return {
              ilike: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: activeAgencies,
                count: activeAgencies.length,
                error: null,
              }),
            };
          }),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: activeAgencies,
            count: activeAgencies.length,
            error: null,
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?status=active'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(capturedEqCall).toBe('is_active:true');
    });

    it('should filter by claimed=yes', async () => {
      const claimedAgencies = mockAgencies.filter((a) => a.is_claimed);
      let capturedEqCalls: string[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest
              .fn()
              .mockResolvedValue({ data: mockProfiles, error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn((field: string, value: boolean) => {
            capturedEqCalls.push(`${field}:${value}`);
            return {
              ilike: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: claimedAgencies,
                count: claimedAgencies.length,
                error: null,
              }),
            };
          }),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: claimedAgencies,
            count: claimedAgencies.length,
            error: null,
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?claimed=yes'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(capturedEqCalls).toContain('is_claimed:true');
    });

    it('should apply search filter', async () => {
      let capturedSearch: string | null = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest
              .fn()
              .mockResolvedValue({ data: mockProfiles, error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn((field: string, pattern: string) => {
            if (field === 'name') capturedSearch = pattern;
            return {
              range: jest.fn().mockResolvedValue({
                data: [mockAgencies[0]],
                count: 1,
                error: null,
              }),
            };
          }),
          range: jest.fn().mockResolvedValue({
            data: [mockAgencies[0]],
            count: 1,
            error: null,
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?search=Alpha'
      );
      const response = await GET(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(capturedSearch).toBe('%Alpha%');
    });

    it('should apply pagination with custom limit and offset', async () => {
      let capturedRange: { from: number; to: number } | null = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn((from: number, to: number) => {
            capturedRange = { from, to };
            return Promise.resolve({
              data: mockAgencies.slice(from, to + 1),
              count: 50,
              error: null,
            });
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?limit=10&offset=20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(capturedRange).toEqual({ from: 20, to: 29 });
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(20);
      expect(data.pagination.page).toBe(3);
    });

    it('should return 400 for invalid query parameters', async () => {
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
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null,
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?status=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
    });

    it('should enforce max limit of 100', async () => {
      let capturedRange: { from: number; to: number } | null = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn((from: number, to: number) => {
            capturedRange = { from, to };
            return Promise.resolve({
              data: [],
              count: 0,
              error: null,
            });
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost/api/admin/agencies?limit=200'
      );
      const response = await GET(request);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should return 500 if agencies query fails', async () => {
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
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            count: null,
            error: new Error('Database error'),
          }),
        };
      });

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch agencies');
    });

    it('should handle empty agencies array gracefully', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null,
          }),
        };
      });

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return 500 if owner profiles query fails', async () => {
      let profileQueryCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          profileQueryCount++;
          if (profileQueryCount === 1) {
            // First call: admin role check
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          } else {
            // Second call: owner profiles - return error
            return {
              select: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: null,
                error: {
                  message: 'Database error',
                  code: 'PGRST000',
                  details: null,
                },
              }),
            };
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockAgencies,
            count: mockAgencies.length,
            error: null,
          }),
        };
      });

      const request = new NextRequest('http://localhost/api/admin/agencies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch owner profiles');
    });
  });
});
