/**
 * Email template for claim request approval
 *
 * Sent when an admin approves a claim request.
 * Includes congratulations message, agency details, and link to dashboard.
 */

interface ClaimApprovedEmailParams {
  recipientEmail: string;
  recipientName?: string;
  agencyName: string;
  agencySlug: string;
  siteUrl: string;
}

/**
 * Builds a complete HTML document for a claim-approved email notifying a recipient that they have management access to an agency.
 *
 * @param params - Input values used to populate the template:
 *   - recipientEmail: recipient's email address (included for context)
 *   - recipientName: optional recipient name used in the greeting
 *   - agencyName: display name of the approved agency
 *   - agencySlug: agency identifier used to construct the dashboard URL
 *   - siteUrl: base site URL used to construct links
 * @returns The full HTML email as a string ready for sending.
 */
export function generateClaimApprovedHTML(
  params: ClaimApprovedEmailParams
): string {
  const { recipientEmail, recipientName, agencyName, agencySlug, siteUrl } =
    params;

  const dashboardUrl = `${siteUrl}/dashboard/agency/${agencySlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim Approved - ${agencyName}</title>
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

          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; text-align: center; line-height: 64px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                  <path d="M9 11L12 14L22 4" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827; text-align: center;">Congratulations! Your Claim Has Been Approved</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Great news! Your claim request for <strong>${agencyName}</strong> has been approved. You now have full management access to this agency profile.
              </p>

              <!-- Agency Details Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="font-size: 14px; color: #166534;">Agency</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <span style="font-size: 16px; color: #111827; font-weight: 600;">${agencyName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="font-size: 14px; color: #166534;">Your Role</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display: inline-block; padding: 4px 12px; background-color: #bbf7d0; color: #166534; border-radius: 9999px; font-size: 14px; font-weight: 500;">Agency Owner</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What You Can Do -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What You Can Do Now</h3>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Update your agency profile and contact information</li>
                <li>Add or modify services your agency offers</li>
                <li>Manage your agency's service areas and specialties</li>
                <li>Upload your agency logo and images</li>
                <li>Respond to inquiries from potential clients</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Get Started</a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Next Steps</h3>

              <ol style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Visit your agency dashboard using the button above</li>
                <li>Review and update your profile information</li>
                <li>Add detailed service descriptions</li>
                <li>Start connecting with potential clients</li>
              </ol>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none;">support@findconstructionstaffing.com</a>.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">
                Welcome aboard,<br>
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
 * Generate the plain-text body for a claim approval email.
 *
 * @param params - Parameters including `recipientEmail`, optional `recipientName`, `agencyName`, `agencySlug`, and `siteUrl`.
 * @returns The formatted plain-text email content.
 */
export function generateClaimApprovedText(
  params: ClaimApprovedEmailParams
): string {
  const { recipientEmail, recipientName, agencyName, agencySlug, siteUrl } =
    params;

  const dashboardUrl = `${siteUrl}/dashboard/agency/${agencySlug}`;

  return `
FINDCONSTRUCTIONSTAFFING
Congratulations! Your Claim Has Been Approved

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

Great news! Your claim request for ${agencyName} has been approved. You now have full management access to this agency profile.

AGENCY DETAILS
---------------
Agency: ${agencyName}
Your Role: Agency Owner

WHAT YOU CAN DO NOW
--------------------
* Update your agency profile and contact information
* Add or modify services your agency offers
* Manage your agency's service areas and specialties
* Upload your agency logo and images
* Respond to inquiries from potential clients

Get Started: ${dashboardUrl}

NEXT STEPS
-----------
1. Visit your agency dashboard using the link above
2. Review and update your profile information
3. Add detailed service descriptions
4. Start connecting with potential clients

If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team at support@findconstructionstaffing.com.

Welcome aboard,
The FindConstructionStaffing Team

---
© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
