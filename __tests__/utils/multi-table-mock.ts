/**
 * Multi-table mock helper for Supabase tests
 *
 * Provides a typed helper to create mock implementations for multiple Supabase tables
 * without repeating brittle any-heavy patterns in each test.
 */

interface TableMockConfig {
  data: any[];
  error?: any;
  count?: number;
}

interface MultiTableMockConfig {
  [tableName: string]: TableMockConfig;
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
  supabaseMock: any,
  config: MultiTableMockConfig
): void {
  supabaseMock.from.mockImplementation((table: string) => {
    const tableConfig = config[table];

    if (!tableConfig) {
      // Return default empty response for unconfigured tables
      const defaultChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      return Object.assign(
        Promise.resolve({ data: [], error: null, count: 0 }),
        defaultChain
      );
    }

    const { data, error = null, count } = tableConfig;

    const promiseResult = Promise.resolve({
      data,
      error,
      ...(count !== undefined && { count }),
    });

    // Declare result first to avoid circular reference
    let result: Promise<any> & any;

    // Create the chain methods that delegate to the global mock
    const chainMethods: any = {
      select: jest.fn((...args: any[]) => {
        supabaseMock.select(...args);
        return result;
      }),
      eq: jest.fn((...args: any[]) => {
        supabaseMock.eq(...args);
        return result;
      }),
      in: jest.fn((...args: any[]) => {
        supabaseMock.in(...args);
        return result;
      }),
      or: jest.fn((...args: any[]) => {
        supabaseMock.or(...args);
        return result;
      }),
      range: jest.fn((...args: any[]) => {
        supabaseMock.range(...args);
        return result;
      }),
      order: jest.fn((...args: any[]) => {
        supabaseMock.order(...args);
        return result;
      }),
    };

    // Combine promise with chain methods
    result = Object.assign(promiseResult, chainMethods);
    return result;
  });
}
