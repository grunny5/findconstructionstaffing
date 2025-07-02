import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  AgenciesApiResponse,
  ErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
  API_CONSTANTS,
} from '@/types/api';
import { createHash } from 'crypto';
import {
  parseAgenciesQuery,
  sanitizeSearchInput,
} from '@/lib/validation/agencies-query';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

/**
 * Apply trade and state filters to get matching agency IDs
 * @returns Array of agency IDs that match the filters, or null if no filters applied
 */
async function applyFilters(
  monitor: PerformanceMonitor,
  trades?: string[],
  states?: string[]
): Promise<string[] | null> {
  if (!supabase) {
    throw new Error('Database connection not initialized');
  }

  let agencyIds: string[] | null = null;

  // Apply trade filter
  if (trades && trades.length > 0) {
    const tradeQueryId = monitor.startQuery();
    const { data: tradeData, error: tradeError } = await supabase
      .from('trades')
      .select('id')
      .in('slug', trades);
    monitor.endQuery(tradeQueryId);

    if (tradeError || !tradeData) {
      throw new Error('Failed to fetch trade data');
    }

    const tradeIds = tradeData.map((t) => t.id);

    if (tradeIds.length > 0) {
      const agencyTradeQueryId = monitor.startQuery();
      const { data: agencyTradeData, error: agencyTradeError } = await supabase
        .from('agency_trades')
        .select('agency_id')
        .in('trade_id', tradeIds);
      monitor.endQuery(agencyTradeQueryId);

      if (agencyTradeError || !agencyTradeData) {
        throw new Error('Failed to fetch agency trade data');
      }

      agencyIds = Array.from(
        new Set(agencyTradeData.map((at) => at.agency_id))
      );
    } else {
      // No matching trades, return empty array
      agencyIds = [];
    }
  }

  // Apply state filter
  if (states && states.length > 0) {
    const regionQueryId = monitor.startQuery();
    const { data: regionData, error: regionError } = await supabase
      .from('regions')
      .select('id')
      .in('state_code', states);
    monitor.endQuery(regionQueryId);

    if (regionError || !regionData) {
      throw new Error('Failed to fetch region data');
    }

    const regionIds = regionData.map((r) => r.id);

    if (regionIds.length > 0) {
      const agencyRegionQueryId = monitor.startQuery();
      const { data: agencyRegionData, error: agencyRegionError } =
        await supabase
          .from('agency_regions')
          .select('agency_id')
          .in('region_id', regionIds);
      monitor.endQuery(agencyRegionQueryId);

      if (agencyRegionError || !agencyRegionData) {
        throw new Error('Failed to fetch agency region data');
      }

      const stateAgencyIds = Array.from(
        new Set(agencyRegionData.map((ar) => ar.agency_id))
      );

      // Intersect with existing filter if needed
      if (agencyIds !== null) {
        agencyIds = agencyIds.filter((id) => stateAgencyIds.includes(id));
      } else {
        agencyIds = stateAgencyIds;
      }
    } else {
      // No matching regions
      if (agencyIds === null) {
        agencyIds = [];
      } else {
        // If we already have trade filters, this intersection results in empty set
        agencyIds = [];
      }
    }
  }

  return agencyIds;
}

/**
 * GET /api/agencies
 *
 * Retrieves a list of active agencies with optional filtering
 */
export async function GET(request: NextRequest) {
  const monitor = new PerformanceMonitor('/api/agencies', 'GET');
  const errorTracker = ErrorRateTracker.getInstance();

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      const errorResponse: ErrorResponse = {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Database connection not initialized',
          details: {
            env: {
              url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
              key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? 'Set'
                : 'Not set',
            },
          },
        },
      };
      const response = NextResponse.json(errorResponse, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      monitor.complete(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorResponse.error.message
      );
      errorTracker.recordRequest('/api/agencies', true);

      return response;
    }

    // Parse and validate query parameters
    const queryParseResult = parseAgenciesQuery(request.nextUrl.searchParams);

    if (!queryParseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: ERROR_CODES.INVALID_PARAMS,
          message: 'Invalid query parameters',
          details: {
            issues: queryParseResult.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              received: 'received' in issue ? issue.received : undefined,
            })),
          },
        },
      };
      const response = NextResponse.json(errorResponse, {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Invalid query parameters');
      errorTracker.recordRequest('/api/agencies', true);

      return response;
    }

    const { search, trades, states, limit, offset } = queryParseResult.data;

    // Sanitize search input if provided
    const sanitizedSearch = search ? sanitizeSearchInput(search) : undefined;

    // Build the base query
    let query = supabase
      .from('agencies')
      .select(
        `
        *,
        trades:agency_trades(
          trade:trades(
            id,
            name,
            slug
          )
        ),
        regions:agency_regions(
          region:regions(
            id,
            name,
            state_code
          )
        )
      `
      )
      .eq('is_active', true);

    // Apply search filter if provided
    if (sanitizedSearch) {
      // Use ilike for partial text matching on name and description columns
      query = query.or(
        `name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`
      );
    }

    // Apply trade and state filters
    const filteredAgencyIds = await applyFilters(monitor, trades, states);

    if (filteredAgencyIds !== null) {
      // Apply the filter to the query
      query = query.in(
        'id',
        filteredAgencyIds.length > 0 ? filteredAgencyIds : []
      );
    }

    // Apply pagination using validated parameters
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    // Execute the query with performance tracking
    const mainQueryId = monitor.startQuery();
    const { data: agencies, error, count } = await query;
    monitor.endQuery(mainQueryId);

    if (error) {
      const errorResponse: ErrorResponse = {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch agencies',
          details: {
            supabaseError: error.message,
            code: error.code,
          },
        },
      };
      const response = NextResponse.json(errorResponse, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      monitor.complete(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorResponse.error.message
      );
      errorTracker.recordRequest('/api/agencies', true);

      return response;
    }

    // Transform the data to match our API response format
    const transformedAgencies = (agencies || []).map((agency) => {
      // Extract trades from the nested structure
      const trades =
        agency.trades?.map((at: any) => ({
          id: at.trade.id,
          name: at.trade.name,
          slug: at.trade.slug,
        })) || [];

      // Extract regions from the nested structure
      const regions =
        agency.regions?.map((ar: any) => ({
          id: ar.region.id,
          name: ar.region.name,
          code: ar.region.state_code,
        })) || [];

      // Remove the nested structures and add flattened arrays
      const { trades: _, regions: __, ...agencyData } = agency;

      return {
        ...agencyData,
        trades,
        regions,
      };
    });

    // Get total count for pagination with same filters applied
    const countQueryId = monitor.startQuery();
    let countQuery = supabase
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Apply same search filter to count query
    if (sanitizedSearch) {
      countQuery = countQuery.or(
        `name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`
      );
    }

    // Apply same filters to count query - reuse the filtered agency IDs
    if (filteredAgencyIds !== null) {
      countQuery = countQuery.in(
        'id',
        filteredAgencyIds.length > 0 ? filteredAgencyIds : []
      );
    }

    const { count: totalCount } = await countQuery;
    monitor.endQuery(countQueryId);

    // Build the response
    const response: AgenciesApiResponse = {
      data: transformedAgencies,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit,
      },
    };

    // Generate ETag for conditional requests
    const responseString = JSON.stringify(response);
    const etag = createHash('md5').update(responseString).digest('hex');

    // Check if client has cached version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      // Return 304 Not Modified if content hasn't changed
      const notModifiedResponse = new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`,
        },
      });

      monitor.complete(304);
      errorTracker.recordRequest('/api/agencies', false);

      return notModifiedResponse;
    }

    // Set caching headers for successful response
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`,
      ETag: etag,
      Vary: 'Accept-Encoding',
    });

    // Complete monitoring with success metrics
    const metrics = monitor.complete(HTTP_STATUS.OK, undefined, {
      resultCount: transformedAgencies.length,
      totalCount: totalCount || 0,
      hasFilters: !!(sanitizedSearch || trades?.length || states?.length),
    });
    errorTracker.recordRequest('/api/agencies', false);

    // Log performance warning if approaching target
    if (metrics.responseTime > 80) {
      console.warn(
        `[Performance Warning] /api/agencies approaching 100ms target: ${metrics.responseTime}ms`
      );
    }

    return NextResponse.json(response, {
      status: HTTP_STATUS.OK,
      headers,
    });
  } catch (error: any) {
    // Log the actual error for debugging in tests
    if (process.env.NODE_ENV === 'test') {
      console.error('API Route Error:', error);
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponse = {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: {
          message: error.message,
        },
      },
    };
    const response = NextResponse.json(errorResponse, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    monitor.complete(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errorResponse.error.message
    );
    errorTracker.recordRequest('/api/agencies', true);

    return response;
  }
}
