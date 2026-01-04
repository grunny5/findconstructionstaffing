/**
 * Admin User Cleanup API Endpoint
 *
 * POST /api/admin/users/cleanup
 *
 * Cleans up orphaned user records from auth.users, auth.identities, and
 * public.profiles tables. This is useful when users are manually deleted
 * from the Supabase Dashboard but related records remain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST handler for cleaning up orphaned user records (admin-only)
 *
 * Request Body:
 * - email: string - The email address to clean up
 *
 * @returns JSON response with cleanup results or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "message": "Cleanup completed successfully",
 *   "deleted": {
 *     "identities": 1,
 *     "profiles": 0,
 *     "users": 1
 *   }
 * }
 * ```
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
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid JSON in request body',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Email address is required',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid email address format',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 4. CREATE ADMIN CLIENT WITH SERVICE ROLE KEY
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

    // ========================================================================
    // 5. DELETE ORPHANED RECORDS
    // ========================================================================
    const deleted = {
      identities: 0,
      profiles: 0,
      users: 0,
    };

    // 5a. Delete from auth.identities (case-insensitive)
    const { data: identitiesData, error: identitiesError } = await adminClient
      .from('identities')
      .delete()
      .filter('identity_data->>email', 'ilike', email)
      .select('id');

    if (identitiesError) {
      // auth.identities might not be accessible via the data API
      // Try using raw SQL via rpc if needed
      console.warn(
        'Could not delete from identities via data API:',
        identitiesError.message
      );
    } else {
      deleted.identities = identitiesData?.length || 0;
    }

    // 5b. Delete from public.profiles (case-insensitive)
    const { data: profilesData, error: profilesError } = await adminClient
      .from('profiles')
      .delete()
      .ilike('email', email)
      .select('id');

    if (profilesError) {
      console.error('Error deleting from profiles:', profilesError.message);
    } else {
      deleted.profiles = profilesData?.length || 0;
    }

    // 5c. Delete from auth.users using admin API
    // Query auth.users directly by email instead of listing all users
    const { data: authUser, error: userQueryError } = await adminClient
      .schema('auth')
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (userQueryError) {
      console.error('Error querying auth.users:', userQueryError.message);
    } else if (authUser) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        authUser.id
      );
      if (deleteError) {
        console.error('Error deleting user:', deleteError.message);
      } else {
        deleted.users = 1;
      }
    }

    // ========================================================================
    // 6. LOG CLEANUP ACTION (no PII - email not logged)
    // ========================================================================
    console.log(`[Admin Cleanup] Admin ${user.id} performed cleanup`, deleted);

    // ========================================================================
    // 7. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        message: 'Cleanup completed successfully',
        deleted,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in admin user cleanup handler:', error);
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
