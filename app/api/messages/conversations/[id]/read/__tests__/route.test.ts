import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('PUT /api/messages/conversations/[id]/read', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Supabase mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('Success Cases', () => {
    it('should mark conversation as read successfully', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock update
      const mockResponse = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        last_read_at: '2025-01-01T12:00:00Z',
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockResponse,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.conversation_id).toBe(
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(data.data.last_read_at).toBeDefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'conversation_participants'
      );
    });

    it('should update last_read_at with current timestamp', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const now = new Date();
      const mockResponse = {
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        last_read_at: now.toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockResponse,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(new Date(data.data.last_read_at).getTime()).toBeGreaterThanOrEqual(
        now.getTime() - 1000
      );
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid conversation ID (not UUID)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/invalid-id/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: 'invalid-id' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid conversation ID format');
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to mark conversations as read'
      );
    });

    it('should return 401 when auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 when user is not a participant (no matching row)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows found' },
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe(
        'Conversation not found or you are not a participant'
      );
    });

    it('should return 404 when update returns null data', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('Database Errors', () => {
    it('should handle database update error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error', code: 'DB_ERROR' },
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to mark conversation as read');
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/read',
        { method: 'PUT' }
      );

      const response = await PUT(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
