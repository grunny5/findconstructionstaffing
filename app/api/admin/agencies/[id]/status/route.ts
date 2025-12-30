/**
 * Admin Agency Status Toggle API Endpoint
 *
 * POST /api/admin/agencies/[id]/status
 * Toggles an agency's active status (admin-only).
 * Sets last_edited_at and last_edited_by audit fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

// Status update validation schema
const statusUpdateSchema = z.object({
  active: z.boolean({
    required_error: 'active field is required',
    invalid_type_error: 'active must be a boolean',
  }),
});

export type StatusUpdateData = z.infer<typeof statusUpdateSchema>;

export async function POST(
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

    const parseResult = statusUpdateSchema.safeParse(body);
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

    const { active } = parseResult.data;

    // ========================================================================
    // 4. CHECK IF AGENCY EXISTS
    // ========================================================================
    const { data: existingAgency, error: fetchError } = await supabase
      .from('agencies')
      .select('id, name, is_active')
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
    // 5. UPDATE AGENCY STATUS
    // ========================================================================
    const updateData = {
      is_active: active,
      updated_at: new Date().toISOString(),
      last_edited_at: new Date().toISOString(),
      last_edited_by: user.id,
    };

    const { data: updatedAgency, error: updateError } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError || !updatedAgency) {
      console.error('Error updating agency status:', updateError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update agency status',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. RETURN SUCCESS RESPONSE
    // ========================================================================
    const action = active ? 'activated' : 'deactivated';
    return NextResponse.json(
      {
        agency: updatedAgency,
        message: `Agency ${action} successfully`,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Agency status update error:', error);
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
