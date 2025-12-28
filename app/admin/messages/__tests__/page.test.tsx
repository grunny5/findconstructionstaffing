/**
 * @jest-environment node
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminMessagesPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT'); // Next.js redirect throws to stop execution
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock AdminMessagesClient component
jest.mock('@/components/admin/AdminMessagesClient', () => ({
  AdminMessagesClient: jest.fn(() => null),
}));

const mockRedirect = jest.mocked(redirect);
const mockCreateClient = jest.mocked(createClient);

describe('AdminMessagesPage', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication and Authorization', () => {
    it('should redirect to login if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(AdminMessagesPage()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith(
        '/login?redirectTo=/admin/messages'
      );
    });

    it('should redirect to login if auth error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      await expect(AdminMessagesPage()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith(
        '/login?redirectTo=/admin/messages'
      );
    });

    it('should redirect to home if user is not admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
        }),
      });

      await expect(AdminMessagesPage()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/?error=unauthorized');
    });

    it('should redirect to home if profile fetch fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Profile not found'),
            }),
          }),
        }),
      });

      await expect(AdminMessagesPage()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/?error=unauthorized');
    });

    it('should redirect to home if user is agency_owner (not admin)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'agency_owner' },
              error: null,
            }),
          }),
        }),
      });

      await expect(AdminMessagesPage()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/?error=unauthorized');
    });
  });

  describe('Data Fetching', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
    });

    it('should fetch conversations for admin user', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'conversations') {
          return {
            select: mockSelect,
            order: mockOrder,
            limit: mockLimit,
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [], error: null }),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
      });

      await AdminMessagesPage();

      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id'));
      expect(mockOrder).toHaveBeenCalledWith('last_message_at', {
        ascending: false,
      });
      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should handle conversations fetch error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          };
        }
      });

      const result = await AdminMessagesPage();

      // Should render error state instead of throwing
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should transform conversations with message counts and stats', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Reset mocks for this test
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'conv-1',
                  context_type: 'general',
                  context_id: null,
                  last_message_at: now.toISOString(),
                  created_at: twoDaysAgo.toISOString(),
                  conversation_participants: [
                    {
                      user_id: 'user-1',
                      profiles: {
                        id: 'user-1',
                        full_name: 'User One',
                        email: 'user1@example.com',
                        role: 'user',
                      },
                    },
                    {
                      user_id: 'user-2',
                      profiles: {
                        id: 'user-2',
                        full_name: 'User Two',
                        email: 'user2@example.com',
                        role: 'agency_owner',
                      },
                    },
                  ],
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'messages') {
          // Create separate chains for each query
          const selectReturn = {
            in: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({
              data: [
                { conversation_id: 'conv-1', created_at: now.toISOString() },
                {
                  conversation_id: 'conv-1',
                  created_at: new Date(now.getTime() - 1000).toISOString(),
                },
              ],
              error: null,
            }),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  conversation_id: 'conv-1',
                  content: 'Latest message',
                  created_at: now.toISOString(),
                  deleted_at: null,
                },
              ],
              error: null,
            }),
          };

          return {
            select: jest.fn().mockReturnValue(selectReturn),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
      });

      const result = await AdminMessagesPage();

      // Should successfully render without error (no redirect thrown)
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
