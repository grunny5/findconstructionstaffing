import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  ErrorResponse, 
  HTTP_STATUS, 
  ERROR_CODES,
  AgencyResponse
} from '@/types/api';
import { PerformanceMonitor, ErrorRateTracker } from '@/lib/monitoring/performance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const errorTracker = ErrorRateTracker.getInstance();

interface RouteParams {
  params: {
    slug: string;
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
    // Validate database connection
    if (!supabase) {
      monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Database connection not initialized');
      errorTracker.recordRequest('GET /api/agencies/[slug]', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Database connection not initialized',
          }
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const { slug } = params;

    // Validate slug
    if (!slug || typeof slug !== 'string') {
      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Invalid agency slug');
      errorTracker.recordRequest('GET /api/agencies/[slug]', true);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid agency slug',
          }
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Fetch agency with related data
    const queryId = monitor.startQuery();
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
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
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    monitor.endQuery(queryId);

    // Handle errors
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        monitor.complete(HTTP_STATUS.NOT_FOUND, 'Agency not found');
        errorTracker.recordRequest('GET /api/agencies/[slug]', true);
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Agency not found',
            }
          },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      // Other database errors
      monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch agency');
      errorTracker.recordRequest('GET /api/agencies/[slug]', true);
      console.error('Database error:', error);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agency',
          }
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Transform the data to match expected format
    const transformedAgency = {
      ...agency,
      trades: agency.agency_trades?.map((at: any) => ({
        id: at.trade.id,
        name: at.trade.name,
        slug: at.trade.slug
      })) || [],
      regions: agency.agency_regions?.map((ar: any) => ({
        id: ar.region.id,
        name: ar.region.name,
        code: ar.region.state_code,
        slug: ar.region.slug
      })) || []
    };

    // Remove the raw junction table data
    delete transformedAgency.agency_trades;
    delete transformedAgency.agency_regions;

    const response = NextResponse.json(
      { data: transformedAgency },
      { 
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
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

  } catch (error) {
    monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'An unexpected error occurred');
    errorTracker.recordRequest('GET /api/agencies/[slug]', true);
    console.error('Unexpected error in GET /api/agencies/[slug]:', error);
    
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        }
      },
      { 
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}