/**
 * Email template for new message notifications
 *
 * Sent when a user receives a new message in a conversation.
 * Includes sender information, message preview, and direct link to conversation.
 */

import { escapeHtml } from './utils';

interface NewMessageNotificationParams {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderCompany?: string;
  messagePreview: string;
  conversationId: string;
  siteUrl: string;
  messageCount?: number; // For batching: "3 new messages"
}

/**
 * Generates HTML version of new message notification email
 */
export function generateNewMessageHTML(
  params: NewMessageNotificationParams
): string {
  const {
    recipientName,
    senderName,
    senderCompany,
    messagePreview,
    conversationId,
    siteUrl,
    messageCount = 1,
  } = params;

  // Sanitize message preview and truncate to 200 chars
  const sanitizedPreview = escapeHtml(messagePreview.substring(0, 200).trim());
  const truncatedPreview =
    messagePreview.length > 200 ? `${sanitizedPreview}...` : sanitizedPreview;

  const escapedSenderName = escapeHtml(senderName);
  const escapedSenderCompany = senderCompany ? escapeHtml(senderCompany) : null;

  const messageText =
    messageCount > 1
      ? `${messageCount} new messages from ${escapedSenderName}`
      : `New message from ${escapedSenderName}`;

  const senderInfo = escapedSenderCompany
    ? `${escapedSenderName} (${escapedSenderCompany})`
    : escapedSenderName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">FindConstructionStaffing</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">${messageText}</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                You have ${messageCount > 1 ? `${messageCount} new messages` : 'a new message'} from <strong>${senderInfo}</strong>.
              </p>

              <!-- Message Preview Box -->
              ${
                messageCount === 1
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #2563eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #4b5563; font-style: italic;">
                      "${truncatedPreview}"
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${siteUrl}/messages/conversations/${conversationId}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">View ${messageCount > 1 ? 'Messages' : 'Message'}</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #6b7280;">
                You can reply directly from your inbox at <a href="${siteUrl}/messages" style="color: #2563eb; text-decoration: none;">FindConstructionStaffing.com/messages</a>.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">
                Thank you,<br>
                The FindConstructionStaffing Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                <a href="${siteUrl}/settings/notifications" style="color: #2563eb; text-decoration: none;">Manage notification preferences</a> |
                <a href="${siteUrl}/settings/notifications/unsubscribe" style="color: #2563eb; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <a href="${siteUrl}" style="color: #2563eb; text-decoration: none;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of new message notification email
 */
export function generateNewMessageText(
  params: NewMessageNotificationParams
): string {
  const {
    recipientName,
    senderName,
    senderCompany,
    messagePreview,
    conversationId,
    siteUrl,
    messageCount = 1,
  } = params;

  // Truncate message preview to 200 chars
  const truncatedPreview =
    messagePreview.length > 200
      ? `${messagePreview.substring(0, 200).trim()}...`
      : messagePreview.trim();

  const messageText =
    messageCount > 1
      ? `${messageCount} new messages from ${senderName}`
      : `New message from ${senderName}`;

  const senderInfo = senderCompany
    ? `${senderName} (${senderCompany})`
    : senderName;

  return `
FINDCONSTRUCTIONSTAFFING
${messageText}

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

You have ${messageCount > 1 ? `${messageCount} new messages` : 'a new message'} from ${senderInfo}.

${messageCount === 1 ? `MESSAGE PREVIEW\n--------------\n"${truncatedPreview}"\n` : ''}
View ${messageCount > 1 ? 'messages' : 'message'}: ${siteUrl}/messages/conversations/${conversationId}

You can reply directly from your inbox at ${siteUrl}/messages.

Thank you,
The FindConstructionStaffing Team

---
Manage notification preferences: ${siteUrl}/settings/notifications
Unsubscribe: ${siteUrl}/settings/notifications/unsubscribe

© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
