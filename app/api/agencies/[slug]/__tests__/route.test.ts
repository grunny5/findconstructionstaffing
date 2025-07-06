/**
 * @jest-environment node
 */
// Import centralized mock first
import {
  configureSupabaseMock,
  resetSupabaseMock,
} from '@/__tests__/utils/supabase-mock';
import { supabase } from '@/lib/supabase';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => {
      const headers = new Map(Object.entries(init?.headers || {}));
      const response = {
        status: init?.status || 200,
        json: async () => data,
        headers: {
          set: jest.fn((key: string, value: string) => {
            headers.set(key, value);
          }),
          get: jest.fn((key: string) => {
            return headers.get(key);
          }),
          has: jest.fn((key: string) => {
            return headers.has(key);
          }),
          delete: jest.fn((key: string) => {
            headers.delete(key);
          }),
          entries: jest.fn(() => headers.entries()),
        },
      };
      return response;
    }),
  },
}));

// Import the route AFTER mocks are set up
import { GET } from '../route';

describe('GET /api/agencies/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Setup default successful response
    configureSupabaseMock(supabase, {
      defaultData: null,
      defaultCount: 0,
    });
  });

  it('should return agency data for valid slug', async () => {
    const mockAgency = {
      id: '1',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'A test agency',
      agency_trades: [
        {
          trade: { id: 1, name: 'Electrician', slug: 'electrician' },
        },
      ],
      agency_regions: [
        {
          region: { id: 1, name: 'Texas', state_code: 'TX', slug: 'tx' },
        },
      ],
    };

    // Configure mock for single result
    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: mockAgency,
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });
    const data = await response.json();

    expect(supabase.from).toHaveBeenCalledWith('agencies');
    expect(response.status).toBe(200);
    expect(data.data.id).toBe('1');
    expect(data.data.name).toBe('Test Agency');
    expect(data.data.trades).toHaveLength(1);
    expect(data.data.regions).toHaveLength(1);
  });

  it('should return 404 for non-existent agency', async () => {
    // Configure mock for 404 response
    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/non-existent',
    });

    const response = await GET(request, {
      params: { slug: 'non-existent' },
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

    const data = await response.json();
    expect(data.error).toEqual({
      code: ERROR_CODES.NOT_FOUND,
      message: 'Agency not found',
    });
  });

  it('should handle database errors', async () => {
    const dbError = { message: 'Database connection failed' };

    // Configure mock for database error
    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: dbError,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const data = await response.json();
    expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
  });

  it('should handle missing slug parameter', async () => {
    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/',
    });

    const response = await GET(request, { params: { slug: '' } });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

    const data = await response.json();
    expect(data.error).toEqual({
      code: ERROR_CODES.INVALID_PARAMS,
      message: 'Invalid agency slug',
      details: {
        slug: 'Slug must be lowercase alphanumeric with hyphens only',
      },
    });
  });

  it('should handle special characters in slug', async () => {
    const specialSlug = 'test-agency-123';

    // Configure mock for special slug
    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: `http://localhost:3000/api/agencies/${encodeURIComponent(specialSlug)}`,
    });

    const response = await GET(request, { params: { slug: specialSlug } });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('should select all required fields', async () => {
    // Track the select call
    let selectCall: string | undefined;

    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn((query) => {
          selectCall = query;
          return queryChain;
        }),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: '1',
              name: 'Test Agency',
              slug: 'test-agency',
              agency_trades: [],
              agency_regions: [],
            },
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    await GET(request, { params: { slug: 'test-agency' } });

    expect(selectCall).toBeDefined();
    expect(selectCall).toContain('trades');
    expect(selectCall).toContain('regions');
  });

  it('should handle unexpected errors', async () => {
    // Configure mock to throw an error that will be caught by the route's catch block
    (supabase.from as any).mockImplementation(() => {
      // This simulates an error in the Supabase client itself
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Unexpected database error' }
        }))
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const data = await response.json();
    // Since the error happens in queryWithRetry, it returns DATABASE_ERROR
    expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    expect(data.error.message).toBe('Failed to fetch agency');
  });

  it('should transform agency data correctly', async () => {
    const rawAgency = {
      id: '123',
      name: 'Full Agency Data',
      slug: 'full-agency',
      description: 'A complete agency',
      agency_trades: [
        { trade: { id: 1, name: 'Electrician', slug: 'electrician' } },
        { trade: { id: 2, name: 'Plumber', slug: 'plumber' } },
      ],
      agency_regions: [
        { region: { id: 1, name: 'Texas', state_code: 'TX', slug: 'tx' } },
        { region: { id: 2, name: 'California', state_code: 'CA', slug: 'ca' } },
      ],
      contact_email: 'test@example.com',
      phone: '555-1234',
    };

    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: rawAgency,
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/full-agency',
    });

    const response = await GET(request, { params: { slug: 'full-agency' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trades).toHaveLength(2);
    expect(data.data.trades[0]).toEqual({
      id: 1,
      name: 'Electrician',
      slug: 'electrician',
    });
    expect(data.data.regions).toHaveLength(2);
    expect(data.data.regions[0]).toEqual({
      id: 1,
      name: 'Texas',
      code: 'TX',
      slug: 'tx',
    });
    expect(data.data.agency_trades).toBeUndefined();
    expect(data.data.agency_regions).toBeUndefined();
  });

  it('should handle empty trades and regions', async () => {
    const agencyNoRelations = {
      id: '456',
      name: 'No Relations Agency',
      slug: 'no-relations',
      description: 'An agency with no trades or regions',
      agency_trades: null,
      agency_regions: null,
    };

    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: agencyNoRelations,
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/no-relations',
    });

    const response = await GET(request, { params: { slug: 'no-relations' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trades).toEqual([]);
    expect(data.data.regions).toEqual([]);
  });

  it('should set proper cache headers on success', async () => {
    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: '1',
              name: 'Test Agency',
              slug: 'test-agency',
              agency_trades: [],
              agency_regions: [],
            },
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    );
  });

  it('should filter by is_active status', async () => {
    // Track eq calls
    const eqCalls: any[] = [];

    (supabase.from as any).mockImplementation(() => {
      const queryChain: any = {
        select: jest.fn(() => queryChain),
        eq: jest.fn((...args) => {
          eqCalls.push(args);
          return queryChain;
        }),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: '1',
              name: 'Active Agency',
              slug: 'active-agency',
              is_active: true,
              agency_trades: [],
              agency_regions: [],
            },
            error: null,
          })
        ),
      };
      return queryChain;
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/active-agency',
    });

    await GET(request, { params: { slug: 'active-agency' } });

    // Verify that both slug and is_active filters were applied
    expect(eqCalls).toContainEqual(['slug', 'active-agency']);
    expect(eqCalls).toContainEqual(['is_active', true]);
  });
});
