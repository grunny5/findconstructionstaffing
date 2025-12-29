/**
 * Bulk Import Preview API Endpoint
 *
 * POST /api/admin/agencies/bulk-import/preview
 * Validates parsed agency data and returns preview with per-row validation status.
 * Does NOT create any agencies - preview only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';
import type { ParsedAgencyRow } from '@/lib/utils/csv-parser';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

// Current year for founded_year validation
const currentYear = new Date().getFullYear();

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: ParsedAgencyRow;
}

/**
 * Summary of validation results
 */
export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  withWarnings: number;
}

/**
 * Response from the preview endpoint
 */
export interface BulkImportPreviewResponse {
  rows: RowValidationResult[];
  summary: ValidationSummary;
}

/**
 * Request body schema - array of parsed agency rows
 */
const bulkImportPreviewSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().optional(),
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
 * Validates a single agency row
 */
function validateRow(
  row: ParsedAgencyRow,
  existingNames: Set<string>,
  batchNames: Map<string, number>,
  validTrades: Map<string, string>,
  validRegions: Map<string, string>
): RowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name (required)
  if (!row.name || row.name.trim() === '') {
    errors.push('Name is required');
  } else {
    const trimmedName = row.name.trim();

    // Check length
    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (trimmedName.length > 200) {
      errors.push('Name must be less than 200 characters');
    }

    // Check uniqueness against database
    const lowerName = trimmedName.toLowerCase();
    if (existingNames.has(lowerName)) {
      errors.push('Agency with this name already exists in database');
    }

    // Check uniqueness within batch
    const existingRowNumber = batchNames.get(lowerName);
    if (
      existingRowNumber !== undefined &&
      existingRowNumber !== row._rowNumber
    ) {
      errors.push(
        `Duplicate name in upload (first appears in row ${existingRowNumber})`
      );
    }
  }

  // Validate description length
  if (row.description && row.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  // Validate website URL
  if (row.website && row.website.trim() !== '') {
    try {
      const url = new URL(row.website.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push('Website must start with http:// or https://');
      }
    } catch {
      errors.push('Website must be a valid URL');
    }
  }

  // Validate phone (E.164 format)
  if (row.phone && row.phone.trim() !== '') {
    if (!/^\+?[1-9]\d{1,14}$/.test(row.phone.trim())) {
      errors.push('Phone must be in E.164 format (e.g., +12345678900)');
    }
  }

  // Validate email
  if (row.email && row.email.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
      errors.push('Email must be a valid email address');
    }
  }

  // Validate headquarters length
  if (row.headquarters && row.headquarters.length > 200) {
    errors.push('Headquarters must be less than 200 characters');
  }

  // Validate founded_year
  if (row.founded_year && row.founded_year.trim() !== '') {
    const year = parseInt(row.founded_year.trim(), 10);
    if (isNaN(year) || !/^\d{4}$/.test(row.founded_year.trim())) {
      errors.push('Founded year must be a valid 4-digit year');
    } else if (year < 1800 || year > currentYear) {
      errors.push(`Founded year must be between 1800 and ${currentYear}`);
    }
  }

  // Validate employee_count
  const validEmployeeCounts = [
    '1-10',
    '11-50',
    '51-100',
    '101-200',
    '201-500',
    '501-1000',
    '1001+',
  ];
  if (row.employee_count && row.employee_count.trim() !== '') {
    if (!validEmployeeCounts.includes(row.employee_count.trim())) {
      warnings.push(
        `Employee count "${row.employee_count}" is not a standard value. Valid options: ${validEmployeeCounts.join(', ')}`
      );
    }
  }

  // Validate company_size
  const validCompanySizes = ['Small', 'Medium', 'Large', 'Enterprise'];
  if (row.company_size && row.company_size.trim() !== '') {
    const normalizedSize =
      row.company_size.trim().charAt(0).toUpperCase() +
      row.company_size.trim().slice(1).toLowerCase();
    if (!validCompanySizes.includes(normalizedSize)) {
      warnings.push(
        `Company size "${row.company_size}" is not a standard value. Valid options: ${validCompanySizes.join(', ')}`
      );
    }
  }

  // Validate trades
  if (row.trades && row.trades.length > 0) {
    const unknownTrades: string[] = [];
    for (const trade of row.trades) {
      const tradeLower = trade.toLowerCase().trim();
      if (!validTrades.has(tradeLower)) {
        unknownTrades.push(trade);
      }
    }
    if (unknownTrades.length > 0) {
      warnings.push(
        `Unknown trades will be skipped: ${unknownTrades.join(', ')}`
      );
    }
  }

  // Validate regions
  if (row.regions && row.regions.length > 0) {
    const unknownRegions: string[] = [];
    for (const region of row.regions) {
      const trimmed = region.trim();
      // Check both uppercase (for codes like TX) and lowercase (for names like Texas)
      const isKnown =
        validRegions.has(trimmed.toUpperCase()) ||
        validRegions.has(trimmed.toLowerCase());
      if (!isKnown) {
        unknownRegions.push(region);
      }
    }
    if (unknownRegions.length > 0) {
      warnings.push(
        `Unknown regions will be skipped: ${unknownRegions.join(', ')}`
      );
    }
  }

  return {
    rowNumber: row._rowNumber,
    valid: errors.length === 0,
    errors,
    warnings,
    data: row,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Authenticate user
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

    // Parse and validate request body
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

    const parseResult = bulkImportPreviewSchema.safeParse(body);
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
        rows: [],
        summary: { total: 0, valid: 0, invalid: 0, withWarnings: 0 },
      });
    }

    // Fetch existing agency names from database (case-insensitive)
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

    // Build batch names map (name -> first row number)
    const batchNames = new Map<string, number>();
    for (const row of rows) {
      if (row.name) {
        const lowerName = row.name.toLowerCase().trim();
        if (!batchNames.has(lowerName)) {
          batchNames.set(lowerName, row._rowNumber);
        }
      }
    }

    // Fetch valid trades from database
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

    // Map trade names and slugs to IDs (case-insensitive)
    const validTrades = new Map<string, string>();
    for (const trade of trades || []) {
      validTrades.set(trade.name.toLowerCase(), trade.id);
      validTrades.set(trade.slug.toLowerCase(), trade.id);
    }

    // Fetch valid regions from database
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

    // Map region codes and names to IDs (case-insensitive)
    const validRegions = new Map<string, string>();
    for (const region of regions || []) {
      validRegions.set(region.code.toUpperCase(), region.id);
      validRegions.set(region.name.toLowerCase(), region.id);
    }

    // Validate each row
    const validationResults: RowValidationResult[] = rows.map((row) =>
      validateRow(row, existingNames, batchNames, validTrades, validRegions)
    );

    // Calculate summary
    const summary: ValidationSummary = {
      total: validationResults.length,
      valid: validationResults.filter((r) => r.valid).length,
      invalid: validationResults.filter((r) => !r.valid).length,
      withWarnings: validationResults.filter((r) => r.warnings.length > 0)
        .length,
    };

    return NextResponse.json({ rows: validationResults, summary });
  } catch (error) {
    console.error('Bulk import preview error:', error);
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
