/**
 * Admin Claims API Endpoint
 *
 * GET /api/admin/claims
 *
 * Retrieves all claim requests with filtering and pagination (admin-only).
 * Includes related agency and user data for the admin dashboard.
 * Results are sorted by creation date (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching all claim requests (admin-only)
 *
 * Query Parameters:
 * - status: Filter by claim status ('pending' | 'under_review' | 'approved' | 'rejected' | 'all')
 * - search: Search by agency name or requester email
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 25, max: 100)
 *
 * @returns JSON response with paginated claim requests or error
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
 *       "reviewed_by": "uuid | null",
 *       "reviewed_at": "2024-01-01T00:00:00Z | null",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "agency": {
 *         "id": "uuid",
 *         "name": "Agency Name",
 *         "slug": "agency-slug",
 *         "logo_url": "https://example.com/logo.png | null",
 *         "website": "https://agency.com | null"
 *       },
 *       "user": {
 *         "id": "uuid",
 *         "full_name": "John Doe | null",
 *         "email": "user@example.com"
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "total": 100,
 *     "limit": 25,
 *     "offset": 0,
 *     "hasMore": true,
 *     "page": 1,
 *     "totalPages": 4
 *   }
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
export async function GET(request: NextRequest) {
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
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 3. PARSE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'all';
    const searchQuery = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '25', 10))
    );
    const offset = (page - 1) * limit;

    // ========================================================================
    // 4. BUILD QUERY WITH FILTERS
    // ========================================================================
    let query = supabase
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
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        agency:agencies!inner (
          id,
          name,
          slug,
          logo_url,
          website
        ),
        user:profiles!agency_claim_requests_user_id_fkey (
          id,
          full_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    // Apply search filter (agency name or user email)
    if (searchQuery) {
      // Use 'or' filter for searching multiple fields
      query = query.or(
        `business_email.ilike.%${searchQuery}%,agency.name.ilike.%${searchQuery}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // ========================================================================
    // 5. EXECUTE QUERY
    // ========================================================================
    const { data: claimRequests, error: fetchError, count } = await query;

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
    // 6. BUILD PAGINATION METADATA
    // ========================================================================
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;

    // ========================================================================
    // 7. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: claimRequests || [],
        pagination: {
          total,
          limit,
          offset,
          hasMore,
          page,
          totalPages,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in admin claims handler:', error);
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
