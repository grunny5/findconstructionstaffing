import * as z from 'zod';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 10000;
export const MESSAGE_PREVIEW_LENGTH = 200;

export const CONTEXT_TYPES = ['agency_inquiry', 'general'] as const;

export const CONVERSATION_FILTERS = ['all', 'unread'] as const;

// Default pagination limits
export const DEFAULT_CONVERSATIONS_LIMIT = 25;
export const MAX_CONVERSATIONS_LIMIT = 100;

export const DEFAULT_MESSAGES_LIMIT = 50;
export const MAX_MESSAGES_LIMIT = 100;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for querying conversations list
 *
 * Query parameters:
 * - limit: Number of conversations to return (1-100, default 25)
 * - offset: Pagination offset (default 0)
 * - filter: Filter by read status ('all' | 'unread', default 'all')
 * - search: Search by participant name (optional)
 *
 * Example: GET /api/messages/conversations?limit=25&offset=0&filter=unread&search=john
 */
export const conversationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_CONVERSATIONS_LIMIT))
    .pipe(
      z
        .number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(
          MAX_CONVERSATIONS_LIMIT,
          `Limit must not exceed ${MAX_CONVERSATIONS_LIMIT}`
        )
    ),

  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(
      z
        .number()
        .int('Offset must be an integer')
        .min(0, 'Offset must be 0 or greater')
    ),

  filter: z
    .enum(CONVERSATION_FILTERS, {
      errorMap: () => ({
        message: `Filter must be one of: ${CONVERSATION_FILTERS.join(', ')}`,
      }),
    })
    .optional()
    .default('all'),

  search: z
    .string()
    .trim()
    .min(1, 'Search term must not be empty')
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
});

export type ConversationsQueryParams = z.infer<typeof conversationsQuerySchema>;

/**
 * Schema for creating a new conversation with initial message
 *
 * Request body:
 * - recipient_id: UUID of the user to start conversation with
 * - context_type: Type of conversation ('agency_inquiry' | 'general')
 * - context_id: UUID of agency (required if context_type is 'agency_inquiry')
 * - initial_message: First message content (1-10,000 chars, no <script> tags)
 *
 * Example:
 * {
 *   "recipient_id": "uuid-here",
 *   "context_type": "agency_inquiry",
 *   "context_id": "agency-uuid",
 *   "initial_message": "Hi, I'm interested in your services."
 * }
 */
export const createConversationSchema = z
  .object({
    recipient_id: z
      .string({ required_error: 'Recipient ID is required' })
      .uuid('Recipient ID must be a valid UUID'),

    context_type: z.enum(CONTEXT_TYPES, {
      errorMap: () => ({
        message: `Context type must be one of: ${CONTEXT_TYPES.join(', ')}`,
      }),
    }),

    context_id: z
      .string()
      .uuid('Context ID must be a valid UUID')
      .optional()
      .nullable(),

    initial_message: z
      .string({ required_error: 'Initial message is required' })
      .trim()
      .min(
        MESSAGE_MIN_LENGTH,
        `Message must be at least ${MESSAGE_MIN_LENGTH} character`
      )
      .max(
        MESSAGE_MAX_LENGTH,
        `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`
      )
      .refine(
        (content) => !/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content),
        { message: 'Message contains invalid HTML (script tags not allowed)' }
      )
      .refine(
        (content) =>
          !/\b(onerror|onclick|onload|onmouseover|onfocus|onblur|oninput|onchange|onsubmit)\s*=/gi.test(
            content
          ),
        {
          message: 'Message contains invalid HTML (event handlers not allowed)',
        }
      )
      .refine((content) => !/javascript:/gi.test(content), {
        message:
          'Message contains invalid content (javascript: URLs not allowed)',
      }),
  })
  .refine(
    (data) => {
      // If context_type is 'agency_inquiry', context_id is required
      if (data.context_type === 'agency_inquiry') {
        return data.context_id !== null && data.context_id !== undefined;
      }
      return true;
    },
    {
      message: 'Context ID is required when context type is "agency_inquiry"',
      path: ['context_id'],
    }
  );

export type CreateConversationData = z.infer<typeof createConversationSchema>;

/**
 * Schema for sending a message in an existing conversation
 *
 * Request body:
 * - content: Message text (1-10,000 chars, no <script> tags)
 *
 * Example:
 * {
 *   "content": "Thank you for the information!"
 * }
 */
export const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(
      MESSAGE_MIN_LENGTH,
      `Message must be at least ${MESSAGE_MIN_LENGTH} character`
    )
    .max(
      MESSAGE_MAX_LENGTH,
      `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`
    )
    .refine(
      (content) => !/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content),
      { message: 'Message contains invalid HTML (script tags not allowed)' }
    )
    .refine(
      (content) =>
        !/\b(onerror|onclick|onload|onmouseover|onfocus|onblur|oninput|onchange|onsubmit)\s*=/gi.test(
          content
        ),
      { message: 'Message contains invalid HTML (event handlers not allowed)' }
    )
    .refine((content) => !/javascript:/gi.test(content), {
      message:
        'Message contains invalid content (javascript: URLs not allowed)',
    }),
});

export type SendMessageData = z.infer<typeof sendMessageSchema>;

/**
 * Schema for editing an existing message
 *
 * Request body:
 * - content: Updated message text (1-10,000 chars, no <script> tags)
 *
 * Example:
 * {
 *   "content": "Thank you for the information! (edited)"
 * }
 */
export const editMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(
      MESSAGE_MIN_LENGTH,
      `Message must be at least ${MESSAGE_MIN_LENGTH} character`
    )
    .max(
      MESSAGE_MAX_LENGTH,
      `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`
    )
    .refine(
      (content) => !/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content),
      { message: 'Message contains invalid HTML (script tags not allowed)' }
    )
    .refine(
      (content) =>
        !/\b(onerror|onclick|onload|onmouseover|onfocus|onblur|oninput|onchange|onsubmit)\s*=/gi.test(
          content
        ),
      { message: 'Message contains invalid HTML (event handlers not allowed)' }
    )
    .refine((content) => !/javascript:/gi.test(content), {
      message:
        'Message contains invalid content (javascript: URLs not allowed)',
    }),
});

export type EditMessageData = z.infer<typeof editMessageSchema>;

/**
 * Schema for marking conversation as read
 *
 * Request body: (empty or no body required)
 * PUT /api/messages/conversations/[id]/read
 */
export const markConversationReadSchema = z.object({});

export type MarkConversationReadData = z.infer<
  typeof markConversationReadSchema
>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Truncate message content for preview display
 * @param content - Full message content
 * @param maxLength - Maximum length for preview (default 200)
 * @returns Truncated message with ellipsis if needed
 */
export function truncateMessage(
  content: string,
  maxLength: number = MESSAGE_PREVIEW_LENGTH
): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Validate message content length
 * @param content - Message content to validate
 * @returns true if valid, false otherwise
 */
export function isValidMessageLength(content: string): boolean {
  const length = content.trim().length;
  return length >= MESSAGE_MIN_LENGTH && length <= MESSAGE_MAX_LENGTH;
}
