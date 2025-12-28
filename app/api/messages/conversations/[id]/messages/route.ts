import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';
import { sendMessageSchema } from '@/lib/validations/messages';
import { z } from 'zod';
import { sendMessageNotificationEmail } from '@/lib/emails/send-message-notification';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

// UUID validation schema
const uuidSchema = z.string().uuid();

interface RouteContext {
  params: {
    id: string;
  };
}

// Type for agency claim response from database
interface AgencyClaimResponse {
  agency: {
    name: string;
  } | null;
}

/**
 * POST /api/messages/conversations/[id]/messages
 *
 * Sends a message in an existing conversation.
 * RLS ensures user is a participant in the conversation.
 * Database trigger updates conversation's last_message_at timestamp.
 *
 * Request Body:
 * - content: Message text (1-10,000 characters, XSS-protected)
 *
 * Returns:
 * - 201: { data: { message } }
 * - 400: Invalid conversation ID or request body
 * - 401: Not authenticated
 * - 403: User not a participant in conversation
 * - 500: Database error
 */
export async function POST(
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
    // 2. VALIDATE REQUEST BODY
    // ========================================================================
    let body;
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

    const bodyValidation = sendMessageSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: bodyValidation.error.flatten().fieldErrors,
          },
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { content } = bodyValidation.data;

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
            message: 'You must be logged in to send messages',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // ========================================================================
    // 4. RATE LIMITING CHECK
    // ========================================================================
    const rateLimitResponse = await checkRateLimit(user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // ========================================================================
    // 5. INSERT MESSAGE
    // ========================================================================
    // RLS policy will ensure user is a participant
    // Database trigger will update conversations.last_message_at
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
      })
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        edited_at,
        deleted_at
      `
      )
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);

      // Check if error is due to RLS (user not participant)
      if (
        insertError.message?.toLowerCase().includes('policy') ||
        insertError.message?.toLowerCase().includes('permission') ||
        insertError.code === '42501'
      ) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.FORBIDDEN,
              message:
                'You do not have permission to send messages in this conversation',
            },
          },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Failed to send message',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Message was not created',
          },
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // ========================================================================
    // 6. SEND EMAIL NOTIFICATION (NON-BLOCKING)
    // ========================================================================
    // Don't await - email sending shouldn't block the response
    // Errors are handled internally and logged, won't fail the request
    (async () => {
      try {
        // Get conversation participants to identify recipient
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);

        if (!participants || participants.length === 0) {
          console.warn(
            `No participants found for conversation ${conversationId}`
          );
          return;
        }

        // Find recipient (the participant who is NOT the sender)
        const recipientId = participants.find(
          (p) => p.user_id !== user.id
        )?.user_id;

        if (!recipientId) {
          console.warn(
            `No recipient found for conversation ${conversationId} (sender: ${user.id})`
          );
          return;
        }

        // Fetch profiles and agency claim in parallel for better performance
        const [
          { data: senderProfile },
          { data: recipientProfile },
          { data: agencyClaim },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single(),
          supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', recipientId)
            .single(),
          supabase
            .from('agency_claims')
            .select(
              `
            agency:agencies(name)
          `
            )
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .single(),
        ]);

        if (!recipientProfile?.email) {
          console.warn(`Recipient ${recipientId} has no email address`);
          return;
        }

        // Send email notification
        const result = await sendMessageNotificationEmail({
          recipientId: recipientId,
          recipientEmail: recipientProfile.email,
          recipientName: recipientProfile.full_name || undefined,
          senderName: senderProfile?.full_name || 'A user',
          senderCompany:
            (agencyClaim as AgencyClaimResponse | null)?.agency?.name ||
            undefined,
          messagePreview: content,
          conversationId: conversationId,
        });

        if (result.sent) {
          console.log(
            `Email notification sent to ${recipientProfile.email} for message ${message.id}`
          );
        } else {
          console.warn(
            `Email notification failed for message ${message.id}: ${result.reason}`
          );
        }
      } catch (emailError) {
        // Catch any unexpected errors in email flow
        // This is a fallback - sendMessageNotificationEmail already has error handling
        console.error(
          'Unexpected error in email notification flow:',
          emailError
        );
      }
    })();

    // ========================================================================
    // 7. RETURN SUCCESS RESPONSE
    // ========================================================================
    return NextResponse.json(
      {
        data: {
          message,
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Unexpected error in send message endpoint:', error);
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
