/**
 * Admin Claim Approval API Endpoint
 *
 * POST /api/admin/claims/[claimId]/approve
 *
 * Approves an agency claim request and grants agency ownership to the requester.
 * This endpoint performs an atomic transaction to update multiple tables:
 * - Updates claim status to 'approved'
 * - Sets agency claimed_by and claimed_at fields
 * - Upgrades user role to 'agency_owner'
 * - Creates audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { Resend } from 'resend';
import {
  generateClaimApprovedHTML,
  generateClaimApprovedText,
} from '@/lib/emails/claim-approved';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * POST handler for approving a claim request (admin-only)
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing claimId
 * @returns JSON response with updated claim data or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": {
 *     "id": "uuid",
 *     "status": "approved",
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
 *     "rejection_reason": null,
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   },
 *   "message": "Claim approved successfully. User role updated to agency_owner."
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
    const supabase = await createClient();

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
    // 4. FETCH CLAIM REQUEST WITH AGENCY AND USER DATA
    // ========================================================================
    const { data: claim, error: claimError } = await supabase
      .from('agency_claim_requests')
      .select(
        `
        *,
        agency:agencies(name, slug),
        user:profiles(email, full_name)
      `
      )
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
    // 5. CHECK IF CLAIM ALREADY PROCESSED
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
    // 6. ATOMIC TRANSACTION: UPDATE CLAIM, AGENCY, PROFILE, AND CREATE AUDIT LOG
    // ========================================================================
    // Note: Supabase JS client doesn't support transactions directly,
    // so we'll use RPC to call a database function that handles the transaction
    // For now, we'll perform updates sequentially and rely on database constraints

    const now = new Date().toISOString();

    // Update claim status to 'approved'
    const { data: updatedClaim, error: updateClaimError } = await supabase
      .from('agency_claim_requests')
      .update({
        status: 'approved',
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

    // Update agency claimed_by and claimed_at
    const { error: updateAgencyError } = await supabase
      .from('agencies')
      .update({
        claimed_by: claim.user_id,
        claimed_at: now,
        is_claimed: true,
      })
      .eq('id', claim.agency_id);

    if (updateAgencyError) {
      // Rollback claim update by setting status back to original
      const { error: rollbackError } = await supabase
        .from('agency_claim_requests')
        .update({
          status: claim.status,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', claimId);

      if (rollbackError) {
        console.error(
          'Failed to rollback claim update after agency update failure:',
          rollbackError
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update agency ownership',
            details: updateAgencyError,
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Update user role to 'agency_owner'
    const { error: updateRoleError } = await supabase
      .from('profiles')
      .update({
        role: 'agency_owner',
      })
      .eq('id', claim.user_id);

    if (updateRoleError) {
      // Rollback previous updates
      const { error: rollbackClaimError } = await supabase
        .from('agency_claim_requests')
        .update({
          status: claim.status,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', claimId);

      if (rollbackClaimError) {
        console.error(
          'Failed to rollback claim update after role update failure:',
          rollbackClaimError
        );
      }

      const { error: rollbackAgencyError } = await supabase
        .from('agencies')
        .update({
          claimed_by: null,
          claimed_at: null,
          is_claimed: false,
        })
        .eq('id', claim.agency_id);

      if (rollbackAgencyError) {
        console.error(
          'Failed to rollback agency update after role update failure:',
          rollbackAgencyError
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update user role',
            details: updateRoleError,
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('agency_claim_audit_log')
      .insert({
        claim_id: claimId,
        admin_id: user.id,
        action: 'approved',
        notes: null,
      });

    if (auditError) {
      // Log error but don't fail the request - audit log is not critical
      console.error('Failed to create audit log entry:', auditError);
    }

    // ========================================================================
    // 7. SEND APPROVAL EMAIL (NON-BLOCKING)
    // ========================================================================
    // Send email in background - don't fail request if email fails
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Type assertion for joined data
        const agency = claim.agency as unknown as {
          name: string;
          slug: string;
        } | null;
        const userProfile = claim.user as unknown as {
          email: string;
          full_name: string | null;
        } | null;

        if (agency && userProfile) {
          const emailHtml = generateClaimApprovedHTML({
            recipientEmail: userProfile.email,
            recipientName: userProfile.full_name || undefined,
            agencyName: agency.name,
            agencySlug: agency.slug,
            siteUrl,
          });

          const emailText = generateClaimApprovedText({
            recipientEmail: userProfile.email,
            recipientName: userProfile.full_name || undefined,
            agencyName: agency.name,
            agencySlug: agency.slug,
            siteUrl,
          });

          await resend.emails.send({
            from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
            to: userProfile.email,
            subject: `Claim Approved - ${agency.name}`,
            html: emailHtml,
            text: emailText,
          });

          console.log(
            `Approval email sent to ${userProfile.email} for claim ${claimId}`
          );
        } else {
          console.warn(
            'Missing agency or user data for approval email - skipping email send'
          );
        }
      } else {
        console.warn('RESEND_API_KEY not configured - skipping approval email');
      }
    } catch (emailError) {
      // Log error but don't fail the request - claim was approved successfully
      console.error('Error sending approval email:', emailError);
    }

    // ========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: updatedClaim,
        message:
          'Claim approved successfully. User role updated to agency_owner.',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in claim approval:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred while approving the claim',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
