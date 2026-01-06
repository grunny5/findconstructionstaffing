/**
 * Admin Agency Detail API Endpoint
 *
 * PATCH /api/admin/agencies/[id]
 * Updates an existing agency (admin-only).
 * Only updates provided fields (partial update).
 * Sets last_edited_at and last_edited_by audit fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

// Agency update validation schema (all fields optional for partial updates)
const agencyUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),

  website: z
    .string()
    .trim()
    .url('Must be a valid URL (http:// or https://)')
    .regex(/^https?:\/\/.+/, 'Website must start with http:// or https://')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone must be in E.164 format (e.g., +12345678900)'
    )
    .optional()
    .nullable()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .email('Must be a valid email address')
    .optional()
    .nullable()
    .or(z.literal('')),

  headquarters: z
    .string()
    .trim()
    .max(200, 'Headquarters must be less than 200 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  founded_year: z
    .string()
    .regex(/^\d{4}$/, 'Must be a valid year')
    .refine(
      (year) => {
        const currentYear = new Date().getFullYear();
        const y = parseInt(year, 10);
        return y >= 1800 && y <= currentYear;
      },
      { message: `Year must be between 1800 and ${new Date().getFullYear()}` }
    )
    .optional()
    .nullable()
    .or(z.literal('')),

  employee_count: z
    .enum([
      '1-10',
      '11-50',
      '51-100',
      '101-200',
      '201-500',
      '501-1000',
      '1001+',
    ])
    .optional()
    .nullable()
    .or(z.literal('')),

  company_size: z
    .enum(['Small', 'Medium', 'Large', 'Enterprise'])
    .optional()
    .nullable()
    .or(z.literal('')),

  offers_per_diem: z.boolean().optional(),

  is_union: z.boolean().optional(),

  // Trade IDs - admin has no limit (unlike owner's 10-trade limit)
  trade_ids: z
    .array(z.string().uuid('Each trade ID must be a valid UUID'))
    .optional(),

  // Region IDs - admin can select any US states
  region_ids: z
    .array(z.string().uuid('Each region ID must be a valid UUID'))
    .optional(),
});

export type AgencyUpdateData = z.infer<typeof agencyUpdateSchema>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    const supabase = await createClient();

    // ========================================================================
    // 1. AUTHENTICATE USER
    // ========================================================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
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

    // ========================================================================
    // 2. CHECK ADMIN AUTHORIZATION
    // ========================================================================
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

    // ========================================================================
    // 3. PARSE AND VALIDATE REQUEST BODY
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid JSON body',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const parseResult = agencyUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const updates = parseResult.data;
    const { trade_ids, region_ids, ...agencyUpdates } = updates;

    // If no fields to update (excluding trade_ids and region_ids which are handled separately)
    const hasAgencyUpdates = Object.keys(agencyUpdates).length > 0;
    const hasTradeUpdates = trade_ids !== undefined;
    const hasRegionUpdates = region_ids !== undefined;

    if (!hasAgencyUpdates && !hasTradeUpdates && !hasRegionUpdates) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'No fields provided to update',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 4. CHECK IF AGENCY EXISTS
    // ========================================================================
    const { data: existingAgency, error: fetchError } = await supabase
      .from('agencies')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingAgency) {
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

    // ========================================================================
    // 5. PREPARE UPDATE DATA
    // ========================================================================
    // Convert empty strings to null
    const updateData: Record<string, any> = {};

    for (const [key, value] of Object.entries(agencyUpdates)) {
      if (value === '' || value === null) {
        updateData[key] = null;
      } else if (key === 'founded_year' && typeof value === 'string') {
        updateData[key] = parseInt(value, 10);
      } else {
        updateData[key] = value;
      }
    }

    // Add audit fields
    updateData.updated_at = new Date().toISOString();
    updateData.last_edited_at = new Date().toISOString();
    updateData.last_edited_by = user.id;

    // ========================================================================
    // 6. UPDATE AGENCY (if there are agency field updates)
    // ========================================================================
    let updatedAgency = existingAgency;

    if (hasAgencyUpdates) {
      const { data: agencyData, error: updateError } = await supabase
        .from('agencies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError || !agencyData) {
        console.error('Error updating agency:', updateError);
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update agency',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
      updatedAgency = agencyData;
    }

    // ========================================================================
    // 7. UPDATE TRADES (if trade_ids provided)
    // ========================================================================
    let updatedTrades: { id: string; name: string; slug: string }[] = [];

    if (hasTradeUpdates) {
      // 7a. Validate trade IDs exist (if not empty array)
      if (trade_ids!.length > 0) {
        const { data: validTrades, error: tradesError } = await supabase
          .from('trades')
          .select('id, name')
          .in('id', trade_ids!);

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

        if (!validTrades || validTrades.length !== trade_ids!.length) {
          const validIds = new Set(validTrades?.map((t) => t.id) || []);
          const invalidIds = trade_ids!.filter((tid) => !validIds.has(tid));

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
      }

      // 7b. Get current trades for audit trail
      const { data: currentTrades } = await supabase
        .from('agency_trades')
        .select('trade_id, trades(id, name)')
        .eq('agency_id', id);

      const oldTradeNames =
        currentTrades
          ?.map((at) => {
            const trade = at.trades as unknown as { id: string; name: string };
            return trade?.name;
          })
          .filter(Boolean) || [];

      // 7c. Upsert new trade relationships (if any)
      if (trade_ids!.length > 0) {
        const newRelationships = trade_ids!.map((trade_id) => ({
          agency_id: id,
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
                message: 'Failed to update trades',
              },
            },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
          );
        }
      }

      // 7d. Delete orphaned trade relationships
      const { data: currentRelations } = await supabase
        .from('agency_trades')
        .select('trade_id')
        .eq('agency_id', id);

      if (currentRelations && currentRelations.length > 0) {
        const currentTradeIds = currentRelations.map((r) => r.trade_id);
        const orphanedIds = currentTradeIds.filter(
          (tid) => !trade_ids!.includes(tid)
        );

        if (orphanedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('agency_trades')
            .delete()
            .eq('agency_id', id)
            .in('trade_id', orphanedIds);

          if (deleteError) {
            console.warn(
              'Non-critical: Failed to delete orphaned trades:',
              deleteError
            );
          }
        }
      }

      // 7e. Create audit trail entry
      const { data: newTradeData } = await supabase
        .from('trades')
        .select('name')
        .in('id', trade_ids!.length > 0 ? trade_ids! : ['no-trades']);

      const newTradeNames = newTradeData?.map((t) => t.name) || [];

      const { error: auditError } = await supabase
        .from('agency_profile_edits')
        .insert({
          agency_id: id,
          edited_by: user.id,
          field_name: 'trades',
          old_value: oldTradeNames,
          new_value: newTradeNames,
        });

      if (auditError) {
        console.error('Error creating audit trail:', auditError);
      }

      // 7f. Fetch updated trades for response
      if (trade_ids!.length > 0) {
        const { data: tradesData } = await supabase
          .from('trades')
          .select('id, name, slug')
          .in('id', trade_ids!)
          .order('name');

        updatedTrades = tradesData || [];
      }

    }

    // ========================================================================
    // 8. UPDATE REGIONS (if region_ids provided)
    // ========================================================================
    let updatedRegions: { id: string; name: string; slug: string; state_code: string }[] = [];

    if (hasRegionUpdates) {
      // 8a. Validate region IDs exist (if not empty array)
      if (region_ids!.length > 0) {
        const { data: validRegions, error: regionsError } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', region_ids!);

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

        if (!validRegions || validRegions.length !== region_ids!.length) {
          const validIds = new Set(validRegions?.map((r) => r.id) || []);
          const invalidIds = region_ids!.filter((rid) => !validIds.has(rid));

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
      }

      // 8b. Get current regions for audit trail
      const { data: currentRegions } = await supabase
        .from('agency_regions')
        .select('region_id, regions(id, name)')
        .eq('agency_id', id);

      const oldRegionNames =
        currentRegions
          ?.map((ar) => {
            const region = ar.regions as unknown as { id: string; name: string };
            return region?.name;
          })
          .filter(Boolean) || [];

      // 8c. Upsert new region relationships (if any)
      if (region_ids!.length > 0) {
        const newRelationships = region_ids!.map((region_id) => ({
          agency_id: id,
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
                message: 'Failed to update regions',
              },
            },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
          );
        }
      }

      // 8d. Delete orphaned region relationships
      const { data: currentRelations } = await supabase
        .from('agency_regions')
        .select('region_id')
        .eq('agency_id', id);

      if (currentRelations && currentRelations.length > 0) {
        const currentRegionIds = currentRelations.map((r) => r.region_id);
        const orphanedIds = currentRegionIds.filter(
          (rid) => !region_ids!.includes(rid)
        );

        if (orphanedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('agency_regions')
            .delete()
            .eq('agency_id', id)
            .in('region_id', orphanedIds);

          if (deleteError) {
            console.warn(
              'Non-critical: Failed to delete orphaned regions:',
              deleteError
            );
          }
        }
      }

      // 8e. Create audit trail entry
      const { data: newRegionData } = await supabase
        .from('regions')
        .select('name')
        .in('id', region_ids!.length > 0 ? region_ids! : ['no-regions']);

      const newRegionNames = newRegionData?.map((r) => r.name) || [];

      const { error: auditError } = await supabase
        .from('agency_profile_edits')
        .insert({
          agency_id: id,
          edited_by: user.id,
          field_name: 'regions',
          old_value: oldRegionNames,
          new_value: newRegionNames,
        });

      if (auditError) {
        console.error('Error creating audit trail:', auditError);
      }

      // 8f. Fetch updated regions for response
      if (region_ids!.length > 0) {
        const { data: regionsData } = await supabase
          .from('regions')
          .select('id, name, slug, state_code')
          .in('id', region_ids!)
          .order('name');

        updatedRegions = regionsData || [];
      }
    }

    // Update agency timestamp if only trades/regions changed (not agency fields)
    if (!hasAgencyUpdates && (hasTradeUpdates || hasRegionUpdates)) {
      await supabase
        .from('agencies')
        .update({
          last_edited_at: new Date().toISOString(),
          last_edited_by: user.id,
        })
        .eq('id', id);
    }

    // ========================================================================
    // 9. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        agency: {
          ...updatedAgency,
          trades: hasTradeUpdates ? updatedTrades : undefined,
          regions: hasRegionUpdates ? updatedRegions : undefined,
        },
        message: 'Agency updated successfully',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Agency update error:', error);
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
