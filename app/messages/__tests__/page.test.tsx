import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MessagesPage from '../page';

// Mock Next.js redirect (throws to stop execution like real redirect)
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
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

// Mock global fetch
global.fetch = jest.fn();

describe('MessagesPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockConversations = [
    {
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
          joined_at: '2025-01-10T10:00:00Z',
          last_read_at: '2025-01-10T12:00:00Z',
        },
        {
          id: 'user-456',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          joined_at: '2025-01-10T10:00:00Z',
          last_read_at: '2025-01-11T10:00:00Z',
        },
      ],
      last_message_preview: 'Hello, how are you?',
      unread_count: 2,
      agency_name: 'Test Agency',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
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
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(MessagesPage()).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login?redirectTo=/messages');
    });

    it('should redirect to login when authentication fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Authentication failed'),
          }),
        },
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(MessagesPage()).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login?redirectTo=/messages');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch conversations successfully and render inbox', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockConversations }),
      });

      const result = await MessagesPage();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages/conversations?limit=50'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'mocked-cookie-string',
          },
          cache: 'no-store',
        })
      );

      // Verify result contains MessagesInboxClient with correct props
      expect(result.props.children.props.initialConversations).toEqual(
        mockConversations
      );
      expect(result.props.children.props.currentUserId).toBe(mockUser.id);
    });

    it('should handle fetch error gracefully and render empty inbox', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await MessagesPage();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching conversations:',
        expect.any(Error)
      );

      // Verify result contains MessagesInboxClient with empty conversations
      expect(result.props.children.props.initialConversations).toEqual([]);
      expect(result.props.children.props.currentUserId).toBe(mockUser.id);

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error gracefully and render empty inbox', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await MessagesPage();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching conversations:',
        expect.any(Error)
      );

      // Verify result contains MessagesInboxClient with empty conversations
      expect(result.props.children.props.initialConversations).toEqual([]);
      expect(result.props.children.props.currentUserId).toBe(mockUser.id);

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty conversations response', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await MessagesPage();

      // Verify result contains MessagesInboxClient with empty conversations
      expect(result.props.children.props.initialConversations).toEqual([]);
      expect(result.props.children.props.currentUserId).toBe(mockUser.id);
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
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await MessagesPage();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/messages/conversations?limit=50',
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
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await MessagesPage();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/messages/conversations?limit=50',
        expect.any(Object)
      );

      // Restore original env
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
      }
    });
  });
});
