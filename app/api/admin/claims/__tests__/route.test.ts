/**
 * Tests for Admin Claims API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('GET /api/admin/claims', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase client mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockReturnValue(mockSupabaseClient);
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

      const request = new NextRequest('http://localhost/api/admin/claims');
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

      const request = new NextRequest('http://localhost/api/admin/claims');
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
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
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

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
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

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
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

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should allow access if user is an admin', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      const mockClaimsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockProfileQuery) // First call for profiles
        .mockReturnValueOnce(mockClaimsQuery); // Second call for claims

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
    });
  });

  // ========================================================================
  // QUERY PARAMETER TESTS
  // ========================================================================

  describe('Query Parameters', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery);
    });

    it('should use default pagination values if not provided', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      await GET(request);

      expect(mockQuery.range).toHaveBeenCalledWith(0, 24); // Default: page 1, limit 25
    });

    it('should apply custom pagination values', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?page=2&limit=10'
      );
      await GET(request);

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // page 2, limit 10
    });

    it('should enforce maximum limit of 100', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?limit=200'
      );
      await GET(request);

      expect(mockQuery.range).toHaveBeenCalledWith(0, 99); // Capped at 100
    });

    it('should handle page 1 as minimum', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?page=0'
      );
      await GET(request);

      expect(mockQuery.range).toHaveBeenCalledWith(0, 24); // page forced to 1
    });
  });

  // ========================================================================
  // STATUS FILTER TESTS
  // ========================================================================

  describe('Status Filter', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery);
    });

    it('should not filter by status if "all" is specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?status=all'
      );
      await GET(request);

      expect(mockQuery.eq).not.toHaveBeenCalled();
    });

    it('should filter by pending status', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?status=pending'
      );
      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should filter by approved status', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?status=approved'
      );
      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
    });

    it('should filter by rejected status', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?status=rejected'
      );
      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'rejected');
    });
  });

  // ========================================================================
  // SEARCH FILTER TESTS
  // ========================================================================

  describe('Search Filter', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery);
    });

    it('should not apply search filter if search query is empty', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      await GET(request);

      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it('should apply search filter for email', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?search=john@example.com'
      );
      await GET(request);

      // Note: @ is encoded to %40 by encodeURIComponent to prevent PostgREST filter syntax errors
      expect(mockQuery.or).toHaveBeenCalledWith(
        'business_email.ilike.%john%40example.com%,agency.name.ilike.%john%40example.com%'
      );
    });

    it('should apply search filter for agency name', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?search=Elite'
      );
      await GET(request);

      expect(mockQuery.or).toHaveBeenCalledWith(
        'business_email.ilike.%Elite%,agency.name.ilike.%Elite%'
      );
    });
  });

  // ========================================================================
  // SUCCESS RESPONSE TESTS
  // ========================================================================

  describe('Success Responses', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery);
    });

    it('should return empty array if no claims exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should return claim requests with related data', async () => {
      const mockClaims = [
        {
          id: 'claim-1',
          agency_id: 'agency-1',
          user_id: 'user-1',
          status: 'pending',
          business_email: 'ceo@agency.com',
          phone_number: '+12345678901',
          position_title: 'CEO',
          verification_method: 'email',
          email_domain_verified: true,
          additional_notes: 'Please approve',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          agency: {
            id: 'agency-1',
            name: 'Elite Staffing',
            slug: 'elite-staffing',
            logo_url: 'https://example.com/logo.png',
            website: 'https://elitestaffing.com',
          },
          user: {
            id: 'user-1',
            full_name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClaims,
          error: null,
          count: 1,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toEqual(mockClaims[0]);
      expect(data.data[0].agency).toBeDefined();
      expect(data.data[0].user).toBeDefined();
    });

    it('should return correct pagination metadata', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: Array(25).fill({}),
          error: null,
          count: 100,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?page=2&limit=25'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.pagination).toEqual({
        total: 100,
        limit: 25,
        offset: 25,
        hasMore: true,
        page: 2,
        totalPages: 4,
      });
    });

    it('should set hasMore to false on last page', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: Array(10).fill({}),
          error: null,
          count: 35,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?page=2&limit=25'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.hasMore).toBe(false);
      expect(data.pagination.total).toBe(35);
      expect(data.pagination.totalPages).toBe(2);
    });

    it('should sort results by created_at DESC', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      await GET(request);

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockProfileQuery);
    });

    it('should return 500 if database query fails', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch claim requests');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost/api/admin/claims');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Integration Tests', () => {
    it('should handle combined filters (status + search + pagination)', async () => {
      // Mock authenticated admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/claims?status=pending&search=Elite&page=1&limit=10'
      );
      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending');
      expect(mockQuery.or).toHaveBeenCalledWith(
        'business_email.ilike.%Elite%,agency.name.ilike.%Elite%'
      );
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });
  });
});
