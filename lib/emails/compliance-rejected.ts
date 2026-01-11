/**
 * Email template for compliance document rejection
 *
 * Sent when an admin rejects a compliance document upload.
 * Includes rejection reason, resubmission instructions, and support contact.
 */

import { escapeHtml, validateSiteUrl } from './utils';
import {
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  type ComplianceType,
} from '@/types/api';

interface ComplianceRejectedEmailParams {
  recipientName?: string;
  agencyName: string;
  agencySlug: string;
  complianceType: ComplianceType;
  rejectionReason: string;
  siteUrl: string;
}

/**
 * Create an HTML email body notifying an agency owner that their compliance document was rejected.
 *
 * @param params - Parameters for the email:
 *   - recipientName: optional recipient name used in the greeting
 *   - agencyName: name of the agency
 *   - complianceType: type of compliance document that was rejected
 *   - rejectionReason: reason shown in the rejection section
 *   - siteUrl: base site URL used for links
 * @returns The complete HTML string for the compliance rejection email
 */
export function generateComplianceRejectedHTML(
  params: ComplianceRejectedEmailParams
): string {
  const {
    recipientName,
    agencyName,
    agencySlug,
    complianceType,
    rejectionReason,
    siteUrl,
  } = params;

  const safeAgencyName = escapeHtml(agencyName);
  const safeRecipientName = recipientName
    ? escapeHtml(recipientName)
    : undefined;
  const safeRejectionReason = escapeHtml(rejectionReason);
  const complianceDisplayName = COMPLIANCE_DISPLAY_NAMES[complianceType];
  const complianceDescription = COMPLIANCE_DESCRIPTIONS[complianceType];
  const validatedSiteUrl = validateSiteUrl(siteUrl);
  const dashboardUrl = `${validatedSiteUrl}/dashboard/agency/${encodeURIComponent(agencySlug)}/compliance`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compliance Document Update - ${escapeHtml(complianceDisplayName)}</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Compliance Document Update</h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${safeRecipientName ? `Hi ${safeRecipientName},` : 'Hello,'}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                We have reviewed the <strong>${escapeHtml(complianceDisplayName)}</strong> document you uploaded for <strong>${safeAgencyName}</strong>. Unfortunately, we are unable to verify this document at this time.
              </p>

              <!-- Document Info Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Document Type</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 20px; color: #6b7280;">${escapeHtml(complianceDisplayName)}</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Description</p>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280;">${escapeHtml(complianceDescription)}</p>
                  </td>
                </tr>
              </table>

              <!-- Rejection Reason Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #991b1b;">Reason for Rejection</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #7f1d1d; white-space: pre-wrap;">${safeRejectionReason}</p>
                  </td>
                </tr>
              </table>

              <!-- What You Can Do -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">What You Can Do</h3>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                To maintain your agency's compliance status, please upload a new document that addresses the concerns noted above.
              </p>

              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Review the rejection reason carefully</li>
                <li>Ensure your document is clear and legible</li>
                <li>Verify the document is current and valid</li>
                <li>Upload a new document through your dashboard</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Upload New Document</a>
                  </td>
                </tr>
              </table>

              <!-- Support Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Need Help?</p>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                      If you have questions about this decision or need assistance, please contact our support team at <a href="mailto:support@findconstructionstaffing.com" style="color: #2563eb; text-decoration: none;">support@findconstructionstaffing.com</a>.
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
                <a href="${validatedSiteUrl}" style="color: #2563eb; text-decoration: none;">FindConstructionStaffing</a>
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
 * Create a plain text email body notifying an agency owner that their compliance document was rejected.
 *
 * @param params - Parameters for the email (same as HTML version)
 * @returns The complete plain text string for the compliance rejection email
 */
export function generateComplianceRejectedText(
  params: ComplianceRejectedEmailParams
): string {
  const {
    recipientName,
    agencyName,
    agencySlug,
    complianceType,
    rejectionReason,
    siteUrl,
  } = params;

  const complianceDisplayName = COMPLIANCE_DISPLAY_NAMES[complianceType];
  const complianceDescription = COMPLIANCE_DESCRIPTIONS[complianceType];
  const validatedSiteUrl = validateSiteUrl(siteUrl);
  const dashboardUrl = `${validatedSiteUrl}/dashboard/agency/${encodeURIComponent(agencySlug)}/compliance`;

  return `
FindConstructionStaffing - Compliance Document Update

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

We have reviewed the ${complianceDisplayName} document you uploaded for ${agencyName}. Unfortunately, we are unable to verify this document at this time.

DOCUMENT TYPE
${complianceDisplayName}

DESCRIPTION
${complianceDescription}

REASON FOR REJECTION
${rejectionReason}

WHAT YOU CAN DO

To maintain your agency's compliance status, please upload a new document that addresses the concerns noted above.

- Review the rejection reason carefully
- Ensure your document is clear and legible
- Verify the document is current and valid
- Upload a new document through your dashboard

UPLOAD NEW DOCUMENT
${dashboardUrl}

NEED HELP?

If you have questions about this decision or need assistance, please contact our support team at support@findconstructionstaffing.com.

---

You're receiving this email because you manage ${agencyName} on FindConstructionStaffing.

${validatedSiteUrl}
  `.trim();
}
