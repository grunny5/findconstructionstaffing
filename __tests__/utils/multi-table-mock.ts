/**
 * Multi-table mock helper for Supabase tests
 *
 * Provides a typed helper to create mock implementations for multiple Supabase tables
 * without repeating brittle any-heavy patterns in each test.
 */

import { NextRequest } from 'next/server';
import type { supabase } from '@/lib/supabase';

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

/**
 * Creates a NextRequest instance for testing API route handlers.
 * Uses the NextRequest constructor which accepts a URL and optional init.
 *
 * @param url - The URL string for the request
 * @param init - Optional NextRequest init options
 * @returns A NextRequest instance
 */
export function createTestRequest(
  url: string,
  init?: NextRequestInit
): NextRequest {
  return new NextRequest(url, init);
}

interface TableMockConfig<T = unknown> {
  data: T[];
  error?: unknown;
  count?: number;
}

type MultiTableMockConfig = Record<string, TableMockConfig>;

type ChainMethods = Record<
  | 'select'
  | 'eq'
  | 'in'
  | 'not'
  | 'or'
  | 'range'
  | 'order'
  | 'single'
  | 'update'
  | 'upsert'
  | 'insert'
  | 'delete',
  jest.Mock
>;

export interface SupabaseMock {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  not: jest.Mock;
  or: jest.Mock;
  range: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
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
      const defaultResult = Promise.resolve({
        data: null,
        error: null,
        count: 0,
      });
      const defaultChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(() => defaultResult),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      };
      return Object.assign(
        Promise.resolve({ data: [], error: null, count: 0 }),
        defaultChain
      );
    }

    const { data, error = null, count } = tableConfig;

    type PromiseResult<T> = Promise<{
      data: T[] | T | null;
      error: unknown | null;
      count?: number;
    }>;

    // Track whether .single() was called
    let isSingleQuery = false;

    const getPromiseResult = (): PromiseResult<(typeof data)[number]> => {
      if (isSingleQuery) {
        // .single() returns the first element or null, not an array
        return Promise.resolve({
          data: data.length > 0 ? data[0] : null,
          error,
          ...(count !== undefined && { count }),
        });
      }
      return Promise.resolve({
        data,
        error,
        ...(count !== undefined && { count }),
      });
    };

    // Declare result first to avoid circular reference
    let result: PromiseResult<(typeof data)[number]> & ChainMethods;

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
      not: jest.fn((...args: unknown[]) => {
        supabaseMock.not(...args);
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
        isSingleQuery = true;
        // Return a new promise that resolves with single data
        return Object.assign(getPromiseResult(), chainMethods);
      }),
      update: jest.fn((...args: unknown[]) => {
        supabaseMock.update(...args);
        return result;
      }),
      upsert: jest.fn((...args: unknown[]) => {
        supabaseMock.upsert(...args);
        return result;
      }),
      insert: jest.fn((...args: unknown[]) => {
        supabaseMock.insert(...args);
        return result;
      }),
      delete: jest.fn((...args: unknown[]) => {
        supabaseMock.delete(...args);
        return result;
      }),
    };

    // Combine promise with chain methods
    result = Object.assign(getPromiseResult(), chainMethods);
    return result;
  });
}

/**
 * Configuration for agency slug API mock
 */
export interface AgencySlugMockConfig {
  /** Agency data to return (null for not found) */
  agencyData?: Record<string, unknown> | null;
  /** Agency query error */
  agencyError?: { code?: string; message: string } | null;
  /** Compliance data array */
  complianceData?: Record<string, unknown>[];
  /** Compliance query error */
  complianceError?: { code?: string; message: string } | null;
}

/**
 * Creates a mock implementation for supabase.from() that handles
 * agencies and agency_compliance tables for the agency slug API.
 *
 * This DRYs up repeated mock patterns in route tests.
 *
 * @param supabaseMock - The mocked supabase instance
 * @param config - Configuration for mock responses
 *
 * @example
 * createAgencySlugMock(supabase, {
 *   agencyData: { id: '1', name: 'Test Agency', slug: 'test-agency' },
 *   complianceData: [],
 * });
 */
export function createAgencySlugMock(
  supabaseMock: typeof supabase,
  config: AgencySlugMockConfig
): void {
  const {
    agencyData = null,
    agencyError = null,
    complianceData = [],
    complianceError = null,
  } = config;

  (supabaseMock.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'agencies') {
      const queryChain: Record<string, jest.Mock> = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: agencyData,
            error: agencyError,
          })
        ),
      };
      return queryChain;
    }

    if (table === 'agency_compliance') {
      const queryChain: Record<string, jest.Mock> = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        order: jest.fn(() =>
          Promise.resolve({
            data: complianceData,
            error: complianceError,
          })
        ),
      };
      return queryChain;
    }

    // Default chain for other tables
    const defaultChain: Record<string, jest.Mock> = {
      select: jest.fn(() => defaultChain),
      eq: jest.fn(() => defaultChain),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };
    return defaultChain;
  });
}
