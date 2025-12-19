/**
 * Email template for claim request confirmation
 *
 * Sent immediately after a user submits a claim request for an agency profile.
 * Includes claim ID for tracking and expected review timeline.
 */

interface ClaimConfirmationEmailParams {
  recipientEmail: string;
  recipientName?: string;
  agencyName: string;
  claimId: string;
  siteUrl: string;
}

/**
 * Generates HTML version of claim confirmation email
 */
export function generateClaimConfirmationHTML(
  params: ClaimConfirmationEmailParams
): string {
  const { recipientName, agencyName, claimId, siteUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Request Submitted</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Claim Request Submitted</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Your claim request for <strong>${agencyName}</strong> has been successfully submitted. We'll review your request and get back to you within <strong>2 business days</strong>.
              </p>

              <!-- Claim Details Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="font-size: 14px; color: #6b7280;">Claim ID</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <code style="font-family: 'Courier New', monospace; font-size: 14px; color: #111827; background-color: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${claimId}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="font-size: 14px; color: #6b7280;">Status</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 14px; font-weight: 500;">Pending Review</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What Happens Next -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What Happens Next?</h3>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Our team will verify your information</li>
                <li>You'll receive an email with our decision</li>
                <li>If approved, you'll be able to manage the agency profile</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${siteUrl}/settings/claims" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">View Claim Status</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                If you have any questions, please don't hesitate to reach out to our support team at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none;">support@findconstructionstaffing.com</a>.
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
 * Generates plain text version of claim confirmation email
 */
export function generateClaimConfirmationText(
  params: ClaimConfirmationEmailParams
): string {
  const { recipientName, agencyName, claimId, siteUrl } = params;

  return `
FINDCONSTRUCTIONSTAFFING
Claim Request Submitted

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

Your claim request for ${agencyName} has been successfully submitted. We'll review your request and get back to you within 2 business days.

CLAIM DETAILS
--------------
Claim ID: ${claimId}
Status: Pending Review

WHAT HAPPENS NEXT?
-------------------
* Our team will verify your information
* You'll receive an email with our decision
* If approved, you'll be able to manage the agency profile

View your claim status: ${siteUrl}/settings/claims

If you have any questions, please don't hesitate to reach out to our support team at support@findconstructionstaffing.com.

Thank you,
The FindConstructionStaffing Team

---
© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
