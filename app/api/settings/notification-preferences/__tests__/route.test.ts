/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';
import { createClient } from '@/lib/supabase/server';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Notification Preferences API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockPreferences = {
    email_enabled: true,
    email_batch_enabled: true,
    email_daily_digest_enabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/settings/notification-preferences
  // ===========================================================================

  describe('GET', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: new Error('Not authenticated'),
            }),
          },
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Fetching Preferences', () => {
      it('should return existing preferences when they exist', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPreferences,
                  error: null,
                }),
              }),
            }),
          }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toEqual(mockPreferences);
      });

      it('should return default preferences when preferences do not exist', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // Not found error
                }),
              }),
            }),
          }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toEqual({
          email_enabled: true,
          email_batch_enabled: true,
          email_daily_digest_enabled: false,
        });
      });

      it('should return 500 on database error', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'DB_ERROR', message: 'Database error' },
                }),
              }),
            }),
          }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        // Mock console.error to suppress error output
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);

        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ===========================================================================
  // PATCH /api/settings/notification-preferences
  // ===========================================================================

  describe('PATCH', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: new Error('Not authenticated'),
            }),
          },
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: JSON.stringify(mockPreferences),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Validation', () => {
      it('should return 400 for invalid JSON', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: 'invalid json',
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(data.error.message).toBe('Invalid JSON in request body');
      });

      it('should return 400 for missing required fields', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: JSON.stringify({
            email_enabled: true,
            // Missing email_batch_enabled and email_daily_digest_enabled
          }),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(data.error.message).toBe('Validation failed');
      });

      it('should return 400 for invalid field types', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: JSON.stringify({
            email_enabled: 'not a boolean',
            email_batch_enabled: true,
            email_daily_digest_enabled: false,
          }),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      });
    });

    describe('Updating Preferences', () => {
      it('should update preferences successfully', async () => {
        const updatedPreferences = {
          email_enabled: false,
          email_batch_enabled: false,
          email_daily_digest_enabled: false,
        };

        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn().mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedPreferences,
                  error: null,
                }),
              }),
            }),
          }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: JSON.stringify(updatedPreferences),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toEqual(updatedPreferences);

        // Verify upsert was called with correct parameters
        expect(mockSupabase.from).toHaveBeenCalledWith('notification_preferences');
        expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
          {
            user_id: mockUser.id,
            ...updatedPreferences,
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        );
      });

      it('should return 500 on database error', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn().mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        // Mock console.error to suppress error output
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const request = new NextRequest('http://localhost/api/settings/notification-preferences', {
          method: 'PATCH',
          body: JSON.stringify(mockPreferences),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
