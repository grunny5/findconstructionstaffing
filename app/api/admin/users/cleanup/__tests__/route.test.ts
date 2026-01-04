/**
 * Tests for Admin User Cleanup API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase clients
jest.mock('@/lib/supabase/server');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);
const mockedCreateAdminClient = jest.mocked(createAdminClient);

// Store original env
const originalEnv = process.env;

describe('POST /api/admin/users/cleanup', () => {
  let mockSupabaseClient: any;
  let mockAdminClient: any;

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

    // Setup admin client mock
    mockAdminClient = {
      from: jest.fn(),
      auth: {
        admin: {
          listUsers: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);
    mockedCreateAdminClient.mockReturnValue(mockAdminClient);
  });

  afterEach(() => {
    process.env = originalEnv;
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
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
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

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
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

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Forbidden: Admin access required');
    });

    it('should return 403 if user is agency_owner (not admin)', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'agency_owner' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
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

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  // ========================================================================
  // REQUEST BODY VALIDATION TESTS
  // ========================================================================

  describe('Request Body Validation', () => {
    beforeEach(() => {
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

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: 'not valid json',
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 if email is missing', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Email address is required');
    });

    it('should return 400 if email is not a string', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 123 }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Email address is required');
    });

    it('should return 400 for invalid email format', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'not-an-email' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid email address format');
    });

    it('should return 400 for email without domain', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ========================================================================
  // CLEANUP OPERATION TESTS
  // ========================================================================

  describe('Cleanup Operations', () => {
    beforeEach(() => {
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

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);
    });

    it('should successfully clean up orphaned records', async () => {
      // Mock identities delete
      const mockIdentitiesQuery = {
        delete: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'identity-1' }],
          error: null,
        }),
      };

      // Mock profiles delete
      const mockProfilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'profile-1' }],
          error: null,
        }),
      };

      mockAdminClient.from
        .mockReturnValueOnce(mockIdentitiesQuery)
        .mockReturnValueOnce(mockProfilesQuery);

      // Mock listUsers to find user
      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            { id: 'user-to-delete', email: 'test@example.com' },
            { id: 'other-user', email: 'other@example.com' },
          ],
        },
        error: null,
      });

      // Mock deleteUser
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: { id: 'user-to-delete' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe('Cleanup completed successfully');
      expect(data.deleted.identities).toBe(1);
      expect(data.deleted.profiles).toBe(1);
      expect(data.deleted.users).toBe(1);
    });

    it('should handle case-insensitive email matching', async () => {
      const mockIdentitiesQuery = {
        delete: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockProfilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockAdminClient.from
        .mockReturnValueOnce(mockIdentitiesQuery)
        .mockReturnValueOnce(mockProfilesQuery);

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [{ id: 'user-123', email: 'TEST@EXAMPLE.COM' }],
        },
        error: null,
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.deleted.users).toBe(1);
    });

    it('should return zeros when no records exist', async () => {
      const mockIdentitiesQuery = {
        delete: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockProfilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockAdminClient.from
        .mockReturnValueOnce(mockIdentitiesQuery)
        .mockReturnValueOnce(mockProfilesQuery);

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'nonexistent@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe('Cleanup completed successfully');
      expect(data.deleted.identities).toBe(0);
      expect(data.deleted.profiles).toBe(0);
      expect(data.deleted.users).toBe(0);
    });

    it('should continue cleanup even if identities delete fails', async () => {
      const mockIdentitiesQuery = {
        delete: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Identities access denied'),
        }),
      };

      const mockProfilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'profile-1' }],
          error: null,
        }),
      };

      mockAdminClient.from
        .mockReturnValueOnce(mockIdentitiesQuery)
        .mockReturnValueOnce(mockProfilesQuery);

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'user-123', email: 'test@example.com' }] },
        error: null,
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.deleted.identities).toBe(0);
      expect(data.deleted.profiles).toBe(1);
      expect(data.deleted.users).toBe(1);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
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

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);
    });

    it('should return 500 if Supabase URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Server configuration error');
    });

    it('should return 500 if service role key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAdminClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });

  // ========================================================================
  // SECURITY TESTS
  // ========================================================================

  describe('Security', () => {
    it('should create admin client with proper configuration', async () => {
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

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const mockIdentitiesQuery = {
        delete: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockProfilesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockAdminClient.from
        .mockReturnValueOnce(mockIdentitiesQuery)
        .mockReturnValueOnce(mockProfilesQuery);

      mockAdminClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/admin/users/cleanup',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        }
      );
      await POST(request);

      expect(mockedCreateAdminClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    });
  });
});
