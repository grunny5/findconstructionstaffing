// Mock for @/lib/supabase/client
// Provides a fully mocked Supabase client for testing

import type { SupabaseClient } from '@supabase/supabase-js';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

// Mock session
const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer' as const,
  user: mockUser,
};

// Create a chainable query builder mock
const createQueryBuilderMock = () => {
  const builder = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    or: jest.fn(),
    not: jest.fn(),
    match: jest.fn(),
    filter: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    then: jest.fn(),
    catch: jest.fn(),
  };

  // Make all methods chainable (except then/catch)
  Object.keys(builder).forEach((key) => {
    if (
      key !== 'then' &&
      key !== 'catch' &&
      key !== 'single' &&
      key !== 'maybeSingle'
    ) {
      (builder as any)[key].mockReturnValue(builder);
    }
  });

  // Set up promise-like behavior for terminal methods
  builder.single.mockResolvedValue({
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  });

  builder.maybeSingle.mockResolvedValue({
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  });

  builder.then.mockImplementation((resolve: any) => {
    return Promise.resolve({
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: 'OK',
    }).then(resolve);
  });

  builder.catch.mockImplementation((reject: any) => {
    return Promise.resolve({
      data: [],
      error: null,
      count: 0,
      status: 200,
      statusText: 'OK',
    }).catch(reject);
  });

  return builder;
};

// Export createClient that returns a mocked Supabase instance
export const createClient = jest.fn((): SupabaseClient => {
  return {
    from: jest.fn(() => createQueryBuilderMock()),

    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      signInWithOAuth: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },

    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
        remove: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        list: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-file' },
        }),
      })),
    },

    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { result: 'mock-function-result' },
        error: null,
      }),
    },

    realtime: {
      channel: jest.fn(),
      channels: [],
      setAuth: jest.fn(),
      removeAllChannels: jest.fn(),
      removeChannel: jest.fn(),
    },
  } as unknown as SupabaseClient;
});
