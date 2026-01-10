/**
 * @jest-environment node
 */

/**
 * Tests for GET/PUT /api/admin/agencies/[id]/compliance
 */

import { GET, PUT } from '../route';
import { createClient } from '@/lib/supabase/server';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = createClient as unknown as jest.MockedFunction<
  typeof createClient
>;

describe('/api/admin/agencies/[id]/compliance', () => {
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockRegularUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  const mockAgencyId = 'agency-123';

  const mockComplianceRows = [
    {
      id: 'comp-1',
      agency_id: mockAgencyId,
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
      agency_id: mockAgencyId,
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
    url: `http://localhost:3000/api/admin/agencies/${mockAgencyId}/compliance`,
    json: body ? jest.fn().mockResolvedValue(body) : jest.fn(),
  });

  const createContext = (id: string = mockAgencyId): any => ({
    params: Promise.resolve({ id }),
  });

  describe('GET /api/admin/agencies/[id]/compliance', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await GET(createMockRequest(), createContext());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Authorization', () => {
      it('returns 403 when user is not admin', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockRegularUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'user' },
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

        const response = await GET(createMockRequest(), createContext());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
        expect(data.error.message).toBe('Admin access required');
      });
    });

    describe('Agency validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        });
      });

      it('returns 404 when agency not found', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(
          createMockRequest(),
          createContext('non-existent')
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
        expect(data.error.message).toBe('Agency not found');
      });
    });

    describe('Success cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        });
      });

      it('returns compliance items for agency', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: mockComplianceRows,
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest(), createContext());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toHaveLength(2);
        expect(data.data[0]).toMatchObject({
          id: 'comp-1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: true,
          verifiedBy: 'admin-123',
          verifiedAt: '2025-01-01T00:00:00Z',
          documentUrl: 'https://storage/doc.pdf',
          notes: 'Verified by inspection',
        });
      });

      it('returns empty array when no compliance data exists', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await GET(createMockRequest(), createContext());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(data.data).toEqual([]);
      });
    });
  });

  describe('PUT /api/admin/agencies/[id]/compliance', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      });
    });

    describe('Authorization', () => {
      it('returns 403 when user is not admin', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockRegularUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'user' },
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

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
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
          url: `http://localhost:3000/api/admin/agencies/${mockAgencyId}/compliance`,
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        } as any;

        const response = await PUT(request, createContext());
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe('Invalid JSON in request body');
      });

      it('returns 400 when items array is missing', async () => {
        const response = await PUT(createMockRequest({}), createContext());
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
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toContain('Invalid compliance type');
      });

      it('returns 400 when isVerified is not boolean', async () => {
        const response = await PUT(
          createMockRequest({
            items: [
              { type: 'osha_certified', isActive: true, isVerified: 'yes' },
            ],
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.error.code).toBe(ERROR_CODES.INVALID_PARAMS);
        expect(data.error.message).toBe(
          'isVerified must be a boolean if provided'
        );
      });
    });

    describe('Success cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        });
      });

      it('upserts compliance items with verification fields', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [mockComplianceRows[0]],
                error: null,
              }),
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
            in: jest.fn().mockReturnThis(),
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
                isVerified: true,
                notes: 'Verified by admin',
              },
            ],
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(upsertMock).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              agency_id: mockAgencyId,
              compliance_type: 'osha_certified',
              is_active: true,
              expiration_date: '2026-12-31',
              is_verified: true,
              verified_by: 'admin-123',
              notes: 'Verified by admin',
            }),
          ],
          expect.anything()
        );
      });

      it('clears verification fields when isVerified is false', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
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
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        await PUT(
          createMockRequest({
            items: [
              { type: 'osha_certified', isActive: true, isVerified: false },
            ],
          }),
          createContext()
        );

        expect(upsertMock).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              is_verified: false,
              verified_by: null,
              verified_at: null,
            }),
          ],
          expect.anything()
        );
      });

      it('can update document URL', async () => {
        const upsertMock = jest.fn().mockResolvedValue({ error: null });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
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
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        await PUT(
          createMockRequest({
            items: [
              {
                type: 'workers_comp',
                isActive: true,
                documentUrl: 'https://storage/workers-comp.pdf',
              },
            ],
          }),
          createContext()
        );

        expect(upsertMock).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              document_url: 'https://storage/workers-comp.pdf',
            }),
          ],
          expect.anything()
        );
      });
    });

    describe('Error cases', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        });
      });

      it('returns 500 when upsert fails', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            };
          }
          if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: mockAgencyId },
                error: null,
              }),
            };
          }
          if (table === 'agency_compliance') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
              upsert: jest.fn().mockResolvedValue({
                error: { code: 'PGRST500', message: 'Database error' },
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const response = await PUT(
          createMockRequest({
            items: [{ type: 'osha_certified', isActive: true }],
          }),
          createContext()
        );
        const data = await response.json();

        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      });
    });
  });
});
