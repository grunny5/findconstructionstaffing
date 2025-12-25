/**
 * Agency Trades Update API Endpoint
 *
 * PUT /api/agencies/[slug]/trades
 *
 * Updates agency-trade relationships with audit trail and ownership verification.
 * Only the agency owner can update their trades. Changes are logged in the
 * agency_profile_edits table for audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import {
  agencyTradesSchema,
  type AgencyTradesUpdateData,
} from '@/lib/validations/agency-trades';
import { ErrorRateTracker } from '@/lib/monitoring/performance';
import { sendProfileCompleteEmailIfNeeded } from '@/lib/emails/send-profile-complete';

export const dynamic = 'force-dynamic';

/**
 * PUT handler for updating agency trades (owner-only)
 *
 * @param request - Next.js request object with trade update data
 * @param params - Route params containing slug
 * @returns JSON response with updated trade list or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": {
 *     "trades": [
 *       { "id": "uuid", "name": "Electrician", "slug": "electrician", "description": "..." },
 *       { "id": "uuid", "name": "Plumber", "slug": "plumber", "description": "..." }
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
            message: 'You must be logged in to update agency trades',
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

    const validation = agencyTradesSchema.safeParse(body);

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

    const { trade_ids } = validation.data;

    // ========================================================================
    // 4. VALIDATE TRADE IDs EXIST
    // ========================================================================
    const { data: validTrades, error: tradesError } = await supabase
      .from('trades')
      .select('id, name')
      .in('id', trade_ids);

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to validate trade IDs',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!validTrades || validTrades.length !== trade_ids.length) {
      const validIds = new Set(validTrades?.map((t) => t.id) || []);
      const invalidIds = trade_ids.filter((id) => !validIds.has(id));

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid trade IDs provided',
            details: {
              invalid_trade_ids: invalidIds,
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 5. GET CURRENT TRADES FOR AUDIT TRAIL
    // ========================================================================
    const agencyId = agency.id;

    const { data: currentTrades, error: currentTradesError } = await supabase
      .from('agency_trades')
      .select('trade_id, trades(id, name)')
      .eq('agency_id', agencyId);

    if (currentTradesError) {
      console.error(
        'Error fetching current trades for audit trail:',
        currentTradesError
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch current trades for audit trail',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const oldTradeNames =
      currentTrades
        ?.map((at) => {
          const trade = at.trades as unknown as { id: string; name: string };
          return trade?.name;
        })
        .filter(Boolean) || [];

    const newTradeNames = validTrades?.map((t) => t.name).filter(Boolean) || [];

    // ========================================================================
    // 6. UPSERT NEW RELATIONSHIPS & DELETE ORPHANED ONES
    // ========================================================================
    // Use upsert to add/update relationships atomically without deleting first
    // This avoids race conditions and eliminates the need for rollback logic
    const newRelationships = trade_ids.map((trade_id) => ({
      agency_id: agencyId,
      trade_id,
    }));

    const { error: upsertError } = await supabase
      .from('agency_trades')
      .upsert(newRelationships, {
        onConflict: 'agency_id,trade_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting agency trades:', upsertError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to insert/update trades',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Then, delete relationships not in the new set (if any)
    // This is non-critical: new trades are already inserted, orphans won't break functionality
    // Fetch current agency_trades to determine which ones are orphaned
    const { data: currentRelations } = await supabase
      .from('agency_trades')
      .select('trade_id')
      .eq('agency_id', agencyId);

    if (currentRelations && currentRelations.length > 0) {
      // Calculate orphaned trade IDs (those not in the new trade_ids list)
      const currentTradeIds = currentRelations.map((r) => r.trade_id);
      const orphanedIds = currentTradeIds.filter(
        (id) => !trade_ids.includes(id)
      );

      // Delete orphaned relationships using safe parameterized .in() method
      if (orphanedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('agency_trades')
          .delete()
          .eq('agency_id', agencyId)
          .in('trade_id', orphanedIds);

        if (deleteError) {
          console.warn(
            'Non-critical: Failed to delete orphaned trades:',
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
        field_name: 'trades',
        old_value: oldTradeNames,
        new_value: newTradeNames,
      });

    if (auditError) {
      console.error('Error creating audit trail:', auditError);

      // Track audit trail failures for monitoring and alerting
      const errorTracker = ErrorRateTracker.getInstance();
      errorTracker.recordRequest(
        'PUT /api/agencies/[slug]/trades - audit trail',
        true
      );

      // Note: We don't block the user request on audit failure since the
      // primary operation (updating trades) succeeded. However, audit failures
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
    // Skip in test environment to avoid mock conflicts
    if (process.env.NODE_ENV !== 'test') {
      sendProfileCompleteEmailIfNeeded(supabase, agencyId).catch((error) => {
        console.error('Error in profile completion email workflow:', error);
      });
    }

    // ========================================================================
    // 10. FETCH AND RETURN UPDATED TRADES
    // ========================================================================
    const { data: updatedTrades, error: fetchError } = await supabase
      .from('trades')
      .select('id, name, slug, description')
      .in('id', trade_ids)
      .order('name');

    if (fetchError) {
      console.error('Error fetching updated trades:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Trades updated but failed to fetch results',
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
          trades: updatedTrades || [],
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in trades update handler:', error);
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
