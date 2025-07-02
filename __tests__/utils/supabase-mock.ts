// Centralized Supabase mock setup for tests
//
// This file provides two approaches for mocking Supabase:
// 1. Module-level mock (default) - Automatically mocked for all tests
// 2. Runtime mock - Use setupSupabaseMockRuntime() for dynamic mocking
//
// For most tests, the module-level mock is sufficient. Use runtime mocking
// only when you need to change mock behavior during test execution.

// Define all Supabase method names for type safety
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

// Type for the mock Supabase object
type MockSupabase = {
  [K in SupabaseMethod]: jest.Mock;
} & {
  _error?: Error | null;
  _throwError?: boolean;
  _isCountQuery?: boolean;
  _defaultData?: any;
  _defaultCount?: number;
  _lastMethod?: string;
  _lastArgs?: any[];
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
    _throwError: false,
    _isCountQuery: false,
    _defaultData: [],
    _defaultCount: 0,
    _resolveWith: null,
    _queryCount: 0,
  };

  // Create a query chain object that tracks its own state
  const createQueryChain = (isCountQuery = false) => {
    const queryChain = {
      _isCountQuery: isCountQuery,

      // Copy all methods from mockSupabase
      ...Object.keys(mockSupabase).reduce((acc, key) => {
        if (
          typeof mockSupabase[key] === 'function' &&
          jest.isMockFunction(mockSupabase[key])
        ) {
          acc[key] = jest.fn((...args) => {
            // Call the original mock to track calls
            mockSupabase[key](...args);
            // Return the same chain for chaining
            return createThenableProxy(queryChain);
          });
        }
        return acc;
      }, {}),

      // Also copy the state properties
      _error: mockSupabase._error,
      _throwError: mockSupabase._throwError,
      _defaultData: mockSupabase._defaultData,
      _defaultCount: mockSupabase._defaultCount,
    };

    return queryChain;
  };

  // Create a proxy wrapper that makes all methods thenable
  const createThenableProxy = (queryChain) => {
    const handler = {
      get(target, prop) {
        // If accessing a promise method, resolve the query
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          // Resolve based on query type
          const getResult = () => {
            if (queryChain._isCountQuery) {
              if (queryChain._throwError && queryChain._error) {
                return Promise.reject(queryChain._error);
              }
              return Promise.resolve({
                data: null,
                error: queryChain._error,
                count: queryChain._defaultCount || 0,
              });
            }

            // Regular query handling
            if (queryChain._throwError && queryChain._error) {
              return Promise.reject(queryChain._error);
            }
            return Promise.resolve({
              data: queryChain._error ? null : queryChain._defaultData || [],
              error: queryChain._error,
              count: null,
            });
          };

          if (prop === 'then') {
            return getResult().then.bind(getResult());
          } else if (prop === 'catch') {
            return getResult().catch.bind(getResult());
          } else if (prop === 'finally') {
            return getResult().finally.bind(getResult());
          }
        }

        // Return the actual property
        return target[prop];
      },
    };

    return new Proxy(queryChain, handler);
  };

  // Setup from to create a new query chain
  mockSupabase.from.mockImplementation(() => {
    const queryChain = createQueryChain();

    // Override select for this specific chain to detect count queries
    queryChain.select = jest.fn((columns, options) => {
      // Call original to track - only pass options if they were provided
      if (options !== undefined) {
        mockSupabase.select(columns, options);
      } else {
        mockSupabase.select(columns);
      }

      // Check if this is a count query
      const isCountQuery = options?.count === 'exact' && options?.head === true;
      if (isCountQuery) {
        queryChain._isCountQuery = true;
      }

      return createThenableProxy(queryChain);
    });

    return createThenableProxy(queryChain);
  });

  // Setup select to handle count queries
  mockSupabase.select.mockImplementation((columns, options = {}) => {
    // Handle count queries with head option
    const isCountQuery = options.count === 'exact' && options.head;
    const queryChain = createQueryChain(isCountQuery);
    return createThenableProxy(queryChain);
  });

  // Setup terminal methods that always return promises
  ['single', 'maybeSingle', 'csv'].forEach((method) => {
    mockSupabase[method].mockImplementation(() => {
      if (mockSupabase._throwError && mockSupabase._error) {
        return Promise.reject(mockSupabase._error);
      }
      return Promise.resolve({
        data: mockSupabase._error
          ? null
          : method === 'single'
            ? null
            : mockSupabase._defaultData || [],
        error: mockSupabase._error,
        count: null,
      });
    });
  });

  // All other methods just return the mock for chaining
  const chainableMethods = Object.keys(mockSupabase).filter((key) => {
    const value = mockSupabase[key];
    return (
      typeof value === 'function' &&
      jest.isMockFunction(value) &&
      !['from', 'select', 'single', 'maybeSingle', 'csv'].includes(key) &&
      !key.startsWith('_')
    );
  });

  chainableMethods.forEach((method) => {
    mockSupabase[method].mockReturnValue(mockSupabase);
  });

  return mockSupabase;
}

// Module-level mock - properly hoisted
jest.mock('@/lib/supabase', () => {
  const { createSlug, formatPhoneNumber } = require('@/lib/utils/formatting');

  // Create mock inline to avoid scope issues
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
    _throwError: false,
    _isCountQuery: false,
    _defaultData: [],
    _defaultCount: 0,
    _resolveWith: null,
    _queryCount: 0,
  };

  // Set up basic chain returns
  const chainableMethods = [
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
    'not',
    'match',
    'filter',
    'or',
    'contains',
    'containedBy',
    'rangeGt',
    'rangeGte',
    'rangeLt',
    'rangeLte',
    'rangeAdjacent',
    'overlaps',
    'textSearch',
    'order',
    'limit',
    'range',
  ];

  chainableMethods.forEach((method) => {
    mockSupabase[method].mockReturnValue(mockSupabase);
  });

  // Set up from to return chainable mock
  mockSupabase.from.mockReturnValue(mockSupabase);

  // Set up select to return chainable mock
  mockSupabase.select.mockReturnValue(mockSupabase);

  // Set up terminal methods to return promises
  ['single', 'maybeSingle', 'csv'].forEach((method) => {
    mockSupabase[method].mockResolvedValue({
      data: null,
      error: null,
      count: null,
    });
  });

  return {
    supabase: mockSupabase,
    createSlug,
    formatPhoneNumber,
  };
});

// Public function to create and configure mock
export function createSupabaseMock(config?: SupabaseMockConfig) {
  const mockSupabase = createSupabaseMockInternal();

  if (config) {
    // Configure error simulation
    if (config.error) {
      mockSupabase._error =
        config.error instanceof Error
          ? config.error
          : new Error(config.error.message);
      mockSupabase._throwError = config.throwError || false;
    }

    // Configure default data
    if (config.defaultData !== undefined) {
      mockSupabase._defaultData = config.defaultData;
    }
    if (config.defaultCount !== undefined) {
      mockSupabase._defaultCount = config.defaultCount;
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

// Runtime mock setup function (use only if you need dynamic mocking)
// For most cases, the module-level mock above is sufficient
export function setupSupabaseMockRuntime(config?: SupabaseMockConfig) {
  const mockSupabase = createSupabaseMock(config);

  // Use doMock for runtime mocking (not hoisted)
  jest.doMock('@/lib/supabase', () => {
    const { createSlug, formatPhoneNumber } = require('@/lib/utils/formatting');
    return {
      supabase: mockSupabase,
      createSlug,
      formatPhoneNumber,
    };
  });

  return mockSupabase;
}

// Helper to configure mock for specific test scenarios
export function configureSupabaseMock(mock, config) {
  // Reset state
  mock._error = null;
  mock._throwError = false;
  mock._isCountQuery = false;
  mock._defaultData =
    config.defaultData !== undefined ? config.defaultData : [];
  mock._defaultCount =
    config.defaultCount !== undefined ? config.defaultCount : 0;

  if (config.error) {
    mock._error =
      config.error instanceof Error
        ? config.error
        : new Error(config.error.message);
    mock._throwError = config.throwError || false;
  }

  // Need to recreate the query chain logic with updated config
  const createQueryChain = (isCountQuery = false) => {
    const queryChain = {
      _isCountQuery: isCountQuery,

      // Copy all methods from mock
      ...Object.keys(mock).reduce((acc, key) => {
        if (typeof mock[key] === 'function' && jest.isMockFunction(mock[key])) {
          acc[key] = jest.fn((...args) => {
            // Call the original mock to track calls
            mock[key](...args);
            // Return the same chain for chaining
            return createThenableProxy(queryChain);
          });
        }
        return acc;
      }, {}),

      // Also copy the state properties
      _error: mock._error,
      _throwError: mock._throwError,
      _defaultData: mock._defaultData,
      _defaultCount: mock._defaultCount,
    };

    return queryChain;
  };

  const createThenableProxy = (queryChain) => {
    const handler = {
      get(target, prop) {
        // If accessing a promise method, resolve the query
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          // Resolve based on query type
          const getResult = () => {
            if (queryChain._isCountQuery) {
              if (queryChain._throwError && queryChain._error) {
                return Promise.reject(queryChain._error);
              }
              return Promise.resolve({
                data: null,
                error: queryChain._error,
                count: queryChain._defaultCount || 0,
              });
            }

            // Regular query handling
            if (queryChain._throwError && queryChain._error) {
              return Promise.reject(queryChain._error);
            }
            return Promise.resolve({
              data: queryChain._error ? null : queryChain._defaultData || [],
              error: queryChain._error,
              count: null,
            });
          };

          if (prop === 'then') {
            return getResult().then.bind(getResult());
          } else if (prop === 'catch') {
            return getResult().catch.bind(getResult());
          } else if (prop === 'finally') {
            return getResult().finally.bind(getResult());
          }
        }

        // Return the actual property
        return target[prop];
      },
    };

    return new Proxy(queryChain, handler);
  };

  // Track query chains to differentiate between data and count queries
  let queryChainCount = 0;

  // Update from method to create a new query chain
  mock.from.mockImplementation(() => {
    queryChainCount++;
    const queryChain = createQueryChain();

    // Override select for this specific chain
    queryChain.select = jest.fn((columns, options) => {
      // Call original to track - only pass options if they were provided
      if (options !== undefined) {
        mock.select(columns, options);
      } else {
        mock.select(columns);
      }

      // Check if this is a count query
      const isCountQuery = options?.count === 'exact' && options?.head === true;
      if (isCountQuery) {
        queryChain._isCountQuery = true;
      }

      return createThenableProxy(queryChain);
    });

    return createThenableProxy(queryChain);
  });

  // Update select method to handle count queries and return proxy
  mock.select.mockImplementation((columns, options = {}) => {
    const isCountQuery = options.count === 'exact' && options.head;
    const queryChain = createQueryChain(isCountQuery);
    return createThenableProxy(queryChain);
  });

  // Update all chainable methods to return the mock
  const chainableMethods = Object.keys(mock).filter((key) => {
    const value = mock[key];
    return (
      typeof value === 'function' &&
      jest.isMockFunction(value) &&
      !['from', 'select', 'single', 'maybeSingle', 'csv'].includes(key) &&
      !key.startsWith('_')
    );
  });

  chainableMethods.forEach((method) => {
    mock[method].mockReturnValue(mock);
  });
}

// Assertion helpers for testing mock calls
export const supabaseMockHelpers = {
  // Assert that a query was made with specific table
  expectTableQueried: (mock, tableName: string) => {
    expect(mock.from).toHaveBeenCalledWith(tableName);
  },

  // Assert that select was called with specific columns
  expectSelectCalled: (mock, columns?: string) => {
    if (columns !== undefined) {
      expect(mock.select).toHaveBeenCalledWith(columns);
    } else {
      expect(mock.select).toHaveBeenCalled();
    }
  },

  // Assert specific filter was applied
  expectFilterApplied: (mock, method: string, ...args: any[]) => {
    expect(mock[method]).toHaveBeenCalledWith(...args);
  },

  // Assert method call count
  expectMethodCallCount: (mock, method: string, count: number) => {
    expect(mock[method]).toHaveBeenCalledTimes(count);
  },

  // Get the nth call arguments for a method
  getMethodCallArgs: (mock, method: string, callIndex = 0) => {
    return mock[method].mock.calls[callIndex];
  },

  // Assert complete query chain
  expectQueryChain: (mock, expectedChain: string[]) => {
    expectedChain.forEach((method) => {
      expect(mock[method]).toHaveBeenCalled();
    });
  },
};

/**
 * Helper function to configure mock for multi-table filter queries.
 *
 * This helper simplifies testing of the complex multi-table query patterns used
 * in the agencies API for trade and state filtering. It automatically handles
 * the chain of queries: trades -> agency_trades and regions -> agency_regions.
 *
 * @param mock - The Supabase mock object (usually the imported supabase instance)
 * @param config - Configuration object specifying the mock data for filters
 * @param config.trades - Trade filter configuration
 * @param config.trades.slugs - Array of trade slugs that would be queried
 * @param config.trades.ids - Array of trade IDs that the trades table should return
 * @param config.trades.agencyIds - Array of agency IDs that agency_trades should return
 * @param config.states - State filter configuration
 * @param config.states.codes - Array of state codes that would be queried
 * @param config.states.regionIds - Array of region IDs that the regions table should return
 * @param config.states.agencyIds - Array of agency IDs that agency_regions should return
 *
 * @example
 * ```typescript
 * // Setup mocks for trade filtering
 * configureMockForFilters(supabase, {
 *   trades: {
 *     slugs: ['electricians', 'plumbers'],
 *     ids: ['trade-1', 'trade-2'],
 *     agencyIds: ['agency-1', 'agency-2']
 *   }
 * });
 *
 * // Setup mocks for state filtering
 * configureMockForFilters(supabase, {
 *   states: {
 *     codes: ['TX', 'CA'],
 *     regionIds: ['region-tx', 'region-ca'],
 *     agencyIds: ['agency-1', 'agency-3']
 *   }
 * });
 *
 * // Setup mocks for combined filtering
 * configureMockForFilters(supabase, {
 *   trades: {
 *     slugs: ['electricians'],
 *     ids: ['trade-1'],
 *     agencyIds: ['agency-1', 'agency-2']
 *   },
 *   states: {
 *     codes: ['TX'],
 *     regionIds: ['region-tx'],
 *     agencyIds: ['agency-1', 'agency-3']
 *   }
 * });
 * ```
 */
export function configureMockForFilters(
  mock,
  config: {
    trades?: {
      slugs: string[];
      ids: string[];
      agencyIds: string[];
    };
    states?: {
      codes: string[];
      regionIds: string[];
      agencyIds: string[];
    };
  }
) {
  // Store the configured response for the main query
  const configuredResponse = mock._defaultData || [];
  const configuredCount = mock._defaultCount || 0;

  mock.from.mockImplementation((table) => {
    // Handle filter tables
    if (
      table === 'trades' ||
      table === 'agency_trades' ||
      table === 'regions' ||
      table === 'agency_regions'
    ) {
      const filterMock = {
        select: jest.fn(() => filterMock),
        in: jest.fn(() => filterMock),
        eq: jest.fn(() => filterMock),
        or: jest.fn(() => filterMock),
        range: jest.fn(() => filterMock),
        order: jest.fn(() => filterMock),
        then: (onFulfilled) => {
          let result = { data: null, error: null };

          // Return appropriate data based on table and configuration
          if (table === 'trades' && config.trades) {
            result.data = config.trades.ids.map((id) => ({ id }));
          } else if (table === 'agency_trades' && config.trades) {
            result.data = config.trades.agencyIds.map((agency_id) => ({
              agency_id,
            }));
          } else if (table === 'regions' && config.states) {
            result.data = config.states.regionIds.map((id) => ({ id }));
          } else if (table === 'agency_regions' && config.states) {
            result.data = config.states.agencyIds.map((agency_id) => ({
              agency_id,
            }));
          }

          return Promise.resolve(result).then(onFulfilled);
        },
      };
      return filterMock;
    }

    // For main agencies query, create a full mock chain
    const queryChain = {
      select: jest.fn(() => queryChain),
      eq: jest.fn(() => queryChain),
      in: jest.fn(() => queryChain),
      or: jest.fn(() => queryChain),
      range: jest.fn(() => queryChain),
      order: jest.fn(() => queryChain),
      then: (onFulfilled) => {
        const result = {
          data: configuredResponse,
          error: null,
          count: configuredCount,
        };
        return Promise.resolve(result).then(onFulfilled);
      },
    };

    // Track the mocked methods on the main mock object for assertions
    Object.keys(queryChain).forEach((method) => {
      if (
        jest.isMockFunction(queryChain[method]) &&
        jest.isMockFunction(mock[method])
      ) {
        queryChain[method].mockImplementation((...args) => {
          mock[method](...args);
          return queryChain;
        });
      }
    });

    return queryChain;
  });
}
