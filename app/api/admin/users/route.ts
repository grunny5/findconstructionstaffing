/**
 * Admin User Management API Endpoint
 *
 * POST /api/admin/users - Create a new user account
 *
 * Creates a new user via Supabase Auth Admin API with profile record.
 * Sends password reset email for the user to set their password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import * as z from 'zod';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * Validation schema for user creation
 */
const userCreationSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Must be a valid email address'),
  full_name: z
    .string()
    .trim()
    .max(200, 'Name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  role: z
    .enum(['user', 'agency_owner', 'admin'], {
      errorMap: () => ({
        message: 'Role must be user, agency_owner, or admin',
      }),
    })
    .default('user'),
});

type UserCreationData = z.infer<typeof userCreationSchema>;

/**
 * POST handler for creating a new user (admin-only)
 *
 * Request Body:
 * - email: string (required) - User's email address
 * - full_name: string (optional) - User's display name
 * - role: 'user' | 'agency_owner' | 'admin' (optional, default: 'user')
 *
 * @returns JSON response with created user or error
 *
 * Success Response (201):
 * ```json
 * {
 *   "message": "User created successfully",
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "full_name": "John Doe",
 *     "role": "user"
 *   },
 *   "passwordResetSent": true
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
    let body: unknown;
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

    const validationResult = userCreationSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: firstError.message,
            field: firstError.path.join('.'),
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { email, full_name, role }: UserCreationData = validationResult.data;

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
    // 5. CHECK IF EMAIL ALREADY EXISTS
    // ========================================================================
    const { data: existingUser } = await adminClient
      .schema('auth')
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'A user with this email address already exists',
          },
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // ========================================================================
    // 6. CREATE USER VIA SUPABASE AUTH ADMIN API
    // ========================================================================
    const { data: authUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true, // Mark as confirmed since admin is creating
        user_metadata: {
          full_name: full_name || null,
        },
      });

    if (createError || !authUser.user) {
      console.error('Error creating auth user:', createError?.message);

      // Check for duplicate email error from auth
      if (createError?.message?.includes('already been registered')) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.CONFLICT,
              message: 'A user with this email address already exists',
            },
          },
          { status: HTTP_STATUS.CONFLICT }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Failed to create user account',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 7. CREATE PROFILE RECORD
    // ========================================================================
    const { error: profileCreateError } = await adminClient
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase(),
        full_name: full_name || null,
        role: role,
      });

    if (profileCreateError) {
      console.error('Error creating profile:', profileCreateError.message);
      // Attempt to clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authUser.user.id);

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Failed to create user profile',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 8. GENERATE PASSWORD RESET LINK AND SEND EMAIL
    // ========================================================================
    let passwordResetSent = false;

    // Get the base URL for the redirect
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      'http://localhost:3000';

    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${baseUrl}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating password reset link:', linkError.message);
      // User was created, but password reset email failed - log but don't fail the request
    } else {
      passwordResetSent = true;
    }

    // ========================================================================
    // 9. LOG ACTION
    // ========================================================================
    console.log(
      `[Admin User Create] Admin ${user.id} created user ${authUser.user.id} with role ${role}`
    );

    // ========================================================================
    // 10. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: authUser.user.id,
          email: email.toLowerCase(),
          full_name: full_name || null,
          role: role,
        },
        passwordResetSent,
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Unexpected error in admin user creation handler:', error);
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
