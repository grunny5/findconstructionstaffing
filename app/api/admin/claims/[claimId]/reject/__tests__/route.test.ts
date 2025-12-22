/**
 * Tests for Admin Claim Rejection API Endpoint
 * POST /api/admin/claims/[claimId]/reject
 *
 * @jest-environment node
 */

import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('POST /api/admin/claims/[claimId]/reject', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase client mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 'Test reason' }),
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe(
        'You must be logged in to access this endpoint'
      );
    });

    it('should return 403 if user is not an admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 'Test reason' }),
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(data.error.message).toBe('Forbidden: Admin access required');
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should return 400 if request body is invalid JSON', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 if rejection_reason is missing', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Rejection reason is required');
    });

    it('should return 400 if rejection_reason is not a string', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 123 }),
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Rejection reason is required');
    });

    it('should return 400 if rejection_reason is too short', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/123/reject',
        {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 'Too short' }),
        }
      );

      const response = await POST(request, { params: { claimId: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toContain(
        'Rejection reason must be at least 20 characters'
      );
      expect(data.error.message).toContain('9 characters');
    });

    it('should return 404 if claim does not exist', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          // First call: profiles table (admin check)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          // Second call: agency_claim_requests (fetch claim)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/nonexistent/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'This claim does not exist in the system',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'nonexistent' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Claim request not found');
    });

    it('should return 409 if claim has already been approved', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          // profiles table
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          // agency_claim_requests - fetch claim
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'approved',
                agency_id: 'agency-123',
                user_id: 'user-123',
              },
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Cannot reject already approved claim',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Claim has already been processed with status: approved'
      );
    });

    it('should return 409 if claim has already been rejected', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'rejected',
                agency_id: 'agency-123',
                user_id: 'user-123',
              },
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Cannot reject already rejected claim',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Claim has already been processed with status: rejected'
      );
    });
  });

  // ============================================================================
  // SUCCESS TESTS
  // ============================================================================

  describe('Successful Rejection', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should successfully reject a pending claim', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        // 1. Admin role check
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        // 2. Fetch claim
        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'pending',
                agency_id: 'agency-123',
                user_id: 'user-123',
                business_email: 'owner@agency.com',
                phone_number: '+1234567890',
                position_title: 'CEO',
                verification_method: 'email',
                email_domain_verified: true,
              },
              error: null,
            }),
          };
        }

        // 3. Update claim
        if (fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'rejected',
                rejection_reason: 'Email domain does not match agency website',
                reviewed_by: 'admin-123',
                reviewed_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }

        // 4. Create audit log
        if (fromCallCount === 4) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Email domain does not match agency website',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.status).toBe('rejected');
      expect(data.data.reviewed_by).toBe('admin-123');
      expect(data.data.rejection_reason).toBe(
        'Email domain does not match agency website'
      );
      expect(data.message).toBe(
        'Claim rejected successfully. Requester will be notified.'
      );
    });

    it('should reject claim with status "under_review"', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'under_review',
                agency_id: 'agency-123',
                user_id: 'user-123',
              },
              error: null,
            }),
          };
        }

        if (fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'rejected',
                rejection_reason:
                  'Unable to verify business email with provided documentation',
                reviewed_by: 'admin-123',
              },
              error: null,
            }),
          };
        }

        if (fromCallCount === 4) {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason:
              'Unable to verify business email with provided documentation',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.status).toBe('rejected');
    });

    it('should trim rejection reason before saving', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'pending',
                agency_id: 'agency-123',
                user_id: 'user-123',
              },
              error: null,
            }),
          };
        }

        if (fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'rejected',
                rejection_reason: 'Reason with extra spaces trimmed',
                reviewed_by: 'admin-123',
              },
              error: null,
            }),
          };
        }

        if (fromCallCount === 4) {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: '   Reason with extra spaces trimmed   ',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.rejection_reason).toBe(
        'Reason with extra spaces trimmed'
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should return 500 if claim update fails', async () => {
      let fromCallCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;

        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }

        if (fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'claim-123',
                status: 'pending',
                agency_id: 'agency-123',
                user_id: 'user-123',
              },
              error: null,
            }),
          };
        }

        if (fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }

        return {};
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Valid reason for database error test case',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(data.error.message).toBe('Failed to update claim status');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/claims/claim-123/reject',
        {
          method: 'POST',
          body: JSON.stringify({
            rejection_reason: 'Valid reason for unexpected error test',
          }),
        }
      );

      const response = await POST(request, {
        params: { claimId: 'claim-123' },
      });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(data.error.message).toBe(
        'An unexpected error occurred while rejecting the claim'
      );
    });
  });
});
