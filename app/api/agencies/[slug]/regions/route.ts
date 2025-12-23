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
import { ErrorRateTracker } from '@/lib/monitoring/performance';
import { sendProfileCompleteEmailIfNeeded } from '@/lib/emails/send-profile-complete';

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
    // Parse request body with error handling for malformed JSON
    let body;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid JSON in request body',
              details: { body: 'Malformed JSON syntax' },
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      throw error; // Re-throw unexpected errors
    }

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

    // ========================================================================
    // 6. UPSERT NEW RELATIONSHIPS & DELETE ORPHANED ONES
    // ========================================================================
    // Use upsert to add/update relationships atomically without deleting first
    // This avoids race conditions and eliminates the need for rollback logic
    const newRelationships = region_ids.map((region_id) => ({
      agency_id: agencyId,
      region_id,
    }));

    const { error: upsertError } = await supabase
      .from('agency_regions')
      .upsert(newRelationships, {
        onConflict: 'agency_id,region_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting agency regions:', upsertError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to insert/update regions',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Then, delete relationships not in the new set (if any)
    // This is non-critical: new regions are already inserted, orphans won't break functionality
    // Fetch current agency_regions to determine which ones are orphaned
    const { data: currentRelations } = await supabase
      .from('agency_regions')
      .select('region_id')
      .eq('agency_id', agencyId);

    if (currentRelations && currentRelations.length > 0) {
      // Calculate orphaned region IDs (those not in the new region_ids list)
      const currentRegionIds = currentRelations.map((r) => r.region_id);
      const orphanedIds = currentRegionIds.filter(
        (id) => !region_ids.includes(id)
      );

      // Delete orphaned relationships using safe parameterized .in() method
      if (orphanedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('agency_regions')
          .delete()
          .eq('agency_id', agencyId)
          .in('region_id', orphanedIds);

        if (deleteError) {
          console.warn(
            'Non-critical: Failed to delete orphaned regions:',
            deleteError
          );
          // Non-fatal: Log but continue - orphans won't break the application
        }
      }
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

      // Track audit trail failures for monitoring and alerting
      const errorTracker = ErrorRateTracker.getInstance();
      errorTracker.recordRequest(
        'PUT /api/agencies/[slug]/regions - audit trail',
        true
      );

      // Note: We don't block the user request on audit failure since the
      // primary operation (updating regions) succeeded. However, audit failures
      // are tracked in our error monitoring system for investigation.
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
    // 9. CHECK AND SEND PROFILE COMPLETION EMAIL (NON-BLOCKING)
    // ========================================================================
    // Send completion milestone email if profile reached 100% and email hasn't been sent
    // This runs asynchronously and errors don't block the response
    sendProfileCompleteEmailIfNeeded(supabase, agencyId).catch((error) => {
      console.error('Error in profile completion email workflow:', error);
    });

    // ========================================================================
    // 10. FETCH AND RETURN UPDATED REGIONS
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
    // 11. RETURN SUCCESS RESPONSE
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
