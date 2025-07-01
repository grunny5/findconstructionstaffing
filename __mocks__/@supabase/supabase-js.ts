// Enhanced mock for @supabase/supabase-js with TypeScript interfaces
import type { PostgrestResponse, PostgrestError, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'

// Sample test data for mocking
const mockAgencyData = [
  {
    id: 'mock-001',
    name: 'Mock Construction Staffing',
    slug: 'mock-construction-staffing',
    description: 'Test agency for mocking',
    is_active: true,
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
    offers_per_diem: false,
    is_union: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Define the query builder interface
interface SupabaseQueryBuilder<T = any> {
  // Query building methods
  from: jest.Mock<SupabaseQueryBuilder<T>>;
  select: jest.Mock<SupabaseQueryBuilder<T>>;
  insert: jest.Mock<SupabaseQueryBuilder<T>>;
  update: jest.Mock<SupabaseQueryBuilder<T>>;
  upsert: jest.Mock<SupabaseQueryBuilder<T>>;
  delete: jest.Mock<SupabaseQueryBuilder<T>>;
  
  // Filter methods
  eq: jest.Mock<SupabaseQueryBuilder<T>>;
  neq: jest.Mock<SupabaseQueryBuilder<T>>;
  gt: jest.Mock<SupabaseQueryBuilder<T>>;
  gte: jest.Mock<SupabaseQueryBuilder<T>>;
  lt: jest.Mock<SupabaseQueryBuilder<T>>;
  lte: jest.Mock<SupabaseQueryBuilder<T>>;
  like: jest.Mock<SupabaseQueryBuilder<T>>;
  ilike: jest.Mock<SupabaseQueryBuilder<T>>;
  is: jest.Mock<SupabaseQueryBuilder<T>>;
  in: jest.Mock<SupabaseQueryBuilder<T>>;
  contains: jest.Mock<SupabaseQueryBuilder<T>>;
  containedBy: jest.Mock<SupabaseQueryBuilder<T>>;
  or: jest.Mock<SupabaseQueryBuilder<T>>;
  not: jest.Mock<SupabaseQueryBuilder<T>>;
  match: jest.Mock<SupabaseQueryBuilder<T>>;
  filter: jest.Mock<SupabaseQueryBuilder<T>>;
  
  // Modifier methods
  order: jest.Mock<SupabaseQueryBuilder<T>>;
  limit: jest.Mock<SupabaseQueryBuilder<T>>;
  range: jest.Mock<SupabaseQueryBuilder<T>>;
  
  // Execution methods that return promises
  single: jest.Mock<Promise<PostgrestResponse<T>>>;
  maybeSingle: jest.Mock<Promise<PostgrestResponse<T>>>;
  csv: jest.Mock<Promise<PostgrestResponse<string>>>;
  execute: jest.Mock<Promise<PostgrestResponse<T[]>>>;
  
  // Promise-like methods for thenable behavior
  then: <TResult1 = PostgrestResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: PostgrestResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) => Promise<TResult1 | TResult2>;
  
  catch: <TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ) => Promise<PostgrestResponse<T[]> | TResult>;
  
  finally: (onfinally?: (() => void) | null) => Promise<PostgrestResponse<T[]>>;
  
  // Internal state for testing
  _mockData?: T[];
  _mockError?: PostgrestError;
  _shouldResolve?: boolean;
}

// Helper to create a promise-like query builder
function createQueryBuilder<T = any>(
  defaultData: T[] = mockAgencyData as any,
  defaultError: PostgrestError | null = null
): SupabaseQueryBuilder<T> {
  // Internal state
  let mockData = defaultData;
  let mockError = defaultError;
  let shouldResolve = true;
  
  // The base response promise
  const getResponse = (): Promise<PostgrestResponse<T[]>> => {
    return Promise.resolve({
      data: mockError ? null : mockData,
      error: mockError,
      count: mockError ? null : mockData.length,
      status: mockError ? 400 : 200,
      statusText: mockError ? 'Bad Request' : 'OK'
    } as PostgrestResponse<T[]>);
  };
  
  // Create the query builder object
  const queryBuilder: SupabaseQueryBuilder<T> = {
    // Query building methods - all return 'this' for chaining
    from: jest.fn(() => queryBuilder),
    select: jest.fn(() => queryBuilder),
    insert: jest.fn(() => queryBuilder),
    update: jest.fn(() => queryBuilder),
    upsert: jest.fn(() => queryBuilder),
    delete: jest.fn(() => queryBuilder),
    
    // Filter methods - all return 'this' for chaining
    eq: jest.fn(() => queryBuilder),
    neq: jest.fn(() => queryBuilder),
    gt: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lt: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    like: jest.fn(() => queryBuilder),
    ilike: jest.fn(() => queryBuilder),
    is: jest.fn(() => queryBuilder),
    in: jest.fn(() => queryBuilder),
    contains: jest.fn(() => queryBuilder),
    containedBy: jest.fn(() => queryBuilder),
    or: jest.fn(() => queryBuilder),
    not: jest.fn(() => queryBuilder),
    match: jest.fn(() => queryBuilder),
    filter: jest.fn(() => queryBuilder),
    
    // Modifier methods - all return 'this' for chaining
    order: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    range: jest.fn(() => queryBuilder),
    
    // Execution methods that return promises
    single: jest.fn(() => 
      getResponse().then(res => ({
        ...res,
        data: res.data?.[0] || null
      } as PostgrestResponse<T>))
    ) as jest.Mock<Promise<PostgrestResponse<T>>>,
    
    maybeSingle: jest.fn(() => 
      getResponse().then(res => ({
        ...res,
        data: res.data?.[0] || null
      } as PostgrestResponse<T>))
    ) as jest.Mock<Promise<PostgrestResponse<T>>>,
    
    csv: jest.fn(() => 
      getResponse().then(res => ({
        ...res,
        data: res.data ? 'id,name\n1,test' : null
      } as PostgrestResponse<string>))
    ) as jest.Mock<Promise<PostgrestResponse<string>>>,
    
    execute: jest.fn(() => getResponse()),
    
    // Promise-like methods
    then: (onfulfilled, onrejected) => getResponse().then(onfulfilled, onrejected),
    catch: (onrejected) => getResponse().catch(onrejected),
    finally: (onfinally) => getResponse().finally(onfinally),
    
    // Internal state for testing
    _mockData: mockData,
    _mockError: mockError as PostgrestError | undefined,
    _shouldResolve: shouldResolve
  };
  
  return queryBuilder;
}

// Create a mock client interface that has our test helper methods
interface SupabaseClient {
  from: <T = any>(table: string) => SupabaseQueryBuilder<T>;
  auth: any;
  storage: any;
  functions: any;
  // Helper method for tests to set mock data
  _setMockData: (data: any[]) => void;
  _setMockError: (error: PostgrestError | null) => void;
}

// Export the createClient mock
export const createClient = jest.fn((url: string, key: string): SupabaseClient => {
  let currentMockData = mockAgencyData;
  let currentMockError: PostgrestError | null = null;
  
  const client: SupabaseClient = {
    from: jest.fn((table: string) => createQueryBuilder(currentMockData as any, currentMockError)) as <T = any>(table: string) => SupabaseQueryBuilder<T>,
    
    auth: {
      signUp: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'mock-user-id' }, session: null }, 
        error: null 
      }),
      signIn: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'mock-user-id' }, session: { access_token: 'mock-token' } }, 
        error: null 
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'mock-user-id' } }, 
        error: null 
      }),
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: { access_token: 'mock-token' } }, 
        error: null 
      }),
    },
    
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
    
    functions: {
      invoke: jest.fn().mockResolvedValue({ 
        data: { result: 'mock-function-result' }, 
        error: null 
      }),
    },
    
    // Helper methods for tests
    _setMockData: (data: any[]) => {
      currentMockData = data;
    },
    _setMockError: (error: PostgrestError | null) => {
      currentMockError = error;
    },
  };
  
  return client;
});

// Export types for use in tests
export type { 
  SupabaseQueryBuilder, 
  SupabaseClient 
};