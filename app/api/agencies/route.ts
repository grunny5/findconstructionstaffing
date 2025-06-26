import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  AgenciesApiResponse, 
  ErrorResponse, 
  HTTP_STATUS, 
  ERROR_CODES,
  API_CONSTANTS 
} from '@/types/api';
import { createHash } from 'crypto';
import { parseAgenciesQuery, sanitizeSearchInput } from '@/lib/validation/agencies-query';
import { PerformanceMonitor, ErrorRateTracker } from '@/lib/monitoring/performance';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

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
              key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
            }
          }
        }
      };
      const response = NextResponse.json(errorResponse, { 
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, errorResponse.error.message);
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
            issues: queryParseResult.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
              received: 'received' in issue ? issue.received : undefined
            }))
          }
        }
      };
      const response = NextResponse.json(errorResponse, { 
        status: HTTP_STATUS.BAD_REQUEST,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
      .select(`
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
      `)
      .eq('is_active', true);

    // Apply search filter if provided
    if (sanitizedSearch) {
      // Use Supabase's textSearch for full-text search capabilities
      // First try full-text search, fallback to ilike for partial matches
      query = query.or(`name.fts.${sanitizedSearch},description.fts.${sanitizedSearch},name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }
    
    // Apply trade filter if provided
    if (trades && trades.length > 0) {
      // First, get the trade IDs for the given slugs
      monitor.startQuery();
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .select('id')
        .in('slug', trades);
      monitor.endQuery();
      
      if (tradeError || !tradeData) {
        throw new Error('Failed to fetch trade data');
      }
      
      const tradeIds = tradeData.map(t => t.id);
      
      if (tradeIds.length > 0) {
        // Get agency IDs that have these trades
        monitor.startQuery();
        const { data: agencyTradeData, error: agencyTradeError } = await supabase
          .from('agency_trades')
          .select('agency_id')
          .in('trade_id', tradeIds);
        monitor.endQuery();
        
        if (agencyTradeError || !agencyTradeData) {
          throw new Error('Failed to fetch agency trade data');
        }
        
        const agencyIds = [...new Set(agencyTradeData.map(at => at.agency_id))];
        
        if (agencyIds.length > 0) {
          query = query.in('id', agencyIds);
        } else {
          // No agencies match the trade filter
          query = query.in('id', []);
        }
      }
    }
    
    // Apply state filter if provided
    if (states && states.length > 0) {
      // First, get the region IDs for the given state codes
      monitor.startQuery();
      const { data: regionData, error: regionError } = await supabase
        .from('regions')
        .select('id')
        .in('state_code', states);
      monitor.endQuery();
      
      if (regionError || !regionData) {
        throw new Error('Failed to fetch region data');
      }
      
      const regionIds = regionData.map(r => r.id);
      
      if (regionIds.length > 0) {
        // Get agency IDs that service these regions
        monitor.startQuery();
        const { data: agencyRegionData, error: agencyRegionError } = await supabase
          .from('agency_regions')
          .select('agency_id')
          .in('region_id', regionIds);
        monitor.endQuery();
        
        if (agencyRegionError || !agencyRegionData) {
          throw new Error('Failed to fetch agency region data');
        }
        
        const agencyIds = [...new Set(agencyRegionData.map(ar => ar.agency_id))];
        
        if (agencyIds.length > 0) {
          // If we already have a trade filter, we need to intersect the results
          if (trades && trades.length > 0) {
            // This will automatically intersect with the previous filter
            query = query.in('id', agencyIds);
          } else {
            query = query.in('id', agencyIds);
          }
        } else {
          // No agencies match the state filter
          query = query.in('id', []);
        }
      }
    }
    
    // Apply pagination using validated parameters
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    // Execute the query with performance tracking
    monitor.startQuery();
    const { data: agencies, error, count } = await query;
    monitor.endQuery();

    if (error) {
      const errorResponse: ErrorResponse = {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch agencies',
          details: { 
            supabaseError: error.message,
            code: error.code 
          }
        }
      };
      const response = NextResponse.json(errorResponse, { 
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, errorResponse.error.message);
      errorTracker.recordRequest('/api/agencies', true);
      
      return response;
    }

    // Transform the data to match our API response format
    const transformedAgencies = (agencies || []).map(agency => {
      // Extract trades from the nested structure
      const trades = agency.trades?.map((at: any) => ({
        id: at.trade.id,
        name: at.trade.name,
        slug: at.trade.slug
      })) || [];

      // Extract regions from the nested structure
      const regions = agency.regions?.map((ar: any) => ({
        id: ar.region.id,
        name: ar.region.name,
        code: ar.region.state_code
      })) || [];

      // Remove the nested structures and add flattened arrays
      const { trades: _, regions: __, ...agencyData } = agency;
      
      return {
        ...agencyData,
        trades,
        regions
      };
    });

    // Get total count for pagination with same filters applied
    monitor.startQuery();
    let countQuery = supabase
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Apply same search filter to count query
    if (sanitizedSearch) {
      countQuery = countQuery.or(`name.fts.${sanitizedSearch},description.fts.${sanitizedSearch},name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }
    
    // For count query with filters, we need to apply the same agency ID filters
    let countAgencyIds: string[] | null = null;
    
    // Apply same trade filter to count query
    if (trades && trades.length > 0) {
      const { data: tradeData } = await supabase
        .from('trades')
        .select('id')
        .in('slug', trades);
      
      if (tradeData && tradeData.length > 0) {
        const tradeIds = tradeData.map(t => t.id);
        const { data: agencyTradeData } = await supabase
          .from('agency_trades')
          .select('agency_id')
          .in('trade_id', tradeIds);
        
        if (agencyTradeData) {
          countAgencyIds = [...new Set(agencyTradeData.map(at => at.agency_id))];
        }
      }
    }
    
    // Apply same state filter to count query
    if (states && states.length > 0) {
      const { data: regionData } = await supabase
        .from('regions')
        .select('id')
        .in('state_code', states);
      
      if (regionData && regionData.length > 0) {
        const regionIds = regionData.map(r => r.id);
        const { data: agencyRegionData } = await supabase
          .from('agency_regions')
          .select('agency_id')
          .in('region_id', regionIds);
        
        if (agencyRegionData) {
          const stateAgencyIds = [...new Set(agencyRegionData.map(ar => ar.agency_id))];
          
          // If we have trade filters too, intersect the results
          if (countAgencyIds !== null) {
            countAgencyIds = countAgencyIds.filter(id => stateAgencyIds.includes(id));
          } else {
            countAgencyIds = stateAgencyIds;
          }
        }
      }
    }
    
    // Apply the agency ID filter to count query if we have filters
    if (countAgencyIds !== null) {
      countQuery = countQuery.in('id', countAgencyIds.length > 0 ? countAgencyIds : []);
    }

    const { count: totalCount } = await countQuery;
    monitor.endQuery();

    // Build the response
    const response: AgenciesApiResponse = {
      data: transformedAgencies,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > (offset + limit)
      }
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
          'ETag': etag,
          'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`
        }
      });
      
      monitor.complete(304);
      errorTracker.recordRequest('/api/agencies', false);
      
      return notModifiedResponse;
    }

    // Set caching headers for successful response
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`,
      'ETag': etag,
      'Vary': 'Accept-Encoding'
    });

    // Complete monitoring with success metrics
    const metrics = monitor.complete(HTTP_STATUS.OK, undefined, {
      resultCount: transformedAgencies.length,
      totalCount: totalCount || 0,
      hasFilters: !!(sanitizedSearch || trades?.length || states?.length)
    });
    errorTracker.recordRequest('/api/agencies', false);
    
    // Log performance warning if approaching target
    if (metrics.responseTime > 80) {
      console.warn(`[Performance Warning] /api/agencies approaching 100ms target: ${metrics.responseTime}ms`);
    }
    
    return NextResponse.json(response, { 
      status: HTTP_STATUS.OK,
      headers 
    });

  } catch (error: any) {
    // Handle unexpected errors
    const errorResponse: ErrorResponse = {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: { 
          message: error.message 
        }
      }
    };
    const response = NextResponse.json(errorResponse, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    monitor.complete(HTTP_STATUS.INTERNAL_SERVER_ERROR, errorResponse.error.message);
    errorTracker.recordRequest('/api/agencies', true);
    
    return response;
  }
}