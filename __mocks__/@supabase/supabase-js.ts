// Enhanced mock for @supabase/supabase-js with full TypeScript support
import type {
  PostgrestResponse,
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
  SupabaseClient as SupabaseClientType,
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
  from: jest.Mock<ChainableQueryBuilder<T>>;
  select: jest.Mock<ChainableQueryBuilder<T>>;
  insert: jest.Mock<ChainableQueryBuilder<T>>;
  update: jest.Mock<ChainableQueryBuilder<T>>;
  upsert: jest.Mock<ChainableQueryBuilder<T>>;
  delete: jest.Mock<ChainableQueryBuilder<T>>;
  eq: jest.Mock<ChainableQueryBuilder<T>>;
  neq: jest.Mock<ChainableQueryBuilder<T>>;
  gt: jest.Mock<ChainableQueryBuilder<T>>;
  gte: jest.Mock<ChainableQueryBuilder<T>>;
  lt: jest.Mock<ChainableQueryBuilder<T>>;
  lte: jest.Mock<ChainableQueryBuilder<T>>;
  like: jest.Mock<ChainableQueryBuilder<T>>;
  ilike: jest.Mock<ChainableQueryBuilder<T>>;
  is: jest.Mock<ChainableQueryBuilder<T>>;
  in: jest.Mock<ChainableQueryBuilder<T>>;
  contains: jest.Mock<ChainableQueryBuilder<T>>;
  containedBy: jest.Mock<ChainableQueryBuilder<T>>;
  or: jest.Mock<ChainableQueryBuilder<T>>;
  not: jest.Mock<ChainableQueryBuilder<T>>;
  match: jest.Mock<ChainableQueryBuilder<T>>;
  filter: jest.Mock<ChainableQueryBuilder<T>>;
  order: jest.Mock<ChainableQueryBuilder<T>>;
  limit: jest.Mock<ChainableQueryBuilder<T>>;
  range: jest.Mock<ChainableQueryBuilder<T>>;
  single: jest.Mock<Promise<PostgrestSingleResponse<T>>>;
  maybeSingle: jest.Mock<Promise<PostgrestMaybeSingleResponse<T>>>;
  csv: jest.Mock<Promise<PostgrestResponse<string>>>;
  execute: jest.Mock<Promise<PostgrestResponse<T[]>>>;
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
  } as PostgrestResponse<T[]>);

  const queryBuilder: ChainableQueryBuilder<T> = {} as ChainableQueryBuilder<T>;

  // Chain methods - all return 'this' for chaining
  const chainMethods = [
    'from',
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'or',
    'not',
    'match',
    'filter',
    'order',
    'limit',
    'range',
  ];

  chainMethods.forEach((method) => {
    (queryBuilder as any)[method] = jest.fn(() => queryBuilder);
  });

  // Execution methods
  queryBuilder.single = jest.fn(() =>
    responsePromise.then(
      (res) =>
        ({
          ...res,
          data: Array.isArray(res.data) ? res.data[0] || null : null,
        }) as PostgrestSingleResponse<T>
    )
  ) as jest.Mock<Promise<PostgrestSingleResponse<T>>>;

  queryBuilder.maybeSingle = jest.fn(() =>
    responsePromise.then(
      (res) =>
        ({
          ...res,
          data: Array.isArray(res.data) ? res.data[0] || null : null,
        }) as PostgrestMaybeSingleResponse<T>
    )
  ) as jest.Mock<Promise<PostgrestMaybeSingleResponse<T>>>;

  queryBuilder.csv = jest.fn(() =>
    responsePromise.then(
      (res) =>
        ({
          ...res,
          data: res.data ? 'id,name\n1,test' : null,
        }) as PostgrestResponse<string>
    )
  ) as jest.Mock<Promise<PostgrestResponse<string>>>;

  queryBuilder.execute = jest.fn(() => responsePromise) as jest.Mock<
    Promise<PostgrestResponse<T[]>>
  >;

  // Promise-like methods
  queryBuilder.then = (onfulfilled, onrejected) =>
    responsePromise.then(onfulfilled, onrejected);

  queryBuilder.catch = (onrejected) => responsePromise.catch(onrejected);

  queryBuilder.finally = (onfinally) => responsePromise.finally(onfinally);

  return queryBuilder;
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
  SupabaseClientType as SupabaseClient,
};
