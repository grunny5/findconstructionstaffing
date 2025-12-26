import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid();

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PUT /api/messages/conversations/[id]/read
 *
 * Marks a conversation as read by updating the user's last_read_at timestamp.
 * RLS ensures user can only update their own participant record.
 *
 * Returns:
 * - 200: { data: { conversation_id, last_read_at } }
 * - 400: Invalid conversation ID
 * - 401: Not authenticated
 * - 404: Conversation not found or user not a participant
 * - 500: Database error
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // ========================================================================
    // 1. VALIDATE CONVERSATION ID
    // ========================================================================
    const conversationId = context.params.id;

    const idValidation = uuidSchema.safeParse(conversationId);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid conversation ID format',
            details: { id: 'Must be a valid UUID' },
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ========================================================================
    // 2. AUTHENTICATION CHECK
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
            message: 'You must be logged in to mark conversations as read',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 3. UPDATE LAST_READ_AT
    // ========================================================================
    const now = new Date().toISOString();

    const { data: updatedParticipant, error: updateError } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: now })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .select('conversation_id, last_read_at')
      .single();

    if (updateError) {
      console.error('Error updating last_read_at:', updateError);

      // Check if error is due to no matching row (user not participant)
      if (
        updateError.code === 'PGRST116' ||
        updateError.message?.toLowerCase().includes('no rows')
      ) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Conversation not found or you are not a participant',
            },
          },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to mark conversation as read',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!updatedParticipant) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Conversation not found or you are not a participant',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 4. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: {
          conversation_id: updatedParticipant.conversation_id,
          last_read_at: updatedParticipant.last_read_at,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error(
      'Unexpected error in mark conversation read endpoint:',
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
