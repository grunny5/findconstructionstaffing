/**
 * Tests for POST /api/admin/agencies/[id]/status endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('POST /api/admin/agencies/[id]/status', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest(
      'http://localhost:3000/api/admin/agencies/test-id/status',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  };

  describe('Authentication and Authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Authentication required');
    });

    it('returns 403 when user is not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Admin access required');
    });

    it('returns 403 when profile lookup fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Profile not found'),
            }),
          }),
        }),
      });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('returns 400 when request body is invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/test-id/status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid-json',
        }
      );

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON body');
    });

    it('returns 400 when active field is missing', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({});
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.details).toBeDefined();
    });

    it('returns 400 when active is not a boolean', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({ active: 'yes' });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Agency Lookup', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('returns 404 when agency does not exist', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Not found'),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('successfully deactivates an active agency', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: true,
      };

      const mockUpdatedAgency = {
        ...mockAgency,
        is_active: false,
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
        last_edited_by: 'admin-123',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedAgency,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency).toEqual(mockUpdatedAgency);
      expect(data.message).toBe('Agency deactivated successfully');
      expect(data.agency.is_active).toBe(false);
    });

    it('successfully activates an inactive agency', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: false,
      };

      const mockUpdatedAgency = {
        ...mockAgency,
        is_active: true,
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
        last_edited_by: 'admin-123',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedAgency,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: true });
      const response = await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency).toEqual(mockUpdatedAgency);
      expect(data.message).toBe('Agency activated successfully');
      expect(data.agency.is_active).toBe(true);
    });

    it('updates audit fields (last_edited_at, last_edited_by)', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: true,
      };

      let capturedUpdateData: any;

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockImplementation((data) => {
            capturedUpdateData = data;
            return {
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockAgency, ...data },
                    error: null,
                  }),
                }),
              }),
            };
          }),
        });

      const request = createMockRequest({ active: false });
      await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });

      expect(capturedUpdateData).toBeDefined();
      expect(capturedUpdateData.last_edited_at).toBeDefined();
      expect(capturedUpdateData.last_edited_by).toBe('admin-123');
      expect(capturedUpdateData.updated_at).toBeDefined();
    });

    it('handles edge case: deactivating already inactive agency', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: false,
      };

      const mockUpdatedAgency = {
        ...mockAgency,
        is_active: false,
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
        last_edited_by: 'admin-123',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedAgency,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency.is_active).toBe(false);
      expect(data.message).toBe('Agency deactivated successfully');
    });

    it('handles edge case: activating already active agency', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: true,
      };

      const mockUpdatedAgency = {
        ...mockAgency,
        is_active: true,
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
        last_edited_by: 'admin-123',
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedAgency,
                  error: null,
                }),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: true });
      const response = await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency.is_active).toBe(true);
      expect(data.message).toBe('Agency activated successfully');
    });

    it('returns 500 when database update fails', async () => {
      const mockAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        is_active: true,
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAgency,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Database error'),
                }),
              }),
            }),
          }),
        });

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'agency-123' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update agency status');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest({ active: false });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('Internal server error');
    });
  });
});
