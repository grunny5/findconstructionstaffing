/**
 * XSS Sanitization Utilities
 *
 * Provides functions to sanitize user-generated content and prevent XSS attacks.
 *
 * Security Strategy:
 * 1. Validation layer (Zod schemas) rejects malicious content before storage
 * 2. Sanitization layer (this file) strips HTML for safe display
 * 3. Client rendering uses Markdown for formatting (optional)
 *
 * All user messages are stored as plain text only.
 */

/**
 * Strip all HTML tags from a string
 *
 * This function removes ALL HTML tags, leaving only plain text.
 * Used for:
 * - Displaying user content safely
 * - Preventing HTML injection
 * - Creating plain-text previews
 *
 * @param content - User-submitted content that may contain HTML
 * @returns Plain text with all HTML tags removed
 *
 * @example
 * ```ts
 * stripHtmlTags('Hello <b>World</b>!')
 * // Returns: 'Hello World!'
 *
 * stripHtmlTags('<script>alert("XSS")</script>Safe text')
 * // Returns: 'alert("XSS")Safe text'
 * ```
 */
export function stripHtmlTags(content: string): string {
  if (!content) return '';

  // Remove all HTML tags using regex
  // Matches: <any-tag ...>content</any-tag> or <self-closing />
  return content
    .replace(/<[^>]*>/g, '') // Remove all tags
    .replace(/&lt;/g, '<') // Decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

/**
 * Check if content contains dangerous XSS patterns
 *
 * Detects common XSS attack vectors:
 * - <script> tags
 * - Event handlers (onclick, onerror, etc.)
 * - javascript: URLs
 *
 * Note: This is a secondary check. Primary protection is in Zod validation schemas.
 *
 * @param content - Content to check for XSS
 * @returns true if dangerous patterns detected, false otherwise
 *
 * @example
 * ```ts
 * containsXSS('<script>alert(1)</script>')
 * // Returns: true
 *
 * containsXSS('Hello world')
 * // Returns: false
 * ```
 */
export function containsXSS(content: string): boolean {
  if (!content) return false;

  // Check for <script> tags (case-insensitive)
  if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
    return true;
  }

  // Check for event handlers (onclick, onerror, onload, etc.)
  if (
    /\b(onerror|onclick|onload|onmouseover|onfocus|onblur|oninput|onchange|onsubmit)\s*=/gi.test(
      content
    )
  ) {
    return true;
  }

  // Check for javascript: URLs
  if (/javascript:/gi.test(content)) {
    return true;
  }

  return false;
}

/**
 * Sanitize message content for safe display
 *
 * This is the main sanitization function that:
 * 1. Strips all HTML tags
 * 2. Validates no XSS patterns remain
 * 3. Returns plain text safe for display
 *
 * Use this before displaying user-generated content in the UI.
 *
 * @param content - Raw message content from database
 * @returns Sanitized plain text safe for display
 *
 * @example
 * ```ts
 * // In a React component:
 * function MessageBubble({ message }: { message: Message }) {
 *   const safeContent = sanitizeMessageContent(message.content);
 *   return <div>{safeContent}</div>;
 * }
 * ```
 */
export function sanitizeMessageContent(content: string): string {
  if (!content) return '';

  // Step 1: Strip all HTML tags
  let sanitized = stripHtmlTags(content);

  // Step 2: Verify no XSS patterns remain (defense in depth)
  if (containsXSS(sanitized)) {
    console.warn('XSS detected after sanitization:', sanitized);
    // If XSS still present, return empty string for safety
    return '';
  }

  // Step 3: Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Truncate and sanitize message for preview display
 *
 * Creates a safe, shortened version of a message for:
 * - Conversation list previews
 * - Notification text
 * - Search results
 *
 * @param content - Full message content
 * @param maxLength - Maximum length for preview (default 200)
 * @returns Sanitized and truncated message with ellipsis if needed
 *
 * @example
 * ```ts
 * const preview = sanitizeMessagePreview(longMessage, 100);
 * // Returns: "First 100 characters of sanitized message..."
 * ```
 */
export function sanitizeMessagePreview(
  content: string,
  maxLength: number = 200
): string {
  // First sanitize the content
  const sanitized = sanitizeMessageContent(content);

  // Then truncate if needed
  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return sanitized.substring(0, maxLength).trim() + '...';
}

/**
 * Validate that content is safe for storage
 *
 * Checks if content passes basic safety requirements before database storage.
 * This is a helper for additional validation beyond Zod schemas.
 *
 * @param content - Content to validate
 * @param minLength - Minimum allowed length (default 1)
 * @param maxLength - Maximum allowed length (default 10000)
 * @returns Object with isValid flag and optional error message
 *
 * @example
 * ```ts
 * const validation = validateMessageContent(userInput);
 * if (!validation.isValid) {
 *   return { error: validation.error };
 * }
 * // Proceed with storage
 * ```
 */
export function validateMessageContent(
  content: string,
  minLength: number = 1,
  maxLength: number = 10000
): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  const trimmed = content.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `Message must be at least ${minLength} character(s)`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Message must not exceed ${maxLength} characters`,
    };
  }

  if (containsXSS(content)) {
    return {
      isValid: false,
      error: 'Message contains invalid HTML or scripts',
    };
  }

  return { isValid: true };
}
