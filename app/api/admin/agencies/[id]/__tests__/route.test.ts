import { NextRequest } from 'next/server';
import { PATCH } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('PATCH /api/admin/agencies/[id]', () => {
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockAgency = {
    id: 'agency-456',
    name: 'Test Agency',
    slug: 'test-agency',
    description: 'Test description',
    website: 'https://test.com',
    phone: '+12345678900',
    email: 'test@agency.com',
    headquarters: 'New York, NY',
    founded_year: 2010,
    employee_count: '11-50',
    company_size: 'Medium',
    offers_per_diem: true,
    is_union: false,
    is_active: true,
    is_claimed: false,
    claimed_by: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_edited_at: null,
    last_edited_by: null,
    profile_completion_percentage: 75,
  };

  const createMockRequest = (body: any, id: string = 'agency-456') => {
    return new NextRequest(`http://localhost:3000/api/admin/agencies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // AUTHENTICATION & AUTHORIZATION TESTS
  // ========================================================================

  describe('Authentication & Authorization', () => {
    it('returns 401 if user is not authenticated', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const request = createMockRequest({ name: 'Updated Agency' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Authentication required');
    });

    it('returns 403 if user is not an admin', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'user' }, // Not admin
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest({ name: 'Updated Agency' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(data.error.message).toBe('Admin access required');
    });
  });

  // ========================================================================
  // INPUT VALIDATION TESTS
  // ========================================================================

  describe('Input Validation', () => {
    beforeEach(() => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);
    });

    it('returns 400 for invalid JSON body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/agency-456',
        {
          method: 'PATCH',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON body');
    });

    it('returns 400 if no fields provided to update', async () => {
      const request = createMockRequest({});
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('No fields provided to update');
    });

    it('validates name length constraints', async () => {
      const request = createMockRequest({ name: 'A' }); // Too short
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates email format', async () => {
      const request = createMockRequest({ email: 'invalid-email' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates website URL format', async () => {
      const request = createMockRequest({ website: 'not-a-url' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates phone E.164 format', async () => {
      const request = createMockRequest({ phone: '123-456-7890' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates founded_year range', async () => {
      const request = createMockRequest({ founded_year: '1700' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates employee_count enum values', async () => {
      const request = createMockRequest({ employee_count: 'invalid' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('validates company_size enum values', async () => {
      const request = createMockRequest({ company_size: 'invalid' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // ========================================================================
  // AGENCY EXISTENCE TESTS
  // ========================================================================

  describe('Agency Existence', () => {
    it('returns 404 if agency does not exist', async () => {
      let callCount = 0;
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' },
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({ name: 'Updated Agency' });
      const response = await PATCH(request, {
        params: { id: 'nonexistent-id' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });
  });

  // ========================================================================
  // SUCCESSFUL UPDATE TESTS
  // ========================================================================

  describe('Successful Updates', () => {
    it('updates agency with single field', async () => {
      let selectCalled = false;
      let updateCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              updateCalled = true;
              return {
                update: jest.fn((data: any) => {
                  expect(data.name).toBe('Updated Agency Name');
                  expect(data.last_edited_by).toBe(mockAdminUser.id);
                  expect(data.last_edited_at).toBeDefined();
                  expect(data.updated_at).toBeDefined();
                  return {
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: {
                            ...mockAgency,
                            name: 'Updated Agency Name',
                            last_edited_by: mockAdminUser.id,
                          },
                          error: null,
                        }),
                      }),
                    }),
                  };
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({ name: 'Updated Agency Name' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe('Agency updated successfully');
      expect(data.agency.name).toBe('Updated Agency Name');
      expect(data.agency.last_edited_by).toBe(mockAdminUser.id);
      expect(updateCalled).toBe(true);
    });

    it('updates multiple fields at once', async () => {
      let selectCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              return {
                update: jest.fn((data: any) => {
                  expect(data.name).toBe('New Name');
                  expect(data.email).toBe('new@email.com');
                  expect(data.phone).toBe('+19876543210');
                  return {
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: {
                            ...mockAgency,
                            name: 'New Name',
                            email: 'new@email.com',
                            phone: '+19876543210',
                          },
                          error: null,
                        }),
                      }),
                    }),
                  };
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({
        name: 'New Name',
        email: 'new@email.com',
        phone: '+19876543210',
      });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency.name).toBe('New Name');
      expect(data.agency.email).toBe('new@email.com');
      expect(data.agency.phone).toBe('+19876543210');
    });

    it('converts empty strings to null', async () => {
      let selectCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              return {
                update: jest.fn((data: any) => {
                  expect(data.description).toBeNull();
                  expect(data.website).toBeNull();
                  return {
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: {
                            ...mockAgency,
                            description: null,
                            website: null,
                          },
                          error: null,
                        }),
                      }),
                    }),
                  };
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({
        description: '',
        website: '',
      });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('converts founded_year string to integer', async () => {
      let selectCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              return {
                update: jest.fn((data: any) => {
                  expect(data.founded_year).toBe(2020);
                  expect(typeof data.founded_year).toBe('number');
                  return {
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: {
                            ...mockAgency,
                            founded_year: 2020,
                          },
                          error: null,
                        }),
                      }),
                    }),
                  };
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({ founded_year: '2020' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.agency.founded_year).toBe(2020);
    });

    it('updates boolean fields correctly', async () => {
      let selectCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              return {
                update: jest.fn((data: any) => {
                  expect(data.offers_per_diem).toBe(false);
                  expect(data.is_union).toBe(true);
                  return {
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: {
                            ...mockAgency,
                            offers_per_diem: false,
                            is_union: true,
                          },
                          error: null,
                        }),
                      }),
                    }),
                  };
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({
        offers_per_diem: false,
        is_union: true,
      });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('handles database update errors', async () => {
      let selectCalled = false;

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'agencies') {
            if (!selectCalled) {
              selectCalled = true;
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockAgency,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Database error' },
                      }),
                    }),
                  }),
                }),
              };
            }
          }
          return {};
        }),
      } as any);

      const request = createMockRequest({ name: 'Updated Name' });
      const response = await PATCH(request, { params: { id: 'agency-456' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update agency');
    });
  });
});
