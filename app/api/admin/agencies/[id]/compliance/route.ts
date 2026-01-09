/**
 * Admin Agency Compliance API Endpoint
 *
 * GET /api/admin/agencies/[id]/compliance
 * PUT /api/admin/agencies/[id]/compliance
 *
 * Allows admins to view and manage compliance data for any agency.
 * Includes full access to verification fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ERROR_CODES,
  HTTP_STATUS,
  COMPLIANCE_TYPES,
  type AgencyComplianceRow,
  type ComplianceItemFull,
  type ComplianceType,
} from '@/types/api';
import { transformComplianceWithSignedUrls } from '@/lib/supabase/compliance-helpers';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Admin compliance update item - includes verification fields
 */
interface AdminComplianceUpdateItem {
  type: ComplianceType;
  isActive: boolean;
  expirationDate?: string | null;
  isVerified?: boolean;
  notes?: string | null;
  documentUrl?: string | null;
}

interface AdminComplianceUpdateRequest {
  items: AdminComplianceUpdateItem[];
}

/**
 * GET handler for fetching agency compliance (admin)
 *
 * @param request - Next.js request object
 * @param context - Route context containing agency ID
 * @returns JSON response with all compliance items
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: agencyId } = await context.params;
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

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Check if agency exists
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
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

    // Check for not found
    if (agencyError?.code === 'PGRST116' || !agency) {
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

    // Fetch all compliance items for this agency
    const { data: complianceRows, error: complianceError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agencyId)
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

    // Transform with signed URLs for any documents
    const complianceItems = await transformComplianceWithSignedUrls(
      supabase,
      complianceRows as AgencyComplianceRow[]
    );

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
    console.error('Unexpected error in admin compliance GET handler:', error);
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
 * PUT handler for updating agency compliance (admin)
 *
 * @param request - Next.js request object
 * @param context - Route context containing agency ID
 * @returns JSON response with updated compliance items
 *
 * Request Body:
 * ```json
 * {
 *   "items": [
 *     {
 *       "type": "osha_certified",
 *       "isActive": true,
 *       "expirationDate": "2026-12-31",
 *       "isVerified": true,
 *       "notes": "Verified via document inspection"
 *     }
 *   ]
 * }
 * ```
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: agencyId } = await context.params;
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

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Check if agency exists
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
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

    // Check for not found
    if (agencyError?.code === 'PGRST116' || !agency) {
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

    // Parse and validate request body
    let body: AdminComplianceUpdateRequest;
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

      // Validate expiration date format and validity if provided
      if (item.expirationDate) {
        if (typeof item.expirationDate !== 'string') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.INVALID_PARAMS,
                message: `Invalid expiration date format for ${item.type}: must be a string`,
              },
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const match = item.expirationDate.match(dateRegex);
        if (!match) {
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

        // Parse and validate date components to reject impossible dates like 2026-02-30
        // Use UTC to avoid timezone-related date rollover issues
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (
          date.getUTCFullYear() !== year ||
          date.getUTCMonth() !== month - 1 ||
          date.getUTCDate() !== day
        ) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.INVALID_PARAMS,
                message: `Invalid calendar date: ${item.expirationDate}`,
              },
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
      }

      // Validate isVerified if provided
      if (
        item.isVerified !== undefined &&
        typeof item.isVerified !== 'boolean'
      ) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.INVALID_PARAMS,
              message: 'isVerified must be a boolean if provided',
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Upsert compliance items (admin can modify all fields including verification)
    // Use batched upsert to avoid partial updates
    const upsertPayload = body.items.map((item) => {
      const upsertData: Record<string, unknown> = {
        agency_id: agencyId,
        compliance_type: item.type,
        is_active: item.isActive,
        expiration_date: item.expirationDate || null,
      };

      // Admin can set verification fields
      if (item.isVerified !== undefined) {
        upsertData.is_verified = item.isVerified;
        if (item.isVerified) {
          upsertData.verified_by = user.id;
          upsertData.verified_at = new Date().toISOString();
        } else {
          upsertData.verified_by = null;
          upsertData.verified_at = null;
        }
      }

      if (item.notes !== undefined) {
        upsertData.notes = item.notes || null;
      }

      if (item.documentUrl !== undefined) {
        upsertData.document_url = item.documentUrl || null;
      }

      return upsertData;
    });

    const { error: upsertError } = await supabase
      .from('agency_compliance')
      .upsert(upsertPayload, {
        onConflict: 'agency_id,compliance_type',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting compliance items:', upsertError);
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

    // Fetch updated compliance state
    const { data: updatedRows, error: fetchError } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agencyId)
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

    // Transform with signed URLs for any documents
    const complianceItems = await transformComplianceWithSignedUrls(
      supabase,
      updatedRows as AgencyComplianceRow[]
    );

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
    console.error('Unexpected error in admin compliance PUT handler:', error);
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
