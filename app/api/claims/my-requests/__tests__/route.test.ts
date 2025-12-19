/**
 * @jest-environment node
 */
import { GET } from '../route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@supabase/ssr');
jest.mock('next/headers');

const mockedCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('GET /api/claims/my-requests', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
  };

  const mockClaimRequests = [
    {
      id: 'claim-1',
      agency_id: 'agency-1',
      user_id: mockUser.id,
      status: 'pending',
      business_email: 'user@agency1.com',
      phone_number: '+1-555-123-4567',
      position_title: 'CEO',
      verification_method: 'email',
      email_domain_verified: true,
      additional_notes: 'I am the owner',
      rejection_reason: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      agency: {
        id: 'agency-1',
        name: 'Test Agency 1',
        slug: 'test-agency-1',
        logo_url: 'https://example.com/logo1.png',
      },
    },
    {
      id: 'claim-2',
      agency_id: 'agency-2',
      user_id: mockUser.id,
      status: 'approved',
      business_email: 'user@agency2.com',
      phone_number: '+1-555-987-6543',
      position_title: 'Manager',
      verification_method: 'phone',
      email_domain_verified: false,
      additional_notes: null,
      rejection_reason: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      agency: {
        id: 'agency-2',
        name: 'Test Agency 2',
        slug: 'test-agency-2',
        logo_url: null,
      },
    },
  ];

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

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to view claim requests'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should create Supabase client with cookie handler', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await GET();

      expect(mockedCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });
  });

  describe('Query Correctness', () => {
    it('should query claims with correct join and filter', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockClaimRequests,
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      await GET();

      expect(mockFrom).toHaveBeenCalledWith('agency_claim_requests');
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('agency:agencies!inner')
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should include all required claim fields in select', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      await GET();

      const selectCall = mockSelect.mock.calls[0][0];
      expect(selectCall).toContain('id');
      expect(selectCall).toContain('agency_id');
      expect(selectCall).toContain('user_id');
      expect(selectCall).toContain('status');
      expect(selectCall).toContain('business_email');
      expect(selectCall).toContain('phone_number');
      expect(selectCall).toContain('position_title');
      expect(selectCall).toContain('verification_method');
      expect(selectCall).toContain('email_domain_verified');
      expect(selectCall).toContain('additional_notes');
      expect(selectCall).toContain('rejection_reason');
      expect(selectCall).toContain('created_at');
      expect(selectCall).toContain('updated_at');
    });

    it('should include required agency fields in join', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      await GET();

      const selectCall = mockSelect.mock.calls[0][0];
      expect(selectCall).toContain('agency:agencies!inner');
      expect(selectCall).toContain('id');
      expect(selectCall).toContain('name');
      expect(selectCall).toContain('slug');
      expect(selectCall).toContain('logo_url');
    });
  });

  describe('Success Scenarios', () => {
    it('should return user claims with agency data', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockClaimRequests,
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toMatchObject({
        id: 'claim-1',
        status: 'pending',
        agency: {
          id: 'agency-1',
          name: 'Test Agency 1',
          slug: 'test-agency-1',
          logo_url: 'https://example.com/logo1.png',
        },
      });
      expect(data.data[1]).toMatchObject({
        id: 'claim-2',
        status: 'approved',
        agency: {
          id: 'agency-2',
          name: 'Test Agency 2',
          slug: 'test-agency-2',
          logo_url: null,
        },
      });
    });

    it('should return empty array when user has no claims', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data).toEqual([]);
    });

    it('should return claims sorted by created_at DESC', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockClaimRequests,
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      // Verify newest first (claim-1 has 2024-01-02, claim-2 has 2024-01-01)
      expect(data.data[0].created_at).toBe('2024-01-02T00:00:00Z');
      expect(data.data[1].created_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to fetch claim requests');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching claim requests:',
        { message: 'Database error' }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unexpected error in my-requests handler:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Structure', () => {
    it('should return response with correct structure', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [mockClaimRequests[0]],
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('agency_id');
      expect(data.data[0]).toHaveProperty('user_id');
      expect(data.data[0]).toHaveProperty('status');
      expect(data.data[0]).toHaveProperty('business_email');
      expect(data.data[0]).toHaveProperty('phone_number');
      expect(data.data[0]).toHaveProperty('position_title');
      expect(data.data[0]).toHaveProperty('verification_method');
      expect(data.data[0]).toHaveProperty('email_domain_verified');
      expect(data.data[0]).toHaveProperty('additional_notes');
      expect(data.data[0]).toHaveProperty('rejection_reason');
      expect(data.data[0]).toHaveProperty('created_at');
      expect(data.data[0]).toHaveProperty('updated_at');
      expect(data.data[0]).toHaveProperty('agency');
      expect(data.data[0].agency).toHaveProperty('id');
      expect(data.data[0].agency).toHaveProperty('name');
      expect(data.data[0].agency).toHaveProperty('slug');
      expect(data.data[0].agency).toHaveProperty('logo_url');
    });
  });
});
