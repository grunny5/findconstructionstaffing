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

// This route uses request-time data, so it will be dynamic by default

/**
 * GET /api/agencies
 * 
 * Retrieves a list of active agencies with optional filtering
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json(errorResponse, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
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
      return NextResponse.json(errorResponse, { 
        status: HTTP_STATUS.BAD_REQUEST,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
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
      // Filter agencies that have ANY of the specified trades (OR logic)
      // We need to use a subquery to filter agencies that have at least one matching trade
      query = query.in(
        'id',
        supabase
          .from('agency_trades')
          .select('agency_id')
          .in('trade_id', 
            supabase
              .from('trades')
              .select('id')
              .in('slug', trades)
          )
      );
    }
    
    // Apply state filter if provided
    if (states && states.length > 0) {
      // Filter agencies that service ANY of the specified states (OR logic)
      // Join through agency_regions to regions table filtered by state codes
      query = query.in(
        'id',
        supabase
          .from('agency_regions')
          .select('agency_id')
          .in('region_id',
            supabase
              .from('regions')
              .select('id')
              .in('state_code', states)
          )
      );
    }
    
    // Apply pagination using validated parameters
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    // Execute the query
    const { data: agencies, error, count } = await query;

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
      return NextResponse.json(errorResponse, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
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
    let countQuery = supabase
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Apply same search filter to count query
    if (sanitizedSearch) {
      countQuery = countQuery.or(`name.fts.${sanitizedSearch},description.fts.${sanitizedSearch},name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }
    
    // Apply same trade filter to count query
    if (trades && trades.length > 0) {
      countQuery = countQuery.in(
        'id',
        supabase
          .from('agency_trades')
          .select('agency_id')
          .in('trade_id', 
            supabase
              .from('trades')
              .select('id')
              .in('slug', trades)
          )
      );
    }
    
    // Apply same state filter to count query
    if (states && states.length > 0) {
      countQuery = countQuery.in(
        'id',
        supabase
          .from('agency_regions')
          .select('agency_id')
          .in('region_id',
            supabase
              .from('regions')
              .select('id')
              .in('state_code', states)
          )
      );
    }

    const { count: totalCount } = await countQuery;

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
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`
        }
      });
    }

    // Set caching headers for successful response
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${API_CONSTANTS.CACHE_MAX_AGE}, must-revalidate`,
      'ETag': etag,
      'Vary': 'Accept-Encoding'
    });

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
    return NextResponse.json(errorResponse, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}