/**
 * API Route: PATCH/DELETE /api/messages/[messageId]
 *
 * Edit or delete a specific message
 *
 * PATCH: Edit message within 5-minute window
 * DELETE: Soft-delete message (user can delete own, admins can delete any)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { editMessageSchema } from '@/lib/validations/messages';
import { z } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for validating UUID message ID
 */
const uuidSchema = z.string().uuid('Message ID must be a valid UUID');

/**
 * Edit window in milliseconds (5 minutes)
 */
const EDIT_WINDOW_MS = 5 * 60 * 1000;

// =============================================================================
// TYPES
// =============================================================================

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

// =============================================================================
// PATCH /api/messages/[messageId] - Edit Message
// =============================================================================

/**
 * PATCH /api/messages/[messageId]
 *
 * Edit a message within 5-minute window
 *
 * @param request - NextRequest with editMessageSchema body
 * @param context - Route context with messageId param
 * @returns 200 with updated message, 400/403/404/500 on errors
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // =========================================================================
    // 1. VALIDATE MESSAGE ID
    // =========================================================================

    const { messageId } = await context.params;
    const idValidation = uuidSchema.safeParse(messageId);

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid message ID',
            details: {
              messageId: idValidation.error.errors.map((e) => e.message),
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // =========================================================================
    // 2. PARSE AND VALIDATE REQUEST BODY
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

    const bodyValidation = editMessageSchema.safeParse(body);

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

    const { content } = bodyValidation.data;

    // =========================================================================
    // 3. AUTHENTICATE USER
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
    // 4. FETCH MESSAGE TO VERIFY OWNERSHIP AND EDIT WINDOW
    // =========================================================================

    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, edited_at, deleted_at')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      // Check if it's a "not found" error (PGRST116)
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Message not found',
            },
          },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      console.error('Database error fetching message:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // =========================================================================
    // 5. VERIFY USER IS MESSAGE SENDER
    // =========================================================================

    if (message.sender_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You can only edit your own messages',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // =========================================================================
    // 6. VERIFY MESSAGE WAS NOT DELETED
    // =========================================================================

    if (message.deleted_at) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot edit a deleted message',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // =========================================================================
    // 7. VERIFY EDIT WINDOW (5 MINUTES)
    // =========================================================================

    const createdAt = new Date(message.created_at);
    const now = new Date();
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    if (timeSinceCreation > EDIT_WINDOW_MS) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message:
              'Edit window expired. Messages can only be edited within 5 minutes of sending.',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // =========================================================================
    // 8. UPDATE MESSAGE
    // =========================================================================

    const editedAt = new Date().toISOString();

    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        content: content,
        edited_at: editedAt,
      })
      .eq('id', messageId)
      .select(
        'id, conversation_id, sender_id, content, created_at, edited_at, deleted_at'
      )
      .single();

    if (updateError || !updatedMessage) {
      console.error('Database error updating message:', updateError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to update message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // =========================================================================
    // 9. RETURN SUCCESS RESPONSE
    // =========================================================================

    return NextResponse.json(
      {
        data: updatedMessage,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in message PATCH endpoint:', error);
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
// DELETE /api/messages/[messageId] - Soft Delete Message
// =============================================================================

/**
 * DELETE /api/messages/[messageId]
 *
 * Soft-delete a message
 * - User can delete their own messages
 * - Admins can delete any message
 * - Content remains in database (audit trail)
 *
 * @param request - NextRequest
 * @param context - Route context with messageId param
 * @returns 200 with { id, deleted_at }, 400/403/404/500 on errors
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // =========================================================================
    // 1. VALIDATE MESSAGE ID
    // =========================================================================

    const { messageId } = await context.params;
    const idValidation = uuidSchema.safeParse(messageId);

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid message ID',
            details: {
              messageId: idValidation.error.errors.map((e) => e.message),
            },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

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
    // 3. FETCH USER PROFILE TO CHECK IF ADMIN
    // =========================================================================

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch user profile',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const isAdmin = profile?.role === 'admin';

    // =========================================================================
    // 4. FETCH MESSAGE TO VERIFY OWNERSHIP (IF NOT ADMIN)
    // =========================================================================

    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id, deleted_at')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      // Check if it's a "not found" error (PGRST116)
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Message not found',
            },
          },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      console.error('Database error fetching message:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // =========================================================================
    // 5. VERIFY USER IS MESSAGE SENDER OR ADMIN
    // =========================================================================

    if (!isAdmin && message.sender_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message:
              'You can only delete your own messages unless you are an admin',
          },
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // =========================================================================
    // 6. CHECK IF MESSAGE ALREADY DELETED
    // =========================================================================

    if (message.deleted_at) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Message has already been deleted',
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // =========================================================================
    // 7. SOFT DELETE MESSAGE
    // =========================================================================

    const deletedAt = new Date().toISOString();

    const { data: deletedMessage, error: deleteError } = await supabase
      .from('messages')
      .update({ deleted_at: deletedAt })
      .eq('id', messageId)
      .select('id, deleted_at')
      .single();

    if (deleteError || !deletedMessage) {
      console.error('Database error deleting message:', deleteError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to delete message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // =========================================================================
    // 8. RETURN SUCCESS RESPONSE
    // =========================================================================

    return NextResponse.json(
      {
        data: {
          id: deletedMessage.id,
          deleted_at: deletedMessage.deleted_at,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in message DELETE endpoint:', error);
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
