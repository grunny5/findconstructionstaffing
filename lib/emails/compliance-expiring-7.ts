/**
 * Email template for 7-day compliance expiration reminder
 *
 * Sent to agency owners when their compliance certifications are expiring in 7 days.
 * Uses urgent styling to emphasize the approaching deadline.
 */

import { escapeHtml, validateSiteUrl } from './utils';
import {
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  type ComplianceType,
} from '@/types/api';

interface ComplianceExpiringItem {
  complianceType: ComplianceType;
  expirationDate: string; // ISO date string
}

interface ComplianceExpiring7EmailParams {
  recipientName?: string;
  agencyName: string;
  expiringItems: ComplianceExpiringItem[];
  siteUrl: string;
}

/**
 * Format date as "Month DD, YYYY" (e.g., "January 15, 2026")
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create an HTML email body notifying agency owner of compliance items expiring in 7 days
 */
export function generateComplianceExpiring7HTML(
  params: ComplianceExpiring7EmailParams
): string {
  const { recipientName, agencyName, expiringItems, siteUrl } = params;

  const safeAgencyName = escapeHtml(agencyName);
  const safeRecipientName = recipientName
    ? escapeHtml(recipientName)
    : undefined;
  const safeSiteUrl = validateSiteUrl(siteUrl);
  const dashboardUrl = `${safeSiteUrl}/dashboard/compliance`;

  // Build list of expiring items
  const itemsList = expiringItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fecaca;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">
          ${escapeHtml(COMPLIANCE_DISPLAY_NAMES[item.complianceType])}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
          ${escapeHtml(COMPLIANCE_DESCRIPTIONS[item.complianceType])}
        </p>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fecaca; text-align: right;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #dc2626;">
          ${escapeHtml(formatDate(item.expirationDate))}
        </p>
      </td>
    </tr>
  `
    )
    .join('');

  const itemCount = expiringItems.length;
  const itemWord = itemCount === 1 ? 'certification' : 'certifications';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URGENT: Compliance Expiring in 7 Days - ${safeAgencyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <!-- Header with Urgent Badge -->
          <tr>
            <td align="center" style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; margin-bottom: 16px;">🚨 Urgent</div>
              <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: 700; color: #1f2937;">FindConstructionStaffing</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #dc2626;">Action Required: ${itemCount} ${itemWord} Expiring in 7 Days</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                <strong style="color: #dc2626;">This is an urgent reminder</strong> that ${itemCount === 1 ? 'a compliance certification' : 'compliance certifications'} for <strong>${safeAgencyName}</strong> will expire in approximately 7 days.
              </p>

              <!-- Expiring Items Table -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #dc2626; text-transform: uppercase;">🔴 Expiring in 7 Days</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${itemsList}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgent Action Items -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Immediate Action Required</h3>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li><strong>Urgent:</strong> Upload renewed documentation immediately</li>
                <li>If renewal is pending, contact your certification provider</li>
                <li>Update your compliance status in your dashboard today</li>
                <li>Your agency profile may be affected if certifications expire</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Update Now</a>
                  </td>
                </tr>
              </table>

              <!-- Warning Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; margin-bottom: 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991b1b;">⚠️ Important Notice</p>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #7f1d1d;">
                      Expired compliance certifications may affect your agency's visibility in search results and contractor confidence. Please update your documentation as soon as possible to maintain your agency's standing.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                You're receiving this email because you manage <strong>${safeAgencyName}</strong> on FindConstructionStaffing.
              </p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Need help? Contact us at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none;">support@findconstructionstaffing.com</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                <a href="${safeSiteUrl}" style="color: #2563eb; text-decoration: none;">FindConstructionStaffing</a>
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
 * Create a plain text email body for 7-day compliance expiration reminder
 */
export function generateComplianceExpiring7Text(
  params: ComplianceExpiring7EmailParams
): string {
  const { recipientName, agencyName, expiringItems, siteUrl } = params;

  const safeSiteUrl = validateSiteUrl(siteUrl);
  const dashboardUrl = `${safeSiteUrl}/dashboard/compliance`;
  const itemCount = expiringItems.length;
  const itemWord = itemCount === 1 ? 'certification' : 'certifications';

  // Build list of expiring items
  const itemsList = expiringItems
    .map(
      (item) =>
        `- ${COMPLIANCE_DISPLAY_NAMES[item.complianceType]}: Expires ${formatDate(item.expirationDate)}`
    )
    .join('\n');

  return `
🚨 URGENT - FindConstructionStaffing Compliance Reminder

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

***ACTION REQUIRED***

This is an urgent reminder that ${itemCount === 1 ? 'a compliance certification' : 'compliance certifications'} for ${agencyName} will expire in approximately 7 days.

EXPIRING IN 7 DAYS
${itemsList}

IMMEDIATE ACTION REQUIRED

- URGENT: Upload renewed documentation immediately
- If renewal is pending, contact your certification provider
- Update your compliance status in your dashboard today
- Your agency profile may be affected if certifications expire

UPDATE NOW
${dashboardUrl}

IMPORTANT NOTICE

Expired compliance certifications may affect your agency's visibility in search results and contractor confidence. Please update your documentation as soon as possible to maintain your agency's standing.

---

You're receiving this email because you manage ${agencyName} on FindConstructionStaffing.

Need help? Contact us at support@findconstructionstaffing.com

${safeSiteUrl}
  `.trim();
}
