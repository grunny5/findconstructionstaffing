/**
 * Admin Agencies API Endpoint
 *
 * GET /api/admin/agencies
 *
 * Retrieves all agencies with filtering and pagination (admin-only).
 * Includes claimed status and owner profile information.
 * Results are sorted by creation date (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

// Query parameter validation schema
const adminAgenciesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  claimed: z.enum(['yes', 'no', 'all']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

export type AdminAgenciesQueryParams = z.infer<typeof adminAgenciesQuerySchema>;

/**
 * GET handler for fetching all agencies (admin-only)
 *
 * Query Parameters:
 * - search: Search by agency name
 * - status: Filter by active status ('active' | 'inactive' | 'all')
 * - claimed: Filter by claimed status ('yes' | 'no' | 'all')
 * - limit: Results per page (default: 25, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @returns JSON response with paginated agencies or error
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const supabase = await createClient();

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
            code: ERROR_CODES.FORBIDDEN,
            message: 'Forbidden: Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 3. PARSE AND VALIDATE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const queryResult = adminAgenciesQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || 'all',
      claimed: searchParams.get('claimed') || 'all',
      limit: searchParams.get('limit') || '25',
      offset: searchParams.get('offset') || '0',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid query parameters',
            details: queryResult.error.issues,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { search, status, claimed, limit, offset } = queryResult.data;

    // ========================================================================
    // 4. BUILD QUERY WITH FILTERS
    // ========================================================================
    let query = supabase
      .from('agencies')
      .select(
        `
        id,
        name,
        slug,
        is_active,
        is_claimed,
        claimed_by,
        created_at,
        profile_completion_percentage
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply claimed filter
    if (claimed === 'yes') {
      query = query.eq('is_claimed', true);
    } else if (claimed === 'no') {
      query = query.eq('is_claimed', false);
    }

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // ========================================================================
    // 5. EXECUTE QUERY
    // ========================================================================
    const { data: agencies, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching agencies:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agencies',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. FETCH OWNER PROFILES FOR CLAIMED AGENCIES
    // ========================================================================
    const claimedByIds = (agencies || [])
      .filter((a) => a.claimed_by)
      .map((a) => a.claimed_by as string);

    let ownerProfiles: Record<
      string,
      { email: string | null; full_name: string | null }
    > = {};

    if (claimedByIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', claimedByIds);

      if (profiles) {
        ownerProfiles = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name };
            return acc;
          },
          {} as Record<
            string,
            { email: string | null; full_name: string | null }
          >
        );
      }
    }

    // Merge owner profiles with agencies
    const agenciesWithOwners = (agencies || []).map((agency) => ({
      ...agency,
      owner_profile: agency.claimed_by
        ? ownerProfiles[agency.claimed_by] || null
        : null,
    }));

    // ========================================================================
    // 7. BUILD PAGINATION METADATA
    // ========================================================================
    const total = count || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;

    // ========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: agenciesWithOwners,
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
    console.error('Unexpected error in admin agencies handler:', error);
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
