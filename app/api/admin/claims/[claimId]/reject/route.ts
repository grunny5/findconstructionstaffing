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
import { Resend } from 'resend';
import {
  generateClaimRejectedHTML,
  generateClaimRejectedText,
} from '@/lib/emails/claim-rejected';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * Rejects an agency claim request identified by `claimId`, records the admin review and rejection reason, creates an audit log entry, and optionally sends a rejection email to the requester.
 *
 * @returns The updated claim record under `data` and a confirmation `message`. On failure the response contains an `error` object with `code` and `message`.
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
    // 9. SEND REJECTION EMAIL
    // ========================================================================
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Type assertions for joined data from Supabase
        const agency = claim.agency as unknown as {
          name: string;
          slug: string;
        } | null;

        const userProfile = claim.user as unknown as {
          email: string;
          full_name: string | null;
        } | null;

        if (agency && userProfile) {
          const emailHtml = generateClaimRejectedHTML({
            recipientEmail: userProfile.email,
            recipientName: userProfile.full_name || undefined,
            agencyName: agency.name,
            agencySlug: agency.slug,
            rejectionReason: rejection_reason.trim(),
            siteUrl,
          });

          const emailText = generateClaimRejectedText({
            recipientEmail: userProfile.email,
            recipientName: userProfile.full_name || undefined,
            agencyName: agency.name,
            agencySlug: agency.slug,
            rejectionReason: rejection_reason.trim(),
            siteUrl,
          });

          await resend.emails.send({
            from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
            to: userProfile.email,
            subject: `Claim Request Update - ${agency.name}`,
            html: emailHtml,
            text: emailText,
          });

          console.log(
            `Rejection email sent to ${userProfile.email} for claim ${claimId}`
          );
        } else {
          console.warn(
            `Unable to send rejection email for claim ${claimId}: missing agency or user data`
          );
        }
      } else {
        console.warn(
          'RESEND_API_KEY not configured - skipping rejection email'
        );
      }
    } catch (emailError) {
      // Log error but don't fail the request - email is not critical
      console.error('Error sending rejection email:', emailError);
    }

    // ========================================================================
    // 10. RETURN SUCCESS RESPONSE
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