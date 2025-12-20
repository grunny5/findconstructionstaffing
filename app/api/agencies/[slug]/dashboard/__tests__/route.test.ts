/**
 * @jest-environment node
 */
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = createClient as unknown as jest.MockedFunction<
  typeof createClient
>;

describe('GET /api/agencies/[slug]/dashboard', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'owner@example.com',
  };

  const mockAgencyId = 'test-staffing-agency';

  const mockAgency = {
    id: mockAgencyId,
    name: 'Test Staffing Agency',
    slug: 'test-staffing-agency',
    description: 'Leading construction staffing provider',
    logo_url: 'https://example.com/logo.png',
    website: 'https://example.com',
    phone: '+1-555-123-4567',
    email: 'info@example.com',
    is_claimed: true,
    is_active: true,
    offers_per_diem: true,
    is_union: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    claimed_at: '2024-01-10T00:00:00Z',
    claimed_by: mockUser.id,
    profile_completion_percentage: 75,
    last_edited_at: '2024-01-15T10:00:00Z',
    last_edited_by: mockUser.id,
    agency_trades: [
      {
        trade: {
          id: 'trade-1',
          name: 'Electrician',
          slug: 'electrician',
        },
      },
      {
        trade: {
          id: 'trade-2',
          name: 'Plumber',
          slug: 'plumber',
        },
      },
    ],
    agency_regions: [
      {
        region: {
          id: 'region-1',
          name: 'Texas',
          state_code: 'TX',
        },
      },
      {
        region: {
          id: 'region-2',
          name: 'California',
          state_code: 'CA',
        },
      },
    ],
  };

  const mockRecentEdits = [
    {
      id: 'edit-1',
      field_name: 'description',
      old_value: { text: 'Old description' },
      new_value: { text: 'New description' },
      edited_by: mockUser.id,
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'edit-2',
      field_name: 'website',
      old_value: { url: 'https://old.com' },
      new_value: { url: 'https://example.com' },
      edited_by: mockUser.id,
      created_at: '2024-01-14T09:00:00Z',
    },
  ];

  let mockSupabaseClient: any;
  let mockRequest: any;
  let mockParams: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      url: `http://localhost:3000/api/agencies/${mockAgencyId}/dashboard`,
    } as any;

    mockParams = {
      params: { slug: mockAgencyId },
    };

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    mockedCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should return 401 when auth.getUser returns error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Token expired'),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 401 when user is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('Parameter Validation', () => {
    it('should return 400 when slug is missing', async () => {
      const invalidParams = { params: { slug: '' } };

      const response = await GET(mockRequest, invalidParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
      expect(data.error.message).toBe('Invalid agency slug');
    });

    it('should return 400 when slug is not a string', async () => {
      const invalidParams = { params: { slug: null as any } };

      const response = await GET(mockRequest, invalidParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
    });
  });

  describe('Ownership Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 403 when user does not own the agency', async () => {
      const differentOwnerId = 'different-user-id';
      const agencyOwnedByOther = {
        ...mockAgency,
        claimed_by: differentOwnerId,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: agencyOwnedByOther, error: null }),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe(
        'Access denied. You do not own this agency.'
      );
    });

    it('should return 200 when user owns the agency', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockAgency, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockResolvedValue({ data: mockRecentEdits, error: null }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.agency.id).toBe(mockAgencyId);
    });
  });

  describe('Agency Existence', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 404 when agency does not exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.AGENCY_NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });

    it('should return 404 when agency data is null', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.AGENCY_NOT_FOUND);
    });
  });

  describe('Database Errors', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 500 when agency query fails with database error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'CONNECTION_ERROR',
                message: 'Database connection failed',
              },
            }),
          }),
        }),
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch agency data');
    });

    it('should handle recent edits query failure gracefully', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockAgency, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Failed to fetch edits' },
                  }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.recent_edits).toEqual([]);
    });
  });

  describe('Success Response', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockAgency, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockResolvedValue({ data: mockRecentEdits, error: null }),
                }),
              }),
            }),
          };
        }
      });
    });

    it('should return complete agency data', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.agency).toMatchObject({
        id: mockAgencyId,
        name: 'Test Staffing Agency',
        slug: 'test-staffing-agency',
        description: 'Leading construction staffing provider',
        logo_url: 'https://example.com/logo.png',
        website: 'https://example.com',
        phone: '+1-555-123-4567',
        email: 'info@example.com',
        is_claimed: true,
        profile_completion_percentage: 75,
        last_edited_at: '2024-01-15T10:00:00Z',
      });
    });

    it('should return correct stats with hardcoded values', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(data.data.stats).toEqual({
        profile_views: 0,
        lead_requests: 0,
        last_edited_at: '2024-01-15T10:00:00Z',
      });
    });

    it('should return recent edits', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(data.data.recent_edits).toHaveLength(2);
      expect(data.data.recent_edits[0]).toMatchObject({
        id: 'edit-1',
        field_name: 'description',
        old_value: { text: 'Old description' },
        new_value: { text: 'New description' },
        edited_by: mockUser.id,
      });
    });

    it('should include trades data', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(data.data.agency.trades).toHaveLength(2);
      expect(data.data.agency.trades).toEqual([
        { id: 'trade-1', name: 'Electrician', slug: 'electrician' },
        { id: 'trade-2', name: 'Plumber', slug: 'plumber' },
      ]);
    });

    it('should include regions data', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(data.data.agency.regions).toHaveLength(2);
      expect(data.data.agency.regions).toEqual([
        { id: 'region-1', name: 'Texas', state_code: 'TX', slug: '' },
        { id: 'region-2', name: 'California', state_code: 'CA', slug: '' },
      ]);
    });

    it('should set correct cache headers', async () => {
      const response = await GET(mockRequest, mockParams);

      expect(response.headers.get('Cache-Control')).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
    });

    it('should set performance metric headers', async () => {
      const response = await GET(mockRequest, mockParams);

      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      // X-Database-Time may not be set in all cases
      const dbTime = response.headers.get('X-Database-Time');
      if (dbTime !== null) {
        expect(Number(dbTime)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should handle agency with no trades', async () => {
      const agencyNoTrades = {
        ...mockAgency,
        agency_trades: [],
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: agencyNoTrades, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.agency.trades).toEqual([]);
    });

    it('should handle agency with no regions', async () => {
      const agencyNoRegions = {
        ...mockAgency,
        agency_regions: [],
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: agencyNoRegions, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.agency.regions).toEqual([]);
    });

    it('should handle agency with no recent edits', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockAgency, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.recent_edits).toEqual([]);
    });

    it('should handle agency with null optional fields', async () => {
      const agencyMinimal = {
        ...mockAgency,
        description: null,
        logo_url: null,
        website: null,
        phone: null,
        email: null,
        last_edited_at: null,
        last_edited_by: null,
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: agencyMinimal, error: null }),
              }),
            }),
          };
        }
        if (table === 'agency_profile_edits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.agency.description).toBeNull();
      expect(data.data.agency.logo_url).toBeNull();
      expect(data.data.stats.last_edited_at).toBeNull();
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockedCreateClient.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
