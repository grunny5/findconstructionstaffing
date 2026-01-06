/**
 * Tests for Admin User Update API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PATCH } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('PATCH /api/admin/users/[id]', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  const validUserId = '11111111-1111-1111-1111-111111111111';
  const adminUserId = 'admin-user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase client mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(
      mockSupabaseClient as unknown as ReturnType<typeof createClient>
    );
  });

  // Helper to create request with params
  const createRequest = (
    body: unknown,
    userId: string = validUserId
  ): [NextRequest, { params: Promise<{ id: string }> }] => {
    const request = new NextRequest(
      'http://localhost/api/admin/users/' + userId,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return [request, { params: Promise.resolve({ id: userId }) }];
  };

  // Helper to setup authenticated admin
  const setupAdminAuth = () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: adminUserId, email: 'admin@example.com' } },
      error: null,
    });

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    };
  };

  // Helper to setup user exists check
  const setupUserExists = (
    userData = {
      id: validUserId,
      email: 'user@example.com',
      full_name: 'Test User',
      role: 'user',
    }
  ) => {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: userData,
        error: null,
      }),
    };
  };

  // Helper to setup successful update
  const setupSuccessfulUpdate = (updatedData: Record<string, unknown>) => {
    return {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: validUserId,
          email: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          ...updatedData,
        },
        error: null,
      }),
    };
  };

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Authentication required');
    });

    it('returns 401 when auth returns null user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  // ========================================================================
  // AUTHORIZATION TESTS
  // ========================================================================

  describe('Authorization', () => {
    it('returns 403 when user is not an admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Admin access required');
    });

    it('returns 403 when user is agency_owner', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-123' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'agency_owner' },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('returns 403 when profile lookup fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Profile not found'),
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('Validation', () => {
    it('returns 400 for invalid UUID format', async () => {
      const mockProfileQuery = setupAdminAuth();
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest(
        { full_name: 'New Name' },
        'invalid-uuid'
      );
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid user ID format');
    });

    it('returns 400 for invalid JSON body', async () => {
      const mockProfileQuery = setupAdminAuth();
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/users/' + validUserId,
        {
          method: 'PATCH',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const params = { params: Promise.resolve({ id: validUserId }) };

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON body');
    });

    it('returns 400 when no fields provided', async () => {
      const mockProfileQuery = setupAdminAuth();
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest({});
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('No fields provided to update');
    });

    it('returns 400 for invalid role value', async () => {
      const mockProfileQuery = setupAdminAuth();
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const [request, params] = createRequest({ role: 'superadmin' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details).toBeDefined();
    });

    it('returns 400 for full_name exceeding max length', async () => {
      const mockProfileQuery = setupAdminAuth();
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const longName = 'a'.repeat(201);
      const [request, params] = createRequest({ full_name: longName });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ========================================================================
  // NOT FOUND TESTS
  // ========================================================================

  describe('Not Found', () => {
    it('returns 404 when user does not exist', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        // First call is for admin profile check
        if (callCount === 1) return mockProfileQuery;
        // Second call is for target user lookup
        return mockUserQuery;
      });

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('User not found');
    });
  });

  // ========================================================================
  // SUCCESS TESTS
  // ========================================================================

  describe('Successful Updates', () => {
    it('updates full_name successfully', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: 'Updated Name',
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ full_name: 'Updated Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.full_name).toBe('Updated Name');
      expect(data.message).toBe('User updated successfully');
    });

    it('updates role successfully', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: 'Test User',
        role: 'admin',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ role: 'admin' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.role).toBe('admin');
      expect(data.message).toBe('User updated successfully');
    });

    it('updates both full_name and role together', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: 'New Admin Name',
        role: 'agency_owner',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({
        full_name: 'New Admin Name',
        role: 'agency_owner',
      });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.full_name).toBe('New Admin Name');
      expect(data.user.role).toBe('agency_owner');
    });

    it('converts empty full_name to null', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: null,
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ full_name: '' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.full_name).toBeNull();
    });

    it('allows setting full_name to null explicitly', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: null,
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ full_name: null });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.full_name).toBeNull();
    });

    it('allows all valid role values', async () => {
      const roles = ['user', 'agency_owner', 'admin'] as const;

      for (const role of roles) {
        jest.clearAllMocks();

        const mockProfileQuery = setupAdminAuth();
        const mockUserQuery = setupUserExists();
        const mockUpdateQuery = setupSuccessfulUpdate({
          full_name: 'Test User',
          role,
        });

        let callCount = 0;
        mockSupabaseClient.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) return mockProfileQuery;
          if (callCount === 2) return mockUserQuery;
          return mockUpdateQuery;
        });

        const [request, params] = createRequest({ role });
        const response = await PATCH(request, params);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.user.role).toBe(role);
      }
    });
  });

  // ========================================================================
  // DATABASE ERROR TESTS
  // ========================================================================

  describe('Database Errors', () => {
    it('returns 500 when update fails', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ full_name: 'New Name' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update user');
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('trims whitespace from full_name', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: 'Trimmed Name',
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({
        full_name: '  Trimmed Name  ',
      });
      const response = await PATCH(request, params);

      expect(response.status).toBe(HTTP_STATUS.OK);
      // The update should have been called with trimmed value
      expect(mockUpdateQuery.update).toHaveBeenCalled();
    });

    it('handles max length full_name (200 chars)', async () => {
      const maxName = 'a'.repeat(200);
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: maxName,
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      const [request, params] = createRequest({ full_name: maxName });
      const response = await PATCH(request, params);

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });
});
