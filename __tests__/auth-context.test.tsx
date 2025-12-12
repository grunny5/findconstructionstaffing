/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// Mock the supabase module
jest.mock('@/lib/supabase', () => {
  const mockAuth = {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  };

  const mockSupabase = {
    auth: mockAuth,
    from: jest.fn(),
  };

  return {
    supabase: mockSupabase,
    createClient: jest.fn(() => mockSupabase),
  };
});

// Mock user data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

const mockAdminProfile: Profile = {
  id: 'user-123',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAgencyOwnerProfile: Profile = {
  id: 'user-123',
  email: 'owner@example.com',
  full_name: 'Agency Owner',
  role: 'agency_owner',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUserProfile: Profile = {
  id: 'user-123',
  email: 'user@example.com',
  full_name: 'Regular User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Wrapper component for AuthProvider
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  Wrapper.displayName = 'AuthWrapper';
  return Wrapper;
};

describe('AuthProvider and useAuth', () => {
  let mockOnAuthStateChange: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    // Clear call history for each mock function (don't use jest.clearAllMocks!)
    if (supabase?.auth?.getSession) {
      (supabase.auth.getSession as jest.Mock).mockClear();
    }
    if (supabase?.auth?.signInWithPassword) {
      (supabase.auth.signInWithPassword as jest.Mock).mockClear();
    }
    if (supabase?.auth?.signUp) {
      (supabase.auth.signUp as jest.Mock).mockClear();
    }
    if (supabase?.auth?.signOut) {
      (supabase.auth.signOut as jest.Mock).mockClear();
    }
    if (supabase?.auth?.onAuthStateChange) {
      (supabase.auth.onAuthStateChange as jest.Mock).mockClear();
    }
    if (supabase?.from) {
      (supabase.from as jest.Mock).mockClear();
    }

    mockUnsubscribe = jest.fn();
    mockOnAuthStateChange = jest.fn(() => ({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    }));

    // Set the onAuthStateChange mock implementation
    if (supabase?.auth?.onAuthStateChange) {
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        mockOnAuthStateChange
      );
    }
  });

  describe('Initialization', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should initialize with loading state when no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.loading).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAgencyOwner).toBe(false);
    });

    it('should initialize with session and fetch profile', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockAdminProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.profile).toEqual(mockAdminProfile);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isAgencyOwner).toBe(false);
    });

    it('should handle profile fetch error gracefully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' },
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching profile:',
        expect.objectContaining({ message: 'Profile not found' })
      );

      consoleSpy.mockRestore();
    });

    it('should subscribe to auth state changes', () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on sign in failure', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signIn('wrong@example.com', 'wrongpassword')
      ).rejects.toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('Sign Up', () => {
    it('should sign up successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp(
          'new@example.com',
          'password123',
          'New User'
        );
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
          },
        },
      });
    });

    it('should sign up without full name', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: undefined,
          },
        },
      });
    });

    it('should throw error on sign up failure', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signUp('existing@example.com', 'password123')
      ).rejects.toEqual({ message: 'Email already exists' });
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error on sign out failure', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.signOut()).rejects.toEqual({
        message: 'Sign out failed',
      });
    });
  });

  describe('Role Checking', () => {
    it('should correctly identify admin users', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockAdminProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isAgencyOwner).toBe(false);
    });

    it('should correctly identify agency owner users', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockAgencyOwnerProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAgencyOwner).toBe(true);
    });

    it('should correctly identify regular users', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAgencyOwner).toBe(false);
    });

    it('should return false for role checks when profile is null', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAgencyOwner).toBe(false);
    });
  });

  describe('Auth State Changes', () => {
    it('should update state when user signs in via auth state change', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      let authStateCallback: (event: string, session: any) => void = () => {};
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      // Simulate auth state change
      await act(async () => {
        authStateCallback('SIGNED_IN', { user: mockUser });
        // Give time for profile fetch
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.profile).toEqual(mockUserProfile);
      });
    });

    it('should clear state when user signs out via auth state change', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      let authStateCallback: (event: string, session: any) => void = () => {};
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      });

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock) = mockFrom;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate auth state change to signed out
      await act(async () => {
        authStateCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Context Value', () => {
    it('should provide all required context values', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('profile');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signIn');
      expect(result.current).toHaveProperty('signUp');
      expect(result.current).toHaveProperty('signOut');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('isAgencyOwner');

      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
    });
  });
});
