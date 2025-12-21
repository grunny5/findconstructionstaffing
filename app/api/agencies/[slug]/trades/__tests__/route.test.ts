/**
 * @jest-environment node
 */
import { PUT } from '../route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@supabase/ssr');
jest.mock('next/headers');

const mockedCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
  } as any as NextRequest;
}

describe('PUT /api/agencies/[slug]/trades', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'owner@agency.com',
  };

  const mockAgencyId = '987e6543-e21b-12d3-a456-426614174001';
  const mockAgencySlug = 'test-staffing-agency';

  const mockAgency = {
    id: mockAgencyId,
    slug: mockAgencySlug,
    claimed_by: mockUser.id,
    name: 'Test Staffing Agency',
  };

  const mockTrades = [
    {
      id: 'a1234567-89ab-cdef-0123-456789abcdef',
      name: 'Electrician',
      slug: 'electrician',
      description: 'Electrical work',
    },
    {
      id: 'b2345678-9abc-def0-1234-56789abcdef0',
      name: 'Plumber',
      slug: 'plumber',
      description: 'Plumbing work',
    },
    {
      id: 'c3456789-abcd-ef01-2345-6789abcdef01',
      name: 'Carpenter',
      slug: 'carpenter',
      description: 'Carpentry work',
    },
  ];

  const validTradeIds = [
    'a1234567-89ab-cdef-0123-456789abcdef',
    'b2345678-9abc-def0-1234-56789abcdef0',
    'c3456789-abcd-ef01-2345-6789abcdef01',
  ];

  let mockSupabaseClient: any;
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };
    mockedCookies.mockReturnValue(mockCookieStore as any);

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    mockedCreateServerClient.mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createMockRequest({ trade_ids: validTradeIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to update agency trades'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest({ trade_ids: validTradeIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Authorization & Ownership', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 404 when agency does not exist', async () => {
      const mockFromAgencies = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFromAgencies);

      const request = createMockRequest({ trade_ids: validTradeIds });
      const response = await PUT(request, {
        params: { slug: 'non-existent-slug' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });

    it('should return 403 when user does not own the agency', async () => {
      const mockFromAgencies = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockAgency,
            claimed_by: 'different-user-id',
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFromAgencies);

      const request = createMockRequest({ trade_ids: validTradeIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Forbidden: You do not own this agency');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFromAgencies = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockAgency,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFromAgencies);
    });

    it('should return 400 when trade_ids is missing', async () => {
      const request = createMockRequest({});
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Validation failed');
    });

    it('should return 400 when trade_ids is empty array', async () => {
      const request = createMockRequest({ trade_ids: [] });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.trade_ids).toBeDefined();
    });

    it('should return 400 when more than 10 trades are provided', async () => {
      const elevenTrades = Array.from({ length: 11 }, (_, i) => `trade-${i}`);
      const request = createMockRequest({ trade_ids: elevenTrades });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.trade_ids).toBeDefined();
    });

    it('should return 400 when trade IDs are not valid UUIDs', async () => {
      const request = createMockRequest({
        trade_ids: ['invalid-uuid', 'also-invalid'],
      });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Success Response', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 200 with updated trades list on successful update', async () => {
      let callIndex = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callIndex++;

        if (table === 'agencies' && callIndex === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }

        if (table === 'trades' && callIndex === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' && callIndex === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' && callIndex === 4) {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === 'agency_trades' && callIndex === 5) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === 'agency_profile_edits' && callIndex === 6) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === 'agencies' && callIndex === 7) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === 'trades' && callIndex === 8) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }

        return { select: jest.fn().mockReturnThis() };
      });

      const request = createMockRequest({ trade_ids: validTradeIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.trades).toEqual(mockTrades);
    });
  });
});
