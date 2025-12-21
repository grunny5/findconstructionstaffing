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

describe('PUT /api/agencies/[agencyId]/profile', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'owner@agency.com',
  };

  const mockAgency = {
    id: '987e6543-e21b-12d3-a456-426614174001',
    claimed_by: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Staffing Agency',
    description: '<p>Original description</p>',
    website: 'https://oldwebsite.com',
    phone: '+1234567890',
    email: 'old@agency.com',
    founded_year: '2000',
    employee_count: '1-10',
    headquarters: 'Old City, ST',
  };

  const validUpdateData = {
    name: 'Updated Agency Name',
    description: '<p>Updated description</p>',
    website: 'https://newwebsite.com',
    phone: '+9876543210',
    email: 'new@agency.com',
    founded_year: '2005',
    employee_count: '51-100',
    headquarters: 'New City, ST',
  };

  let mockSupabaseClient: any;
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Mock cookie store
    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };
    mockedCookies.mockReturnValue(mockCookieStore as any);

    // Mock Supabase client
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

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to update agency profiles'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
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

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: 'non-existent-id' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });

    it('should return 403 when user does not own the agency', async () => {
      const differentOwnerAgency = {
        ...mockAgency,
        claimed_by: 'different-user-id',
      };

      const mockFromAgencies = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: differentOwnerAgency,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFromAgencies);

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
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

    it('should return 400 when company name is too short', async () => {
      const invalidData = {
        ...validUpdateData,
        name: 'A',
      };

      const request = createMockRequest(invalidData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Validation failed');
      expect(data.error.details).toBeDefined();
    });

    it('should return 400 when website URL is invalid', async () => {
      const invalidData = {
        ...validUpdateData,
        website: 'not-a-url',
      };

      const request = createMockRequest(invalidData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 when phone is in invalid format', async () => {
      const invalidData = {
        ...validUpdateData,
        phone: 'invalid-phone-number',
      };

      const request = createMockRequest(invalidData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 when email is invalid', async () => {
      const invalidData = {
        ...validUpdateData,
        email: 'not-an-email',
      };

      const request = createMockRequest(invalidData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 400 when employee_count is invalid', async () => {
      const invalidData = {
        ...validUpdateData,
        employee_count: 'invalid-range',
      };

      const request = createMockRequest(invalidData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Successful Updates', () => {
    let mockFromAudit: any;

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock audit trail insert
      mockFromAudit = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Setup from mock to handle different table queries
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch agency for ownership check
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          } else {
            // Second call: update agency
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockAgency,
                  ...validUpdateData,
                  last_edited_at: new Date().toISOString(),
                  last_edited_by: mockUser.id,
                },
                error: null,
              }),
            };
          }
        } else if (table === 'agency_profile_edits') {
          return mockFromAudit;
        }
        return null;
      });
    });

    it('should successfully update agency profile with all fields', async () => {
      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toBeDefined();
      expect(data.data.name).toBe(validUpdateData.name);
      expect(data.data.description).toBe(validUpdateData.description);
      expect(data.data.website).toBe(validUpdateData.website);
      expect(data.data.last_edited_by).toBe(mockUser.id);
      expect(data.data.last_edited_at).toBeDefined();
    });

    it('should create audit trail entries for changed fields', async () => {
      const request = createMockRequest(validUpdateData);
      await PUT(request, { params: { agencyId: mockAgency.id } });

      // Verify audit trail insert was called
      expect(mockFromAudit.insert).toHaveBeenCalled();

      const auditEntries = mockFromAudit.insert.mock.calls[0][0];
      expect(Array.isArray(auditEntries)).toBe(true);
      expect(auditEntries.length).toBeGreaterThan(0);

      // Check that each audit entry has required fields
      auditEntries.forEach((entry: any) => {
        expect(entry).toHaveProperty('agency_id', mockAgency.id);
        expect(entry).toHaveProperty('edited_by', mockUser.id);
        expect(entry).toHaveProperty('field_name');
        expect(entry).toHaveProperty('old_value');
        expect(entry).toHaveProperty('new_value');
      });
    });

    it('should not create audit entries when no fields changed', async () => {
      // Reset mock for this specific test
      mockSupabaseClient.from.mockReset();

      const mockFromAuditNoChanges = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch agency for ownership check
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          } else {
            // Second call: update agency (still called even with no changes)
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockAgency,
                  last_edited_at: new Date().toISOString(),
                  last_edited_by: mockUser.id,
                },
                error: null,
              }),
            };
          }
        } else if (table === 'agency_profile_edits') {
          return mockFromAuditNoChanges;
        }
        return null;
      });

      // Update with same values as current agency
      const sameData = {
        name: mockAgency.name,
        description: mockAgency.description,
        website: mockAgency.website,
        phone: mockAgency.phone,
        email: mockAgency.email,
        founded_year: mockAgency.founded_year,
        employee_count: mockAgency.employee_count,
        headquarters: mockAgency.headquarters,
      };

      const request = createMockRequest(sameData);
      await PUT(request, { params: { agencyId: mockAgency.id } });

      // Verify audit trail insert was NOT called
      expect(mockFromAuditNoChanges.insert).not.toHaveBeenCalled();
    });

    it('should update last_edited_at and last_edited_by fields', async () => {
      // Reset mock for this specific test
      mockSupabaseClient.from.mockReset();

      const mockFromUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockAgency,
            ...validUpdateData,
            last_edited_at: new Date().toISOString(),
            last_edited_by: mockUser.id,
          },
          error: null,
        }),
      };

      const mockFromAuditLocal = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch agency for ownership check
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          } else {
            // Second call: update agency
            return mockFromUpdate;
          }
        } else if (table === 'agency_profile_edits') {
          return mockFromAuditLocal;
        }
        return null;
      });

      const request = createMockRequest(validUpdateData);
      await PUT(request, { params: { agencyId: mockAgency.id } });

      // Verify update was called with correct metadata
      expect(mockFromUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_edited_by: mockUser.id,
          last_edited_at: expect.any(String),
        })
      );
    });

    it('should handle partial updates (only some fields provided)', async () => {
      // Reset mock for this specific test
      mockSupabaseClient.from.mockReset();

      const mockFromAuditPartial = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          callCount++;
          if (callCount === 1) {
            // First call: fetch agency for ownership check
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          } else {
            // Second call: update agency
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockAgency,
                  description: '<p>New description only</p>',
                  last_edited_at: new Date().toISOString(),
                  last_edited_by: mockUser.id,
                },
                error: null,
              }),
            };
          }
        } else if (table === 'agency_profile_edits') {
          return mockFromAuditPartial;
        }
        return null;
      });

      const partialUpdate = {
        name: mockAgency.name, // Keep same
        description: '<p>New description only</p>', // Change only this
        website: mockAgency.website, // Keep same
        phone: mockAgency.phone, // Keep same
        email: mockAgency.email, // Keep same
        founded_year: mockAgency.founded_year, // Keep same
        employee_count: mockAgency.employee_count, // Keep same
        headquarters: mockAgency.headquarters, // Keep same
      };

      const request = createMockRequest(partialUpdate);
      await PUT(request, { params: { agencyId: mockAgency.id } });

      // Verify audit trail has only 1 entry for description
      expect(mockFromAuditPartial.insert).toHaveBeenCalled();
      const auditEntries = mockFromAuditPartial.insert.mock.calls[0][0];
      expect(auditEntries.length).toBe(1);
      expect(auditEntries[0].field_name).toBe('description');
    });

    it('should handle empty optional fields', async () => {
      const updateWithEmptyFields = {
        name: 'Updated Name',
        description: '', // Empty string
        website: '', // Empty string
        phone: '', // Empty string
        email: '', // Empty string
        founded_year: '', // Empty string
        employee_count: '', // Empty string
        headquarters: '', // Empty string
      };

      const request = createMockRequest(updateWithEmptyFields);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Error Handling', () => {
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

    it('should return 500 when audit trail creation fails', async () => {
      const mockFromAudit = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agency_profile_edits') {
          return mockFromAudit;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockAgency,
            error: null,
          }),
        };
      });

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to create audit trail');
    });

    it('should return 500 when agency update fails', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agencies') {
          callCount++;
          if (callCount === 1) {
            // First call: successful fetch
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            };
          } else {
            // Second call: failed update
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            };
          }
        }
        if (table === 'agency_profile_edits') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return null;
      });

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update agency profile');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = createMockRequest(validUpdateData);
      const response = await PUT(request, {
        params: { agencyId: mockAgency.id },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
    });
  });
});
