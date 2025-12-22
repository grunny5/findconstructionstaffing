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

describe('PUT /api/agencies/[slug]/regions', () => {
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

  const mockRegions = [
    {
      id: 'a1234567-89ab-cdef-0123-456789abcdef',
      name: 'Texas',
      state_code: 'TX',
      slug: 'texas',
    },
    {
      id: 'b2345678-9abc-def0-1234-56789abcdef0',
      name: 'California',
      state_code: 'CA',
      slug: 'california',
    },
    {
      id: 'c3456789-abcd-ef01-2345-6789abcdef01',
      name: 'New York',
      state_code: 'NY',
      slug: 'new-york',
    },
  ];

  const validRegionIds = [
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

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to update agency regions'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest({ region_ids: validRegionIds });
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

      const request = createMockRequest({ region_ids: validRegionIds });
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

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
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

    it('should return 400 when region_ids is missing', async () => {
      const request = createMockRequest({});
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Validation failed');
    });

    it('should return 400 when region_ids is empty array', async () => {
      const request = createMockRequest({ region_ids: [] });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.region_ids).toBeDefined();
    });

    it('should return 400 when region IDs are not valid UUIDs', async () => {
      const request = createMockRequest({
        region_ids: ['invalid-uuid', 'also-invalid'],
      });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details.region_ids).toBeDefined();
    });

    it('should return 400 when some region IDs do not exist in database', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [mockRegions[0]],
              error: null,
            }),
          };
        }
      });

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid region IDs provided');
      expect(data.error.details.invalid_region_ids).toHaveLength(2);
    });
  });

  describe('Transaction & Update Flow', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should successfully update regions with full transaction', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        } else if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  region_id: mockRegions[0].id,
                  regions: mockRegions[0],
                },
              ],
              error: null,
            }),
          };
        } else if (callCount === 4) {
          return {
            upsert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 5) {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 6) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 7) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 8) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }
      });

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.regions).toEqual(mockRegions);
      expect(data.data.regions).toHaveLength(3);
    });

    it('should return 500 when upsert operation fails', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        } else if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        } else if (callCount === 4) {
          return {
            upsert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Upsert failed' },
            }),
          };
        }
      });

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to insert/update regions');
    });
  });

  describe('Audit Trail', () => {
    it('should create audit trail entry with old and new values', async () => {
      let auditInsertCalled = false;
      let auditData: any;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        } else if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  region_id: mockRegions[0].id,
                  regions: mockRegions[0],
                },
              ],
              error: null,
            }),
          };
        } else if (callCount === 4) {
          return {
            upsert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 5) {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 6) {
          return {
            insert: jest.fn().mockImplementation((data: any) => {
              auditInsertCalled = true;
              auditData = data;
              return Promise.resolve({
                data: null,
                error: null,
              });
            }),
          };
        } else if (callCount === 7) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        } else if (callCount === 8) {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }
      });

      const request = createMockRequest({ region_ids: validRegionIds });
      await PUT(request, {
        params: { slug: mockAgencySlug },
      });

      expect(auditInsertCalled).toBe(true);
      expect(auditData).toMatchObject({
        agency_id: mockAgencyId,
        edited_by: mockUser.id,
        field_name: 'regions',
      });
      expect(auditData.old_value).toEqual(['Texas']);
      expect(auditData.new_value).toEqual(['Texas', 'California', 'New York']);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = createMockRequest({ region_ids: validRegionIds });
      const response = await PUT(request, {
        params: { slug: mockAgencySlug },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
