/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { verifyEmailDomain } from '@/lib/utils/email-domain-verification';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import {
  generateClaimConfirmationHTML,
  generateClaimConfirmationText,
} from '@/lib/emails/claim-confirmation';

jest.mock('@supabase/ssr');
jest.mock('next/headers');
jest.mock('@/lib/utils/email-domain-verification');
jest.mock('resend');
jest.mock('@/lib/emails/claim-confirmation');

const mockedCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;
const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockedVerifyEmailDomain = verifyEmailDomain as jest.MockedFunction<
  typeof verifyEmailDomain
>;

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
  } as any as NextRequest;
}

describe('POST /api/claims/request', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
  };

  const mockAgency = {
    id: '987e6543-e21b-12d3-a456-426614174001',
    name: 'Test Staffing Agency',
    website: 'https://teststaffing.com',
    is_claimed: false,
    claimed_by: null,
  };

  const validClaimRequest = {
    agency_id: '987e6543-e21b-12d3-a456-426614174001',
    business_email: 'admin@teststaffing.com',
    phone_number: '+1-555-123-4567',
    position_title: 'HR Manager',
    verification_method: 'email' as const,
    additional_notes: 'I am the HR manager',
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

    // Mock email domain verification - default to true
    mockedVerifyEmailDomain.mockReturnValue(true);

    // Mock Resend email template functions
    (generateClaimConfirmationHTML as jest.Mock).mockReturnValue(
      '<html>Email HTML</html>'
    );
    (generateClaimConfirmationText as jest.Mock).mockReturnValue('Email Text');

    // Mock Resend constructor
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'email-123' }),
      },
    }));
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

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to submit a claim request'
      );
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should create Supabase client with cookie handler', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createMockRequest(validClaimRequest);
      await POST(request);

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

  describe('Request Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should reject request with missing agency_id', async () => {
      const invalidRequest = { ...validClaimRequest };
      delete (invalidRequest as any).agency_id;

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid request data');
      expect(data.error.details).toBeDefined();
    });

    it('should reject request with invalid agency_id format', async () => {
      const invalidRequest = {
        ...validClaimRequest,
        agency_id: 'not-a-uuid',
      };

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject request with invalid email format', async () => {
      const invalidRequest = {
        ...validClaimRequest,
        business_email: 'not-an-email',
      };

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject request with invalid phone number', async () => {
      const invalidRequest = {
        ...validClaimRequest,
        phone_number: 'invalid',
      };

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject request with missing position_title', async () => {
      const invalidRequest = { ...validClaimRequest };
      delete (invalidRequest as any).position_title;

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject request with invalid verification_method', async () => {
      const invalidRequest = {
        ...validClaimRequest,
        verification_method: 'invalid',
      };

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should accept optional additional_notes', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const requestWithNotes = {
        ...validClaimRequest,
        additional_notes: 'Some additional context',
      };

      const request = createMockRequest(requestWithNotes);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should accept request without additional_notes', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const requestWithoutNotes = { ...validClaimRequest };
      delete (requestWithoutNotes as any).additional_notes;

      const request = createMockRequest(requestWithoutNotes);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  describe('Agency Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 404 when agency does not exist', async () => {
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.AGENCY_NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });

    it('should return 409 when agency is already claimed', async () => {
      const claimedAgency = {
        ...mockAgency,
        is_claimed: true,
        claimed_by: '999e9999-e99b-99d9-a999-999999999999',
      };

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: claimedAgency,
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
        single: mockSingle,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.AGENCY_ALREADY_CLAIMED);
      expect(data.error.message).toBe('This agency has already been claimed');
    });
  });

  describe('Duplicate Claim Detection', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 409 when user has pending claim for agency', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // First call - agency fetch (success)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Second call - existing claim check (found pending)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-claim-123',
          status: 'pending',
        },
        error: null,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.PENDING_CLAIM_EXISTS);
      expect(data.error.message).toBe(
        'You already have a pending claim request for this agency'
      );
      expect(data.error.details.existing_claim_id).toBe('existing-claim-123');
    });

    it('should return 409 when user has under_review claim for agency', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // First call - agency fetch (success)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Second call - existing claim check (found under_review)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-claim-456',
          status: 'under_review',
        },
        error: null,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.PENDING_CLAIM_EXISTS);
    });

    it('should allow new claim when previous claim was rejected', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // First call - agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Second call - existing claim check (no pending/under_review)
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Third call - insert new claim
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-claim-789',
          agency_id: validClaimRequest.agency_id,
          user_id: mockUser.id,
          status: 'pending',
          email_domain_verified: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Fourth call - insert audit log
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  describe('Email Domain Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should verify email domain matches agency website', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Setup agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Setup existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Setup claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'claim-123',
          agency_id: validClaimRequest.agency_id,
          user_id: mockUser.id,
          status: 'pending',
          email_domain_verified: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Setup audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      mockedVerifyEmailDomain.mockReturnValue(true);

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(mockedVerifyEmailDomain).toHaveBeenCalledWith(
        validClaimRequest.business_email,
        mockAgency.website
      );
      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.email_domain_verified).toBe(true);
    });

    it('should set email_domain_verified to false when domains do not match', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Setup agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Setup existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Setup claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'claim-123',
          agency_id: validClaimRequest.agency_id,
          user_id: mockUser.id,
          status: 'pending',
          email_domain_verified: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Setup audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      mockedVerifyEmailDomain.mockReturnValue(false);

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.email_domain_verified).toBe(false);
    });
  });

  describe('Successful Claim Creation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should create claim request and audit log successfully', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      const mockInsertFn = jest.fn().mockResolvedValue({
        data: {
          id: 'claim-123',
          agency_id: validClaimRequest.agency_id,
          user_id: mockUser.id,
          status: 'pending',
          email_domain_verified: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: mockInsertFn,
      });

      // Audit log insert
      const mockAuditInsert = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        insert: mockAuditInsert,
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data).toEqual({
        id: 'claim-123',
        agency_id: validClaimRequest.agency_id,
        user_id: mockUser.id,
        status: 'pending',
        email_domain_verified: true,
        created_at: '2024-01-01T00:00:00Z',
      });

      // Verify audit log was created
      expect(mockAuditInsert).toHaveBeenCalledWith({
        claim_id: 'claim-123',
        admin_id: null,
        action: 'submitted',
        notes: 'Claim request submitted by user',
      });
    });

    it('should succeed even if audit log creation fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert - fails
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Audit log error'),
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(data.data.id).toBe('claim-123');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating audit log entry:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Database Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 500 when existing claim check fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch success
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check fails
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe(
        'Failed to check existing claim requests'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 when claim insert fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert fails
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed'),
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to create claim request');
      expect(data.error.details).toBeUndefined(); // Should not expose internal error
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not expose internal database errors to client', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert fails with detailed error
      const detailedError = new Error('Constraint violation: fk_user_id');
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: detailedError,
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.message).toBe('Failed to create claim request');
      expect(data.error.details).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('Constraint violation');
      expect(JSON.stringify(data)).not.toContain('fk_user_id');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Unexpected Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Force an unexpected error by making json() throw
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      } as any as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe('An unexpected error occurred');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unexpected error in claim request handler:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Email Notification', () => {
    let mockResendInstance: any;

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Create mock Resend instance
      mockResendInstance = {
        emails: {
          send: jest.fn().mockResolvedValue({ id: 'email-123' }),
        },
      };
      (Resend as jest.Mock).mockImplementation(() => mockResendInstance);

      // Set environment variable for RESEND_API_KEY
      process.env.RESEND_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://findconstructionstaffing.com';
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
      delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it('should send confirmation email after successful claim creation', async () => {
      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);

      // Verify email template generation was called
      expect(generateClaimConfirmationHTML).toHaveBeenCalledWith({
        recipientEmail: mockUser.email,
        agencyName: mockAgency.name,
        claimId: 'claim-123',
        siteUrl: 'https://findconstructionstaffing.com',
      });

      expect(generateClaimConfirmationText).toHaveBeenCalledWith({
        recipientEmail: mockUser.email,
        agencyName: mockAgency.name,
        claimId: 'claim-123',
        siteUrl: 'https://findconstructionstaffing.com',
      });

      // Verify Resend was called with correct parameters
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
        to: mockUser.email,
        subject: `Claim Request Submitted for ${mockAgency.name}`,
        html: '<html>Email HTML</html>',
        text: 'Email Text',
      });
    });

    it('should not fail request if RESEND_API_KEY is not configured', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      delete process.env.RESEND_API_KEY;

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'RESEND_API_KEY not configured - skipping confirmation email'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not fail request if email sending fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock email sending to fail
      mockResendInstance.emails.send.mockRejectedValueOnce(
        new Error('Email service error')
      );

      const mockFrom = jest.fn();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();
      const mockMaybeSingle = jest.fn();

      mockSupabaseClient.from = mockFrom;

      // Agency fetch
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        single: mockSingle,
      });
      mockSingle.mockResolvedValueOnce({
        data: mockAgency,
        error: null,
      });

      // Existing claim check
      mockFrom.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });
      mockEq.mockReturnValueOnce({
        in: mockIn,
      });
      mockIn.mockReturnValueOnce({
        maybeSingle: mockMaybeSingle,
      });
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Claim insert
      mockFrom.mockReturnValueOnce({
        insert: mockInsert,
      });
      mockInsert.mockReturnValueOnce({
        select: mockSelect,
      });
      mockSelect.mockReturnValueOnce({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'claim-123',
            agency_id: validClaimRequest.agency_id,
            user_id: mockUser.id,
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      // Audit log insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const request = createMockRequest(validClaimRequest);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending confirmation email:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
