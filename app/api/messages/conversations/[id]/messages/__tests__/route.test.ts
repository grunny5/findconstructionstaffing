/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { sendMessageNotificationEmail } from '@/lib/emails/send-message-notification';

// Mock Supabase
jest.mock('@/lib/supabase/server');

// Mock email function
jest.mock('@/lib/emails/send-message-notification');

const mockedCreateClient = jest.mocked(createClient);
const mockedSendEmail = jest.mocked(sendMessageNotificationEmail);

describe('POST /api/messages/conversations/[id]/messages', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default email mock - successful send
    mockedSendEmail.mockResolvedValue({ sent: true });

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

  describe('Email Notifications', () => {
    const conversationId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = 'user-123';
    const recipientId = 'user-456';

    it('should send email notification when message is sent successfully', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'sender@example.com' } },
        error: null,
      });

      // Mock message insert
      const mockMessage = {
        id: 'msg-123',
        conversation_id: conversationId,
        sender_id: userId,
        content: 'Hello, this is a test message',
        created_at: '2025-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      // Setup chain mocks for message insert and email notification queries
      const mockFrom = jest.fn();

      // First call: insert message
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null,
            }),
          }),
        }),
      });

      // Second call: get conversation participants
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ user_id: userId }, { user_id: recipientId }],
            error: null,
          }),
        }),
      });

      // Third call: get sender profile
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'John Sender' },
              error: null,
            }),
          }),
        }),
      });

      // Fourth call: get recipient profile
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                full_name: 'Jane Recipient',
                email: 'recipient@example.com',
              },
              error: null,
            }),
          }),
        }),
      });

      // Fifth call: check agency claim
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      const request = new NextRequest(
        `http://localhost:3000/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Hello, this is a test message',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: conversationId },
      });

      // Wait for async email sending to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(mockedSendEmail).toHaveBeenCalledWith({
        recipientId: 'user-456',
        recipientEmail: 'recipient@example.com',
        recipientName: 'Jane Recipient',
        senderName: 'John Sender',
        senderCompany: undefined,
        messagePreview: 'Hello, this is a test message',
        conversationId: conversationId,
      });
    });

    it('should include sender company name if sender is agency owner', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'agency@example.com' } },
        error: null,
      });

      // Mock message insert
      const mockMessage = {
        id: 'msg-123',
        conversation_id: conversationId,
        sender_id: userId,
        content: 'We can help with your staffing needs',
        created_at: '2025-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      const mockFrom = jest.fn();

      // Message insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null,
            }),
          }),
        }),
      });

      // Get participants
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ user_id: userId }, { user_id: recipientId }],
            error: null,
          }),
        }),
      });

      // Get sender profile
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'Agency Owner' },
              error: null,
            }),
          }),
        }),
      });

      // Get recipient profile
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                full_name: 'Contractor',
                email: 'contractor@example.com',
              },
              error: null,
            }),
          }),
        }),
      });

      // Get agency claim - this time with agency data
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { agency: { name: 'Acme Staffing Agency' } },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      const request = new NextRequest(
        `http://localhost:3000/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'We can help with your staffing needs',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: conversationId },
      });

      // Wait for async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(mockedSendEmail).toHaveBeenCalledWith({
        recipientId: 'user-456',
        recipientEmail: 'contractor@example.com',
        recipientName: 'Contractor',
        senderName: 'Agency Owner',
        senderCompany: 'Acme Staffing Agency',
        messagePreview: 'We can help with your staffing needs',
        conversationId: conversationId,
      });
    });

    it('should not fail request if email notification fails', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'sender@example.com' } },
        error: null,
      });

      // Mock message insert
      const mockMessage = {
        id: 'msg-123',
        conversation_id: conversationId,
        sender_id: userId,
        content: 'Test message',
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

      // Mock email send failure
      mockedSendEmail.mockResolvedValue({
        sent: false,
        reason: 'resend_api_key_missing',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Test message' }),
        }
      );

      const response = await POST(request, {
        params: { id: conversationId },
      });

      const data = await response.json();

      // Request should still succeed even if email fails
      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.message).toEqual(mockMessage);
    });

    it('should not fail request if recipient has no email address', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'sender@example.com' } },
        error: null,
      });

      // Mock message insert
      const mockMessage = {
        id: 'msg-123',
        conversation_id: conversationId,
        sender_id: userId,
        content: 'Test message',
        created_at: '2025-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      const mockFrom = jest.fn();

      // Message insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessage,
              error: null,
            }),
          }),
        }),
      });

      // Get participants
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ user_id: userId }, { user_id: recipientId }],
            error: null,
          }),
        }),
      });

      // Get sender profile
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'John Sender' },
              error: null,
            }),
          }),
        }),
      });

      // Get recipient profile - NO EMAIL
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'Jane Recipient', email: null },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      const request = new NextRequest(
        `http://localhost:3000/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Test message' }),
        }
      );

      const response = await POST(request, {
        params: { id: conversationId },
      });

      // Wait for async email logic
      await new Promise((resolve) => setTimeout(resolve, 100));

      const data = await response.json();

      // Request should still succeed
      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.message).toEqual(mockMessage);
      // Email should not be sent
      expect(mockedSendEmail).not.toHaveBeenCalled();
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
