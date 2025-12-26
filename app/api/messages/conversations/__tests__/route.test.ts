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

describe('GET /api/messages/conversations', () => {
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
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to access conversations'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should reject invalid limit parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?limit=abc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid query parameters');
      expect(data.error.details).toBeDefined();
    });

    it('should reject limit below 1', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?limit=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.limit).toContain('at least 1');
    });

    it('should reject limit above 100', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?limit=101'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.limit).toContain('not exceed 100');
    });

    it('should reject negative offset', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?offset=-1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.offset).toContain('0 or greater');
    });

    it('should reject invalid filter value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?filter=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.filter).toContain('all, unread');
    });

    it('should reject search term exceeding 100 characters', async () => {
      const longSearch = 'a'.repeat(101);
      const request = new NextRequest(
        `http://localhost:3000/api/messages/conversations?search=${longSearch}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.search).toContain('less than 100 characters');
    });

    it('should accept valid query parameters with defaults', async () => {
      // Mock empty conversations response
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockConversationsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.pagination.limit).toBe(25); // Default limit
      expect(data.pagination.offset).toBe(0); // Default offset
    });
  });

  describe('Empty Conversations', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should return empty array when user has no conversations', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockConversationsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should return empty array when conversations is null', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockConversationsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('Successful Conversation Retrieval', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockConversations = [
      {
        id: 'conv-1',
        context_type: 'general',
        context_id: null,
        last_message_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'conv-2',
        context_type: 'agency_inquiry',
        context_id: 'agency-1',
        last_message_at: '2024-01-14T10:00:00Z',
        created_at: '2024-01-09T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z',
      },
    ];

    const mockParticipants = [
      {
        conversation_id: 'conv-1',
        user_id: 'user-123',
        last_read_at: '2024-01-15T09:00:00Z',
        profiles: {
          id: 'user-123',
          full_name: 'Test User',
          email: 'test@example.com',
        },
      },
      {
        conversation_id: 'conv-1',
        user_id: 'user-456',
        last_read_at: '2024-01-15T10:00:00Z',
        profiles: {
          id: 'user-456',
          full_name: 'Other User',
          email: 'other@example.com',
        },
      },
      {
        conversation_id: 'conv-2',
        user_id: 'user-123',
        last_read_at: null,
        profiles: {
          id: 'user-123',
          full_name: 'Test User',
          email: 'test@example.com',
        },
      },
      {
        conversation_id: 'conv-2',
        user_id: 'user-789',
        last_read_at: '2024-01-14T10:00:00Z',
        profiles: {
          id: 'user-789',
          full_name: 'Agency Owner',
          email: 'agency@example.com',
        },
      },
    ];

    const mockMessages = [
      {
        conversation_id: 'conv-1',
        content: 'Latest message in conversation 1',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        conversation_id: 'conv-1',
        content: 'Unread message in conversation 1',
        created_at: '2024-01-15T09:30:00Z',
      },
      {
        conversation_id: 'conv-2',
        content: 'Latest message in conversation 2',
        created_at: '2024-01-14T10:00:00Z',
      },
    ];

    const mockAgencies = [
      {
        id: 'agency-1',
        name: 'Test Staffing Agency',
      },
    ];

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    const setupSuccessfulMocks = () => {
      // Mock conversations query
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockConversations,
          error: null,
          count: 2,
        }),
      };

      // Mock participants query
      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockParticipants,
          error: null,
        }),
      };

      // Mock messages query
      const mockMessagesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockMessages,
          error: null,
        }),
      };

      // Mock agencies query
      const mockAgenciesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockAgencies,
          error: null,
        }),
      };

      // Return different mocks based on call order
      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery)
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockAgenciesQuery);
    };

    it('should return conversations with enriched data', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.hasMore).toBe(false);

      // Check first conversation
      expect(data.data[0].id).toBe('conv-1');
      expect(data.data[0].participants).toBeDefined();
      expect(data.data[0].last_message_preview).toBe(
        'Latest message in conversation 1'
      );
      expect(data.data[0].unread_count).toBeGreaterThanOrEqual(0);

      // Check second conversation (agency_inquiry)
      expect(data.data[1].id).toBe('conv-2');
      expect(data.data[1].context_type).toBe('agency_inquiry');
      expect(data.data[1].agency_name).toBe('Test Staffing Agency');
    });

    it('should calculate unread count correctly', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      // conv-1: user last_read_at = 2024-01-15T09:00:00Z
      // Messages after: 09:30:00Z (1 message) and 10:00:00Z (1 message)
      // Should have 2 unread messages
      expect(data.data[0].unread_count).toBe(2);

      // conv-2: user last_read_at = null
      // All messages unread
      expect(data.data[1].unread_count).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      // Mock for pagination test with hasMore = true
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockConversations[0]],
          error: null,
          count: 2,
        }),
      };

      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockMessagesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery)
        .mockReturnValueOnce(mockMessagesQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?limit=1&offset=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.offset).toBe(0);
      expect(data.pagination.hasMore).toBe(true); // 1 < 2 total
    });

    it('should apply unread filter correctly', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?filter=unread'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Should only return conversations with unread_count > 0
      expect(data.data.every((c: any) => c.unread_count > 0)).toBe(true);
    });

    it('should apply search filter correctly', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?search=agency'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Should only return conversations with participants matching "agency"
      const hasMatchingParticipant = data.data.some((c: any) =>
        c.participants.some(
          (p: any) =>
            p.full_name?.toLowerCase().includes('agency') ||
            p.email?.toLowerCase().includes('agency')
        )
      );
      expect(hasMatchingParticipant).toBe(true);
    });

    it('should use filtered count for pagination when filter applied', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?filter=unread'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // total should reflect filtered count, not DB count
      expect(data.pagination.total).toBe(data.data.length);
      // hasMore should be false when filters applied (client-side filtering)
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should use filtered count for pagination when search applied', async () => {
      setupSuccessfulMocks();

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations?search=test'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // total should reflect filtered count, not DB count
      expect(data.pagination.total).toBe(data.data.length);
      // hasMore should be false when filters applied (client-side filtering)
      expect(data.pagination.hasMore).toBe(false);
    });
  });

  describe('Database Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should return 500 when conversations query fails', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockConversationsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch conversations');
    });

    it('should return 500 when participants query fails', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'conv-1',
              context_type: 'general',
              context_id: null,
              last_message_at: '2024-01-15T10:00:00Z',
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
          count: 1,
        }),
      };

      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Participants query failed' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe(
        'Failed to fetch conversation participants'
      );
    });

    it('should handle messages query errors gracefully', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'conv-1',
              context_type: 'general',
              context_id: null,
              last_message_at: '2024-01-15T10:00:00Z',
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
          count: 1,
        }),
      };

      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockMessagesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Messages query failed' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery)
        .mockReturnValueOnce(mockMessagesQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      // Should still return 200 but with null last_message_preview
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data[0].last_message_preview).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should handle conversation without agency_inquiry context', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'conv-1',
              context_type: 'general',
              context_id: null,
              last_message_at: '2024-01-15T10:00:00Z',
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
          count: 1,
        }),
      };

      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockMessagesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery)
        .mockReturnValueOnce(mockMessagesQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data[0].agency_name).toBeNull();
    });

    it('should truncate long message previews to 200 characters', async () => {
      const longMessage = 'a'.repeat(300);

      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'conv-1',
              context_type: 'general',
              context_id: null,
              last_message_at: '2024-01-15T10:00:00Z',
              created_at: '2024-01-10T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
          count: 1,
        }),
      };

      const mockParticipantsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockMessagesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              conversation_id: 'conv-1',
              content: longMessage,
              created_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockConversationsQuery)
        .mockReturnValueOnce(mockParticipantsQuery)
        .mockReturnValueOnce(mockMessagesQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data[0].last_message_preview).toHaveLength(200);
    });
  });

  describe('Unexpected Errors', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      const mockConversationsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockConversationsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/messages/conversations'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
