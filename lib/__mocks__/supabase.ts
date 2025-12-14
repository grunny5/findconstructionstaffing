// Consolidated Supabase mock for @/lib/supabase
// This mock uses the mocked createClient from @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

// Create and export the default mock instance using the mocked createClient
export const supabase = createClient(
  'https://test.supabase.co',
  'test-anon-key'
);

// Define comprehensive Supabase method types for type safety
type SupabaseMethod =
  | 'from'
  | 'select'
  | 'eq'
  | 'neq'
  | 'or'
  | 'in'
  | 'range'
  | 'order'
  | 'limit'
  | 'single'
  | 'delete'
  | 'insert'
  | 'update'
  | 'upsert'
  | 'match'
  | 'is'
  | 'filter'
  | 'not'
  | 'gte'
  | 'gt'
  | 'lte'
  | 'lt'
  | 'like'
  | 'ilike'
  | 'contains'
  | 'containedBy'
  | 'rangeGt'
  | 'rangeGte'
  | 'rangeLt'
  | 'rangeLte'
  | 'rangeAdjacent'
  | 'overlaps'
  | 'textSearch'
  | 'count'
  | 'maybeSingle'
  | 'csv';

// Factory function to create a mock Supabase instance (kept for backwards compatibility)
// This approach provides better control for test-specific configurations
export function createMockSupabase() {
  return createClient('https://test.supabase.co', 'test-anon-key');
}

// Legacy mock object for backwards compatibility with tests that don't use createClient
const legacyMock: Record<string, jest.Mock | any> = {
    // Add _error property to signal this is a mock to API routes
    _error: true,

    // Query builder methods
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),

    // Filter methods
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

    // Modifier methods
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),

    // Execute methods
    single: jest.fn(),
    maybeSingle: jest.fn(),
    count: jest.fn(),
    csv: jest.fn(),
  };

  // Set up method chaining - each method returns the mock object
  Object.keys(legacyMock).forEach((method) => {
    // Skip non-function properties
    if (typeof legacyMock[method] !== 'function') return;

    // Terminal methods that return promises
    if (['single', 'maybeSingle', 'csv'].includes(method)) {
      legacyMock[method].mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: null,
          count: null,
        })
      );
    } else if (method === 'count') {
      legacyMock[method].mockImplementation(() =>
        Promise.resolve({
          data: null,
          error: null,
          count: 0,
        })
      );
    } else if (method === 'order') {
      // Order is often the final method in a chain before execution
      legacyMock[method].mockImplementation(() =>
        Promise.resolve({
          data: [],
          error: null,
          count: null,
        })
      );
    } else {
      // All other methods return the mock for chaining
      legacyMock[method].mockReturnValue(legacyMock);
    }
  });

  return legacyMock;
}

// Re-export types from shared locations
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Export a reset function for tests that need to reset the mock
export function resetSupabaseMock() {
  // Reset all auth mocks
  if (supabase.auth) {
    Object.values(supabase.auth).forEach((method) => {
      if (typeof method === 'function' && jest.isMockFunction(method)) {
        method.mockClear();
      }
    });
  }

  // Reset from method
  if (jest.isMockFunction(supabase.from)) {
    supabase.from.mockClear();
  }
}
