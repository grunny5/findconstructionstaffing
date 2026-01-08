/**
 * Agency Compliance API Endpoint
 *
 * GET /api/agencies/[slug]/compliance
 *
 * Returns public compliance data for an agency's profile.
 * Only returns active compliance items (is_active=true).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  ERROR_CODES,
  HTTP_STATUS,
  type AgencyComplianceRow,
  type ComplianceItem,
  toComplianceItem,
} from '@/types/api';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET handler for fetching agency compliance (public)
 *
 * @param request - Next.js request object
 * @param context - Route context containing slug param
 * @returns JSON response with compliance items or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": [
 *     {
 *       "type": "osha_certified",
 *       "displayName": "OSHA Certified",
 *       "isVerified": true,
 *       "expirationDate": "2026-12-31",
 *       "isExpired": false
 *     }
 *   ]
 * }
 * ```
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params;

    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid agency slug',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Find the agency by slug
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (agencyError || !agency) {
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

    // Fetch active compliance items for this agency
    const { data: complianceRows, error: complianceError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('is_active', true)
      .order('compliance_type');

    if (complianceError) {
      console.error('Error fetching compliance data:', complianceError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch compliance data',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Transform database rows to public ComplianceItem format
    const complianceItems: ComplianceItem[] = (
      (complianceRows || []) as AgencyComplianceRow[]
    ).map(toComplianceItem);

    // Return with cache headers (5 minutes)
    return NextResponse.json(
      { data: complianceItems },
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in compliance GET handler:', error);
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
