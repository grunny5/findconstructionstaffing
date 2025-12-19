/**
 * Agency Claim Request API Endpoint
 *
 * POST /api/claims/request
 *
 * Allows authenticated users to submit a claim request for an agency profile.
 * Validates the request, checks for conflicts, verifies email domain if possible,
 * and creates both the claim request and initial audit log entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { ClaimRequestSchema } from '@/lib/validation/claim-request';
import { verifyEmailDomain } from '@/lib/utils/email-domain-verification';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { ZodError } from 'zod';
import {
  generateClaimConfirmationHTML,
  generateClaimConfirmationText,
} from '@/lib/emails/claim-confirmation';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * POST handler for agency claim request submissions
 *
 * @param request - The incoming HTTP request
 * @returns JSON response with claim request data or error
 *
 * Success Response (201):
 * ```json
 * {
 *   "data": {
 *     "id": "uuid",
 *     "agency_id": "uuid",
 *     "user_id": "uuid",
 *     "status": "pending",
 *     "email_domain_verified": true|false,
 *     "created_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 * ```
 *
 * Error Response (4xx/5xx):
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message",
 *     "details": { ... }
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create Supabase client with cookie handling for auth
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

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
            message: 'You must be logged in to submit a claim request',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. REQUEST BODY VALIDATION
    // ========================================================================
    const body = await request.json();

    let validatedData;
    try {
      validatedData = ClaimRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid request data',
              details: error.errors.reduce(
                (acc, err) => ({
                  ...acc,
                  [err.path.join('.')]: err.message,
                }),
                {}
              ),
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      throw error;
    }

    const {
      agency_id,
      business_email,
      phone_number,
      position_title,
      verification_method,
      additional_notes,
    } = validatedData;

    // ========================================================================
    // 3. CHECK IF AGENCY EXISTS
    // ========================================================================
    const { data: agency, error: agencyFetchError } = await supabase
      .from('agencies')
      .select('id, name, website, is_claimed, claimed_by')
      .eq('id', agency_id)
      .single();

    if (agencyFetchError || !agency) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AGENCY_NOT_FOUND,
            message: 'Agency not found',
            details: { agency_id },
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 4. CHECK IF AGENCY IS ALREADY CLAIMED
    // ========================================================================
    if (agency.is_claimed && agency.claimed_by) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AGENCY_ALREADY_CLAIMED,
            message: 'This agency has already been claimed',
            details: {
              agency_id,
              agency_name: agency.name,
            },
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 5. CHECK IF USER ALREADY HAS PENDING CLAIM FOR THIS AGENCY
    // ========================================================================
    const { data: existingClaim, error: existingClaimError } = await supabase
      .from('agency_claim_requests')
      .select('id, status')
      .eq('agency_id', agency_id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (existingClaimError) {
      console.error('Error checking existing claims:', existingClaimError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to check existing claim requests',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (existingClaim) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.PENDING_CLAIM_EXISTS,
            message: 'You already have a pending claim request for this agency',
            details: {
              existing_claim_id: existingClaim.id,
              status: existingClaim.status,
            },
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 6. VERIFY EMAIL DOMAIN (AUTOMATIC)
    // ========================================================================
    const emailDomainVerified = verifyEmailDomain(
      business_email,
      agency.website
    );

    // ========================================================================
    // 7. INSERT CLAIM REQUEST
    // ========================================================================
    const { data: claimRequest, error: insertError } = await supabase
      .from('agency_claim_requests')
      .insert({
        agency_id,
        user_id: user.id,
        business_email,
        phone_number,
        position_title,
        verification_method,
        additional_notes,
        email_domain_verified: emailDomainVerified,
        status: 'pending',
      })
      .select(
        'id, agency_id, user_id, status, email_domain_verified, created_at'
      )
      .single();

    if (insertError || !claimRequest) {
      console.error('Error inserting claim request:', insertError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to create claim request',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 8. CREATE AUDIT LOG ENTRY
    // ========================================================================
    const { error: auditLogError } = await supabase
      .from('agency_claim_audit_log')
      .insert({
        claim_id: claimRequest.id,
        admin_id: null, // User-initiated action
        action: 'submitted',
        notes: 'Claim request submitted by user',
      });

    if (auditLogError) {
      // Log error but don't fail the request - claim was created successfully
      console.error('Error creating audit log entry:', auditLogError);
    }

    // ========================================================================
    // 9. SEND CONFIRMATION EMAIL (NON-BLOCKING)
    // ========================================================================
    // Send email in background - don't fail request if email fails
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const emailHtml = generateClaimConfirmationHTML({
          recipientEmail: user.email || business_email,
          agencyName: agency.name,
          claimId: claimRequest.id,
          siteUrl,
        });

        const emailText = generateClaimConfirmationText({
          recipientEmail: user.email || business_email,
          agencyName: agency.name,
          claimId: claimRequest.id,
          siteUrl,
        });

        await resend.emails.send({
          from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
          to: user.email || business_email,
          subject: `Claim Request Submitted for ${agency.name}`,
          html: emailHtml,
          text: emailText,
        });

        console.log(
          `Confirmation email sent to ${user.email || business_email} for claim ${claimRequest.id}`
        );
      } else {
        console.warn(
          'RESEND_API_KEY not configured - skipping confirmation email'
        );
      }
    } catch (emailError) {
      // Log error but don't fail the request - claim was created successfully
      console.error('Error sending confirmation email:', emailError);
    }

    // ========================================================================
    // 10. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: {
          id: claimRequest.id,
          agency_id: claimRequest.agency_id,
          user_id: claimRequest.user_id,
          status: claimRequest.status,
          email_domain_verified: claimRequest.email_domain_verified,
          created_at: claimRequest.created_at,
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in claim request handler:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
