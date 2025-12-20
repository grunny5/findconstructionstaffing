/**
 * Email template for claim request rejection
 *
 * Sent when an admin rejects a claim request.
 * Includes rejection reason, resubmit instructions, and support contact.
 */

/**
 * Escapes HTML special characters to prevent HTML injection.
 *
 * @param unsafe - The string to escape
 * @returns The escaped string safe for HTML insertion
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ClaimRejectedEmailParams {
  recipientEmail: string;
  recipientName?: string;
  agencyName: string;
  agencySlug: string;
  rejectionReason: string;
  siteUrl: string;
}

/**
 * Create an HTML email body notifying a recipient that their claim request was denied.
 *
 * @param params - Parameters for the email:
 *   - recipientEmail: recipient's email address
 *   - recipientName: optional recipient name used in the greeting
 *   - agencyName: name of the agency being claimed
 *   - agencySlug: agency path segment used to build the resubmission URL
 *   - rejectionReason: reason shown in the denial section
 *   - siteUrl: base site URL used for links
 * @returns The complete HTML string for the claim rejection email, including a reason block, guidance for resubmission, a "Resubmit Claim Request" link (siteUrl/claim/{agencySlug}), support contact, and footer.
 */
export function generateClaimRejectedHTML(
  params: ClaimRejectedEmailParams
): string {
  const {
    recipientEmail,
    recipientName,
    agencyName,
    agencySlug,
    rejectionReason,
    siteUrl,
  } = params;

  const safeAgencyName = escapeHtml(agencyName);
  const safeRecipientName = recipientName
    ? escapeHtml(recipientName)
    : undefined;
  const safeRejectionReason = escapeHtml(rejectionReason);
  const resubmitUrl = `${siteUrl}/claim/${agencySlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Request Update - ${safeAgencyName}</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Claim Request Update</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Thank you for your interest in claiming <strong>${safeAgencyName}</strong> on FindConstructionStaffing. After reviewing your request, we are unable to approve it at this time.
              </p>

              <!-- Rejection Reason Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #991b1b;">Reason for Denial</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #7f1d1d; white-space: pre-wrap;">${safeRejectionReason}</p>
                  </td>
                </tr>
              </table>

              <!-- What You Can Do -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What You Can Do</h3>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                If you believe this decision was made in error or if you can provide additional verification, you may resubmit your claim with updated information.
              </p>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Review the reason for denial above</li>
                <li>Gather any additional verification documents</li>
                <li>Submit a new claim request with updated information</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${resubmitUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Resubmit Claim Request</a>
                  </td>
                </tr>
              </table>

              <!-- Need Help Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #eff6ff; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1e40af;">Need Help?</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #1e3a8a;">
                      If you have questions about this decision or need assistance with the verification process, our support team is here to help. Contact us at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@findconstructionstaffing.com</a>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                We appreciate your understanding and look forward to potentially working with you in the future.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">
                Best regards,<br>
                The FindConstructionStaffing Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
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
 * Generate a plain-text email notifying a user that their claim request was rejected.
 *
 * @returns A plain-text email body containing a greeting, the reason for denial, guidance on how to resubmit (including a resubmit URL), support contact information, and a footer with the current year and site URL.
 */
export function generateClaimRejectedText(
  params: ClaimRejectedEmailParams
): string {
  const {
    recipientEmail,
    recipientName,
    agencyName,
    agencySlug,
    rejectionReason,
    siteUrl,
  } = params;

  const safeAgencyName = escapeHtml(agencyName);
  const safeRecipientName = recipientName
    ? escapeHtml(recipientName)
    : undefined;
  const safeRejectionReason = escapeHtml(rejectionReason);
  const resubmitUrl = `${siteUrl}/claim/${agencySlug}`;

  return `
FINDCONSTRUCTIONSTAFFING
Claim Request Update

${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}

Thank you for your interest in claiming ${safeAgencyName} on FindConstructionStaffing. After reviewing your request, we are unable to approve it at this time.

REASON FOR DENIAL
------------------
${safeRejectionReason}

WHAT YOU CAN DO
----------------
If you believe this decision was made in error or if you can provide additional verification, you may resubmit your claim with updated information.

* Review the reason for denial above
* Gather any additional verification documents
* Submit a new claim request with updated information

Resubmit your claim: ${resubmitUrl}

NEED HELP?
-----------
If you have questions about this decision or need assistance with the verification process, our support team is here to help. Contact us at support@findconstructionstaffing.com.

We appreciate your understanding and look forward to potentially working with you in the future.

Best regards,
The FindConstructionStaffing Team

---
© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
