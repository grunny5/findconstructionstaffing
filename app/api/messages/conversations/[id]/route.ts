import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS, SyncRouteContext } from '@/types/api';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid();

// Query params schema
const queryParamsSchema = z.object({
  before: z.string().uuid().optional(), // Cursor for pagination (message ID)
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

type RouteContext = SyncRouteContext<{ id: string }>;

/**
 * GET /api/messages/conversations/[id]
 *
 * Fetches a single conversation with paginated messages.
 * Auto-updates user's last_read_at timestamp.
 *
 * Query Parameters:
 * - before (optional): Message ID cursor for pagination
 * - limit (optional): Number of messages to fetch (default: 50, max: 100)
 *
 * Returns:
 * - 200: { data: { conversation, messages, has_more } }
 * - 400: Invalid UUID or query parameters
 * - 401: Not authenticated
 * - 404: Conversation not found or user not participant
 * - 500: Database error
 */
export async function GET(
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
    // 2. VALIDATE QUERY PARAMETERS
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      before: searchParams.get('before') || undefined,
      limit: searchParams.get('limit') || '50',
    };

    const paramsValidation = queryParamsSchema.safeParse(queryParams);
    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid query parameters',
            details: paramsValidation.error.flatten().fieldErrors,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { before, limit } = paramsValidation.data;

    // ========================================================================
    // 3. AUTHENTICATION CHECK
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
            message: 'You must be logged in to access conversations',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 4. FETCH CONVERSATION
    // ========================================================================
    // RLS automatically filters to conversations where user is participant
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(
        `
        id,
        context_type,
        context_id,
        last_message_at,
        created_at,
        updated_at
      `
      )
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      console.error('Error fetching conversation:', conversationError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Conversation not found or you do not have access',
          },
        },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // ========================================================================
    // 5. FETCH PARTICIPANTS
    // ========================================================================
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(
        `
        user_id,
        joined_at,
        last_read_at,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq('conversation_id', conversationId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch conversation participants',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. FETCH MESSAGES WITH PAGINATION
    // ========================================================================
    let messagesQuery = supabase
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        edited_at,
        deleted_at,
        profiles:sender_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine has_more

    // Apply cursor-based pagination if 'before' provided
    if (before) {
      // Get the timestamp of the cursor message
      const { data: cursorMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (cursorMessage) {
        messagesQuery = messagesQuery.lt(
          'created_at',
          cursorMessage.created_at
        );
      }
    }

    const { data: messagesData, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch messages',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Determine if there are more messages
    const hasMore = messagesData.length > limit;
    const messages = hasMore ? messagesData.slice(0, limit) : messagesData;

    // ========================================================================
    // 7. FETCH AGENCY NAME IF APPLICABLE
    // ========================================================================
    let agencyName = null;
    if (
      conversation.context_type === 'agency_inquiry' &&
      conversation.context_id
    ) {
      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', conversation.context_id)
        .single();
      agencyName = agency?.name || null;
    }

    // ========================================================================
    // 8. UPDATE LAST_READ_AT FOR CURRENT USER
    // ========================================================================
    // Fire-and-forget update (don't await, don't block response)
    supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update last_read_at:', error);
        }
      });

    // ========================================================================
    // 9. BUILD RESPONSE
    // ========================================================================
    const enrichedConversation = {
      ...conversation,
      participants:
        participants?.map((p) => ({
          id: (p.profiles as any).id,
          full_name: (p.profiles as any).full_name,
          email: (p.profiles as any).email,
          joined_at: p.joined_at,
          last_read_at: p.last_read_at,
        })) || [],
      agency_name: agencyName,
    };

    const enrichedMessages = messages.map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      edited_at: m.edited_at,
      deleted_at: m.deleted_at,
      sender: {
        id: (m.profiles as any).id,
        full_name: (m.profiles as any).full_name,
        email: (m.profiles as any).email,
      },
    }));

    return NextResponse.json(
      {
        data: {
          conversation: enrichedConversation,
          messages: enrichedMessages,
          has_more: hasMore,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Unexpected error in conversation GET endpoint:', error);
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
