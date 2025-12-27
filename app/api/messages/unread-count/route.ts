import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

/**
 * GET /api/messages/unread-count
 *
 * Gets the total count of unread messages and conversations with unread messages
 * for the authenticated user. Used for navigation badge display.
 *
 * Returns:
 * - 200: { data: { total_unread: number, conversations_with_unread: number } }
 * - 401: Not authenticated
 * - 500: Database error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
            message: 'You must be logged in to view unread counts',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. FETCH USER'S CONVERSATION PARTICIPANTS
    // ========================================================================
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (participantsError) {
      console.error(
        'Error fetching conversation participants:',
        participantsError
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch unread counts',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // If user has no conversations, return zero counts
    if (!participants || participants.length === 0) {
      return NextResponse.json(
        {
          data: {
            total_unread: 0,
            conversations_with_unread: 0,
          },
        },
        { status: HTTP_STATUS.OK }
      );
    }

    // ========================================================================
    // 3. FETCH MESSAGES FOR ALL USER'S CONVERSATIONS
    // ========================================================================
    const conversationIds = participants.map((p) => p.conversation_id);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch unread counts',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // If no messages, return zero counts
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          data: {
            total_unread: 0,
            conversations_with_unread: 0,
          },
        },
        { status: HTTP_STATUS.OK }
      );
    }

    // ========================================================================
    // 4. CALCULATE UNREAD COUNTS
    // ========================================================================
    let totalUnread = 0;
    const conversationsWithUnread = new Set<string>();

    // Create a map of conversation_id to last_read_at for quick lookup
    const lastReadMap = new Map(
      participants.map((p) => [p.conversation_id, p.last_read_at])
    );

    for (const message of messages) {
      const lastReadAt = lastReadMap.get(message.conversation_id);

      // Message is unread if:
      // 1. User has never read the conversation (last_read_at is null), OR
      // 2. Message was created after user's last_read_at timestamp
      const isUnread =
        !lastReadAt || new Date(message.created_at) > new Date(lastReadAt);

      if (isUnread) {
        totalUnread++;
        conversationsWithUnread.add(message.conversation_id);
      }
    }

    // ========================================================================
    // 5. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: {
          total_unread: totalUnread,
          conversations_with_unread: conversationsWithUnread.size,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in unread count endpoint:', error);
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
