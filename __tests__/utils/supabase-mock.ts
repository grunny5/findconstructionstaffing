// Centralized Supabase mock setup for tests

// Define all Supabase method names for type safety
type SupabaseMethod = 
  | 'from' | 'select' | 'eq' | 'neq' | 'or' | 'in' | 'range' 
  | 'order' | 'limit' | 'single' | 'delete' | 'insert' | 'update'
  | 'upsert' | 'match' | 'is' | 'filter' | 'not' | 'gte' | 'gt'
  | 'lte' | 'lt' | 'like' | 'ilike' | 'contains' | 'containedBy'
  | 'rangeGt' | 'rangeGte' | 'rangeLt' | 'rangeLte' | 'rangeAdjacent'
  | 'overlaps' | 'textSearch' | 'count' | 'maybeSingle' | 'csv';

// Type for the mock Supabase object
type MockSupabase = {
  [K in SupabaseMethod]: jest.Mock;
} & {
  _error?: Error | null;
  _throwError?: boolean;
};

// Configuration for error simulation
export interface SupabaseMockConfig {
  throwError?: boolean;
  error?: Error | { message: string; code?: string };
  defaultData?: any;
  defaultCount?: number;
}

// Define createSupabaseMockInternal before using it in jest.mock
function createSupabaseMockInternal() {
  const mockSupabase = {
    from: jest.fn(),
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
    not: jest.fn(),
    match: jest.fn(),
    filter: jest.fn(),
    or: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    rangeGt: jest.fn(),
    rangeGte: jest.fn(),
    rangeLt: jest.fn(),
    rangeLte: jest.fn(),
    rangeAdjacent: jest.fn(),
    overlaps: jest.fn(),
    textSearch: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    count: jest.fn(),
    csv: jest.fn(),
    _error: null,
    _throwError: false
  };

  // Type-safe method chaining setup
  const methods = Object.keys(mockSupabase);
  methods.forEach((method) => {
    const value = mockSupabase[method];
    if (typeof value === 'function' && jest.isMockFunction(value)) {
      if (['single', 'maybeSingle', 'csv'].includes(method)) {
        value.mockImplementation(() => {
          if (mockSupabase._throwError && mockSupabase._error) {
            return Promise.reject(mockSupabase._error);
          }
          return Promise.resolve({
            data: null,
            error: mockSupabase._error,
            count: null
          });
        });
      } else if (method === 'count') {
        value.mockImplementation(() => {
          if (mockSupabase._throwError && mockSupabase._error) {
            return Promise.reject(mockSupabase._error);
          }
          return Promise.resolve({
            data: null,
            error: mockSupabase._error,
            count: 0
          });
        });
      } else {
        value.mockReturnValue(mockSupabase);
      }
    }
  });

  return mockSupabase;
}

// Module-level mock - properly hoisted
jest.mock('@/lib/supabase', () => {
  const { createSlug, formatPhoneNumber } = require('@/lib/utils/formatting');
  const mockSupabase = createSupabaseMockInternal();
  return {
    supabase: mockSupabase,
    createSlug,
    formatPhoneNumber
  };
});


// Public function to create and configure mock
export function createSupabaseMock(config?: SupabaseMockConfig) {
  const mockSupabase = createSupabaseMockInternal();
  
  if (config) {
    // Configure error simulation
    if (config.error) {
      mockSupabase._error = config.error instanceof Error 
        ? config.error 
        : new Error(config.error.message);
      mockSupabase._throwError = config.throwError || false;
    }
    
    // Configure default responses
    if (config.defaultData !== undefined || config.defaultCount !== undefined) {
      // Override order method to return configured data
      mockSupabase.order.mockImplementation(() => {
        if (mockSupabase._throwError && mockSupabase._error) {
          return Promise.reject(mockSupabase._error);
        }
        return Promise.resolve({
          data: config.defaultData || [],
          error: mockSupabase._error,
          count: config.defaultCount || null
        });
      });
    }
  }
  
  return mockSupabase;
}

// Helper to reset mock to default state
export function resetSupabaseMock(mock) {
  // Clear all mock calls
  const methods = Object.keys(mock);
  methods.forEach((method) => {
    const value = mock[method];
    if (typeof value === 'function' && jest.isMockFunction(value)) {
      value.mockClear();
    }
  });
  
  // Reset error state
  mock._error = null;
  mock._throwError = false;
}

// Helper to configure mock for specific test scenarios
export function configureSupabaseMock(mock, config) {
  if (config.error) {
    mock._error = config.error instanceof Error 
      ? config.error 
      : new Error(config.error.message);
    mock._throwError = config.throwError || false;
  }
  
  if (config.defaultData !== undefined || config.defaultCount !== undefined) {
    mock.order.mockImplementation(() => {
      if (mock._throwError && mock._error) {
        return Promise.reject(mock._error);
      }
      return Promise.resolve({
        data: config.defaultData || [],
        error: mock._error,
        count: config.defaultCount || null
      });
    });
  }
}