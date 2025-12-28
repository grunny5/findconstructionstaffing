import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConversationPage from '../page';

// Mock Next.js redirect (throws to stop execution like real redirect)
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: jest.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    toString: () => 'mocked-cookie-string',
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock ConversationThreadClient component
jest.mock('@/components/messages/ConversationThreadClient', () => ({
  ConversationThreadClient: jest
    .fn()
    .mockImplementation((props) => (
      <div data-testid="conversation-thread-client">{props.currentUserId}</div>
    )),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('ConversationPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockProfileQuery = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: 'user' },
            error: null,
          }),
        }),
      }),
    }),
  };

  const mockConversation = {
    id: 'conv-1',
    context_type: 'agency_inquiry',
    context_id: 'agency-1',
    last_message_at: '2025-01-11T10:00:00Z',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-11T10:00:00Z',
    participants: [
      {
        id: 'user-123',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 'user-456',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    last_message_preview: 'Hello, how are you?',
    unread_count: 2,
    agency_name: 'Test Agency',
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-456',
      content: 'Hello, how are you?',
      created_at: '2025-01-11T10:00:00Z',
      edited_at: null,
      deleted_at: null,
      sender: {
        id: 'user-456',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'user-123',
      content: "I'm good, thanks!",
      created_at: '2025-01-11T10:05:00Z',
      edited_at: null,
      deleted_at: null,
      sender: {
        id: 'user-123',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Authentication', () => {
    it('should redirect to login when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        ConversationPage({ params: { id: 'conv-1' } })
      ).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith(
        '/login?redirectTo=/messages/conversations/conv-1'
      );
    });

    it('should redirect to login when authentication fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Authentication failed'),
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        ConversationPage({ params: { id: 'conv-1' } })
      ).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith(
        '/login?redirectTo=/messages/conversations/conv-1'
      );
    });
  });

  describe('Data Fetching', () => {
    it('should fetch conversation and messages successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'user' },
                error: null,
              }),
            }),
          }),
        }),
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            conversation: mockConversation,
            messages: mockMessages,
            has_more: false,
          },
        }),
      });

      const result = await ConversationPage({ params: { id: 'conv-1' } });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages/conversations/conv-1?limit=50'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'mocked-cookie-string',
          },
          cache: 'no-store',
        })
      );

      // Verify result contains ConversationThreadClient with correct props
      expect(result.props.children.props.initialConversation).toEqual(
        mockConversation
      );
      expect(result.props.children.props.initialMessages).toEqual(mockMessages);
      expect(result.props.children.props.initialHasMore).toBe(false);
      expect(result.props.children.props.currentUserId).toBe(mockUser.id);
    });

    it('should handle 404 when conversation not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        ConversationPage({ params: { id: 'nonexistent-id' } })
      ).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalled();
    });

    it('should handle fetch error and return 404', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        ConversationPage({ params: { id: 'conv-1' } })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching conversation:',
        expect.any(Error)
      );
      expect(notFound).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error and return 404', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        ConversationPage({ params: { id: 'conv-1' } })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching conversation:',
        expect.any(Error)
      );
      expect(notFound).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return 404 when conversation is null after fetch', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            conversation: null,
            messages: [],
            has_more: false,
          },
        }),
      });

      await expect(
        ConversationPage({ params: { id: 'conv-1' } })
      ).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('Environment Variables', () => {
    it('should use NEXT_PUBLIC_SITE_URL when available', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            conversation: mockConversation,
            messages: mockMessages,
            has_more: false,
          },
        }),
      });

      await ConversationPage({ params: { id: 'conv-1' } });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/messages/conversations/conv-1?limit=50',
        expect.any(Object)
      );

      // Restore original env
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      }
    });

    it('should fallback to localhost when NEXT_PUBLIC_SITE_URL is not set', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            conversation: mockConversation,
            messages: mockMessages,
            has_more: false,
          },
        }),
      });

      await ConversationPage({ params: { id: 'conv-1' } });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/messages/conversations/conv-1?limit=50',
        expect.any(Object)
      );

      // Restore original env
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
      }
    });
  });

  describe('Pagination Support', () => {
    it('should pass has_more flag to client component', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        ...mockProfileQuery,
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            conversation: mockConversation,
            messages: mockMessages,
            has_more: true, // More messages available
          },
        }),
      });

      const result = await ConversationPage({ params: { id: 'conv-1' } });

      expect(result.props.children.props.initialHasMore).toBe(true);
    });
  });
});
