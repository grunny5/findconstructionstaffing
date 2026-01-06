/**
 * Admin User Management API Endpoint
 *
 * PATCH /api/admin/users/[id]
 * Updates an existing user's profile (admin-only).
 * Only updates provided fields (partial update).
 *
 * DELETE /api/admin/users/[id]
 * Deletes a user account (admin-only).
 * Cannot delete self or users who own claimed agencies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

// User update validation schema (all fields optional for partial updates)
const userUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(200, 'Name must be less than 200 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  role: z
    .enum(['user', 'agency_owner', 'admin'], {
      errorMap: () => ({
        message: 'Role must be user, agency_owner, or admin',
      }),
    })
    .optional(),
});

export type UserUpdateData = z.infer<typeof userUpdateSchema>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    const supabase = await createClient();

    // ========================================================================
    // 1. VALIDATE UUID FORMAT
    // ========================================================================
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid user ID format',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 2. AUTHENTICATE USER
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
    // 3. CHECK ADMIN AUTHORIZATION
    // ========================================================================
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
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
    // 4. PARSE AND VALIDATE REQUEST BODY
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

    const parseResult = userUpdateSchema.safeParse(body);
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

    // Check if any fields were provided
    const hasFullNameUpdate = updates.full_name !== undefined;
    const hasRoleUpdate = updates.role !== undefined;

    if (!hasFullNameUpdate && !hasRoleUpdate) {
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
    // 5. CHECK IF USER EXISTS
    // ========================================================================
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'User not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 6. PREPARE UPDATE DATA
    // ========================================================================
    const updateData: Record<string, unknown> = {};

    if (hasFullNameUpdate) {
      // Convert empty string to null
      updateData.full_name =
        updates.full_name === '' || updates.full_name === null
          ? null
          : updates.full_name;
    }

    if (hasRoleUpdate) {
      // Prevent admin from demoting themselves
      if (user.id === id && updates.role !== 'admin') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.FORBIDDEN,
              message: 'Cannot demote yourself from admin role',
            },
          },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }
      updateData.role = updates.role;
    }

    // Add audit field
    updateData.updated_at = new Date().toISOString();

    // ========================================================================
    // 7. UPDATE USER PROFILE
    // ========================================================================
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update user',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        user: updatedUser,
        message: 'User updated successfully',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error updating user:', error);
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
 * DELETE handler for deleting a user account (admin-only)
 *
 * Cannot delete:
 * - Own account (returns 403)
 * - User who owns claimed agencies (returns 409)
 *
 * @returns JSON response with success message or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    const supabase = await createClient();

    // ========================================================================
    // 1. VALIDATE UUID FORMAT
    // ========================================================================
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid user ID format',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 2. AUTHENTICATE USER
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
    // 3. CHECK ADMIN AUTHORIZATION
    // ========================================================================
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
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
    // 4. PREVENT SELF-DELETION
    // ========================================================================
    if (user.id === id) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Cannot delete your own account',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ========================================================================
    // 5. CHECK IF TARGET USER EXISTS
    // ========================================================================
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'User not found',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 6. CHECK IF USER OWNS CLAIMED AGENCIES
    // ========================================================================
    const { data: claimedAgencies, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, slug')
      .eq('claimed_by', id)
      .eq('is_claimed', true);

    if (agencyError) {
      console.error('Error checking claimed agencies:', agencyError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to check agency ownership',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (claimedAgencies && claimedAgencies.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.CONFLICT,
            message:
              'Cannot delete user who owns a claimed agency. Unclaim the agency first.',
            details: {
              claimed_agencies: claimedAgencies,
            },
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 7. CREATE ADMIN CLIENT AND DELETE USER
    // ========================================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration for admin operations');
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Server configuration error',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete user via Admin API (will CASCADE delete profile)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Failed to delete user',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        message: 'User deleted successfully',
        deleted_user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
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
