import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Agency } from '@/types/supabase';
import type { AgencyProfileEdit } from '@/types/database';
import { ErrorResponse, HTTP_STATUS, ERROR_CODES } from '@/types/api';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const errorTracker = ErrorRateTracker.getInstance();

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * Dashboard stats returned by the API
 */
interface DashboardStats {
  profile_views: number;
  lead_requests: number;
  last_edited_at: string | null;
}

/**
 * Recent edit record for audit trail
 */
interface RecentEdit {
  id: string;
  field_name: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  edited_by: string;
  created_at: string;
}

/**
 * Complete dashboard data response
 */
interface DashboardData {
  agency: Agency;
  stats: DashboardStats;
  recent_edits: RecentEdit[];
}

/**
 * API response format
 */
interface DashboardResponse {
  data: DashboardData;
}

/**
 * Fetches the dashboard data for an agency identified by the route `slug`; requires the authenticated user to be the agency owner.
 *
 * @returns The dashboard payload containing agency details, statistics, and up to five recent profile edits, or an error response object describing the failure.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DashboardResponse | ErrorResponse>> {
  const monitor = new PerformanceMonitor(
    'GET /api/agencies/[slug]/dashboard',
    'GET'
  );

  try {
    const { slug } = params;

    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Invalid agency slug');
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid agency slug',
            details: {
              slug: 'Must be a valid slug string',
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Create authenticated Supabase client
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      monitor.complete(HTTP_STATUS.UNAUTHORIZED, 'Not authenticated');
      errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Fetch agency with ownership check and related data
    const queryId = monitor.startQuery();
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select(
        `
        *,
        agency_trades (
          trade:trades (
            id,
            name,
            slug
          )
        ),
        agency_regions (
          region:regions (
            id,
            name,
            state_code
          )
        )
      `
      )
      .eq('slug', slug)
      .single();

    monitor.endQuery(queryId);

    // Check for PGRST116 specifically (no rows found)
    if (agencyError?.code === 'PGRST116') {
      monitor.complete(HTTP_STATUS.NOT_FOUND, 'Agency not found');
      errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AGENCY_NOT_FOUND,
            message: 'Agency not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Handle other database errors
    if (agencyError) {
      monitor.complete(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to fetch agency'
      );
      errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agency data',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Handle null agency (defensive check)
    if (!agency) {
      monitor.complete(HTTP_STATUS.NOT_FOUND, 'Agency not found');
      errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AGENCY_NOT_FOUND,
            message: 'Agency not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check ownership: user must be the one who claimed this agency
    if (agency.claimed_by !== user.id) {
      monitor.complete(HTTP_STATUS.FORBIDDEN, 'Access denied');
      errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Access denied. You do not own this agency.',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Fetch recent edits (last 5)
    const editsQueryId = monitor.startQuery();
    const { data: recentEdits, error: editsError } = await supabase
      .from('agency_profile_edits')
      .select('id, field_name, old_value, new_value, edited_by, created_at')
      .eq('agency_id', slug)
      .order('created_at', { ascending: false })
      .limit(5);

    monitor.endQuery(editsQueryId);

    // Log but don't fail if edits query fails (not critical data)
    if (editsError) {
      console.error(
        '[API WARNING] Failed to fetch recent edits:',
        editsError.message
      );
    }

    // Transform agency data to match expected format
    const agencyData = agency as Agency & {
      agency_trades?: Array<{
        trade: {
          id: string;
          name: string;
          slug: string;
        };
      }>;
      agency_regions?: Array<{
        region: {
          id: string;
          name: string;
          state_code: string;
        };
      }>;
    };

    // Build response data
    const dashboardData: DashboardData = {
      agency: {
        id: agencyData.id,
        name: agencyData.name,
        slug: agencyData.slug,
        description: agencyData.description,
        logo_url: agencyData.logo_url,
        website: agencyData.website,
        phone: agencyData.phone,
        email: agencyData.email,
        is_claimed: agencyData.is_claimed,
        is_active: agencyData.is_active,
        offers_per_diem: agencyData.offers_per_diem,
        is_union: agencyData.is_union,
        created_at: agencyData.created_at,
        updated_at: agencyData.updated_at,
        claimed_at: agencyData.claimed_at,
        claimed_by: agencyData.claimed_by,
        profile_completion_percentage:
          agencyData.profile_completion_percentage || 0,
        last_edited_at: agencyData.last_edited_at,
        last_edited_by: agencyData.last_edited_by,
        trades:
          agencyData.agency_trades?.map((at) => ({
            id: at.trade.id,
            name: at.trade.name,
            slug: at.trade.slug,
          })) || [],
        regions:
          agencyData.agency_regions?.map((ar) => ({
            id: ar.region.id,
            name: ar.region.name,
            state_code: ar.region.state_code,
            slug: '', // Slug not available in current schema
          })) || [],
      },
      stats: {
        profile_views: 0, // Hardcoded for now (future feature)
        lead_requests: 0, // Hardcoded for now (future feature)
        last_edited_at: agencyData.last_edited_at || null,
      },
      recent_edits: (recentEdits || []).map((edit) => ({
        id: edit.id,
        field_name: edit.field_name,
        old_value: edit.old_value as Record<string, unknown> | null,
        new_value: edit.new_value as Record<string, unknown> | null,
        edited_by: edit.edited_by,
        created_at: edit.created_at,
      })),
    };

    const response = NextResponse.json(
      { data: dashboardData },
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );

    // Record success metrics
    const metrics = monitor.complete(HTTP_STATUS.OK);
    errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', false);

    response.headers.set('X-Response-Time', metrics.responseTime.toString());
    if (metrics.queryTime) {
      response.headers.set('X-Database-Time', metrics.queryTime.toString());
    }

    return response;
  } catch (error: any) {
    monitor.complete(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred'
    );
    errorTracker.recordRequest('GET /api/agencies/[slug]/dashboard', true);

    console.error('Unexpected error in GET /api/agencies/[slug]/dashboard:', {
      error: error?.message || error,
      stack: error?.stack,
      slug: params.slug,
    });

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  message: error?.message,
                  type: error?.constructor?.name,
                }
              : undefined,
        },
      },
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}