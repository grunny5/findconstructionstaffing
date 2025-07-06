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

// Network error codes that indicate connection issues
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EPIPE',
  'ECONNABORTED',
]);

// Auth error codes from PostgREST/Supabase
const AUTH_ERROR_CODES = new Set([
  'PGRST301', // JWT auth error
  'PGRST302', // Anonymous access disallowed
  'PGRST303', // JWT expired
]);

// Helper function to classify database errors
function classifyDatabaseError(error: any): {
  type: 'CONNECTION' | 'AUTH' | 'CLIENT' | 'OTHER';
  isRetryable: boolean;
} {
  // Check error codes first (most reliable)
  if (error.code) {
    if (NETWORK_ERROR_CODES.has(error.code)) {
      return { type: 'CONNECTION', isRetryable: true };
    }
    if (AUTH_ERROR_CODES.has(error.code)) {
      return { type: 'AUTH', isRetryable: false };
    }
    // PGRST116 = no rows found - this is a client error, not retryable
    if (error.code === 'PGRST116') {
      return { type: 'CLIENT', isRetryable: false };
    }
  }

  // Fallback to message patterns for errors without codes
  const message = error.message?.toLowerCase() || '';

  // Connection error patterns
  if (
    message.includes('fetch') ||
    message.includes('connect') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('socket hang up')
  ) {
    return { type: 'CONNECTION', isRetryable: true };
  }

  // Auth error patterns
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('forbidden')
  ) {
    return { type: 'AUTH', isRetryable: false };
  }

  // Client error patterns (bad requests)
  if (
    message.includes('invalid') ||
    message.includes('not found') ||
    message.includes('bad request') ||
    message.includes('malformed')
  ) {
    return { type: 'CLIENT', isRetryable: false };
  }

  // Default to OTHER with no retry
  return { type: 'OTHER', isRetryable: false };
}

// Helper function to execute query with retry logic and detailed diagnostics
async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 1000
): Promise<{ data: T | null; error: any }> {
  const startTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const attemptStart = Date.now();
      const result = await queryFn();
      const attemptTime = Date.now() - attemptStart;

      // If successful, return immediately
      if (!result.error) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[API SUCCESS] Database query completed in ${attemptTime}ms (attempt ${attempt})`
          );
        }
        return result;
      }

      // Classify the error
      const errorClassification = classifyDatabaseError(result.error);

      // Log detailed error information
      const errorDetails = {
        attempt: `${attempt}/${retries}`,
        attemptTime: `${attemptTime}ms`,
        totalTime: `${Date.now() - startTime}ms`,
        errorType: errorClassification.type,
        isRetryable: errorClassification.isRetryable,
        message: result.error.message,
        code: result.error.code,
        supabaseUrl:
          process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        hasValidKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };

      // Log based on error type
      switch (errorClassification.type) {
        case 'CONNECTION':
          console.error(
            `[API ERROR] Database connection failed:`,
            errorDetails
          );
          break;
        case 'AUTH':
          console.error(
            `[API ERROR] Database authentication failed:`,
            errorDetails
          );
          break;
        case 'CLIENT':
          console.error(
            `[API ERROR] Client error (not retrying):`,
            errorDetails
          );
          break;
        default:
          console.error(`[API ERROR] Database query error:`, errorDetails);
      }

      // Only retry if it's retryable and not the last attempt
      if (attempt < retries && errorClassification.isRetryable) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API RETRY] Waiting ${delay}ms before retry...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }

      return result;
    } catch (error: any) {
      const attemptTime = Date.now() - startTime;

      // Try to classify even thrown errors
      const errorClassification = classifyDatabaseError(error);

      console.error(`[API ERROR] Unexpected error in query:`, {
        attempt: `${attempt}/${retries}`,
        totalTime: `${attemptTime}ms`,
        errorType: errorClassification.type,
        isRetryable: errorClassification.isRetryable,
        error: error?.message || String(error),
        code: error?.code,
        stack: error?.stack?.split('\n')[0], // First line only
      });

      if (attempt < retries && errorClassification.isRetryable) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
        continue;
      }

      return { data: null, error: error };
    }
  }

  // All retries exhausted
  return {
    data: null,
    error: new Error(
      `Database query failed after ${retries} retry attempts in ${Date.now() - startTime}ms`
    ),
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
    // Early environment validation with detailed logging
    // Skip validation if supabase is mocked (has _error property or is in test env)
    const isMockedSupabase =
      supabase &&
      (typeof (supabase as any)._error !== 'undefined' ||
        (typeof (supabase as any).from === 'function' &&
          (supabase as any).from._isMockFunction));

    // Also check for CI environment
    const isCIEnvironment = process.env.CI === 'true';

    if (!isTestEnvironment && !isMockedSupabase && !isCIEnvironment) {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        const envStatus = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? 'Set'
            : 'Missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? 'Set'
            : 'Missing',
          NODE_ENV: process.env.NODE_ENV,
          url_preview:
            process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        };

        console.error(
          '[API ERROR] Missing Supabase environment variables',
          envStatus
        );

        console.error(
          '\nTo fix this error, please set the following environment variables:\n' +
            '  - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL\n' +
            '  - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key\n\n' +
            'For CI/CD setup, see: docs/CI_CD_ENV_SETUP.md'
        );

        monitor.complete(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Missing environment variables'
        );
        errorTracker.recordRequest('GET /api/agencies/[slug]', true);

        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Database configuration error',
              details:
                process.env.NODE_ENV === 'development' ? envStatus : undefined,
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    }

    // Validate params and slug format early with detailed error reporting
    if (!params || !params.slug) {
      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Missing agency slug');
      console.error(
        '[API ERROR] GET /api/agencies/[slug]: Missing agency slug parameter',
        { params }
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Agency slug is required',
            details: {
              slug: 'Slug parameter cannot be empty',
              received: params?.slug || 'undefined',
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const slug = params.slug;

    if (!isValidSlug(slug)) {
      monitor.complete(HTTP_STATUS.BAD_REQUEST, 'Invalid agency slug format');
      console.error(
        `[API ERROR] GET /api/agencies/[slug]: Invalid agency slug format`,
        {
          received: slug,
          length: slug.length,
          pattern: 'Expected: lowercase alphanumeric with hyphens only',
          examples: ['elite-construction', 'abc-staffing-123'],
        }
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid agency slug format',
            details: {
              received: slug,
              expected:
                'lowercase alphanumeric with hyphens only (e.g., "elite-construction")',
              pattern: '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate database connection and environment
    if (
      !supabase &&
      !isTestEnvironment &&
      !isMockedSupabase &&
      !isCIEnvironment
    ) {
      const debugInfo = {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
        urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co'),
        keyFormat: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ'),
      };

      console.error('[API ERROR] Supabase client not initialized', debugInfo);

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
            details:
              process.env.NODE_ENV === 'development' ? debugInfo : undefined,
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

      // Classify the error for better diagnostics
      const errorClassification = classifyDatabaseError(error);

      // Provide more detailed error information
      const errorDetails: any = {
        code: error.code || 'DATABASE_ERROR',
        message: error.message || 'Connection failed',
        slug,
        type: errorClassification.type + '_ERROR',
        isRetryable: errorClassification.isRetryable,
      };

      // Add specific hints based on error type
      switch (errorClassification.type) {
        case 'CONNECTION':
          errorDetails.hint = 'Check Supabase URL and network connectivity';
          break;
        case 'AUTH':
          errorDetails.hint = 'Check Supabase anon key configuration';
          break;
        case 'CLIENT':
          errorDetails.hint = 'Check the request parameters and data';
          break;
        default:
          errorDetails.hint = 'An unexpected database error occurred';
      }

      console.error(
        `[API ERROR] GET /api/agencies/[slug]: Database error`,
        errorDetails
      );

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agency',
            details:
              process.env.NODE_ENV === 'development' ? errorDetails : undefined,
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
      },
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
