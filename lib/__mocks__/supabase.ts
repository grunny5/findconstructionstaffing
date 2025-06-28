// Consolidated Supabase mock for @/lib/supabase
// This mock provides a factory function for better control and testing flexibility

// Define comprehensive Supabase method types for type safety
type SupabaseMethod = 
  | 'from' | 'select' | 'eq' | 'neq' | 'or' | 'in' | 'range' 
  | 'order' | 'limit' | 'single' | 'delete' | 'insert' | 'update'
  | 'upsert' | 'match' | 'is' | 'filter' | 'not' | 'gte' | 'gt'
  | 'lte' | 'lt' | 'like' | 'ilike' | 'contains' | 'containedBy'
  | 'rangeGt' | 'rangeGte' | 'rangeLt' | 'rangeLte' | 'rangeAdjacent'
  | 'overlaps' | 'textSearch' | 'count' | 'maybeSingle' | 'csv';

// Factory function to create a mock Supabase instance
// This approach provides better control for test-specific configurations
export function createMockSupabase() {
  const mock: Record<string, jest.Mock> = {
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
  Object.keys(mock).forEach((method) => {
    // Terminal methods that return promises
    if (['single', 'maybeSingle', 'csv'].includes(method)) {
      mock[method].mockImplementation(() => Promise.resolve({
        data: null,
        error: null,
        count: null,
      }));
    } else if (method === 'count') {
      mock[method].mockImplementation(() => Promise.resolve({
        data: null,
        error: null,
        count: 0,
      }));
    } else if (method === 'order') {
      // Order is often the final method in a chain before execution
      mock[method].mockImplementation(() => Promise.resolve({
        data: [],
        error: null,
        count: null,
      }));
    } else {
      // All other methods return the mock for chaining
      mock[method].mockReturnValue(mock);
    }
  });

  return mock;
}

// Create and export the default mock instance
export const supabase = createMockSupabase();

// Re-export types from shared locations
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Export a reset function for tests that need to reset the mock
export function resetSupabaseMock() {
  Object.keys(supabase).forEach((method) => {
    if (typeof supabase[method] === 'function' && jest.isMockFunction(supabase[method])) {
      supabase[method].mockClear();
    }
  });
}