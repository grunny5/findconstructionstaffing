/**
 * Tests for Admin User Creation API Endpoint
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

describe('POST /api/admin/users', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };
  let mockAdminClient: {
    from: jest.Mock;
    schema: jest.Mock;
    auth: {
      admin: {
        createUser: jest.Mock;
        generateLink: jest.Mock;
        deleteUser: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
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
      schema: jest.fn(),
      auth: {
        admin: {
          createUser: jest.fn(),
          generateLink: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    mockedCreateClient.mockResolvedValue(
      mockSupabaseClient as unknown as ReturnType<typeof createClient>
    );
    mockedCreateAdminClient.mockReturnValue(
      mockAdminClient as unknown as ReturnType<typeof createAdminClient>
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper to setup authenticated admin context
  const setupAdminAuth = () => {
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
  };

  // Helper to setup no existing user check
  const setupNoExistingUser = () => {
    const mockAuthUsersQuery = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };
    mockAdminClient.schema.mockReturnValue(mockAuthUsersQuery);
  };

  // Helper to setup successful user creation
  const setupSuccessfulUserCreation = (userId = 'new-user-123') => {
    mockAdminClient.auth.admin.createUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: 'newuser@example.com',
        },
      },
      error: null,
    });

    const mockProfileInsert = {
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    mockAdminClient.from.mockReturnValue(mockProfileInsert);

    mockAdminClient.auth.admin.generateLink.mockResolvedValue({
      data: { properties: { action_link: 'https://example.com/reset' } },
      error: null,
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

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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
      setupAdminAuth();
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: 'not valid json',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 if email is missing', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ role: 'user' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Email is required');
    });

    it('should return 400 for invalid email format', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'not-an-email',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Must be a valid email address');
    });

    it('should return 400 for invalid role', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'superadmin',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Role must be user, agency_owner, or admin'
      );
    });

    it('should return 400 if full_name exceeds 200 characters', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'a'.repeat(201),
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Name must be less than 200 characters');
    });

    it('should accept valid request with all fields', async () => {
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'John Doe',
          role: 'user',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should accept request with only email (defaults role to user)', async () => {
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.role).toBe('user');
    });

    it('should trim whitespace from email', async () => {
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: '  newuser@example.com  ',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.email).toBe('newuser@example.com');
    });
  });

  // ========================================================================
  // DUPLICATE EMAIL CHECK TESTS
  // ========================================================================

  describe('Duplicate Email Check', () => {
    beforeEach(() => {
      setupAdminAuth();
    });

    it('should return 409 if email already exists', async () => {
      const mockAuthUsersQuery = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'existing-user-id' },
                error: null,
              }),
            }),
          }),
        }),
      };
      mockAdminClient.schema.mockReturnValue(mockAuthUsersQuery);

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.CONFLICT);
      expect(data.error.message).toBe(
        'A user with this email address already exists'
      );
    });

    it('should handle case-insensitive duplicate check', async () => {
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'NewUser@Example.com',
          role: 'user',
        }),
      });
      await POST(request);

      // Verify ilike was used for case-insensitive check
      expect(mockAdminClient.schema).toHaveBeenCalledWith('auth');
    });
  });

  // ========================================================================
  // USER CREATION TESTS
  // ========================================================================

  describe('User Creation', () => {
    beforeEach(() => {
      setupAdminAuth();
      setupNoExistingUser();
    });

    it('should create user successfully with all fields', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'John Doe',
          role: 'agency_owner',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.message).toBe('User created successfully');
      expect(data.user).toEqual({
        id: 'new-user-123',
        email: 'newuser@example.com',
        full_name: 'John Doe',
        role: 'agency_owner',
      });
      expect(data.passwordResetSent).toBe(true);
    });

    it('should create user with admin role', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newadmin@example.com',
          full_name: 'Admin User',
          role: 'admin',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.role).toBe('admin');
    });

    it('should call createUser with correct parameters', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'John Doe',
          role: 'user',
        }),
      });
      await POST(request);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        email_confirm: true,
        user_metadata: {
          full_name: 'John Doe',
        },
      });
    });

    it('should lowercase email in profile', async () => {
      setupSuccessfulUserCreation();

      const mockProfileInsert = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockAdminClient.from.mockReturnValue(mockProfileInsert);

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'NewUser@Example.COM',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.email).toBe('newuser@example.com');
    });

    it('should handle null full_name', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.full_name).toBeNull();
    });

    it('should handle empty string full_name as null', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: '',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.user.full_name).toBeNull();
    });
  });

  // ========================================================================
  // PROFILE CREATION TESTS
  // ========================================================================

  describe('Profile Creation', () => {
    beforeEach(() => {
      setupAdminAuth();
      setupNoExistingUser();
    });

    it('should create profile with correct data', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
          },
        },
        error: null,
      });

      const mockProfileInsert = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockAdminClient.from.mockReturnValue(mockProfileInsert);

      mockAdminClient.auth.admin.generateLink.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'John Doe',
          role: 'agency_owner',
        }),
      });
      await POST(request);

      expect(mockAdminClient.from).toHaveBeenCalledWith('profiles');
      expect(mockProfileInsert.insert).toHaveBeenCalledWith({
        id: 'new-user-123',
        email: 'newuser@example.com',
        full_name: 'John Doe',
        role: 'agency_owner',
      });
    });

    it('should rollback auth user if profile creation fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
          },
        },
        error: null,
      });

      const mockProfileInsert = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Profile insert failed'),
        }),
      };
      mockAdminClient.from.mockReturnValue(mockProfileInsert);

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.message).toBe('Failed to create user profile');
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        'new-user-123'
      );
    });
  });

  // ========================================================================
  // PASSWORD RESET EMAIL TESTS
  // ========================================================================

  describe('Password Reset Email', () => {
    beforeEach(() => {
      setupAdminAuth();
      setupNoExistingUser();
    });

    it('should generate password reset link after user creation', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      await POST(request);

      expect(mockAdminClient.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'recovery',
        email: 'newuser@example.com',
        options: {
          redirectTo: 'http://localhost:3000/reset-password',
        },
      });
    });

    it('should return passwordResetSent: true when email sent successfully', async () => {
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.passwordResetSent).toBe(true);
    });

    it('should still succeed if password reset email fails (soft failure)', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
          },
        },
        error: null,
      });

      const mockProfileInsert = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockAdminClient.from.mockReturnValue(mockProfileInsert);

      mockAdminClient.auth.admin.generateLink.mockResolvedValue({
        data: null,
        error: new Error('Email sending failed'),
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.passwordResetSent).toBe(false);
      expect(data.user.id).toBe('new-user-123');
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      setupAdminAuth();
    });

    it('should return 500 if Supabase URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Server configuration error');
    });

    it('should return 500 if service role key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should return 409 if auth createUser returns duplicate email error', async () => {
      setupNoExistingUser();

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User has already been registered' },
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.CONFLICT);
    });

    it('should return 500 for general auth createUser errors', async () => {
      setupNoExistingUser();

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Failed to create user account');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAdminClient.schema.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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
      setupAdminAuth();
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
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

    it('should mark email as confirmed for admin-created users', async () => {
      setupAdminAuth();
      setupNoExistingUser();
      setupSuccessfulUserCreation();

      const request = new NextRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'user',
        }),
      });
      await POST(request);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email_confirm: true,
        })
      );
    });
  });
});
