/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('POST /api/messages/conversations/[id]/messages', () => {
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
    it('should send a message successfully', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock message insert
      const mockMessage = {
        id: 'msg-123',
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        sender_id: 'user-123',
        content: 'Hello, this is a test message',
        created_at: '2025-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Hello, this is a test message',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.message).toEqual(mockMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages');
    });

    it('should handle long message content (within limit)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const longContent = 'a'.repeat(10000); // Max length
      const mockMessage = {
        id: 'msg-123',
        conversation_id: '123e4567-e89b-12d3-a456-426614174000',
        sender_id: 'user-123',
        content: longContent,
        created_at: '2025-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: longContent }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.message.content).toBe(longContent);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid conversation ID (not UUID)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/invalid-id/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: 'invalid-id' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid conversation ID format');
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 for missing content field', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid request body');
    });

    it('should return 400 for empty content', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: '' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for content exceeding max length', async () => {
      const tooLongContent = 'a'.repeat(10001); // One char over limit

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: tooLongContent }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.content).toBeDefined();
    });

    it('should return 400 for content with <script> tags', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Hello <script>alert("XSS")</script>',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.content).toBeDefined();
    });

    it('should return 400 for content with event handlers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            content: '<img src="x" onerror="alert(1)">',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for content with javascript: URL', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            content: '<a href="javascript:alert(1)">Click</a>',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('You must be logged in to send messages');
    });

    it('should return 401 when auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Authorization Errors', () => {
    it('should return 403 when user is not a participant (RLS policy violation)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock RLS policy violation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message:
                  'new row violates row-level security policy for table "messages"',
                code: '42501',
              },
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe(
        'You do not have permission to send messages in this conversation'
      );
    });
  });

  describe('Database Errors', () => {
    it('should handle database insert error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to send message');
    });

    it('should handle null message after insert', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Message was not created');
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        }
      );

      const response = await POST(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
