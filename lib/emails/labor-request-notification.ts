/**
 * Email template for labor request notifications to agencies
 *
 * Sent when an agency is matched to one or more craft requirements in a labor request.
 * Consolidates multiple craft requirements into a single email per agency.
 */

import { escapeHtml, formatDate } from './utils';

interface CraftRequirement {
  tradeId: string;
  tradeName: string;
  regionName: string;
  experienceLevel: string;
  workerCount: number;
  startDate: string;
  durationDays: number;
  hoursPerWeek: number;
  notes?: string;
  payRateMin?: number;
  payRateMax?: number;
  perDiemRate?: number;
}

interface LaborRequestNotificationParams {
  agencyEmail: string;
  agencyName: string;
  projectName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  additionalDetails?: string;
  crafts: CraftRequirement[];
  siteUrl: string;
  laborRequestId: string;
}

/**
 * Generates HTML version of labor request notification email
 */
export function generateLaborRequestNotificationHTML(
  params: LaborRequestNotificationParams
): string {
  const {
    agencyName,
    projectName,
    companyName,
    contactEmail,
    contactPhone,
    additionalDetails,
    crafts,
    siteUrl,
    laborRequestId,
  } = params;

  const escapedAgencyName = escapeHtml(agencyName);
  const escapedProjectName = escapeHtml(projectName);
  const escapedCompanyName = escapeHtml(companyName);
  const escapedContactEmail = escapeHtml(contactEmail);
  const escapedContactPhone = escapeHtml(contactPhone);

  const craftCount = crafts.length;
  const totalWorkers = crafts.reduce((sum, craft) => sum + craft.workerCount, 0);

  // Generate craft requirement rows
  const craftRows = crafts
    .map((craft) => {
      const escapedTradeName = escapeHtml(craft.tradeName);
      const escapedRegionName = escapeHtml(craft.regionName);
      const escapedExperience = escapeHtml(craft.experienceLevel);
      const formattedStartDate = formatDate(craft.startDate);

      const payRateDisplay = craft.payRateMin && craft.payRateMax
        ? `$${craft.payRateMin}-$${craft.payRateMax}/hr`
        : craft.payRateMin
        ? `$${craft.payRateMin}+/hr`
        : 'Rate negotiable';

      const perDiemDisplay = craft.perDiemRate
        ? `$${craft.perDiemRate}/day per diem`
        : null;

      return `
              <tr>
                <td style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                    ${craft.workerCount} ${escapedTradeName}${craft.workerCount > 1 ? 's' : ''}
                  </h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Experience Level:</strong> ${escapedExperience}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Location:</strong> ${escapedRegionName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Start Date:</strong> ${formattedStartDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Duration:</strong> ${craft.durationDays} days (${craft.hoursPerWeek} hours/week)
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Pay Rate:</strong> ${payRateDisplay}
                      </td>
                    </tr>
                    ${
                      perDiemDisplay
                        ? `
                    <tr>
                      <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">
                        <strong>Per Diem:</strong> ${perDiemDisplay}
                      </td>
                    </tr>
                    `
                        : ''
                    }
                    ${
                      craft.notes
                        ? `
                    <tr>
                      <td style="padding: 8px 0 0 0; font-size: 14px; color: #4b5563; font-style: italic;">
                        "${escapeHtml(craft.notes)}"
                      </td>
                    </tr>
                    `
                        : ''
                    }
                  </table>
                </td>
              </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Labor Request - ${escapedProjectName}</title>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                New Labor Request: ${escapedProjectName}
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Hi ${escapedAgencyName},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                You've been matched to a new labor request from <strong>${escapedCompanyName}</strong> requiring <strong>${totalWorkers} worker${totalWorkers > 1 ? 's' : ''}</strong> across <strong>${craftCount} craft${craftCount > 1 ? 's' : ''}</strong>.
              </p>

              <!-- Project Details Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                      Project Details
                    </h3>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">
                      <strong>Company:</strong> ${escapedCompanyName}
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">
                      <strong>Contact:</strong> ${escapedContactEmail}
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">
                      <strong>Phone:</strong> ${escapedContactPhone}
                    </p>
                    ${
                      additionalDetails
                        ? `
                    <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 22px; color: #4b5563;">
                      <strong>Additional Details:</strong><br>
                      ${escapeHtml(additionalDetails)}
                    </p>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <!-- Craft Requirements -->
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                Craft Requirements
              </h3>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 24px; overflow: hidden;">
                ${craftRows}
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${siteUrl}/dashboard/labor-requests/${laborRequestId}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">View Full Request & Respond</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #6b7280;">
                Please review the requirements and respond at your earliest convenience. The client is expecting to hear from matched agencies within 24-48 hours.
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
                <a href="${siteUrl}/dashboard" style="color: #2563eb; text-decoration: none;">View Dashboard</a> |
                <a href="${siteUrl}/settings/notifications" style="color: #2563eb; text-decoration: none;">Notification Settings</a>
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
 * Generates plain text version of labor request notification email
 */
export function generateLaborRequestNotificationText(
  params: LaborRequestNotificationParams
): string {
  const {
    agencyName,
    projectName,
    companyName,
    contactEmail,
    contactPhone,
    additionalDetails,
    crafts,
    siteUrl,
    laborRequestId,
  } = params;

  const craftCount = crafts.length;
  const totalWorkers = crafts.reduce((sum, craft) => sum + craft.workerCount, 0);

  // Generate craft requirement text
  const craftText = crafts
    .map((craft, index) => {
      const payRateDisplay = craft.payRateMin && craft.payRateMax
        ? `$${craft.payRateMin}-$${craft.payRateMax}/hr`
        : craft.payRateMin
        ? `$${craft.payRateMin}+/hr`
        : 'Rate negotiable';

      const perDiemDisplay = craft.perDiemRate
        ? `  • Per Diem: $${craft.perDiemRate}/day\n`
        : '';

      const notesDisplay = craft.notes ? `  • Notes: ${craft.notes}\n` : '';

      const formattedStartDate = formatDate(craft.startDate);

      return `
${index + 1}. ${craft.workerCount} ${craft.tradeName}${craft.workerCount > 1 ? 's' : ''}
  • Experience Level: ${craft.experienceLevel}
  • Location: ${craft.regionName}
  • Start Date: ${formattedStartDate}
  • Duration: ${craft.durationDays} days (${craft.hoursPerWeek} hours/week)
  • Pay Rate: ${payRateDisplay}
${perDiemDisplay}${notesDisplay}`;
    })
    .join('\n');

  return `
FINDCONSTRUCTIONSTAFFING
New Labor Request: ${projectName}

Hi ${agencyName},

You've been matched to a new labor request from ${companyName} requiring ${totalWorkers} worker${totalWorkers > 1 ? 's' : ''} across ${craftCount} craft${craftCount > 1 ? 's' : ''}.

PROJECT DETAILS
--------------
Company: ${companyName}
Contact: ${contactEmail}
Phone: ${contactPhone}${additionalDetails ? `\n\nAdditional Details:\n${additionalDetails}` : ''}

CRAFT REQUIREMENTS
------------------
${craftText}

VIEW FULL REQUEST & RESPOND
${siteUrl}/dashboard/labor-requests/${laborRequestId}

Please review the requirements and respond at your earliest convenience. The client is expecting to hear from matched agencies within 24-48 hours.

Thank you,
The FindConstructionStaffing Team

---
View Dashboard: ${siteUrl}/dashboard
Notification Settings: ${siteUrl}/settings/notifications

© ${new Date().getFullYear()} FindConstructionStaffing. All rights reserved.
Visit our website: ${siteUrl}
  `.trim();
}
