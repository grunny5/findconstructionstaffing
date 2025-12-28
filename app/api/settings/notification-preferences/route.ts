/**
 * API Route: GET/PATCH /api/settings/notification-preferences
 *
 * Manage user notification preferences
 *
 * GET: Fetch current user's notification preferences
 * PATCH: Update current user's notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for notification preferences
 */
const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  email_batch_enabled: z.boolean(),
  email_daily_digest_enabled: z.boolean(),
});

// =============================================================================
// TYPES
// =============================================================================

type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// =============================================================================
// GET /api/settings/notification-preferences - Fetch Preferences
// =============================================================================

/**
 * GET /api/settings/notification-preferences
 *
 * Fetch current user's notification preferences
 * Returns defaults if preferences don't exist yet
 *
 * @returns 200 with preferences, 401 if not authenticated, 500 on error
 */
export async function GET(): Promise<NextResponse> {
  try {
    // =========================================================================
    // 1. AUTHENTICATE USER
    // =========================================================================

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
            message: 'Authentication required',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // =========================================================================
    // 2. FETCH PREFERENCES FROM DATABASE
    // =========================================================================

    const { data: preferences, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('email_enabled, email_batch_enabled, email_daily_digest_enabled')
      .eq('user_id', user.id)
      .single();

    // =========================================================================
    // 3. HANDLE CASES: EXISTS, DOESN'T EXIST, OR ERROR
    // =========================================================================

    // Case: Database error (not including "not found")
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch notification preferences',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Case: Preferences don't exist - return defaults
    if (!preferences) {
      const defaults: NotificationPreferences = {
        email_enabled: true,
        email_batch_enabled: true,
        email_daily_digest_enabled: false,
      };

      return NextResponse.json(
        { data: defaults },
        { status: HTTP_STATUS.OK }
      );
    }

    // Case: Preferences exist - return them
    return NextResponse.json(
      { data: preferences },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error(
      'Unexpected error in notification preferences GET endpoint:',
      error
    );
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

// =============================================================================
// PATCH /api/settings/notification-preferences - Update Preferences
// =============================================================================

/**
 * PATCH /api/settings/notification-preferences
 *
 * Update current user's notification preferences
 * Creates preferences if they don't exist (upsert)
 *
 * @param request - NextRequest with notificationPreferencesSchema body
 * @returns 200 with updated preferences, 400/401/500 on errors
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // =========================================================================
    // 1. PARSE AND VALIDATE REQUEST BODY
    // =========================================================================

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

    const bodyValidation = notificationPreferencesSchema.safeParse(body);

    if (!bodyValidation.success) {
      // Transform Zod errors to field-specific error messages
      const fieldErrors: Record<string, string[]> = {};
      bodyValidation.error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || 'unknown';
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: fieldErrors,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const preferences = bodyValidation.data;

    // =========================================================================
    // 2. AUTHENTICATE USER
    // =========================================================================

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
            message: 'Authentication required',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // =========================================================================
    // 3. UPSERT PREFERENCES (INSERT OR UPDATE)
    // =========================================================================

    const { data: updatedPreferences, error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          ...preferences,
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      )
      .select('email_enabled, email_batch_enabled, email_daily_digest_enabled')
      .single();

    if (upsertError || !updatedPreferences) {
      console.error('Error updating notification preferences:', upsertError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update notification preferences',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // =========================================================================
    // 4. RETURN SUCCESS RESPONSE
    // =========================================================================

    return NextResponse.json(
      { data: updatedPreferences },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error(
      'Unexpected error in notification preferences PATCH endpoint:',
      error
    );
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
