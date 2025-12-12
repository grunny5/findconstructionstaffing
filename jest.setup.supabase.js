// Global Supabase mock setup for all tests
// This ensures Supabase is always mocked to prevent real database connections

// Mock the Supabase module globally
jest.mock('@/lib/supabase', () => {
  // Create a chainable mock that supports both chaining and terminal operations
  const createMockChain = () => {
    const chainObj = {
      // Chainable methods that return another chain
      select: jest.fn(() => createMockChain()),
      from: jest.fn(() => createMockChain()),
      eq: jest.fn(() => createMockChain()),
      neq: jest.fn(() => createMockChain()),
      gt: jest.fn(() => createMockChain()),
      gte: jest.fn(() => createMockChain()),
      lt: jest.fn(() => createMockChain()),
      lte: jest.fn(() => createMockChain()),
      like: jest.fn(() => createMockChain()),
      ilike: jest.fn(() => createMockChain()),
      is: jest.fn(() => createMockChain()),
      in: jest.fn(() => createMockChain()),
      not: jest.fn(() => createMockChain()),
      or: jest.fn(() => createMockChain()),
      match: jest.fn(() => createMockChain()),
      filter: jest.fn(() => createMockChain()),
      order: jest.fn(() => createMockChain()),
      limit: jest.fn(() => createMockChain()),
      range: jest.fn(() => createMockChain()),

      // Terminal methods that return promises
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      count: jest.fn(() =>
        Promise.resolve({ data: null, error: null, count: 0 })
      ),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),

      // Add then/catch to make the chain thenable when needed
      then: jest.fn((onFulfilled) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled)
      ),
      catch: jest.fn((onRejected) =>
        Promise.resolve({ data: [], error: null }).catch(onRejected)
      ),
    };
    return chainObj;
  };

  const mockSupabase = createMockChain();
  mockSupabase._error = true; // CRITICAL: This signals to API routes that this is a mock

  // Ensure from method exists on root object
  mockSupabase.from = jest.fn(() => createMockChain());

  // Add auth mock for authentication tests
  mockSupabase.auth = {
    getSession: jest.fn(() =>
      Promise.resolve({ data: { session: null }, error: null })
    ),
    signInWithPassword: jest.fn(() =>
      Promise.resolve({ data: { user: null, session: null }, error: null })
    ),
    signUp: jest.fn(() =>
      Promise.resolve({ data: { user: null, session: null }, error: null })
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn((callback) => {
      // Immediately call callback with initial state (no session)
      callback('INITIAL_SESSION', null);
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    }),
  };

  return {
    supabase: mockSupabase,
    createSlug: jest.fn((name) => name.toLowerCase().replace(/\s+/g, '-')),
    formatPhoneNumber: jest.fn((phone) => phone),
  };
});

// Export for tests that need to access the mock
module.exports = {
  mockSupabase: require('@/lib/supabase').supabase,
};
