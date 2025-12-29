/**
 * Tests for Admin Agencies API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { createSlug } from '@/lib/utils/formatting';

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

// ============================================================================
// POST /api/admin/agencies TESTS
// ============================================================================

describe('POST /api/admin/agencies', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  const validAgencyData = {
    name: 'New Staffing Agency',
    description: 'A great staffing agency',
    website: 'https://newstaffing.com',
    phone: '+12345678900',
    email: 'contact@newstaffing.com',
    headquarters: 'Houston, TX',
    founded_year: '2010',
    employee_count: '51-100',
    company_size: 'Medium',
    offers_per_diem: true,
    is_union: false,
  };

  const createdAgency = {
    id: 'new-agency-id',
    name: 'New Staffing Agency',
    slug: 'new-staffing-agency',
    description: 'A great staffing agency',
    website: 'https://newstaffing.com',
    phone: '+12345678900',
    email: 'contact@newstaffing.com',
    headquarters: 'Houston, TX',
    founded_year: 2010,
    employee_count: '51-100',
    company_size: 'Medium',
    offers_per_diem: true,
    is_union: false,
    is_active: true,
    is_claimed: false,
    profile_completion_percentage: 0,
    created_at: '2024-01-01T00:00:00Z',
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

  const createPostRequest = (body: unknown) => {
    return new NextRequest('http://localhost/api/admin/agencies', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
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

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
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
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Forbidden: Admin access required');
    });

    it('should return 403 if profile does not exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
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
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: createdAgency,
            error: null,
          }),
        };
      });
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/admin/agencies', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 when name is missing', async () => {
      const request = createPostRequest({ description: 'No name provided' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Validation failed');
    });

    it('should return 400 when name is too short', async () => {
      const request = createPostRequest({ name: 'A' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for invalid email format', async () => {
      const request = createPostRequest({
        name: 'Valid Name',
        email: 'not-an-email',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for invalid website URL', async () => {
      const request = createPostRequest({
        name: 'Valid Name',
        website: 'not-a-url',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for invalid phone format', async () => {
      const request = createPostRequest({
        name: 'Valid Name',
        phone: 'invalid-phone',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for invalid founded_year', async () => {
      const request = createPostRequest({
        name: 'Valid Name',
        founded_year: '1700',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for invalid employee_count enum', async () => {
      const request = createPostRequest({
        name: 'Valid Name',
        employee_count: 'invalid-range',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ========================================================================
  // SLUG GENERATION TESTS
  // ========================================================================

  describe('Slug Generation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should generate slug from agency name', async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...createdAgency, ...data },
                error: null,
              }),
            };
          }),
        };
      });

      const request = createPostRequest({
        name: 'Test Staffing Company',
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(capturedInsertData).not.toBeNull();
      expect(capturedInsertData!.slug).toBe('test-staffing-company');
    });

    it('should handle special characters in name for slug generation', async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...createdAgency, ...data },
                error: null,
              }),
            };
          }),
        };
      });

      const request = createPostRequest({
        name: "Bob's #1 Staffing & Recruiting!",
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      // Apostrophe becomes a hyphen, resulting in "bob-s-..."
      expect(capturedInsertData).not.toBeNull();
      expect(capturedInsertData!.slug).toBe('bob-s-1-staffing-recruiting');
    });
  });

  // ========================================================================
  // DUPLICATE HANDLING TESTS
  // ========================================================================

  describe('Duplicate Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should return 409 if agency name already exists', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 'existing-id',
              name: 'New Staffing Agency',
              slug: 'new-staffing-agency',
            },
            error: null,
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'An agency with this name already exists'
      );
    });

    it('should return 409 if slug already exists (different name)', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 'existing-id',
              name: 'Different Name',
              slug: 'new-staffing-agency',
            },
            error: null,
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.message).toContain('slug conflict');
    });

    it('should handle unique constraint violation during insert', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'Unique constraint violation' },
            }),
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.message).toBe(
        'An agency with this name or slug already exists'
      );
    });
  });

  // ========================================================================
  // SUCCESS TESTS
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

    it('should create agency and return 201', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: createdAgency,
              error: null,
            }),
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data).toMatchObject({
        name: 'New Staffing Agency',
        slug: 'new-staffing-agency',
        is_active: true,
        is_claimed: false,
      });
      expect(data.message).toBe('Agency created successfully');
    });

    it('should create agency with minimal data (only name)', async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...createdAgency, ...data },
                error: null,
              }),
            };
          }),
        };
      });

      const request = createPostRequest({ name: 'Minimal Agency' });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(capturedInsertData).toMatchObject({
        name: 'Minimal Agency',
        slug: 'minimal-agency',
        is_active: true,
        is_claimed: false,
        offers_per_diem: false,
        is_union: false,
        description: null,
        website: null,
        phone: null,
        email: null,
      });
    });

    it('should set defaults for is_active and is_claimed', async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...createdAgency, ...data },
                error: null,
              }),
            };
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(capturedInsertData).not.toBeNull();
      expect(capturedInsertData!.is_active).toBe(true);
      expect(capturedInsertData!.is_claimed).toBe(false);
    });

    it('should convert founded_year string to integer', async () => {
      let capturedInsertData: Record<string, unknown> | null = null;

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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...createdAgency, ...data },
                error: null,
              }),
            };
          }),
        };
      });

      const request = createPostRequest({
        name: 'Test Agency',
        founded_year: '2015',
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(capturedInsertData).not.toBeNull();
      expect(capturedInsertData!.founded_year).toBe(2015);
      expect(typeof capturedInsertData!.founded_year).toBe('number');
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

    it('should return 500 if duplicate check fails', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to check for existing agency');
    });

    it('should return 500 if insert fails with non-unique error', async () => {
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
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST000', message: 'Some database error' },
            }),
          }),
        };
      });

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to create agency');
    });

    it('should return 500 on unexpected error', async () => {
      mockedCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const request = createPostRequest(validAgencyData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
