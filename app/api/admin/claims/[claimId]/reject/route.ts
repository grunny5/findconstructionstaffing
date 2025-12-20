/**
 * Admin Claim Rejection API Endpoint
 *
 * POST /api/admin/claims/[claimId]/reject
 *
 * Rejects an agency claim request with a reason.
 * This endpoint performs the following operations:
 * - Updates claim status to 'rejected'
 * - Sets rejection_reason field
 * - Sets reviewed_by and reviewed_at fields
 * - Creates audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * POST handler for rejecting a claim request (admin-only)
 *
 * @param request - Next.js request object with rejection_reason in body
 * @param params - Route parameters containing claimId
 * @returns JSON response with updated claim data or error
 *
 * Request Body:
 * ```json
 * {
 *   "rejection_reason": "string (min 20 characters)"
 * }
 * ```
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": {
 *     "id": "uuid",
 *     "status": "rejected",
 *     "rejection_reason": "string",
 *     "reviewed_by": "admin-uuid",
 *     "reviewed_at": "2024-01-01T00:00:00Z",
 *     "agency_id": "uuid",
 *     "user_id": "uuid",
 *     "business_email": "user@agency.com",
 *     "phone_number": "+1234567890",
 *     "position_title": "CEO",
 *     "verification_method": "email",
 *     "email_domain_verified": true,
 *     "additional_notes": "string | null",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   },
 *   "message": "Claim rejected successfully. Requester will be notified."
 * }
 * ```
 *
 * Error Response (4xx/5xx):
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message"
 *   }
 * }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'You must be logged in to access this endpoint',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. ADMIN ROLE VERIFICATION
    // ========================================================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Forbidden: Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 3. VALIDATE CLAIM ID
    // ========================================================================
    const { claimId } = params;

    if (!claimId) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Claim ID is required',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 4. VALIDATE REQUEST BODY
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid JSON in request body',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { rejection_reason } = body;

    if (!rejection_reason || typeof rejection_reason !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Rejection reason is required',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (rejection_reason.trim().length < 20) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message:
              'Rejection reason must be at least 20 characters (currently ' +
              rejection_reason.trim().length +
              ' characters)',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 5. FETCH CLAIM REQUEST
    // ========================================================================
    const { data: claim, error: claimError } = await supabase
      .from('agency_claim_requests')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Claim request not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 6. CHECK IF CLAIM ALREADY PROCESSED
    // ========================================================================
    if (claim.status !== 'pending' && claim.status !== 'under_review') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Claim has already been processed with status: ${claim.status}`,
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 7. UPDATE CLAIM STATUS TO REJECTED
    // ========================================================================
    const now = new Date().toISOString();

    const { data: updatedClaim, error: updateClaimError } = await supabase
      .from('agency_claim_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason.trim(),
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq('id', claimId)
      .select()
      .single();

    if (updateClaimError || !updatedClaim) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update claim status',
            details: updateClaimError,
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 8. CREATE AUDIT LOG ENTRY
    // ========================================================================
    const { error: auditError } = await supabase
      .from('agency_claim_audit_log')
      .insert({
        claim_id: claimId,
        admin_id: user.id,
        action: 'rejected',
        notes: rejection_reason.trim(),
      });

    if (auditError) {
      // Log error but don't fail the request - audit log is not critical
      console.error('Failed to create audit log entry:', auditError);
    }

    // ========================================================================
    // 9. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: updatedClaim,
        message: 'Claim rejected successfully. Requester will be notified.',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in claim rejection:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred while rejecting the claim',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
