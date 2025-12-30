/**
 * Admin Agencies API Endpoint
 *
 * GET /api/admin/agencies
 * Retrieves all agencies with filtering and pagination (admin-only).
 * Includes claimed status and owner profile information.
 * Results are sorted by creation date (newest first).
 *
 * POST /api/admin/agencies
 * Creates a new agency (admin-only).
 * Auto-generates slug from name, validates uniqueness.
 * Sets is_active=true, is_claimed=false by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';
import { createSlug } from '@/lib/utils/formatting';
import { sanitizeSearchInput } from '@/lib/validation/agencies-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { MAX_SLUG_ATTEMPTS } from '@/lib/constants/agency';
import {
  agencyCreationSchema,
  type AgencyCreationFormData,
} from '@/lib/validations/agency-creation';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * Escapes SQL LIKE/ILIKE wildcard characters for literal matching.
 * PostgreSQL uses backslash as the default escape character.
 * @param input - The string to escape
 * @returns The escaped string safe for use in LIKE/ILIKE patterns
 */
function escapeLikeWildcards(input: string): string {
  return input
    .trim()
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/%/g, '\\%') // Escape percent signs
    .replace(/_/g, '\\_'); // Escape underscores
}

// Query parameter validation schema
const adminAgenciesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  claimed: z.enum(['yes', 'no', 'all']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

export type AdminAgenciesQueryParams = z.infer<typeof adminAgenciesQuerySchema>;

// Re-export for backwards compatibility
export type AgencyCreationData = AgencyCreationFormData;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique slug for an agency by appending incrementing numbers if needed.
 *
 * @param baseSlug - The initial slug generated from the agency name
 * @param supabase - Supabase client for database queries
 * @returns The unique slug (either baseSlug or baseSlug-N where N is 2-5)
 * @throws Error if unable to find a unique slug after MAX_SLUG_ATTEMPTS attempts
 */
async function generateUniqueSlug(
  baseSlug: string,
  supabase: SupabaseClient
): Promise<string> {
  // Try the base slug first
  const { data: existingWithBase, error: baseError } = await supabase
    .from('agencies')
    .select('id')
    .eq('slug', baseSlug)
    .limit(1)
    .maybeSingle();

  if (baseError) {
    throw new Error(`Database error checking slug: ${baseError.message}`);
  }

  if (!existingWithBase) {
    return baseSlug;
  }

  // Base slug exists, try appending -2, -3, etc.
  for (let i = 2; i <= MAX_SLUG_ATTEMPTS; i++) {
    const candidateSlug = `${baseSlug}-${i}`;

    const { data: existing, error: checkError } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', candidateSlug)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error checking slug: ${checkError.message}`);
    }

    if (!existing) {
      return candidateSlug;
    }
  }

  // All attempts exhausted
  throw new Error(
    `Unable to generate unique slug after ${MAX_SLUG_ATTEMPTS} attempts`
  );
}

/**
 * GET handler for fetching all agencies (admin-only)
 *
 * Query Parameters:
 * - search: Search by agency name
 * - status: Filter by active status ('active' | 'inactive' | 'all')
 * - claimed: Filter by claimed status ('yes' | 'no' | 'all')
 * - limit: Results per page (default: 25, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @returns JSON response with paginated agencies or error
 */
export async function GET(request: NextRequest) {
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
            message: 'You must be logged in to access this endpoint',
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
            message: 'Forbidden: Admin access required',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 3. PARSE AND VALIDATE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const queryResult = adminAgenciesQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || 'all',
      claimed: searchParams.get('claimed') || 'all',
      limit: searchParams.get('limit') || '25',
      offset: searchParams.get('offset') || '0',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid query parameters',
            details: queryResult.error.issues,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { search, status, claimed, limit, offset } = queryResult.data;

    // ========================================================================
    // 4. BUILD QUERY WITH FILTERS
    // ========================================================================
    let query = supabase
      .from('agencies')
      .select(
        `
        id,
        name,
        slug,
        is_active,
        is_claimed,
        claimed_by,
        created_at,
        profile_completion_percentage
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply claimed filter
    if (claimed === 'yes') {
      query = query.eq('is_claimed', true);
    } else if (claimed === 'no') {
      query = query.eq('is_claimed', false);
    }

    // Apply search filter (sanitize to prevent wildcard injection)
    const sanitizedSearch = search ? sanitizeSearchInput(search) : undefined;
    if (sanitizedSearch) {
      query = query.ilike('name', `%${sanitizedSearch}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // ========================================================================
    // 5. EXECUTE QUERY
    // ========================================================================
    const { data: agencies, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching agencies:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch agencies',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. FETCH OWNER PROFILES FOR CLAIMED AGENCIES
    // ========================================================================
    const claimedByIds = (agencies || [])
      .filter((a) => a.claimed_by)
      .map((a) => a.claimed_by as string);

    let ownerProfiles: Record<
      string,
      { email: string | null; full_name: string | null }
    > = {};

    if (claimedByIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', claimedByIds);

      if (profilesError) {
        console.error('Error fetching owner profiles:', {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details,
          claimedByIds,
        });
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to fetch owner profiles',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }

      if (profiles) {
        ownerProfiles = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name };
            return acc;
          },
          {} as Record<
            string,
            { email: string | null; full_name: string | null }
          >
        );
      }
    }

    // Merge owner profiles with agencies
    const agenciesWithOwners = (agencies || []).map((agency) => ({
      ...agency,
      owner_profile: agency.claimed_by
        ? ownerProfiles[agency.claimed_by] || null
        : null,
    }));

    // ========================================================================
    // 7. BUILD PAGINATION METADATA
    // ========================================================================
    const total = count || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;

    // ========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: agenciesWithOwners,
        pagination: {
          total,
          limit,
          offset,
          hasMore,
          page,
          totalPages,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in admin agencies handler:', error);
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
 * POST handler for creating a new agency (admin-only)
 *
 * Request Body:
 * - name: Agency name (required, must be unique)
 * - description: Agency description (optional)
 * - website: Website URL (optional, must be valid URL)
 * - phone: Phone number (optional, E.164 format)
 * - email: Contact email (optional, must be valid)
 * - headquarters: Location (optional)
 * - founded_year: Year founded (optional)
 * - employee_count: Employee range (optional)
 * - company_size: Size category (optional)
 * - offers_per_diem: Boolean (default false)
 * - is_union: Boolean (default false)
 *
 * @returns JSON response with created agency or error
 */
export async function POST(request: NextRequest) {
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
            message: 'You must be logged in to access this endpoint',
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
            message: 'Forbidden: Admin access required',
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
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Invalid JSON in request body',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const validationResult = agencyCreationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationResult.error.issues,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const data = validationResult.data;

    // ========================================================================
    // 4. GENERATE BASE SLUG FROM NAME
    // ========================================================================
    const baseSlug = createSlug(data.name);

    if (!baseSlug) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Unable to generate slug from agency name',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 5. CHECK FOR DUPLICATE NAME
    // ========================================================================
    // Escape wildcards for literal matching (prevents % and _ from acting as patterns)
    const escapedName = escapeLikeWildcards(data.name);
    const { data: existingAgency, error: checkError } = await supabase
      .from('agencies')
      .select('id, name')
      .ilike('name', escapedName)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for duplicate agency:', checkError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to check for existing agency',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (existingAgency) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'An agency with this name already exists',
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 6. GENERATE UNIQUE SLUG (with incrementing suffix if needed)
    // ========================================================================
    let uniqueSlug: string;
    try {
      uniqueSlug = await generateUniqueSlug(baseSlug, supabase);
    } catch (error) {
      console.error('Error generating unique slug:', error);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message:
              error instanceof Error
                ? error.message
                : 'Unable to generate unique slug',
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 7. PREPARE AGENCY DATA FOR INSERT
    // ========================================================================
    const agencyData = {
      name: data.name,
      slug: uniqueSlug,
      description: data.description || null,
      website: data.website || null,
      phone: data.phone || null,
      email: data.email || null,
      headquarters: data.headquarters || null,
      founded_year: data.founded_year ? parseInt(data.founded_year, 10) : null,
      employee_count: data.employee_count || null,
      company_size: data.company_size || null,
      offers_per_diem: data.offers_per_diem,
      is_union: data.is_union,
      is_active: true,
      is_claimed: false,
      profile_completion_percentage: 0,
    };

    // ========================================================================
    // 8. INSERT AGENCY INTO DATABASE
    // ========================================================================
    const { data: createdAgency, error: insertError } = await supabase
      .from('agencies')
      .insert(agencyData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating agency:', insertError);

      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'An agency with this name or slug already exists',
            },
          },
          { status: HTTP_STATUS.CONFLICT }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to create agency',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 9. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: createdAgency,
        message: 'Agency created successfully',
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Unexpected error in agency creation handler:', error);
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
