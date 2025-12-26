/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

// Helper function to create conversation_participants mock
function createParticipantsMock(participants: any[]) {
  const selectQuery = {
    eq: jest.fn().mockResolvedValue({
      data: participants,
      error: null,
    }),
  };

  const updateQueryFinal = {
    eq: jest.fn().mockReturnThis(),
    then: jest.fn((callback: any) => {
      callback({ error: null });
      return Promise.resolve({ error: null });
    }),
  };

  const updateQuery = {
    eq: jest.fn().mockReturnValue(updateQueryFinal),
  };

  return {
    select: jest.fn().mockReturnValue(selectQuery),
    update: jest.fn().mockReturnValue(updateQuery),
  };
}

describe('GET /api/messages/conversations/[id]', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);

    // Default auth success
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
  });

  describe('Success Cases', () => {
    it('should fetch conversation with messages successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        context_type: 'general',
        context_id: null,
        last_message_at: '2024-01-15T12:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      const mockParticipants = [
        {
          user_id: 'user-123',
          joined_at: '2024-01-15T10:00:00Z',
          last_read_at: '2024-01-15T11:00:00Z',
          profiles: {
            id: 'user-123',
            full_name: 'Test User',
            email: 'test@example.com',
          },
        },
        {
          user_id: 'user-456',
          joined_at: '2024-01-15T10:00:00Z',
          last_read_at: '2024-01-15T10:30:00Z',
          profiles: {
            id: 'user-456',
            full_name: 'Other User',
            email: 'other@example.com',
          },
        },
      ];

      const mockMessages = [
        {
          id: 'msg-3',
          conversation_id: 'conv-123',
          sender_id: 'user-456',
          content: 'Third message',
          created_at: '2024-01-15T12:00:00Z',
          edited_at: null,
          deleted_at: null,
          profiles: {
            id: 'user-456',
            full_name: 'Other User',
            email: 'other@example.com',
          },
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-123',
          sender_id: 'user-123',
          content: 'Second message',
          created_at: '2024-01-15T11:00:00Z',
          edited_at: null,
          deleted_at: null,
          profiles: {
            id: 'user-123',
            full_name: 'Test User',
            email: 'test@example.com',
          },
        },
        {
          id: 'msg-1',
          conversation_id: 'conv-123',
          sender_id: 'user-123',
          content: 'First message',
          created_at: '2024-01-15T10:00:00Z',
          edited_at: null,
          deleted_at: null,
          profiles: {
            id: 'user-123',
            full_name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock(mockParticipants);
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.conversation).toMatchObject({
        id: 'conv-123',
        context_type: 'general',
        participants: expect.arrayContaining([
          expect.objectContaining({ id: 'user-123' }),
          expect.objectContaining({ id: 'user-456' }),
        ]),
      });
      expect(data.data.messages).toHaveLength(3);
      expect(data.data.messages[0]).toMatchObject({
        id: 'msg-3',
        content: 'Third message',
        sender: expect.objectContaining({ id: 'user-456' }),
      });
      expect(data.data.has_more).toBe(false);
    });

    it('should fetch conversation with agency context', async () => {
      const mockConversation = {
        id: 'conv-456',
        context_type: 'agency_inquiry',
        context_id: 'agency-123',
        last_message_at: '2024-01-15T12:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      const mockParticipants = [
        {
          user_id: 'user-123',
          joined_at: '2024-01-15T10:00:00Z',
          last_read_at: null,
          profiles: {
            id: 'user-123',
            full_name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      const mockAgency = { name: 'Test Agency' };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock(mockParticipants);
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174001'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174001' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.conversation.context_type).toBe('agency_inquiry');
      expect(data.data.conversation.agency_name).toBe('Test Agency');
    });

    it('should handle pagination with has_more=true', async () => {
      const mockMessages = Array.from({ length: 51 }, (_, i) => ({
        id: `msg-${i}`,
        conversation_id: 'conv-123',
        sender_id: 'user-123',
        content: `Message ${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        edited_at: null,
        deleted_at: null,
        profiles: {
          id: 'user-123',
          full_name: 'Test User',
          email: 'test@example.com',
        },
      }));

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'conv-123',
                context_type: 'general',
                context_id: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock([]);
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.messages).toHaveLength(50);
      expect(data.data.has_more).toBe(true);
    });

    it('should handle cursor-based pagination with before param', async () => {
      const cursorMessage = {
        created_at: '2024-01-15T12:00:00Z',
      };

      const mockMessages = [
        {
          id: 'msg-2',
          conversation_id: 'conv-123',
          sender_id: 'user-123',
          content: 'Earlier message',
          created_at: '2024-01-15T11:00:00Z',
          edited_at: null,
          deleted_at: null,
          profiles: {
            id: 'user-123',
            full_name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      // Track which call to from('messages') this is
      let messagesCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'conv-123',
                context_type: 'general',
                context_id: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock([]);
        }
        if (table === 'messages') {
          messagesCallCount++;

          if (messagesCallCount === 1) {
            // First call: Main messages query builder (line 175 in route)
            // Create a thenable query builder that can be chained and awaited
            const queryBuilder: any = {
              select: jest.fn(),
              eq: jest.fn(),
              order: jest.fn(),
              lt: jest.fn(),
              limit: jest.fn(),
              then: jest.fn((resolve) =>
                Promise.resolve(resolve({ data: mockMessages, error: null }))
              ),
            };

            // Make all methods return the queryBuilder itself for chaining
            queryBuilder.select.mockReturnValue(queryBuilder);
            queryBuilder.eq.mockReturnValue(queryBuilder);
            queryBuilder.order.mockReturnValue(queryBuilder);
            queryBuilder.lt.mockReturnValue(queryBuilder);
            queryBuilder.limit.mockReturnValue(queryBuilder);

            return queryBuilder;
          } else {
            // Second call: Fetch cursor message (line 200 in route)
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: cursorMessage,
                error: null,
              }),
            };
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000?before=123e4567-e89b-12d3-a456-426614174999'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.messages).toHaveLength(1);
    });

    it('should handle custom limit parameter', async () => {
      const mockMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        conversation_id: 'conv-123',
        sender_id: 'user-123',
        content: `Message ${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        edited_at: null,
        deleted_at: null,
        profiles: {
          id: 'user-123',
          full_name: 'Test User',
          email: 'test@example.com',
        },
      }));

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'conv-123',
                context_type: 'general',
                context_id: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock([]);
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000?limit=10'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.messages).toHaveLength(10);
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid UUID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/invalid-uuid'
      );

      const response = await GET(request, {
        params: { id: 'invalid-uuid' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid conversation ID format');
    });

    it('should return 400 for invalid before parameter (not UUID)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000?before=invalid'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid query parameters');
    });

    it('should return 400 for limit exceeding max (100)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000?limit=101'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 for negative limit', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000?limit=-1'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Authorization', () => {
    it('should return 404 when conversation not found', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe(
        'Conversation not found or you do not have access'
      );
    });
  });

  describe('Database Errors', () => {
    it('should return 500 when participants fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'conv-123',
                context_type: 'general',
                context_id: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe(
        'Failed to fetch conversation participants'
      );
    });

    it('should return 500 when messages fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'conv-123',
                context_type: 'general',
                context_id: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'conversation_participants') {
          return createParticipantsMock([]);
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch messages');
    });

    it('should return 500 when unexpected error occurs', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations/123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request, {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });

      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });
});
