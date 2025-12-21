/**
 * Agency Trades Update API Endpoint
 *
 * PUT /api/agencies/[agencyId]/trades
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

export const dynamic = 'force-dynamic';

/**
 * PUT handler for updating agency trades (owner-only)
 *
 * @param request - Next.js request object with trade update data
 * @param params - Route params containing agencyId
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
  { params }: { params: { agencyId: string } }
) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const supabase = createClient();

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
    const { agencyId } = params;

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, claimed_by, name')
      .eq('id', agencyId)
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
            code: ERROR_CODES.UNAUTHORIZED,
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
    const { data: currentTrades } = await supabase
      .from('agency_trades')
      .select('trade_id, trades(id, name)')
      .eq('agency_id', agencyId);

    const oldTradeIds = currentTrades?.map((at) => at.trade_id) || [];
    const oldTradeNames =
      currentTrades
        ?.map((at) => {
          const trade = at.trades as unknown as { id: string; name: string };
          return trade?.name;
        })
        .filter(Boolean) || [];

    const newTradeNames = validTrades?.map((t) => t.name).filter(Boolean) || [];

    // ========================================================================
    // 6. DELETE EXISTING RELATIONSHIPS & INSERT NEW ONES (TRANSACTION)
    // ========================================================================
    const { error: deleteError } = await supabase
      .from('agency_trades')
      .delete()
      .eq('agency_id', agencyId);

    if (deleteError) {
      console.error('Error deleting agency trades:', deleteError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to delete existing trades',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const newRelationships = trade_ids.map((trade_id) => ({
      agency_id: agencyId,
      trade_id,
    }));

    const { error: insertError } = await supabase
      .from('agency_trades')
      .insert(newRelationships);

    if (insertError) {
      console.error('Error inserting agency trades:', insertError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update trades',
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
        field_name: 'trades',
        old_value: oldTradeNames,
        new_value: newTradeNames,
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
    // 9. FETCH AND RETURN UPDATED TRADES
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
    // 10. RETURN SUCCESS RESPONSE
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
