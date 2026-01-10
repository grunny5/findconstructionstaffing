/**
 * Admin Compliance Verification API Endpoint
 *
 * POST /api/admin/agencies/[id]/compliance/verify
 *
 * Allows admin to verify or reject compliance documents.
 * This endpoint performs the following operations:
 * - Verify: Sets is_verified=true, verified_by, verified_at
 * - Reject: Clears document_url, sends rejection email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ERROR_CODES,
  HTTP_STATUS,
  type ComplianceType,
  COMPLIANCE_TYPES,
} from '@/types/api';
import { Resend } from 'resend';
import {
  generateComplianceRejectedHTML,
  generateComplianceRejectedText,
} from '@/lib/emails/compliance-rejected';
import { validateSiteUrl } from '@/lib/emails/utils';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * POST handler for verifying or rejecting compliance documents (admin-only)
 *
 * @param request - Next.js request object
 * @param context - Route parameters containing agency id
 * @returns JSON response with updated compliance data or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const { id: agencyId } = await params;
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
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Forbidden: Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 3. VALIDATE AGENCY ID
    // ========================================================================
    if (!agencyId) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Agency ID is required',
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

    const { complianceType, action, reason, notes } = body;

    // Validate notes if provided
    let validatedNotes: string | undefined = undefined;
    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Notes must be a string if provided',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      validatedNotes = notes.trim() || undefined;
    }

    // Validate complianceType
    if (!complianceType || typeof complianceType !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Compliance type is required',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!COMPLIANCE_TYPES.includes(complianceType as ComplianceType)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Invalid compliance type: ${complianceType}`,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate action
    if (!action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Action must be either "verify" or "reject"',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate reason for reject action
    if (action === 'reject') {
      if (!reason || typeof reason !== 'string') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Rejection reason is required when rejecting',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      if (reason.trim().length < 10) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message:
                'Rejection reason must be at least 10 characters (currently ' +
                reason.trim().length +
                ' characters)',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // ========================================================================
    // 5. FETCH AGENCY AND COMPLIANCE DATA
    // ========================================================================
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select(
        `
        id,
        name,
        slug,
        claimed_by
      `
      )
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Agency not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Fetch compliance record
    const { data: compliance, error: complianceError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('compliance_type', complianceType)
      .single();

    if (complianceError || !compliance) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `Compliance record not found for type: ${complianceType}`,
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 6. PERFORM VERIFY OR REJECT ACTION
    // ========================================================================
    const now = new Date().toISOString();

    if (action === 'verify') {
      // Validate that a supporting document exists before verification
      if (!compliance.document_url) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Cannot verify compliance without a supporting document',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      // VERIFY ACTION: Set verification fields
      const { data: updatedCompliance, error: updateError } = await supabase
        .from('agency_compliance')
        .update({
          is_verified: true,
          verified_by: user.id,
          verified_at: now,
          notes: validatedNotes !== undefined ? validatedNotes : compliance.notes,
        })
        .eq('id', compliance.id)
        .select()
        .single();

      if (updateError || !updatedCompliance) {
        console.error(
          'Failed to verify compliance document:',
          updateError,
          'Agency ID:',
          agencyId,
          'Compliance Type:',
          complianceType
        );
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to verify compliance document',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }

      return NextResponse.json(
        {
          data: updatedCompliance,
          message: 'Compliance document verified successfully',
        },
        { status: HTTP_STATUS.OK }
      );
    } else {
      // REJECT ACTION: Delete storage file, clear document_url, and send email

      // Delete the document from storage if it exists
      if (compliance.document_url) {
        // Extract file path from signed URL (strip bucket prefix and query params)
        // Handles both full signed URLs and plain storage paths
        const STORAGE_BUCKET = 'compliance-documents';
        const urlParts = compliance.document_url.split(`/${STORAGE_BUCKET}/`);
        let filePath: string;
        if (urlParts.length > 1) {
          // Full URL with bucket prefix - extract path after bucket name
          filePath = urlParts[1].split('?')[0];
        } else {
          // Plain storage path - strip query params only
          filePath = compliance.document_url.split('?')[0];
        }
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath]);

        if (deleteError) {
          console.warn(
            `Failed to delete storage file ${filePath}:`,
            deleteError
          );
          // Continue with rejection even if storage delete fails
        }
      }

      const { data: updatedCompliance, error: updateError } = await supabase
        .from('agency_compliance')
        .update({
          is_verified: false,
          verified_by: null,
          verified_at: null,
          document_url: null,
          notes: validatedNotes ?? null,
        })
        .eq('id', compliance.id)
        .select()
        .single();

      if (updateError || !updatedCompliance) {
        console.error(
          'Failed to reject compliance document:',
          updateError,
          'Agency ID:',
          agencyId,
          'Compliance Type:',
          complianceType
        );
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to reject compliance document',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }

      // ========================================================================
      // 7. SEND REJECTION EMAIL
      // ========================================================================
      let emailSent = false;
      try {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (resendApiKey && agency.claimed_by) {
          const resend = new Resend(resendApiKey);
          const siteUrl = validateSiteUrl(
            process.env.NEXT_PUBLIC_SITE_URL || ''
          );

          // Fetch agency owner's email
          const { data: owner, error: ownerError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', agency.claimed_by)
            .single();

          if (!ownerError && owner && owner.email) {
            // Use configurable sender address - domain must be verified in Resend (SPF/DKIM)
            const emailSender =
              process.env.AUTH_EMAIL_SENDER ||
              'FindConstructionStaffing <noreply@findconstructionstaffing.com>';

            const emailHtml = generateComplianceRejectedHTML({
              recipientName: owner.full_name || undefined,
              agencyName: agency.name,
              agencySlug: agency.slug,
              complianceType: complianceType as ComplianceType,
              rejectionReason: reason.trim(),
              siteUrl,
            });

            const emailText = generateComplianceRejectedText({
              recipientName: owner.full_name || undefined,
              agencyName: agency.name,
              agencySlug: agency.slug,
              complianceType: complianceType as ComplianceType,
              rejectionReason: reason.trim(),
              siteUrl,
            });

            await resend.emails.send({
              from: emailSender,
              to: owner.email,
              subject: `Compliance Document Update - ${agency.name}`,
              html: emailHtml,
              text: emailText,
            });

            emailSent = true;
            console.log(
              `Rejection email sent to owner ${agency.claimed_by} for compliance ${complianceType} on agency ${agencyId}`
            );
          } else {
            console.warn(
              `Unable to send rejection email for agency ${agencyId}: owner not found or missing email`
            );
          }
        } else {
          console.warn(
            'RESEND_API_KEY not configured or agency not claimed - skipping rejection email'
          );
        }
      } catch (emailError) {
        // Log error but don't fail the request - document was rejected successfully
        console.error('Error sending rejection email:', emailError);
      }

      return NextResponse.json(
        {
          data: updatedCompliance,
          message: `Compliance document rejected successfully.${emailSent ? ' Agency owner has been notified.' : ''}`,
        },
        { status: HTTP_STATUS.OK }
      );
    }
  } catch (error) {
    console.error('Unexpected error in compliance verification:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message:
            'An unexpected error occurred while processing the compliance verification',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
