/**
 * Agency Profile Update API Endpoint
 *
 * PUT /api/agencies/[slug]/profile
 *
 * Updates agency profile information with audit trail and ownership verification.
 * Only the agency owner can update their profile. All field changes are logged
 * in the agency_profile_edits table for audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import {
  agencyProfileSchema,
  type AgencyProfileFormData,
} from '@/lib/validations/agency-profile';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * PUT handler for updating agency profile (owner-only)
 *
 * @param request - Next.js request object with profile update data
 * @param params - Route params containing slug
 * @returns JSON response with updated agency data or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": {
 *     "id": "uuid",
 *     "name": "Updated Agency Name",
 *     "description": "<p>Updated description</p>",
 *     "website": "https://updated.com",
 *     "phone": "+1234567890",
 *     "email": "contact@updated.com",
 *     "founded_year": "2000",
 *     "employee_count": "51-100",
 *     "headquarters": "Updated City, ST",
 *     "last_edited_at": "2024-01-01T00:00:00Z",
 *     "last_edited_by": "uuid"
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
 *     "details": { ... } // Optional validation errors
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
            message: 'You must be logged in to update agency profiles',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. VERIFY OWNERSHIP
    // ========================================================================
    const { slug } = params;

    // Fetch agency to verify it exists and get current values
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select(
        'id, claimed_by, name, description, website, phone, email, founded_year, employee_count, headquarters'
      )
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

    // Verify user owns this agency
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

    const validation = agencyProfileSchema.safeParse(body);

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

    const updateData: AgencyProfileFormData = validation.data;

    // ========================================================================
    // 4. CREATE AUDIT TRAIL FOR CHANGED FIELDS
    // ========================================================================
    const changedFields: Array<{
      field_name: string;
      old_value: unknown;
      new_value: unknown;
    }> = [];

    // Compare each field and track changes
    const fieldMapping: Array<{
      key: keyof AgencyProfileFormData;
      dbField: string;
    }> = [
      { key: 'name', dbField: 'name' },
      { key: 'description', dbField: 'description' },
      { key: 'website', dbField: 'website' },
      { key: 'phone', dbField: 'phone' },
      { key: 'email', dbField: 'email' },
      { key: 'founded_year', dbField: 'founded_year' },
      { key: 'employee_count', dbField: 'employee_count' },
      { key: 'headquarters', dbField: 'headquarters' },
    ];

    for (const { key, dbField } of fieldMapping) {
      const oldValue = agency[dbField as keyof typeof agency];
      const newValue = updateData[key];

      // Skip if values are the same (including empty string comparisons)
      const oldNormalized = oldValue || '';
      const newNormalized = newValue || '';

      if (oldNormalized !== newNormalized) {
        changedFields.push({
          field_name: dbField,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    // ========================================================================
    // 5. UPDATE AGENCY RECORD AND CREATE AUDIT ENTRIES
    // ========================================================================
    // Use Supabase transaction-like pattern with multiple operations

    // Insert audit trail entries for all changed fields
    if (changedFields.length > 0) {
      const auditEntries = changedFields.map((change) => ({
        agency_id: agency.id,
        edited_by: user.id,
        field_name: change.field_name,
        old_value: change.old_value,
        new_value: change.new_value,
      }));

      const { error: auditError } = await supabase
        .from('agency_profile_edits')
        .insert(auditEntries);

      if (auditError) {
        console.error('Error creating audit trail:', auditError);
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to create audit trail',
            },
          },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }
    }

    // Update agency record with new values
    const { data: updatedAgency, error: updateError } = await supabase
      .from('agencies')
      .update({
        name: updateData.name,
        description: updateData.description || null,
        website: updateData.website || null,
        phone: updateData.phone || null,
        email: updateData.email || null,
        founded_year: updateData.founded_year || null,
        employee_count: updateData.employee_count || null,
        headquarters: updateData.headquarters || null,
        last_edited_at: new Date().toISOString(),
        last_edited_by: user.id,
      })
      .eq('id', agency.id)
      .select(
        'id, name, description, website, phone, email, founded_year, employee_count, headquarters, last_edited_at, last_edited_by'
      )
      .single();

    if (updateError) {
      console.error('Error updating agency:', updateError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update agency profile',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: updatedAgency,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in profile update handler:', error);
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
