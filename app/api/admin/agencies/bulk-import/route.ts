/**
 * Bulk Import Execution API Endpoint
 *
 * POST /api/admin/agencies/bulk-import
 * Executes bulk import of validated agencies.
 * Creates agencies, generates slugs, and establishes trade/region relationships.
 * Processes rows individually allowing partial success.
 * Errors for individual rows are handled per-row without rolling back the entire import.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';
import { createSlug } from '@/lib/utils/formatting';
import type { ParsedAgencyRow } from '@/lib/utils/csv-parser';
import { SupabaseClient } from '@supabase/supabase-js';
import { MAX_SLUG_ATTEMPTS } from '@/lib/constants/agency';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * Result for a single imported row
 */
export interface ImportRowResult {
  rowNumber: number;
  status: 'created' | 'skipped' | 'failed';
  agencyId?: string;
  agencyName: string;
  reason?: string;
}

/**
 * Response from the bulk import endpoint
 */
export interface BulkImportResponse {
  results: ImportRowResult[];
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Request body schema - array of validated agency rows
 */
const bulkImportSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      headquarters: z.string().optional(),
      founded_year: z.string().optional(),
      employee_count: z.string().optional(),
      company_size: z.string().optional(),
      offers_per_diem: z.boolean().optional(),
      is_union: z.boolean().optional(),
      trades: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      _rowNumber: z.number(),
    })
  ),
});

/**
 * Generate a unique slug for an agency by appending incrementing numbers if needed.
 */
async function generateUniqueSlug(
  baseSlug: string,
  supabase: SupabaseClient,
  existingSlugsInBatch: Set<string>
): Promise<string> {
  // Try the base slug first
  if (!existingSlugsInBatch.has(baseSlug)) {
    const { data: existingWithBase } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', baseSlug)
      .limit(1)
      .maybeSingle();

    if (!existingWithBase) {
      existingSlugsInBatch.add(baseSlug);
      return baseSlug;
    }
  }

  // Base slug exists, try appending -2, -3, etc.
  for (let i = 2; i <= MAX_SLUG_ATTEMPTS; i++) {
    const candidateSlug = `${baseSlug}-${i}`;

    if (!existingSlugsInBatch.has(candidateSlug)) {
      const { data: existing } = await supabase
        .from('agencies')
        .select('id')
        .eq('slug', candidateSlug)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        existingSlugsInBatch.add(candidateSlug);
        return candidateSlug;
      }
    }
  }

  throw new Error(
    `Unable to generate unique slug after ${MAX_SLUG_ATTEMPTS} attempts`
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // ========================================================================
    // 1. AUTHENTICATION CHECK
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
    // 2. ADMIN ROLE VERIFICATION
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

    const parseResult = bulkImportSchema.safeParse(body);
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

    const { rows } = parseResult.data;

    if (rows.length === 0) {
      return NextResponse.json({
        results: [],
        summary: { total: 0, created: 0, skipped: 0, failed: 0 },
      });
    }

    // ========================================================================
    // 4. FETCH EXISTING AGENCY NAMES
    // ========================================================================
    const { data: existingAgencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('name');

    if (agenciesError) {
      console.error('Error fetching agencies:', agenciesError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to check existing agencies',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const existingNames = new Set<string>(
      (existingAgencies || []).map((a) => a.name.toLowerCase())
    );

    // ========================================================================
    // 5. FETCH VALID TRADES AND REGIONS FOR MAPPING
    // ========================================================================
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, name, slug');

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch trades',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tradeMap = new Map<string, string>();
    for (const trade of trades || []) {
      tradeMap.set(trade.name.toLowerCase(), trade.id);
      tradeMap.set(trade.slug.toLowerCase(), trade.id);
    }

    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('id, name, code');

    if (regionsError) {
      console.error('Error fetching regions:', regionsError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch regions',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const regionMap = new Map<string, string>();
    for (const region of regions || []) {
      regionMap.set(region.code.toUpperCase(), region.id);
      regionMap.set(region.name.toLowerCase(), region.id);
    }

    // ========================================================================
    // 6. PROCESS EACH ROW
    // ========================================================================
    const results: ImportRowResult[] = [];
    const existingSlugsInBatch = new Set<string>();

    for (const row of rows) {
      const rowResult: ImportRowResult = {
        rowNumber: row._rowNumber,
        status: 'failed',
        agencyName: row.name,
      };

      try {
        // Check for duplicate name
        const lowerName = row.name.toLowerCase().trim();
        if (existingNames.has(lowerName)) {
          rowResult.status = 'skipped';
          rowResult.reason = 'Agency with this name already exists';
          results.push(rowResult);
          continue;
        }

        // Generate unique slug
        const baseSlug = createSlug(row.name);
        if (!baseSlug) {
          rowResult.status = 'failed';
          rowResult.reason = 'Unable to generate slug from name';
          results.push(rowResult);
          continue;
        }

        let uniqueSlug: string;
        try {
          uniqueSlug = await generateUniqueSlug(
            baseSlug,
            supabase,
            existingSlugsInBatch
          );
        } catch (error) {
          rowResult.status = 'failed';
          rowResult.reason =
            error instanceof Error ? error.message : 'Failed to generate slug';
          results.push(rowResult);
          continue;
        }

        // Prepare agency data
        // Parse and validate founded_year
        let foundedYear: number | null = null;
        if (row.founded_year) {
          const trimmed = row.founded_year.trim();
          const parsed = parseInt(trimmed, 10);
          const currentYear = new Date().getFullYear();
          if (
            Number.isFinite(parsed) &&
            Number.isInteger(parsed) &&
            parsed >= 1800 &&
            parsed <= currentYear
          ) {
            foundedYear = parsed;
          }
        }

        const agencyData = {
          name: row.name,
          slug: uniqueSlug,
          description: row.description || null,
          website: row.website || null,
          phone: row.phone || null,
          email: row.email || null,
          headquarters: row.headquarters || null,
          founded_year: foundedYear,
          employee_count: row.employee_count || null,
          company_size: row.company_size || null,
          offers_per_diem: row.offers_per_diem ?? false,
          is_union: row.is_union ?? false,
          is_active: true,
          is_claimed: false,
          profile_completion_percentage: 0,
        };

        // Insert agency
        const { data: createdAgency, error: insertError } = await supabase
          .from('agencies')
          .insert(agencyData)
          .select('id')
          .single();

        if (insertError || !createdAgency) {
          rowResult.status = 'failed';
          rowResult.reason = insertError?.message || 'Failed to create agency';
          results.push(rowResult);
          continue;
        }

        const agencyId = createdAgency.id;

        // Add name to existing set to prevent duplicates within batch
        existingNames.add(lowerName);

        // Create trade associations
        if (row.trades && row.trades.length > 0) {
          const tradeAssociations: { agency_id: string; trade_id: string }[] =
            [];

          for (const tradeName of row.trades) {
            const tradeLower = tradeName.toLowerCase().trim();
            const tradeId = tradeMap.get(tradeLower);
            if (tradeId) {
              tradeAssociations.push({
                agency_id: agencyId,
                trade_id: tradeId,
              });
            }
          }

          if (tradeAssociations.length > 0) {
            const { error: tradesInsertError } = await supabase
              .from('agency_trades')
              .insert(tradeAssociations);

            if (tradesInsertError) {
              console.error(
                `Error creating trade associations for agency ${agencyId}:`,
                tradesInsertError
              );
            }
          }
        }

        // Create region associations
        if (row.regions && row.regions.length > 0) {
          const regionAssociations: {
            agency_id: string;
            region_id: string;
          }[] = [];

          for (const regionName of row.regions) {
            const trimmed = regionName.trim();
            const regionId =
              regionMap.get(trimmed.toUpperCase()) ||
              regionMap.get(trimmed.toLowerCase());
            if (regionId) {
              regionAssociations.push({
                agency_id: agencyId,
                region_id: regionId,
              });
            }
          }

          if (regionAssociations.length > 0) {
            const { error: regionsInsertError } = await supabase
              .from('agency_regions')
              .insert(regionAssociations);

            if (regionsInsertError) {
              console.error(
                `Error creating region associations for agency ${agencyId}:`,
                regionsInsertError
              );
            }
          }
        }

        rowResult.status = 'created';
        rowResult.agencyId = agencyId;
        rowResult.reason = undefined;
        results.push(rowResult);
      } catch (error) {
        console.error(
          `Unexpected error processing row ${row._rowNumber}:`,
          error
        );
        rowResult.status = 'failed';
        rowResult.reason =
          error instanceof Error ? error.message : 'Unexpected error';
        results.push(rowResult);
      }
    }

    // ========================================================================
    // 7. BUILD SUMMARY
    // ========================================================================
    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
    };

    return NextResponse.json({ results, summary });
  } catch (error) {
    console.error('Bulk import error:', error);
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
