import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Agency } from '@/types/supabase';
import { dbQueryWithTimeout, TIMEOUT_CONFIG } from '@/lib/fetch/timeout';
import {
  ErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
  AgencyResponse,
  type ComplianceItem,
  type ComplianceType,
  getComplianceDisplayName,
  isComplianceExpired,
} from '@/types/api';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';
import { isValidSlug } from '@/lib/validation/slug';

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
              received: params?.slug === undefined ? 'undefined' : params?.slug,
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

    // Fetch agency with all related data in a single query for performance
    // Includes trades, regions, and compliance data to avoid sequential queries
    // Timeout protection prevents indefinite hanging if database is slow
    const queryId = monitor.startQuery();
    const { data: agency, error } = await dbQueryWithTimeout(
      async () =>
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
          ),
          agency_compliance (
            id,
            compliance_type,
            is_active,
            is_verified,
            expiration_date,
            document_url,
            notes
          )
        `
          )
          .eq('slug', slug)
          .eq('is_active', true)
          .single(),
      {
        retries: 3,
        retryDelay: 1000,
        totalTimeout: TIMEOUT_CONFIG.DB_RETRY_TOTAL,
      }
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
    // Compliance is now included in the main query for better performance

    // Type for nested compliance data from the query (matches SELECT fields exactly)
    interface NestedComplianceRow {
      id: string;
      compliance_type: ComplianceType;
      is_active: boolean;
      is_verified: boolean;
      expiration_date: string | null;
      document_url: string | null;
      notes: string | null;
    }

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
      agency_compliance?: NestedComplianceRow[] | null;
    };

    // Transform compliance data with graceful degradation
    // If compliance data is missing or malformed, return empty array instead of failing
    let complianceItems: ComplianceItem[] = [];
    try {
      const rawCompliance = agencyData.agency_compliance;
      if (Array.isArray(rawCompliance)) {
        // Type guard: validate object shape to ensure safe access to properties
        const isNestedComplianceRow = (c: any): c is NestedComplianceRow => {
          return (
            c != null &&
            typeof c === 'object' &&
            typeof c.compliance_type === 'string' &&
            typeof c.is_active === 'boolean' &&
            typeof c.is_verified === 'boolean' &&
            (c.expiration_date === null || typeof c.expiration_date === 'string') &&
            (c.document_url === null || typeof c.document_url === 'string') &&
            (c.notes === null || typeof c.notes === 'string')
          );
        };

        complianceItems = rawCompliance
          .filter(isNestedComplianceRow)
          .filter((c) => c.is_active === true) // Business logic: only active items
          .sort((a, b) => a.compliance_type.localeCompare(b.compliance_type))
          .map((c) => ({
            type: c.compliance_type,
            displayName: getComplianceDisplayName(c.compliance_type),
            isVerified: c.is_verified,
            expirationDate: c.expiration_date,
            isExpired: isComplianceExpired(c.expiration_date),
          }));
      }
    } catch (complianceError) {
      // Log but don't fail if compliance transformation fails (not critical for display)
      console.warn(
        `[API WARNING] Failed to transform compliance data for agency ${agencyData.slug}:`,
        complianceError
      );
      complianceItems = [];
    }

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
      profile_completion_percentage:
        agencyData.profile_completion_percentage || 0,
      last_edited_at: agencyData.last_edited_at || null,
      last_edited_by: agencyData.last_edited_by || null,
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
      compliance: complianceItems,
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
