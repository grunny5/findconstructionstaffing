/**
 * Email template for profile completion milestone
 *
 * Sent when an agency profile reaches 100% completion for the first time.
 * Includes congratulations message, list of unlocked benefits, and link to public profile.
 */

import { escapeHtml } from './utils';

interface ProfileCompleteEmailParams {
  recipientEmail: string;
  recipientName?: string;
  agencyName: string;
  agencySlug: string;
  siteUrl: string;
}

/**
 * Builds a complete HTML document for a profile completion email celebrating 100% completion.
 *
 * @param params - Input values used to populate the template:
 *   - recipientEmail: recipient's email address (included for context)
 *   - recipientName: optional recipient name used in the greeting
 *   - agencyName: display name of the agency
 *   - agencySlug: agency identifier used to construct the profile URL
 *   - siteUrl: base site URL used to construct links
 * @returns The full HTML email as a string ready for sending.
 */
export function generateProfileCompleteHTML(
  params: ProfileCompleteEmailParams
): string {
  const { recipientName, agencyName, agencySlug, siteUrl } = params;

  const safeAgencyName = escapeHtml(agencyName);
  const safeRecipientName = recipientName
    ? escapeHtml(recipientName)
    : undefined;
  const profileUrl = `${siteUrl}/recruiters/${agencySlug}`;
  const dashboardUrl = `${siteUrl}/dashboard/agency/${agencySlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile Complete - ${safeAgencyName}</title>
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

          <!-- Success Icon with Confetti -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 50%; text-align: center; line-height: 64px; box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827; text-align: center;">🎉 Congratulations! Your Profile is Complete!</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Fantastic work! Your profile for <strong>${safeAgencyName}</strong> has reached 100% completion. You've unlocked premium features that will help you stand out and attract more qualified candidates.
              </p>

              <!-- Benefits Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border: 2px solid #fbbf24; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #78350f;">✨ You've Unlocked:</h3>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #fbbf24; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px; vertical-align: middle;">⭐</span>
                          <span style="font-size: 15px; color: #78350f; font-weight: 500; vertical-align: middle;">Featured Agency Badge</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #fbbf24; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px; vertical-align: middle;">🔝</span>
                          <span style="font-size: 15px; color: #78350f; font-weight: 500; vertical-align: middle;">Priority Search Placement</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #fbbf24; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px; vertical-align: middle;">✓</span>
                          <span style="font-size: 15px; color: #78350f; font-weight: 500; vertical-align: middle;">Verified Profile Status</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #fbbf24; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 12px; vertical-align: middle;">👁️</span>
                          <span style="font-size: 15px; color: #78350f; font-weight: 500; vertical-align: middle;">Maximum Visibility to Job Seekers</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What This Means -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What This Means for You</h3>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Your complete profile now appears at the <strong>top of search results</strong>, giving you maximum exposure to construction professionals actively looking for staffing opportunities. The Featured Agency badge signals to candidates that you're a serious, professional employer they can trust.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${profileUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.3);">View Your Profile</a>
                  </td>
                </tr>
              </table>

              <!-- Keep Your Profile Fresh -->
              <h3 style="margin: 24px 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Keep Your Profile Fresh</h3>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                To maintain your competitive edge, regularly update your profile with:
              </p>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>New service offerings and specializations</li>
                <li>Updated contact information and availability</li>
                <li>Recent project successes and testimonials</li>
                <li>Changes to your service areas</li>
              </ul>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #059669; text-decoration: none; border-radius: 6px; border: 2px solid #059669; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Need help maximizing your profile's impact? Our support team is here to assist at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none;">support@findconstructionstaffing.com</a>.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">
                Thank you for being a valued partner,<br>
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
 * Generate the plain-text body for a profile completion email.
 *
 * @param params - Parameters including `recipientEmail`, optional `recipientName`, `agencyName`, `agencySlug`, and `siteUrl`.
 * @returns The formatted plain-text email content.
 */
export function generateProfileCompleteText(
  params: ProfileCompleteEmailParams
): string {
  const { recipientName, agencyName, agencySlug, siteUrl } = params;

  const profileUrl = `${siteUrl}/recruiters/${agencySlug}`;
  const dashboardUrl = `${siteUrl}/dashboard/agency/${agencySlug}`;

  return `
FINDCONSTRUCTIONSTAFFING
🎉 Congratulations! Your Profile is Complete!

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

Fantastic work! Your profile for ${agencyName} has reached 100% completion. You've unlocked premium features that will help you stand out and attract more qualified candidates.

✨ YOU'VE UNLOCKED:
--------------------
⭐ Featured Agency Badge
🔝 Priority Search Placement
✓ Verified Profile Status
👁️ Maximum Visibility to Job Seekers

WHAT THIS MEANS FOR YOU
-----------------------
Your complete profile now appears at the TOP OF SEARCH RESULTS, giving you maximum exposure to construction professionals actively looking for staffing opportunities. The Featured Agency badge signals to candidates that you're a serious, professional employer they can trust.

View Your Profile: ${profileUrl}

KEEP YOUR PROFILE FRESH
-----------------------
To maintain your competitive edge, regularly update your profile with:

* New service offerings and specializations
* Updated contact information and availability
* Recent project successes and testimonials
* Changes to your service areas

Go to Dashboard: ${dashboardUrl}

Need help maximizing your profile's impact? Our support team is here to assist at support@findconstructionstaffing.com.

Thank you for being a valued partner,
The FindConstructionStaffing Team

---
© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
