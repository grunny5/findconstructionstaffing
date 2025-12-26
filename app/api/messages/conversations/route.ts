/**
 * Conversations API Endpoint
 *
 * GET /api/messages/conversations
 * POST /api/messages/conversations
 *
 * GET: Retrieves user's conversations with pagination, filtering, and search.
 * POST: Creates a new conversation with an initial message.
 *
 * Includes participant information, unread counts, and last message previews.
 * Results are sorted by last message timestamp (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import {
  conversationsQuerySchema,
  createConversationSchema,
} from '@/lib/validations/messages';
import { ZodError } from 'zod';
import type {
  ConversationsApiResponse,
  ConversationResponse,
} from '@/types/api';

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
    // Note: Use filtered count for pagination when client-side filters are applied
    // Check if actual filtering occurred (filter='unread' or search was provided)
    const hasClientSideFilters = filter === 'unread' || search !== undefined;
    const filteredCount = filteredConversations.length;
    const totalCount = count || 0;

    const response: ConversationsApiResponse = {
      data: filteredConversations,
      pagination: {
        total: hasClientSideFilters ? filteredCount : totalCount,
        limit,
        offset,
        hasMore: hasClientSideFilters
          ? false // Client-side filtering means we can't know if more exist
          : offset + limit < totalCount,
      },
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Unexpected error in conversations GET endpoint:', error);
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
 * POST handler for creating a new conversation with initial message
 *
 * Request Body:
 * - recipient_id: UUID of the other participant
 * - context_type: 'agency_inquiry' | 'general'
 * - context_id: UUID of agency (required if context_type = 'agency_inquiry')
 * - initial_message: Text content of first message (1-10000 chars)
 *
 * @returns JSON response with created conversation or error
 *
 * Success Response (201):
 * ```json
 * {
 *   "data": {
 *     "id": "conversation-uuid",
 *     "context_type": "agency_inquiry",
 *     "context_id": "agency-uuid",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "participants": [...],
 *     "last_message_preview": "Hello...",
 *     "unread_count": 0,
 *     "agency_name": "Agency Name"
 *   }
 * }
 * ```
 *
 * Conflict Response (409):
 * ```json
 * {
 *   "error": {
 *     "code": "CONVERSATION_EXISTS",
 *     "message": "Conversation already exists",
 *     "details": {
 *       "conversation_id": "existing-conversation-uuid"
 *     }
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
            message: 'You must be logged in to create a conversation',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 2. REQUEST BODY VALIDATION
    // ========================================================================
    const body = await request.json();

    let validatedData;
    try {
      validatedData = createConversationSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid request data',
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

    const { recipient_id, context_type, context_id, initial_message } =
      validatedData;

    // ========================================================================
    // 3. CHECK FOR DUPLICATE CONVERSATION
    // ========================================================================
    // Find existing conversation with same participants and context
    // Must query conversation_participants to find conversations with both users
    const { data: existingParticipants, error: participantsError } =
      await supabase
        .from('conversation_participants')
        .select(
          `
          conversation_id,
          conversations!inner (
            id,
            context_type,
            context_id
          )
        `
        )
        .in('user_id', [user.id, recipient_id]);

    if (participantsError) {
      console.error(
        'Database error checking for duplicate conversation:',
        participantsError
      );
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to check for existing conversation',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Group by conversation_id to find conversations with both participants
    const conversationCounts = new Map<string, number>();
    const conversationData = new Map<string, any>();

    if (existingParticipants) {
      for (const participant of existingParticipants) {
        const convId = participant.conversation_id;
        const count = conversationCounts.get(convId) || 0;
        conversationCounts.set(convId, count + 1);
        conversationData.set(convId, (participant as any).conversations);
      }
    }

    // Find conversation with both users and matching context
    for (const [convId, count] of conversationCounts.entries()) {
      if (count === 2) {
        // Both users are participants
        const conv = conversationData.get(convId);
        if (
          conv.context_type === context_type &&
          conv.context_id === context_id
        ) {
          // Duplicate found
          return NextResponse.json(
            {
              error: {
                code: 'CONVERSATION_EXISTS',
                message: 'A conversation already exists with this recipient',
                details: {
                  conversation_id: convId,
                },
              },
            },
            { status: HTTP_STATUS.CONFLICT }
          );
        }
      }
    }

    // ========================================================================
    // 4. CREATE CONVERSATION USING DATABASE FUNCTION
    // ========================================================================
    // Call create_conversation_with_participants function
    const { data: conversationId, error: createError } = await supabase.rpc(
      'create_conversation_with_participants',
      {
        p_context_type: context_type,
        p_context_id: context_id,
        p_participant_ids: [user.id, recipient_id],
      }
    );

    if (createError || !conversationId) {
      console.error('Database error creating conversation:', createError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: createError?.message || 'Failed to create conversation',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 5. INSERT INITIAL MESSAGE
    // ========================================================================
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: initial_message,
      })
      .select('id, created_at')
      .single();

    if (messageError || !message) {
      console.error('Database error inserting initial message:', messageError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to send initial message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. FETCH CREATED CONVERSATION WITH FULL DATA
    // ========================================================================
    // Get conversation with participants and agency name
    const { data: conversation, error: fetchError } = await supabase
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

    if (fetchError || !conversation) {
      console.error('Database error fetching created conversation:', fetchError);
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Conversation created but failed to fetch details',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Fetch participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(
        `
        user_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq('conversation_id', conversationId);

    // Fetch agency name if applicable
    let agencyName = null;
    if (context_type === 'agency_inquiry' && context_id) {
      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', context_id)
        .single();
      agencyName = agency?.name || null;
    }

    // ========================================================================
    // 7. BUILD RESPONSE
    // ========================================================================
    const enrichedConversation = {
      ...conversation,
      participants:
        participants?.map((p) => ({
          id: (p.profiles as any).id,
          full_name: (p.profiles as any).full_name,
          email: (p.profiles as any).email,
        })) || [],
      last_message_preview: initial_message.substring(0, 200),
      unread_count: 0, // Creator has read their own message
      agency_name: agencyName,
    };

    const response: ConversationResponse = {
      data: enrichedConversation,
    };

    console.log(
      `Conversation created: ${conversationId} by user ${user.id} with ${recipient_id}`
    );

    return NextResponse.json(response, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('Unexpected error in conversations POST endpoint:', error);
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
