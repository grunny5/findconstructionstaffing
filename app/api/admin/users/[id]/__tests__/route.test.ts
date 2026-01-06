/**
 * Tests for Admin User Management API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server');
jest.mock('@supabase/supabase-js');

const mockedCreateClient = jest.mocked(createClient);
const mockedCreateAdminClient = jest.mocked(createAdminClient);

describe('PATCH /api/admin/users/[id]', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  const validUserId = '11111111-1111-1111-1111-111111111111';
  const adminUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

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

  // ========================================================================
  // SELF-DEMOTION PREVENTION TESTS
  // ========================================================================

  describe('Self-Demotion Prevention', () => {
    it('returns 403 when admin tries to demote themselves to user', async () => {
      // Admin is trying to update their own user ID
      const adminId = adminUserId;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId, email: 'admin@example.com' } },
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
          },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        return mockUserQuery;
      });

      // Admin trying to demote themselves
      const [request, params] = createRequest({ role: 'user' }, adminId);
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Cannot demote yourself from admin role');
    });

    it('returns 403 when admin tries to demote themselves to agency_owner', async () => {
      const adminId = adminUserId;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId, email: 'admin@example.com' } },
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
          },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        return mockUserQuery;
      });

      const [request, params] = createRequest(
        { role: 'agency_owner' },
        adminId
      );
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Cannot demote yourself from admin role');
    });

    it('allows admin to keep their admin role when updating themselves', async () => {
      const adminId = adminUserId;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId, email: 'admin@example.com' } },
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
          },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      // Admin keeping their admin role is allowed
      const [request, params] = createRequest({ role: 'admin' }, adminId);
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.role).toBe('admin');
    });

    it('allows admin to update their own full_name without role change', async () => {
      const adminId = adminUserId;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId, email: 'admin@example.com' } },
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

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
          },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: adminId,
            email: 'admin@example.com',
            full_name: 'Updated Admin Name',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      // Admin updating their name without changing role is allowed
      const [request, params] = createRequest(
        { full_name: 'Updated Admin Name' },
        adminId
      );
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.full_name).toBe('Updated Admin Name');
    });

    it('allows admin to change another user role to anything', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupUserExists();
      const mockUpdateQuery = setupSuccessfulUpdate({
        full_name: 'Test User',
        role: 'agency_owner',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return mockUpdateQuery;
      });

      // Admin changing another user's role is allowed
      const [request, params] = createRequest({ role: 'agency_owner' });
      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.user.role).toBe('agency_owner');
    });
  });
});

// =============================================================================
// DELETE /api/admin/users/[id] TESTS
// =============================================================================

describe('DELETE /api/admin/users/[id]', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  let mockAdminClient: {
    auth: { admin: { deleteUser: jest.Mock } };
  };

  const validUserId = '11111111-1111-1111-1111-111111111111';
  const adminUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };

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

    // Setup admin client mock
    mockAdminClient = {
      auth: {
        admin: {
          deleteUser: jest.fn(),
        },
      },
    };

    mockedCreateAdminClient.mockReturnValue(mockAdminClient as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper to create DELETE request with params
  const createDeleteRequest = (
    userId: string = validUserId
  ): [NextRequest, { params: Promise<{ id: string }> }] => {
    const request = new NextRequest(
      'http://localhost/api/admin/users/' + userId,
      { method: 'DELETE' }
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

  // Helper to setup target user exists
  const setupTargetUserExists = (
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

  // Helper to setup no claimed agencies
  const setupNoClaimedAgencies = () => {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: [],
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

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
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

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
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

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
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

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
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

      const [request, params] = createDeleteRequest('invalid-uuid');
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid user ID format');
    });
  });

  // ========================================================================
  // SELF-DELETION PREVENTION TESTS
  // ========================================================================

  describe('Self-Deletion Prevention', () => {
    it('returns 403 when admin tries to delete themselves', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: adminUserId, email: 'admin@example.com' } },
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
      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      // Admin trying to delete their own account
      const [request, params] = createDeleteRequest(adminUserId);
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Cannot delete your own account');
    });
  });

  // ========================================================================
  // NOT FOUND TESTS
  // ========================================================================

  describe('Not Found', () => {
    it('returns 404 when target user does not exist', async () => {
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
        if (callCount === 1) return mockProfileQuery;
        return mockUserQuery;
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('User not found');
    });
  });

  // ========================================================================
  // CLAIMED AGENCY CONFLICT TESTS
  // ========================================================================

  describe('Claimed Agency Conflict', () => {
    it('returns 409 when user owns a claimed agency', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      // Create a mock that returns a thenable for the agencies query
      const createAgencyMock = (agencies: unknown[]) => {
        const mockEq = jest.fn().mockReturnValue(
          Promise.resolve({
            data: agencies,
            error: null,
          })
        );
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        };
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([
          { id: 'agency-1', name: 'Test Agency', slug: 'test-agency' },
        ]);
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.CONFLICT);
      expect(data.error.message).toContain('claimed agency');
      expect(data.error.details.claimed_agencies).toHaveLength(1);
      expect(data.error.details.claimed_agencies[0].name).toBe('Test Agency');
    });

    it('returns 409 when user owns multiple claimed agencies', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      const createAgencyMock = (agencies: unknown[]) => {
        const mockEq = jest.fn().mockReturnValue(
          Promise.resolve({
            data: agencies,
            error: null,
          })
        );
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        };
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([
          { id: 'agency-1', name: 'Agency One', slug: 'agency-one' },
          { id: 'agency-2', name: 'Agency Two', slug: 'agency-two' },
        ]);
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.details.claimed_agencies).toHaveLength(2);
    });
  });

  // ========================================================================
  // SUCCESSFUL DELETION TESTS
  // ========================================================================

  describe('Successful Deletion', () => {
    // Helper to create agency query mock
    const createAgencyMock = (agencies: unknown[], error: unknown = null) => {
      const mockEq = jest.fn().mockReturnValue(
        Promise.resolve({
          data: agencies,
          error: error,
        })
      );
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      };
    };

    it('deletes user successfully when no claimed agencies', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists({
        id: validUserId,
        email: 'user@example.com',
        full_name: 'Test User',
        role: 'user',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([]); // No claimed agencies
      });

      // Admin client delete succeeds
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe('User deleted successfully');
      expect(data.deleted_user.id).toBe(validUserId);
      expect(data.deleted_user.email).toBe('user@example.com');
      expect(data.deleted_user.full_name).toBe('Test User');
    });

    it('calls admin deleteUser with correct user ID', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([]);
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const [request, params] = createDeleteRequest();
      await DELETE(request, params);

      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        validUserId
      );
    });

    it('deletes agency_owner user without claimed agencies', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists({
        id: validUserId,
        email: 'owner@example.com',
        full_name: 'Agency Owner',
        role: 'agency_owner',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([]); // No claimed agencies
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.deleted_user.role).toBeUndefined(); // role not in response
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    // Helper to create agency query mock
    const createAgencyMock = (
      agencies: unknown[] | null,
      error: unknown = null
    ) => {
      const mockEq = jest.fn().mockReturnValue(
        Promise.resolve({
          data: agencies,
          error: error,
        })
      );
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      };
    };

    it('returns 500 when admin deleteUser fails', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([]);
      });

      // Admin client delete fails
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: new Error('Failed to delete user'),
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Failed to delete user');
    });

    it('returns 500 when service role key is missing', async () => {
      // Remove service role key
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock([]);
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Server configuration error');
    });

    it('returns 500 when agency check fails', async () => {
      const mockProfileQuery = setupAdminAuth();
      const mockUserQuery = setupTargetUserExists();

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockProfileQuery;
        if (callCount === 2) return mockUserQuery;
        return createAgencyMock(null, new Error('Database error'));
      });

      const [request, params] = createDeleteRequest();
      const response = await DELETE(request, params);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to check agency ownership');
    });
  });
});
