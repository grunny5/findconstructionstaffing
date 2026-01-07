/**
 * Tests for Admin Compliance Verification API Endpoint
 * POST /api/admin/agencies/[id]/compliance/verify
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

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-123' }),
    },
  })),
}));

// Mock email generators
jest.mock('@/lib/emails/compliance-rejected', () => ({
  generateComplianceRejectedHTML: jest.fn().mockReturnValue('<html></html>'),
  generateComplianceRejectedText: jest.fn().mockReturnValue('text'),
}));

const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('POST /api/admin/agencies/[id]/compliance/verify', () => {
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

    // Set environment variables
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
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
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
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
          data: { role: 'user', full_name: 'Test User' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
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

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin', full_name: 'Admin User' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);
    });

    it('should return 400 if request body is invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 if complianceType is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe('Compliance type is required');
    });

    it('should return 400 if complianceType is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'invalid_type',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toContain('Invalid compliance type');
    });

    it('should return 400 if action is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Action must be either "verify" or "reject"'
      );
    });

    it('should return 400 if action is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'invalid',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Action must be either "verify" or "reject"'
      );
    });

    it('should return 400 if reject action is missing reason', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'reject',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toBe(
        'Rejection reason is required when rejecting'
      );
    });

    it('should return 400 if reject reason is too short', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'reject',
            reason: 'short',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(data.error.message).toContain(
        'Rejection reason must be at least 10 characters'
      );
    });
  });

  // ============================================================================
  // NOT FOUND TESTS
  // ============================================================================

  describe('Not Found', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should return 404 if agency not found', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: profiles (admin check)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else {
          // Second call: agencies
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toBe('Agency not found');
    });

    it('should return 404 if compliance record not found', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: profiles (admin check)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // Second call: agencies
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'agency-123',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-123',
              },
              error: null,
            }),
          };
        } else {
          // Third call: agency_compliance
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(data.error.message).toContain('Compliance record not found');
    });
  });

  // ============================================================================
  // VERIFY ACTION TESTS
  // ============================================================================

  describe('Verify Action', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should successfully verify compliance document', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: profiles (admin check)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // Second call: agencies
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'agency-123',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-123',
              },
              error: null,
            }),
          };
        } else if (callCount === 3) {
          // Third call: agency_compliance (select)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                agency_id: 'agency-123',
                compliance_type: 'osha_certified',
                is_active: true,
                is_verified: false,
                document_url: 'https://example.com/doc.pdf',
                notes: null,
              },
              error: null,
            }),
          };
        } else {
          // Fourth call: agency_compliance (update)
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                agency_id: 'agency-123',
                compliance_type: 'osha_certified',
                is_active: true,
                is_verified: true,
                verified_by: 'admin-123',
                verified_at: expect.any(String),
                document_url: 'https://example.com/doc.pdf',
                notes: 'Verified by admin',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/agency-123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
            notes: 'Verified by admin',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'agency-123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toBe('Compliance document verified successfully');
      expect(data.data.is_verified).toBe(true);
      expect(data.data.verified_by).toBe('admin-123');
    });

    it('should preserve existing notes if no new notes provided', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // profiles
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // agencies
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'agency-123',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-123',
              },
              error: null,
            }),
          };
        } else if (callCount === 3) {
          // agency_compliance (select)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                agency_id: 'agency-123',
                compliance_type: 'osha_certified',
                is_active: true,
                is_verified: false,
                document_url: 'https://example.com/doc.pdf',
                notes: 'Existing notes',
              },
              error: null,
            }),
          };
        } else {
          // agency_compliance (update)
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                is_verified: true,
                verified_by: 'admin-123',
                notes: 'Existing notes',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/agency-123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'verify',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'agency-123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.data.notes).toBe('Existing notes');
    });
  });

  // ============================================================================
  // REJECT ACTION TESTS
  // ============================================================================

  describe('Reject Action', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
    });

    it('should successfully reject compliance document', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // profiles (admin check)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // agencies
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'agency-123',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-123',
              },
              error: null,
            }),
          };
        } else if (callCount === 3) {
          // agency_compliance (select)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                agency_id: 'agency-123',
                compliance_type: 'osha_certified',
                is_active: true,
                is_verified: false,
                document_url: 'https://example.com/doc.pdf',
                notes: null,
              },
              error: null,
            }),
          };
        } else if (callCount === 4) {
          // agency_compliance (update)
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                agency_id: 'agency-123',
                compliance_type: 'osha_certified',
                is_active: true,
                is_verified: false,
                verified_by: null,
                verified_at: null,
                document_url: null,
                notes: 'Rejected notes',
              },
              error: null,
            }),
          };
        } else {
          // profiles (owner email)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                email: 'owner@test.com',
                full_name: 'Owner Name',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/agency-123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'reject',
            reason: 'Document is not legible',
            notes: 'Rejected notes',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'agency-123' } });
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toContain('rejected successfully');
      expect(data.data.is_verified).toBe(false);
      expect(data.data.document_url).toBeNull();
    });

    it('should handle email sending failure gracefully', async () => {
      const { Resend } = require('resend');
      Resend.mockImplementationOnce(() => ({
        emails: {
          send: jest.fn().mockRejectedValue(new Error('Email failed')),
        },
      }));

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin', full_name: 'Admin User' },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'agency-123',
                name: 'Test Agency',
                slug: 'test-agency',
                claimed_by: 'owner-123',
              },
              error: null,
            }),
          };
        } else if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                is_active: true,
                is_verified: false,
                document_url: 'https://example.com/doc.pdf',
              },
              error: null,
            }),
          };
        } else if (callCount === 4) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'comp-123',
                is_verified: false,
                document_url: null,
              },
              error: null,
            }),
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                email: 'owner@test.com',
                full_name: 'Owner Name',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/agencies/agency-123/compliance/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            complianceType: 'osha_certified',
            action: 'reject',
            reason: 'Document is not legible',
          }),
        }
      );

      const response = await POST(request, { params: { id: 'agency-123' } });
      const data = await response.json();

      // Should still succeed even if email fails
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(data.message).toContain('rejected successfully');
    });
  });
});
