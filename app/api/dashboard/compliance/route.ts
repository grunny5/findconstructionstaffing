/**
 * Dashboard Compliance API Endpoint
 *
 * GET /api/dashboard/compliance
 * PUT /api/dashboard/compliance
 *
 * Allows agency owners to view and manage their compliance data.
 * Only accessible to authenticated users who own a claimed agency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ERROR_CODES,
  HTTP_STATUS,
  COMPLIANCE_TYPES,
  type AgencyComplianceRow,
  type ComplianceItemFull,
  type ComplianceUpdateRequest,
  type ComplianceFullResponse,
  toComplianceItemFull,
} from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching owner's agency compliance
 *
 * @param request - Next.js request object
 * @returns JSON response with all compliance items (including inactive)
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "type": "osha_certified",
 *       "displayName": "OSHA Certified",
 *       "isActive": true,
 *       "isVerified": false,
 *       "expirationDate": "2026-12-31",
 *       "isExpired": false,
 *       "documentUrl": null,
 *       "notes": null,
 *       "verifiedBy": null,
 *       "verifiedAt": null
 *     }
 *   ]
 * }
 * ```
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ComplianceFullResponse | { error: unknown }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Find user's owned agency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('claimed_by', user.id)
      .single();

    // Check for database errors first (but not "not found" which is expected)
    if (agencyError && agencyError.code !== 'PGRST116') {
      console.error('Error fetching agency:', agencyError);
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

    // User doesn't own any agency
    if (agencyError?.code === 'PGRST116' || !agency) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You do not own any agency',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Fetch all compliance items for this agency (including inactive)
    const { data: complianceRows, error: complianceError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agency.id)
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

    // Transform database rows to full ComplianceItemFull format
    const complianceItems: ComplianceItemFull[] = (
      complianceRows as AgencyComplianceRow[]
    ).map(toComplianceItemFull);

    return NextResponse.json(
      { data: complianceItems },
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
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

/**
 * PUT handler for updating owner's agency compliance
 *
 * @param request - Next.js request object with ComplianceUpdateRequest body
 * @returns JSON response with updated compliance items
 *
 * Request Body:
 * ```json
 * {
 *   "items": [
 *     { "type": "osha_certified", "isActive": true, "expirationDate": "2026-12-31" },
 *     { "type": "drug_testing", "isActive": true }
 *   ]
 * }
 * ```
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ComplianceFullResponse | { error: unknown }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Find user's owned agency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('claimed_by', user.id)
      .single();

    // Check for database errors first (but not "not found" which is expected)
    if (agencyError && agencyError.code !== 'PGRST116') {
      console.error('Error fetching agency:', agencyError);
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

    // User doesn't own any agency
    if (agencyError?.code === 'PGRST116' || !agency) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You do not own any agency',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Parse and validate request body
    let body: ComplianceUpdateRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid JSON in request body',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate items array
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Request body must contain an "items" array',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.type || !COMPLIANCE_TYPES.includes(item.type)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.INVALID_PARAMS,
              message: `Invalid compliance type: ${item.type}`,
              details: { validTypes: COMPLIANCE_TYPES },
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      if (typeof item.isActive !== 'boolean') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.INVALID_PARAMS,
              message: 'Each item must have a boolean "isActive" field',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      // Validate expiration date format and semantics if provided
      if (item.expirationDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(item.expirationDate)) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.INVALID_PARAMS,
                message:
                  'expirationDate must be in YYYY-MM-DD format if provided',
              },
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }

        // Validate that the date is semantically valid (e.g., 2026-02-31 is invalid)
        const parsedDate = new Date(item.expirationDate + 'T00:00:00Z');
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.INVALID_PARAMS,
                message: `Invalid date: ${item.expirationDate}`,
              },
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
      }
    }

    // Upsert compliance items (owner cannot modify verification fields)
    for (const item of body.items) {
      const { error: upsertError } = await supabase
        .from('agency_compliance')
        .upsert(
          {
            agency_id: agency.id,
            compliance_type: item.type,
            is_active: item.isActive,
            expiration_date: item.expirationDate || null,
          },
          {
            onConflict: 'agency_id,compliance_type',
            ignoreDuplicates: false,
          }
        );

      if (upsertError) {
        console.error('Error upserting compliance item:', upsertError);
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update compliance data',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    }

    // Fetch updated compliance state
    const { data: updatedRows, error: fetchError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agency.id)
      .order('compliance_type');

    if (fetchError) {
      console.error('Error fetching updated compliance:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch updated compliance data',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const complianceItems: ComplianceItemFull[] = (
      updatedRows as AgencyComplianceRow[]
    ).map(toComplianceItemFull);

    return NextResponse.json(
      { data: complianceItems },
      {
        status: HTTP_STATUS.OK,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in compliance PUT handler:', error);
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
