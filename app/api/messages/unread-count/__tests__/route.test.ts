import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

describe('GET /api/messages/unread-count', () => {
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
    it('should return zero counts when user has no conversations', async () => {
      // Mock auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock no participants
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(0);
      expect(data.data.conversations_with_unread).toBe(0);
    });

    it('should return zero counts when conversations have no messages', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Mock participants but no messages
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    conversation_id: 'conv-1',
                    last_read_at: '2025-01-01T00:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(0);
      expect(data.data.conversations_with_unread).toBe(0);
    });

    it('should count unread messages correctly when last_read_at is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    conversation_id: 'conv-1',
                    last_read_at: null, // Never read
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'msg-1',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T12:00:00Z',
                    },
                    {
                      id: 'msg-2',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T13:00:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(2);
      expect(data.data.conversations_with_unread).toBe(1);
    });

    it('should count unread messages created after last_read_at', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    conversation_id: 'conv-1',
                    last_read_at: '2025-01-01T12:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'msg-1',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T11:00:00Z', // Before last_read_at - read
                    },
                    {
                      id: 'msg-2',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T13:00:00Z', // After last_read_at - unread
                    },
                    {
                      id: 'msg-3',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T14:00:00Z', // After last_read_at - unread
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(2);
      expect(data.data.conversations_with_unread).toBe(1);
    });

    it('should count unread messages across multiple conversations', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    conversation_id: 'conv-1',
                    last_read_at: '2025-01-01T12:00:00Z',
                  },
                  {
                    conversation_id: 'conv-2',
                    last_read_at: null, // Never read
                  },
                  {
                    conversation_id: 'conv-3',
                    last_read_at: '2025-01-01T15:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'msg-1',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T13:00:00Z', // Unread (after last_read_at)
                    },
                    {
                      id: 'msg-2',
                      conversation_id: 'conv-2',
                      created_at: '2025-01-01T14:00:00Z', // Unread (never read)
                    },
                    {
                      id: 'msg-3',
                      conversation_id: 'conv-2',
                      created_at: '2025-01-01T14:30:00Z', // Unread (never read)
                    },
                    {
                      id: 'msg-4',
                      conversation_id: 'conv-3',
                      created_at: '2025-01-01T14:00:00Z', // Read (before last_read_at)
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(3);
      expect(data.data.conversations_with_unread).toBe(2);
    });

    it('should return correct counts when all messages are read', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    conversation_id: 'conv-1',
                    last_read_at: '2025-01-01T15:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'msg-1',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T12:00:00Z',
                    },
                    {
                      id: 'msg-2',
                      conversation_id: 'conv-1',
                      created_at: '2025-01-01T13:00:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.total_unread).toBe(0);
      expect(data.data.conversations_with_unread).toBe(0);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to view unread counts'
      );
    });

    it('should return 401 when auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Database Errors', () => {
    it('should handle error fetching conversation participants', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch unread counts');
    });

    it('should handle error fetching messages', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_participants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ conversation_id: 'conv-1', last_read_at: null }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch unread counts');
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/messages/unread-count'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
