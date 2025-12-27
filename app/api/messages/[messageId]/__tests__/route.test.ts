/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase
jest.mock('@/lib/supabase/server');

describe('PATCH /api/messages/[messageId]', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  // Helper to create request
  const createRequest = (messageId: string, body: any) => {
    const request = new NextRequest(
      `http://localhost:3000/api/messages/${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return request;
  };

  // Helper to create context
  const createContext = (messageId: string) => ({
    params: Promise.resolve({ messageId }),
  });

  describe('Success Cases', () => {
    it('should edit message successfully within 5-minute window', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();
      const createdAt = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Mock fetching existing message
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Original message',
          created_at: createdAt.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      // Mock message update
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          conversation_id: 'conv-123',
          sender_id: userId,
          content: 'Edited message',
          created_at: createdAt.toISOString(),
          edited_at: now.toISOString(),
          deleted_at: null,
        },
        error: null,
      });

      const request = createRequest(messageId, {
        content: 'Edited message',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveProperty('id', messageId);
      expect(data.data).toHaveProperty('content', 'Edited message');
      expect(data.data).toHaveProperty('edited_at');
      expect(data.data.edited_at).not.toBeNull();

      // Verify update was called with correct parameters
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Edited message',
          edited_at: expect.any(String),
        })
      );
    });

    it('should accept content at max length (10,000 chars)', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();
      const createdAt = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute ago
      const maxContent = 'a'.repeat(10000);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Original',
          created_at: createdAt.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          conversation_id: 'conv-123',
          sender_id: userId,
          content: maxContent,
          created_at: createdAt.toISOString(),
          edited_at: now.toISOString(),
          deleted_at: null,
        },
        error: null,
      });

      const request = createRequest(messageId, { content: maxContent });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.content).toBe(maxContent);
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid UUID message ID', async () => {
      const request = createRequest('not-a-uuid', { content: 'Test' });
      const context = createContext('not-a-uuid');

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid message ID');
      expect(data.error.details.messageId).toContain(
        'Message ID must be a valid UUID'
      );
    });

    it('should reject invalid JSON in request body', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const request = new NextRequest(
        `http://localhost:3000/api/messages/${messageId}`,
        {
          method: 'PATCH',
          body: 'invalid-json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should reject empty content', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const request = createRequest(messageId, { content: '' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.content).toBeDefined();
    });

    it('should reject content exceeding max length', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const tooLong = 'a'.repeat(10001);
      const request = createRequest(messageId, { content: tooLong });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.content).toBeDefined();
    });
  });

  describe('XSS Protection', () => {
    it('should reject content with script tags', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const request = createRequest(messageId, {
        content: 'Hello <script>alert("XSS")</script> world',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.content).toBeDefined();
    });

    it('should reject content with event handlers', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const request = createRequest(messageId, {
        content: '<img onclick="alert(1)" src="x">',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject content with javascript: URLs', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const request = createRequest(messageId, {
        content: 'Link: javascript:alert(1)',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when not authenticated', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createRequest(messageId, { content: 'Test' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 401 when auth error occurs', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth failed' },
      });

      const request = createRequest(messageId, { content: 'Test' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Message Not Found', () => {
    it('should return 404 when message does not exist', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // PGRST116 is Supabase's "no rows returned" error code
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const request = createRequest(messageId, { content: 'Test' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Message not found');
    });

    it('should return 500 on database error when fetching message', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createRequest(messageId, { content: 'Test' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Authorization Errors', () => {
    it('should return 403 when user is not the message sender', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: messageId,
          sender_id: otherUserId, // Different user
          content: 'Someone else message',
          created_at: new Date().toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      const request = createRequest(messageId, { content: 'Hacked!' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('You can only edit your own messages');
    });
  });

  describe('Edit Window Validation', () => {
    it('should reject edit when message is older than 5 minutes', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();
      const createdAt = new Date(now.getTime() - 6 * 60 * 1000); // 6 minutes ago

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Old message',
          created_at: createdAt.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      const request = createRequest(messageId, {
        content: 'Trying to edit old message',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toContain('Edit window expired');
      expect(data.error.message).toContain('5 minutes');
    });

    it('should allow edit when message is exactly 5 minutes old', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();
      const createdAt = new Date(now.getTime() - 4 * 60 * 1000 - 59 * 1000); // 4:59 ago (within 5 min window)

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Old message',
          created_at: createdAt.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          conversation_id: 'conv-123',
          sender_id: userId,
          content: 'Edited at 5 min mark',
          created_at: createdAt.toISOString(),
          edited_at: now.toISOString(),
          deleted_at: null,
        },
        error: null,
      });

      const request = createRequest(messageId, {
        content: 'Edited at 5 min mark',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.content).toBe('Edited at 5 min mark');
    });
  });

  describe('Deleted Message Validation', () => {
    it('should reject editing a deleted message', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Deleted message',
          created_at: now.toISOString(),
          edited_at: null,
          deleted_at: now.toISOString(), // Message was deleted
        },
        error: null,
      });

      const request = createRequest(messageId, {
        content: 'Trying to edit deleted message',
      });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Cannot edit a deleted message');
    });
  });

  describe('Database Update Errors', () => {
    it('should return 500 when update fails', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Original',
          created_at: now.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      // Mock update failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const request = createRequest(messageId, { content: 'Updated' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update message');
    });

    it('should return 500 when update returns null', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const now = new Date();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          content: 'Original',
          created_at: now.toISOString(),
          edited_at: null,
          deleted_at: null,
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = createRequest(messageId, { content: 'Updated' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      // Force an unexpected error by throwing in createClient
      (createClient as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = createRequest(messageId, { content: 'Test' });
      const context = createContext(messageId);

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});

// =============================================================================
// DELETE ENDPOINT TESTS
// =============================================================================

describe('DELETE /api/messages/[messageId]', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  // Helper to create DELETE request
  const createDeleteRequest = (messageId: string) => {
    return new NextRequest(`http://localhost:3000/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  };

  // Helper to create context
  const createContext = (messageId: string) => ({
    params: Promise.resolve({ messageId }),
  });

  describe('Success Cases', () => {
    it('should soft-delete own message successfully', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Mock profile fetch (not admin)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      // Mock message fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          deleted_at: null,
        },
        error: null,
      });

      // Mock soft delete
      const deletedAt = new Date().toISOString();
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          deleted_at: deletedAt,
        },
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveProperty('id', messageId);
      expect(data.data).toHaveProperty('deleted_at');
      expect(data.data.deleted_at).not.toBeNull();

      // Verify soft delete was called
      expect(mockSupabase.update).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
      });
    });

    it('should allow admin to delete any message', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const adminId = 'admin-123';
      const otherUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      // Mock profile fetch (is admin)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });

      // Mock message fetch (different sender)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: otherUserId,
          deleted_at: null,
        },
        error: null,
      });

      // Mock soft delete
      const deletedAt = new Date().toISOString();
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          deleted_at: deletedAt,
        },
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveProperty('id', messageId);
      expect(data.data).toHaveProperty('deleted_at');
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid UUID message ID', async () => {
      const request = createDeleteRequest('not-a-uuid');
      const context = createContext('not-a-uuid');

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid message ID');
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when not authenticated', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 401 when auth error occurs', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth failed' },
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Profile Fetch Errors', () => {
    it('should return 500 when profile fetch fails', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile fetch failed' },
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch user profile');
    });
  });

  describe('Message Not Found', () => {
    it('should return 404 when message does not exist', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Profile fetch success
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      // Message not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Message not found');
    });

    it('should return 500 on database error when fetching message', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Authorization Errors', () => {
    it('should return 403 when non-admin user tries to delete another user message', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const otherUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Not admin
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      // Message belongs to different user
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: otherUserId,
          deleted_at: null,
        },
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toContain('only delete your own messages');
    });
  });

  describe('Already Deleted', () => {
    it('should return 400 when message is already deleted', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          deleted_at: new Date().toISOString(), // Already deleted
        },
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Message has already been deleted');
    });
  });

  describe('Database Delete Errors', () => {
    it('should return 500 when delete operation fails', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          deleted_at: null,
        },
        error: null,
      });

      // Delete fails
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Delete failed' },
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to delete message');
    });

    it('should return 500 when delete returns null', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: messageId,
          sender_id: userId,
          deleted_at: null,
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';

      (createClient as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = createDeleteRequest(messageId);
      const context = createContext(messageId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
