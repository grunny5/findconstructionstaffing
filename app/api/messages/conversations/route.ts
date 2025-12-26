/**
 * Conversations API Endpoint
 *
 * GET /api/messages/conversations
 *
 * Retrieves user's conversations with pagination, filtering, and search.
 * Includes participant information, unread counts, and last message previews.
 * Results are sorted by last message timestamp (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { conversationsQuerySchema } from '@/lib/validations/messages';
import { ZodError } from 'zod';
import type { ConversationsApiResponse } from '@/types/api';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching user's conversations
 *
 * Query Parameters:
 * - limit: Number of conversations to return (1-100, default 25)
 * - offset: Pagination offset (default 0)
 * - filter: Filter by read status ('all' | 'unread', default 'all')
 * - search: Search by participant name (optional)
 *
 * @returns JSON response with paginated conversations or error
 *
 * Success Response (200):
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "context_type": "agency_inquiry" | "general",
 *       "context_id": "uuid | null",
 *       "last_message_at": "2024-01-01T00:00:00Z",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "participants": [
 *         { "id": "uuid", "full_name": "John Doe", "email": "john@example.com" }
 *       ],
 *       "last_message_preview": "Hello, I have a question...",
 *       "unread_count": 3,
 *       "agency_name": "Agency Name | null"
 *     }
 *   ],
 *   "pagination": {
 *     "total": 50,
 *     "limit": 25,
 *     "offset": 0,
 *     "hasMore": true
 *   }
 * }
 * ```
 *
 * Error Response (4xx/5xx):
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message",
 *     "details": { ... }
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const supabase = await createClient();

    // Get authenticated user
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
    // 2. PARSE AND VALIDATE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(request.url);

    // Convert searchParams to object for Zod validation
    const queryParams = {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      filter: searchParams.get('filter') || undefined,
      search: searchParams.get('search') || undefined,
    };

    let validatedParams;
    try {
      validatedParams = conversationsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid query parameters',
              details: error.errors.reduce(
                (acc, err) => ({
                  ...acc,
                  [err.path.join('.')]: err.message,
                }),
                {}
              ),
            },
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      throw error;
    }

    const { limit, offset, filter, search } = validatedParams;

    // ========================================================================
    // 3. FETCH CONVERSATIONS
    // ========================================================================
    // RLS will automatically filter to conversations where user is a participant

    // Build the main query for conversations with participants
    let conversationsQuery = supabase
      .from('conversations')
      .select(
        `
        id,
        context_type,
        context_id,
        last_message_at,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute conversation query
    const { data: conversations, error: conversationsError, count } =
      await conversationsQuery;

    if (conversationsError) {
      console.error('Database error fetching conversations:', conversationsError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to fetch conversations',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!conversations || conversations.length === 0) {
      const response: ConversationsApiResponse = {
        data: [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: false,
        },
      };
      return NextResponse.json(response, { status: HTTP_STATUS.OK });
    }

    // ========================================================================
    // 4. FETCH RELATED DATA FOR EACH CONVERSATION
    // ========================================================================
    const conversationIds = conversations.map((c) => c.id);

    // Fetch all participants for these conversations
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        user_id,
        last_read_at,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .in('conversation_id', conversationIds);

    if (participantsError) {
      console.error('Database error fetching participants:', participantsError);
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

    // Fetch last message for each conversation
    const { data: lastMessages, error: messagesError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Database error fetching messages:', messagesError);
    }

    // Fetch agency names for agency_inquiry conversations
    const agencyConversations = conversations.filter(
      (c) => c.context_type === 'agency_inquiry' && c.context_id
    );
    const agencyIds = agencyConversations.map((c) => c.context_id as string);

    let agencies: { id: string; name: string }[] = [];
    if (agencyIds.length > 0) {
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('agencies')
        .select('id, name')
        .in('id', agencyIds);

      if (!agenciesError && agenciesData) {
        agencies = agenciesData;
      }
    }

    // ========================================================================
    // 5. BUILD RESPONSE DATA WITH ENRICHED INFORMATION
    // ========================================================================
    const enrichedConversations = conversations.map((conversation) => {
      // Get participants for this conversation (excluding current user for display)
      const conversationParticipants = (participants || [])
        .filter((p) => p.conversation_id === conversation.id)
        .map((p) => ({
          id: (p.profiles as any).id,
          full_name: (p.profiles as any).full_name,
          email: (p.profiles as any).email,
          last_read_at: p.last_read_at,
        }));

      // Get current user's participant record for unread calculation
      const userParticipant = (participants || []).find(
        (p) => p.conversation_id === conversation.id && p.user_id === user.id
      );

      // Calculate unread count
      // Count messages after user's last_read_at timestamp
      const unreadCount =
        userParticipant?.last_read_at
          ? (lastMessages || []).filter(
              (m) =>
                m.conversation_id === conversation.id &&
                new Date(m.created_at) > new Date(userParticipant.last_read_at!)
            ).length
          : (lastMessages || []).filter(
              (m) => m.conversation_id === conversation.id
            ).length;

      // Get last message preview
      const lastMessage = (lastMessages || []).find(
        (m) => m.conversation_id === conversation.id
      );
      const lastMessagePreview = lastMessage
        ? lastMessage.content.substring(0, 200)
        : null;

      // Get agency name if applicable
      const agency = agencies.find((a) => a.id === conversation.context_id);

      return {
        ...conversation,
        participants: conversationParticipants.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
        })),
        last_message_preview: lastMessagePreview,
        unread_count: unreadCount,
        agency_name: agency?.name || null,
      };
    });

    // ========================================================================
    // 6. APPLY FILTERS AND SEARCH
    // ========================================================================
    let filteredConversations = enrichedConversations;

    // Filter by unread status
    if (filter === 'unread') {
      filteredConversations = filteredConversations.filter(
        (c) => c.unread_count > 0
      );
    }

    // Search by participant name
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = filteredConversations.filter((c) =>
        c.participants.some(
          (p) =>
            p.full_name?.toLowerCase().includes(searchLower) ||
            p.email?.toLowerCase().includes(searchLower)
        )
      );
    }

    // ========================================================================
    // 7. BUILD RESPONSE
    // ========================================================================
    const response: ConversationsApiResponse = {
      data: filteredConversations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Unexpected error in conversations endpoint:', error);
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
