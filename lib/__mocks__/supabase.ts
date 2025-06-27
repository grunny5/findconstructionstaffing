// Mock for @/lib/supabase

function createMockSupabase() {
  const mock = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    or: jest.fn(),
    in: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  // Set up method chaining - each method returns the mock object
  Object.keys(mock).forEach((method) => {
    if (method !== 'order') {
      mock[method].mockImplementation(() => mock);
    }
  });

  // Order method returns a promise for consistency with __mocks__/lib/supabase.ts
  mock.order.mockImplementation(() => Promise.resolve({
    data: [],
    error: null,
    count: null,
  }));

  return mock;
}

export const supabase = createMockSupabase();

// Re-export types from shared location
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';