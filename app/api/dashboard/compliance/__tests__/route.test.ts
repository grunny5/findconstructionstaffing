/**
 * @jest-environment node
 */

/**
 * Tests for GET/PUT /api/dashboard/compliance
 */

import { GET, PUT } from '../route';
import { createClient } from '@/lib/supabase/server';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = createClient as unknown as jest.MockedFunction<
  typeof createClient
>;

describe('/api/dashboard/compliance', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'owner@example.com',
  };

  const mockAgency = {
    id: 'agency-123',
  };

  const mockComplianceRows = [
    {
      id: 'comp-1',
      agency_id: 'agency-123',
      compliance_type: 'osha_certified',
      is_active: true,
      is_verified: true,
      verified_by: 'admin-123',
      verified_at: '2025-01-01T00:00:00Z',
      document_url: 'https://storage/doc.pdf',
      expiration_date: '2026-12-31',
      notes: 'Verified by inspection',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'comp-2',
      agency_id: 'agency-123',
      compliance_type: 'workers_comp',
      is_active: false,
      is_verified: false,
      verified_by: null,
      verified_at: null,
      document_url: null,
      expiration_date: null,
      notes: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    mockedCreateClient.mockResolvedValue(mockSupabaseClient as any);
  });

  const createMockRequest = (body?: unknown): any => ({
    url: 'http://localhost:3000/api/dashboard/compliance',
    json: body ? jest.fn().mockResolvedValue(body) : jest.fn(),
  });

  describe('GET /api/dashboard/compliance', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
        expect(data.error.message).toBe('Authentication required');
      });

      it('returns 401 when user is null', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Agency ownership', () => {
      it('returns 403 when user does not own any agency', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        }));

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
        expect(data.error.message).toBe('You do not own any agency');
      });

      it('returns 500 when agency query fails', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST500', message: 'Database error' },
          }),
        }));

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      });
    });

    describe('Success cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });
      });

      it('returns compliance items for agency', async () => {
        let queryCount = 0;
        mockSupabaseClient.from.mockImplementation((table: string) => {
          queryCount++;
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: mockComplianceRows,
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(queryCount).toBe(2); // agencies and agency_compliance tables
        expect(data.data).toHaveLength(2);
        expect(data.data[0]).toMatchObject({
          id: 'comp-1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: true,
          expirationDate: '2026-12-31',
          isExpired: false,
          documentUrl: 'https://storage/doc.pdf',
          notes: 'Verified by inspection',
          verifiedBy: 'admin-123',
          verifiedAt: '2025-01-01T00:00:00Z',
        });
        expect(data.data[1]).toMatchObject({
          id: 'comp-2',
          type: 'workers_comp',
          displayName: "Workers' Compensation",
          isActive: false,
          isVerified: false,
        });
      });

      it('returns empty array when no compliance data exists', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toEqual([]);
      });

      it('includes inactive items (unlike public endpoint)', async () => {
        const complianceWithInactive = [
          { ...mockComplianceRows[0] },
          { ...mockComplianceRows[1], is_active: false },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: complianceWithInactive,
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toHaveLength(2);
        expect(data.data[1].isActive).toBe(false);
      });

      it('includes private no-cache headers', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest());

        expect(response.headers.get('Cache-Control')).toBe(
          'private, no-cache, no-store, must-revalidate'
        );
      });
    });

    describe('Error cases', () => {
      it('returns 500 when compliance query fails', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST500', message: 'Database error' },
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      });
    });
  });

  describe('PUT /api/dashboard/compliance', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Agency ownership', () => {
      it('returns 403 when user does not own any agency', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        }));

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });
      });

      it('returns 400 for invalid JSON', async () => {
        const request = {
          url: 'http://localhost:3000/api/dashboard/compliance',
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        } as any;

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe('Invalid JSON in request body');
      });

      it('returns 400 when items array is missing', async () => {
        const response = await PUT(createMockRequest({}));
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe(
          'Request body must contain an "items" array'
        );
      });

      it('returns 400 when items is not an array', async () => {
        const response = await PUT(createMockRequest({ items: 'not-array' }));
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe(
          'Request body must contain an "items" array'
        );
      });

      it('returns 400 for invalid compliance type', async () => {
        const response = await PUT(
          createMockRequest({
            items: [{ type: 'invalid_type', isActive: true }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toContain('Invalid compliance type');
      });

      it('returns 400 when isActive is not boolean', async () => {
        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: 'yes' }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe(
          'Each item must have a boolean "isActive" field'
        );
      });

      it('returns 400 for invalid expiration date format', async () => {
        const response = await PUT(
          createMockRequest({
            items: [
              {
                type: 'osha_certified',
                isActive: true,
                expirationDate: '2026/12/31',
              },
            ],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe(
          'expirationDate must be in YYYY-MM-DD format if provided'
        );
      });
    });

    describe('Success cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });
      });

      it('upserts compliance items and returns updated state', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [mockComplianceRows[0]],
                error: null,
              }),
              upsert: upsertMock,
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await PUT(
          createMockRequest({
            items: [
              {
                type: 'osha_certified',
                isActive: true,
                expirationDate: '2026-12-31',
              },
            ],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(upsertMock).toHaveBeenCalledWith(
          {
            agency_id: 'agency-123',
            compliance_type: 'osha_certified',
            is_active: true,
            expiration_date: '2026-12-31',
          },
          {
            onConflict: 'agency_id,compliance_type',
            ignoreDuplicates: false,
          }
        );
        expect(data.data).toHaveLength(1);
      });

      it('handles multiple items in single request', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: mockComplianceRows,
                error: null,
              }),
              upsert: upsertMock,
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await PUT(
          createMockRequest({
            items: [
              { type: 'osha_certified', isActive: true },
              { type: 'drug_testing', isActive: false },
              {
                type: 'workers_comp',
                isActive: true,
                expirationDate: '2027-01-15',
              },
            ],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(upsertMock).toHaveBeenCalledTimes(3);
      });

      it('sets expiration_date to null when not provided', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
              upsert: upsertMock,
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          })
        );

        expect(upsertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            expiration_date: null,
          }),
          expect.anything()
        );
      });
    });

    describe('Error cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });
      });

      it('returns 500 when upsert fails', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              upsert: jest.fn().mockResolvedValue({
                error: { code: 'PGRST500', message: 'Database error' },
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      });

      it('returns 500 when fetching updated compliance fails', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST500', message: 'Database error' },
              }),
              upsert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          })
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      });
    });
  });
});
