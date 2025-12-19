/**
 * User Claim Requests API Endpoint
 *
 * GET /api/claims/my-requests
 *
 * Retrieves all claim requests for the authenticated user.
 * Includes related agency data (name, logo, slug) for display purposes.
 * Results are sorted by creation date (newest first).
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching user's claim requests
 *
 * @returns JSON response with user's claim requests or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "agency_id": "uuid",
 *       "user_id": "uuid",
 *       "status": "pending" | "under_review" | "approved" | "rejected",
 *       "business_email": "user@agency.com",
 *       "phone_number": "+1234567890",
 *       "position_title": "CEO",
 *       "verification_method": "email" | "phone" | "manual",
 *       "email_domain_verified": true | false,
 *       "additional_notes": "string | null",
 *       "rejection_reason": "string | null",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "agency": {
 *         "id": "uuid",
 *         "name": "Agency Name",
 *         "slug": "agency-slug",
 *         "logo_url": "https://example.com/logo.png | null"
 *       }
 *     }
 *   ]
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
export async function GET() {
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
            message: 'You must be logged in to view claim requests',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. FETCH USER'S CLAIM REQUESTS WITH AGENCY DATA
    // ========================================================================
    const { data: claimRequests, error: fetchError } = await supabase
      .from('agency_claim_requests')
      .select(
        `
        id,
        agency_id,
        user_id,
        status,
        business_email,
        phone_number,
        position_title,
        verification_method,
        email_domain_verified,
        additional_notes,
        rejection_reason,
        created_at,
        updated_at,
        agency:agencies!inner (
          id,
          name,
          slug,
          logo_url
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching claim requests:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch claim requests',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 3. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: claimRequests || [],
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in my-requests handler:', error);
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
