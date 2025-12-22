/**
 * Agency Regions Update API Endpoint
 *
 * PUT /api/agencies/[slug]/regions
 *
 * Updates agency-region relationships with audit trail and ownership verification.
 * Only the agency owner can update their service regions. Changes are logged in the
 * agency_profile_edits table for audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import {
  agencyRegionsSchema,
  type AgencyRegionsUpdateData,
} from '@/lib/validations/agency-regions';

export const dynamic = 'force-dynamic';

/**
 * PUT handler for updating agency service regions (owner-only)
 *
 * @param request - Next.js request object with region update data
 * @param params - Route params containing slug
 * @returns JSON response with updated region list or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": {
 *     "regions": [
 *       { "id": "uuid", "name": "Texas", "state_code": "TX", "slug": "texas" },
 *       { "id": "uuid", "name": "California", "state_code": "CA", "slug": "california" }
 *     ]
 *   }
 * }
 * ```
 *
 * Error Response (4xx/5xx):
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message",
 *     "details": { ... }
 *   }
 * }
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'You must be logged in to update agency regions',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. VERIFY OWNERSHIP
    // ========================================================================
    const { slug } = params;

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, claimed_by, name')
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

    if (agency.claimed_by !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Forbidden: You do not own this agency',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 3. PARSE AND VALIDATE REQUEST BODY
    // ========================================================================
    const body = await request.json();

    const validation = agencyRegionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validation.error.format(),
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { region_ids } = validation.data;

    // ========================================================================
    // 4. VALIDATE REGION IDs EXIST
    // ========================================================================
    const { data: validRegions, error: regionsError } = await supabase
      .from('regions')
      .select('id, name, state_code')
      .in('id', region_ids);

    if (regionsError) {
      console.error('Error fetching regions:', regionsError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to validate region IDs',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!validRegions || validRegions.length !== region_ids.length) {
      const validIds = new Set(validRegions?.map((r) => r.id) || []);
      const invalidIds = region_ids.filter((id) => !validIds.has(id));

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid region IDs provided',
            details: {
              invalid_region_ids: invalidIds,
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 5. GET CURRENT REGIONS FOR AUDIT TRAIL
    // ========================================================================
    const agencyId = agency.id;

    const { data: currentRegions, error: currentRegionsError } = await supabase
      .from('agency_regions')
      .select('region_id, regions(id, name, state_code)')
      .eq('agency_id', agencyId);

    if (currentRegionsError) {
      console.error(
        'Error fetching current regions for audit trail:',
        currentRegionsError
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch current regions for audit trail',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const oldRegionNames =
      currentRegions
        ?.map((ar) => {
          const region = ar.regions as unknown as {
            id: string;
            name: string;
            state_code: string;
          };
          return region?.name;
        })
        .filter(Boolean) || [];

    const newRegionNames =
      validRegions?.map((r) => r.name).filter(Boolean) || [];

    // Store old relationships for potential rollback
    const oldRelationships =
      currentRegions?.map((ar) => ({
        agency_id: agencyId,
        region_id: ar.region_id,
      })) || [];

    // ========================================================================
    // 6. DELETE EXISTING RELATIONSHIPS & INSERT NEW ONES (WITH ROLLBACK)
    // ========================================================================
    const { error: deleteError } = await supabase
      .from('agency_regions')
      .delete()
      .eq('agency_id', agencyId);

    if (deleteError) {
      console.error('Error deleting agency regions:', deleteError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to delete existing regions',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const newRelationships = region_ids.map((region_id) => ({
      agency_id: agencyId,
      region_id,
    }));

    const { error: insertError } = await supabase
      .from('agency_regions')
      .insert(newRelationships);

    if (insertError) {
      console.error('Error inserting agency regions:', insertError);

      // Rollback: Restore old relationships
      if (oldRelationships.length > 0) {
        const { error: rollbackError } = await supabase
          .from('agency_regions')
          .insert(oldRelationships);

        if (rollbackError) {
          console.error('CRITICAL: Rollback failed:', rollbackError);
        }
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update regions',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 7. CREATE AUDIT TRAIL ENTRY
    // ========================================================================
    const { error: auditError } = await supabase
      .from('agency_profile_edits')
      .insert({
        agency_id: agencyId,
        edited_by: user.id,
        field_name: 'regions',
        old_value: oldRegionNames,
        new_value: newRegionNames,
      });

    if (auditError) {
      console.error('Error creating audit trail:', auditError);
    }

    // ========================================================================
    // 8. UPDATE AGENCY LAST_EDITED TIMESTAMP
    // ========================================================================
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        last_edited_at: new Date().toISOString(),
        last_edited_by: user.id,
      })
      .eq('id', agencyId);

    if (updateError) {
      console.error('Error updating agency timestamp:', updateError);
    }

    // ========================================================================
    // 9. FETCH AND RETURN UPDATED REGIONS
    // ========================================================================
    const { data: updatedRegions, error: fetchError } = await supabase
      .from('regions')
      .select('id, name, state_code, slug')
      .in('id', region_ids)
      .order('name');

    if (fetchError) {
      console.error('Error fetching updated regions:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Regions updated but failed to fetch results',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 10. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: {
          regions: updatedRegions || [],
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in regions update handler:', error);
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
