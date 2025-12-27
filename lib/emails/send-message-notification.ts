/**
 * Message Notification Email Sender
 *
 * Utility function to send email notifications when a user receives a new message.
 * Supports batching multiple messages from the same sender.
 */

import { Resend } from 'resend';
import {
  generateNewMessageHTML,
  generateNewMessageText,
} from './new-message-notification';

interface SendMessageNotificationParams {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderCompany?: string;
  messagePreview: string;
  conversationId: string;
  messageCount?: number; // For batching: number of messages in batch
}

interface MessageNotificationResult {
  sent: boolean;
  reason?: string;
  error?: unknown;
}

/**
 * Send message notification email via Resend
 *
 * This function:
 * 1. Checks RESEND_API_KEY is configured
 * 2. Generates HTML and text email templates
 * 3. Sends email via Resend
 * 4. Handles errors gracefully without throwing
 * 5. Logs success/failure for debugging
 *
 * @param params - Email parameters including recipient, sender, and message details
 * @returns Result object with sent status and optional reason/error
 *
 * @example
 * ```typescript
 * const result = await sendMessageNotificationEmail({
 *   recipientEmail: 'user@example.com',
 *   recipientName: 'John Doe',
 *   senderName: 'Jane Smith',
 *   senderCompany: 'Acme Staffing',
 *   messagePreview: 'Hello, I need workers for...',
 *   conversationId: 'conv-123',
 * });
 *
 * if (result.sent) {
 *   console.log('Email sent successfully');
 * }
 * ```
 */
export async function sendMessageNotificationEmail(
  params: SendMessageNotificationParams
): Promise<MessageNotificationResult> {
  try {
    // ========================================================================
    // 1. CHECK RESEND API KEY
    // ========================================================================
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - skipping message notification');
      return { sent: false, reason: 'resend_api_key_missing' };
    }

    // ========================================================================
    // 2. GET SITE URL
    // ========================================================================
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // ========================================================================
    // 3. GENERATE EMAIL TEMPLATES
    // ========================================================================
    const emailParams = {
      ...params,
      siteUrl,
    };

    const emailHtml = generateNewMessageHTML(emailParams);
    const emailText = generateNewMessageText(emailParams);

    // ========================================================================
    // 4. SEND EMAIL VIA RESEND
    // ========================================================================
    const resend = new Resend(resendApiKey);

    const messageCount = params.messageCount || 1;
    const subject =
      messageCount > 1
        ? `${messageCount} new messages from ${params.senderName}`
        : `New message from ${params.senderName}`;

    await resend.emails.send({
      from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
      to: params.recipientEmail,
      subject,
      html: emailHtml,
      text: emailText,
    });

    console.log(
      `Message notification email sent to ${params.recipientEmail} from ${params.senderName} (conversation: ${params.conversationId})`
    );

    return { sent: true };
  } catch (error) {
    // Catch any unexpected errors (network issues, Resend API errors, etc.)
    // Don't throw - email sending should never break the main message send flow
    console.error('Error in sendMessageNotificationEmail:', error);
    return { sent: false, reason: 'unexpected_error', error };
  }
}
