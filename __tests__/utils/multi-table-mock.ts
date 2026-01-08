/**
 * Multi-table mock helper for Supabase tests
 *
 * Provides a typed helper to create mock implementations for multiple Supabase tables
 * without repeating brittle any-heavy patterns in each test.
 */

interface TableMockConfig<T = unknown> {
  data: T[];
  error?: any;
  count?: number;
}

type MultiTableMockConfig = Record<string, TableMockConfig>;

type ChainMethods = Record<
  'select' | 'eq' | 'in' | 'or' | 'range' | 'order' | 'single',
  jest.Mock
>;

interface SupabaseMock {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  or: jest.Mock;
  range: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
}

/**
 * Creates a mock implementation for supabase.from() that handles multiple tables
 *
 * @param supabaseMock - The mocked supabase instance
 * @param config - Configuration object mapping table names to their mock data
 *
 * @example
 * createMultiTableMock(supabase, {
 *   agency_compliance: { data: [{ agency_id: '1', compliance_type: 'osha_certified' }] },
 *   agencies: { data: mockAgencies, count: 1 }
 * });
 */
export function createMultiTableMock(
  supabaseMock: SupabaseMock,
  config: MultiTableMockConfig
): void {
  supabaseMock.from.mockImplementation((table: string) => {
    const tableConfig: TableMockConfig | undefined = config[table];

    if (!tableConfig) {
      // Return default empty response for unconfigured tables
      const defaultChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      };
      return Object.assign(
        Promise.resolve({ data: [], error: null, count: 0 }),
        defaultChain
      );
    }

    const { data, error = null, count } = tableConfig;

    type PromiseResult = Promise<{
      data: unknown[];
      error: any;
      count?: number;
    }>;

    const promiseResult: PromiseResult = Promise.resolve({
      data,
      error,
      ...(count !== undefined && { count }),
    });

    // Declare result first to avoid circular reference
    let result: PromiseResult & ChainMethods;

    // Create the chain methods that delegate to the global mock
    const chainMethods: ChainMethods = {
      select: jest.fn((...args: unknown[]) => {
        supabaseMock.select(...args);
        return result;
      }),
      eq: jest.fn((...args: unknown[]) => {
        supabaseMock.eq(...args);
        return result;
      }),
      in: jest.fn((...args: unknown[]) => {
        supabaseMock.in(...args);
        return result;
      }),
      or: jest.fn((...args: unknown[]) => {
        supabaseMock.or(...args);
        return result;
      }),
      range: jest.fn((...args: unknown[]) => {
        supabaseMock.range(...args);
        return result;
      }),
      order: jest.fn((...args: unknown[]) => {
        supabaseMock.order(...args);
        return result;
      }),
      single: jest.fn((...args: unknown[]) => {
        supabaseMock.single(...args);
        return result;
      }),
    };

    // Combine promise with chain methods
    result = Object.assign(promiseResult, chainMethods);
    return result;
  });
}
