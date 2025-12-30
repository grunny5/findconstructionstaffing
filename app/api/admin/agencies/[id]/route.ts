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

// Current year for validation
const currentYear = new Date().getFullYear();

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
        const y = parseInt(year, 10);
        return y >= 1800 && y <= currentYear;
      },
      { message: `Year must be between 1800 and ${currentYear}` }
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
});

export type AgencyUpdateData = z.infer<typeof agencyUpdateSchema>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
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

    // If no fields to update, return early
    if (Object.keys(updates).length === 0) {
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
      .eq('id', params.id)
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

    for (const [key, value] of Object.entries(updates)) {
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
    // 6. UPDATE AGENCY
    // ========================================================================
    const { data: updatedAgency, error: updateError } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError || !updatedAgency) {
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

    // ========================================================================
    // 7. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        agency: updatedAgency,
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
