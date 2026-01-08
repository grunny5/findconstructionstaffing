/**
 * Email template for 30-day compliance expiration reminder
 *
 * Sent to agency owners when their compliance certifications are expiring in 30 days.
 * Provides advance notice to allow time for renewal.
 */

import { escapeHtml, formatDate, validateSiteUrl } from './utils';
import {
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  type ComplianceExpiringItem,
} from '@/types/api';

interface ComplianceExpiring30EmailParams {
  recipientName?: string;
  agencyName: string;
  expiringItems: ComplianceExpiringItem[];
  siteUrl: string;
}

/**
 * Create an HTML email body notifying agency owner of compliance items expiring in 30 days
 */
export function generateComplianceExpiring30HTML(
  params: ComplianceExpiring30EmailParams
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
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">
          ${escapeHtml(COMPLIANCE_DISPLAY_NAMES[item.complianceType])}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
          ${escapeHtml(COMPLIANCE_DESCRIPTIONS[item.complianceType])}
        </p>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #d97706;">
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
  <title>Compliance Certification Expiring Soon - ${safeAgencyName}</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Compliance Reminder: ${itemCount} ${itemWord} Expiring Soon</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                This is a friendly reminder that ${itemCount === 1 ? 'a compliance certification' : 'compliance certifications'} for <strong>${safeAgencyName}</strong> will expire in approximately 30 days.
              </p>

              <!-- Expiring Items Table -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d97706; text-transform: uppercase;">⚠️ Expiring in 30 Days</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${itemsList}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Items -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What You Should Do</h3>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Review your current ${itemWord} and begin the renewal process</li>
                <li>Upload updated documentation before the expiration date</li>
                <li>Contact your certification provider if you need assistance</li>
                <li>Update your compliance information in your dashboard</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Update Compliance</a>
                  </td>
                </tr>
              </table>

              <!-- Info Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #eff6ff; border-radius: 6px; margin-bottom: 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e40af;">💡 Why This Matters</p>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #1e3a8a;">
                      Maintaining current compliance certifications helps contractors find your agency and demonstrates your commitment to industry standards. You'll receive another reminder when your certifications are 7 days from expiration.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                You're receiving this email because you manage <strong>${safeAgencyName}</strong> on FindConstructionStaffing.
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
 * Create a plain text email body for 30-day compliance expiration reminder
 */
export function generateComplianceExpiring30Text(
  params: ComplianceExpiring30EmailParams
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
FindConstructionStaffing - Compliance Reminder

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

This is a friendly reminder that ${itemCount === 1 ? 'a compliance certification' : 'compliance certifications'} for ${agencyName} will expire in approximately 30 days.

EXPIRING IN 30 DAYS
${itemsList}

WHAT YOU SHOULD DO

- Review your current ${itemWord} and begin the renewal process
- Upload updated documentation before the expiration date
- Contact your certification provider if you need assistance
- Update your compliance information in your dashboard

UPDATE COMPLIANCE
${dashboardUrl}

WHY THIS MATTERS

Maintaining current compliance certifications helps contractors find your agency and demonstrates your commitment to industry standards. You'll receive another reminder when your certifications are 7 days from expiration.

---

You're receiving this email because you manage ${agencyName} on FindConstructionStaffing.

${safeSiteUrl}
  `.trim();
}
