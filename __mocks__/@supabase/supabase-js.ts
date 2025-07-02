// Enhanced mock for @supabase/supabase-js with full TypeScript support
import type {
  PostgrestResponse,
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
  SupabaseClient as SupabaseClientType,
  PostgrestQueryBuilder,
  PostgrestFilterBuilder,
  PostgrestBuilder,
} from '@supabase/supabase-js';

// Sample test data for mocking
const mockAgencyData = [
  {
    id: 'mock-001',
    name: 'Mock Construction Staffing',
    slug: 'mock-construction-staffing',
    description: 'Test agency for mocking',
    is_active: true,
    is_claimed: false,
    offers_per_diem: true,
    is_union: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-002',
    name: 'Test Builders Inc',
    slug: 'test-builders-inc',
    description: 'Another test agency',
    is_active: true,
    is_claimed: false,
    offers_per_diem: false,
    is_union: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create a complete PostgrestError
function createPostgrestError(
  message: string,
  code: string = 'PGRST000',
  details: string = '',
  hint: string = ''
): PostgrestError {
  return {
    message,
    code,
    details,
    hint,
    name: 'PostgrestError',
  } as PostgrestError;
}

// Type for chainable query builder
type ChainableQueryBuilder<T = any> = {
  [K in keyof PostgrestFilterBuilder<any, any, T[], string, unknown>]: (
    ...args: any[]
  ) => ChainableQueryBuilder<T>;
} & {
  then<TResult1 = PostgrestResponse<T[]>, TResult2 = never>(
    onfulfilled?:
      | ((value: PostgrestResponse<T[]>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<PostgrestResponse<T[]> | TResult>;
  finally(onfinally?: (() => void) | null): Promise<PostgrestResponse<T[]>>;
};

// Helper to create a chainable query builder
function createChainableQueryBuilder<T = any>(
  mockData: T[] = [],
  mockError: PostgrestError | null = null
): ChainableQueryBuilder<T> {
  // Create the promise that will be returned
  const responsePromise = Promise.resolve<PostgrestResponse<T[]>>({
    data: mockError ? null : mockData,
    error: mockError,
    count: mockError ? null : mockData.length,
    status: mockError ? 400 : 200,
    statusText: mockError ? 'Bad Request' : 'OK',
  });

  // Create a proxy that returns itself for all method calls
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      // Handle promise methods
      if (prop === 'then') {
        return responsePromise.then.bind(responsePromise);
      }
      if (prop === 'catch') {
        return responsePromise.catch.bind(responsePromise);
      }
      if (prop === 'finally') {
        return responsePromise.finally.bind(responsePromise);
      }

      // Handle special execution methods
      if (prop === 'single' || prop === 'maybeSingle') {
        return jest.fn(() =>
          responsePromise.then((res) => ({
            ...res,
            data: res.data?.[0] || null,
          }))
        );
      }
      if (prop === 'csv') {
        return jest.fn(() =>
          responsePromise.then((res) => ({
            ...res,
            data: res.data ? 'id,name\n1,test' : null,
          }))
        );
      }

      // All other methods return the proxy for chaining
      return jest.fn(() => new Proxy({}, handler));
    },
  };

  return new Proxy({}, handler) as ChainableQueryBuilder<T>;
}

// Create the mock Supabase client
interface MockSupabaseClient extends SupabaseClientType {
  _setMockData: (data: any[]) => void;
  _setMockError: (error: PostgrestError | null) => void;
}

// Create client factory
export const createClient = jest.fn(
  (url: string, key: string): MockSupabaseClient => {
    let currentMockData: any[] = mockAgencyData;
    let currentMockError: PostgrestError | null = null;

    const client = {
      from: jest.fn((table: string) => {
        return createChainableQueryBuilder(currentMockData, currentMockError);
      }),

      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id' }, session: null },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'mock-user-id' },
            session: { access_token: 'mock-token' },
          },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id' } },
          error: null,
        }),
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'mock-token' } },
          error: null,
        }),
        // Add other auth methods as needed
        signInWithOAuth: jest.fn(),
        signInWithOtp: jest.fn(),
        verifyOtp: jest.fn(),
        updateUser: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        onAuthStateChange: jest.fn(),
      },

      storage: {
        from: jest.fn((bucket: string) => ({
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
        channels: [],
        setAuth: jest.fn(),
        removeAllChannels: jest.fn(),
        removeChannel: jest.fn(),
      },

      // Helper methods for testing
      _setMockData: (data: any[]) => {
        currentMockData = data;
      },
      _setMockError: (error: PostgrestError | null) => {
        currentMockError = error;
      },
    } as unknown as MockSupabaseClient;

    return client;
  }
);

// Export helper to create errors
export { createPostgrestError };

// Export types
export type {
  PostgrestResponse,
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
  SupabaseClient,
  SupabaseClientType,
};