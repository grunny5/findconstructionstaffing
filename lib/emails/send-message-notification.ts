/**
 * Message Notification Email Sender
 *
 * Utility function to send email notifications when a user receives a new message.
 * Supports batching multiple messages from the same sender.
 */

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import {
  generateNewMessageHTML,
  generateNewMessageText,
} from './new-message-notification';

interface SendMessageNotificationParams {
  recipientId: string; // User ID to check preferences
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
 * 1. Checks recipient's notification preferences (email_enabled, email_daily_digest_enabled)
 * 2. Checks RESEND_API_KEY is configured
 * 3. Generates HTML and text email templates
 * 4. Sends email via Resend
 * 5. Handles errors gracefully without throwing
 * 6. Logs success/failure for debugging
 *
 * @param params - Email parameters including recipient, sender, and message details
 * @returns Result object with sent status and optional reason/error
 *
 * @example
 * ```typescript
 * const result = await sendMessageNotificationEmail({
 *   recipientId: 'user-123',
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
    // 1. CHECK NOTIFICATION PREFERENCES
    // ========================================================================
    const supabase = await createClient();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_enabled, email_batch_enabled, email_daily_digest_enabled')
      .eq('user_id', params.recipientId)
      .single();

    // If preferences exist and email is disabled, don't send
    if (preferences && !preferences.email_enabled) {
      console.log(
        `Email notifications disabled for user ${params.recipientId} - skipping message notification`
      );
      return { sent: false, reason: 'email_notifications_disabled' };
    }

    // If preferences exist and daily digest is enabled, don't send real-time notification
    if (preferences && preferences.email_daily_digest_enabled) {
      console.log(
        `Daily digest enabled for user ${params.recipientId} - skipping real-time notification`
      );
      return { sent: false, reason: 'daily_digest_enabled' };
    }

    // Note: Batch mode logic would be implemented here in a real batching system
    // For now, we send immediately if batch mode is disabled or preferences don't exist

    // ========================================================================
    // 2. CHECK RESEND API KEY
    // ========================================================================
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn(
        'RESEND_API_KEY not configured - skipping message notification'
      );
      return { sent: false, reason: 'resend_api_key_missing' };
    }

    // ========================================================================
    // 3. GET SITE URL
    // ========================================================================
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // ========================================================================
    // 4. GENERATE EMAIL TEMPLATES
    // ========================================================================
    const emailParams = {
      ...params,
      siteUrl,
    };

    const emailHtml = generateNewMessageHTML(emailParams);
    const emailText = generateNewMessageText(emailParams);

    // ========================================================================
    // 5. SEND EMAIL VIA RESEND
    // ========================================================================
    const resend = new Resend(resendApiKey);

    // Get configurable sender email (allows different emails for staging/production)
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      'FindConstructionStaffing <noreply@findconstructionstaffing.com>';

    const messageCount = params.messageCount || 1;
    const subject =
      messageCount > 1
        ? `${messageCount} new messages from ${params.senderName}`
        : `New message from ${params.senderName}`;

    await resend.emails.send({
      from: fromEmail,
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
