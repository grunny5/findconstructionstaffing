import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Agency } from '@/types/supabase';
import {
  ErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
  AgencyResponse,
} from '@/types/api';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const errorTracker = ErrorRateTracker.getInstance();

// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Log environment variable status on initialization (only in development)
if (process.env.NODE_ENV === 'development' && !isTestEnvironment) {
  console.log('[Supabase Config]', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  });
}

interface RouteParams {
  params: {
    slug: string;
  };
}

// Helper function to validate slug format
function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric with hyphens, no spaces or special chars
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

// Helper function to execute query with retry logic
async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 1000
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();

      // If successful or it's a client error (not a connection issue), return immediately
      if (
        !result.error ||
        (result.error.code && !result.error.message?.includes('fetch'))
      ) {
        return result;
      }

      // Log connection errors
      if (result.error.message?.includes('fetch')) {
        console.error(
          `[API ERROR] Database connection failed (attempt ${attempt}/${retries}):`,
          {
            error: result.error.message,
            code: result.error.code,
          }
        );
      }

      // If not the last attempt and it's a connection error, retry
      if (attempt < retries && result.error.message?.includes('fetch')) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return result;
    } catch (error) {
      console.error(
        `[API ERROR] Unexpected error in query (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return { data: null, error };
    }
  }

  // All retries exhausted
  return {
    data: null,
    error: new Error('Database query failed after all retry attempts'),
  };
}

/**
 * GET /api/agencies/[slug]
 * Fetch a single agency by its slug
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AgencyResponse | ErrorResponse>> {
  const monitor = new PerformanceMonitor('GET /api/agencies/[slug]', 'GET');

  try {
    // Early environment validation (only log in non-test environments)
    if (!isTestEnvironment && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      console.error('[API ERROR] Missing Supabase environment variables', {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      });
    }
    
    // Validate slug format early
    const slug = params.slug;
    if (!slug || !isValidSlug(slug)) {
      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Invalid agency slug format');
      console.error(
        `[API ERROR] GET /api/agencies/[slug]: Invalid agency slug format - slug: "${slug}"`
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid agency slug',
            details: {
              slug: 'Slug must be lowercase alphanumeric with hyphens only',
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate database connection and environment
    if (!supabase && !isTestEnvironment) {
      console.error('[API ERROR] Supabase client not initialized', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      });

      monitor.complete(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Database connection not initialized'
      );
      errorTracker.recordRequest('GET /api/agencies/[slug]', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Database connection not initialized',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Fetch agency with related data using retry logic
    const queryId = monitor.startQuery();
    const { data: agency, error } = await queryWithRetry(async () =>
      supabase
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
              state_code,
              slug
            )
          )
        `
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
    );

    monitor.endQuery(queryId);

    // Handle errors
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        monitor.complete(HTTP_STATUS.NOT_FOUND, 'Agency not found');
        errorTracker.recordRequest('GET /api/agencies/[slug]', true);
        console.error(
          `[API ERROR] GET /api/agencies/[slug]: Agency not found - slug: ${slug}`
        );
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

      // Other database errors
      monitor.complete(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to fetch agency'
      );
      errorTracker.recordRequest('GET /api/agencies/[slug]', true);
      
      // Provide more detailed error information
      const errorDetails: any = {
        code: error.code || 'DATABASE_ERROR',
        message: error.message || 'Connection failed',
        slug,
      };
      
      // Check for connection-specific errors
      if (error.message?.includes('fetch') || error.message?.includes('connect')) {
        errorDetails.type = 'CONNECTION_ERROR';
        errorDetails.hint = 'Check Supabase URL and network connectivity';
      } else if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
        errorDetails.type = 'AUTH_ERROR';
        errorDetails.hint = 'Check Supabase anon key configuration';
      }
      
      console.error(`[API ERROR] GET /api/agencies/[slug]: Database error`, errorDetails);
      
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agency',
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Handle null agency
    if (!agency) {
      monitor.complete(HTTP_STATUS.NOT_FOUND, 'Agency not found');
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

    // Transform the data to match expected format
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
          slug: string;
        };
      }>;
    };

    // Create API response with all required fields
    const apiAgency = {
      id: agencyData.id,
      name: agencyData.name,
      slug: agencyData.slug,
      description: agencyData.description || null,
      logo_url: agencyData.logo_url || null,
      website: agencyData.website || null,
      phone: agencyData.phone || null,
      email: agencyData.email || null,
      is_claimed: agencyData.is_claimed,
      is_active: agencyData.is_active,
      offers_per_diem: agencyData.offers_per_diem,
      is_union: agencyData.is_union,
      // Add fields expected by API that aren't in database
      founded_year: null,
      employee_count: null,
      headquarters: null,
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
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
          code: ar.region.state_code,
          slug: ar.region.slug,
        })) || [],
    };

    const response = NextResponse.json(
      { data: apiAgency },
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );

    // Record success metrics
    const metrics = monitor.complete(HTTP_STATUS.OK);
    errorTracker.recordRequest('GET /api/agencies/[slug]', false);

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
    errorTracker.recordRequest('GET /api/agencies/[slug]', true);
    
    // Log detailed error information for debugging
    console.error('Unexpected error in GET /api/agencies/[slug]:', {
      error: error?.message || error,
      stack: error?.stack,
      slug: params.slug,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      }
    });

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            type: error?.constructor?.name,
          } : undefined,
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
