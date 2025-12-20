/**
 * Email template for claim request rejection
 *
 * Sent when an admin rejects a claim request.
 * Includes rejection reason, resubmit instructions, and support contact.
 */

interface ClaimRejectedEmailParams {
  recipientEmail: string;
  recipientName?: string;
  agencyName: string;
  agencySlug: string;
  rejectionReason: string;
  siteUrl: string;
}

/**
 * Generates HTML version of claim rejection email
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

  const resubmitUrl = `${siteUrl}/claim/${agencySlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Request Update - ${agencyName}</title>
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
                ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Thank you for your interest in claiming <strong>${agencyName}</strong> on FindConstructionStaffing. After reviewing your request, we are unable to approve it at this time.
              </p>

              <!-- Rejection Reason Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #991b1b;">Reason for Denial</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #7f1d1d; white-space: pre-wrap;">${rejectionReason}</p>
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
 * Generates plain text version of claim rejection email
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

  const resubmitUrl = `${siteUrl}/claim/${agencySlug}`;

  return `
FINDCONSTRUCTIONSTAFFING
Claim Request Update

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

Thank you for your interest in claiming ${agencyName} on FindConstructionStaffing. After reviewing your request, we are unable to approve it at this time.

REASON FOR DENIAL
------------------
${rejectionReason}

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
