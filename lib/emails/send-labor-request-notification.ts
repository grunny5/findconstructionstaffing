/**
 * Labor Request Notification Email Sender
 *
 * Utility function to send email notifications to agencies when they're matched to labor requests.
 * Consolidates multiple craft requirements per agency into a single email.
 */

import { Resend } from 'resend';
import {
  generateLaborRequestNotificationHTML,
  generateLaborRequestNotificationText,
} from './labor-request-notification';

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

interface SendLaborRequestNotificationParams {
  agencyId: string;
  agencyEmail: string;
  agencyName: string;
  projectName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  additionalDetails?: string;
  crafts: CraftRequirement[];
  laborRequestId: string;
}

interface LaborRequestNotificationResult {
  sent: boolean;
  reason?: string;
  error?: unknown;
}

/**
 * Send labor request notification email via Resend
 *
 * This function:
 * 1. Checks RESEND_API_KEY is configured
 * 2. Validates site URL configuration
 * 3. Generates HTML and text email templates
 * 4. Sends consolidated email for all matched crafts
 * 5. Handles errors gracefully without throwing
 * 6. Logs success/failure for debugging
 *
 * @param params - Email parameters including agency info, project details, and craft requirements
 * @returns Result object with sent status and optional reason/error
 *
 * @example
 * ```typescript
 * const result = await sendLaborRequestNotificationEmail({
 *   agencyId: 'agency-123',
 *   agencyEmail: 'info@agency.com',
 *   agencyName: 'Industrial Staffing Solutions',
 *   projectName: 'Downtown Office Complex',
 *   companyName: 'ABC Construction',
 *   contactEmail: 'project@abc.com',
 *   contactPhone: '555-0100',
 *   crafts: [
 *     {
 *       tradeId: 'trade-1',
 *       tradeName: 'Electrician',
 *       regionName: 'Texas',
 *       experienceLevel: 'Journeyman',
 *       workerCount: 5,
 *       startDate: '2026-02-01',
 *       durationDays: 30,
 *       hoursPerWeek: 40,
 *       payRateMin: 35,
 *       payRateMax: 45,
 *     },
 *   ],
 *   laborRequestId: 'request-123',
 * });
 *
 * if (result.sent) {
 *   console.log('Email sent successfully to agency');
 * }
 * ```
 */
export async function sendLaborRequestNotificationEmail(
  params: SendLaborRequestNotificationParams
): Promise<LaborRequestNotificationResult> {
  try {
    // Validate required email
    if (!params.agencyEmail) {
      console.warn(
        `No email address for agency ${params.agencyId} - skipping notification`
      );
      return { sent: false, reason: 'no_email_address' };
    }

    // Check Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn(
        'RESEND_API_KEY not configured - skipping labor request notification'
      );
      return { sent: false, reason: 'resend_api_key_missing' };
    }

    // Get site URL (required for email links)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      console.error(
        'NEXT_PUBLIC_SITE_URL not configured - skipping labor request notification to avoid incorrect email links'
      );
      return { sent: false, reason: 'site_url_missing' };
    }

    // Generate email templates
    const emailParams = {
      ...params,
      siteUrl,
    };

    const emailHtml = generateLaborRequestNotificationHTML(emailParams);
    const emailText = generateLaborRequestNotificationText(emailParams);

    // Send email via Resend
    const resend = new Resend(resendApiKey);

    // Get configurable sender email (allows different emails for staging/production)
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      'FindConstructionStaffing <noreply@findconstructionstaffing.com>';

    const craftCount = params.crafts.length;
    const subject =
      craftCount > 1
        ? `New Labor Request: ${params.projectName} (${craftCount} crafts)`
        : `New Labor Request: ${params.projectName}`;

    await resend.emails.send({
      from: fromEmail,
      to: params.agencyEmail,
      subject,
      html: emailHtml,
      text: emailText,
    });

    console.log(
      `Labor request notification sent to ${params.agencyEmail} (${params.agencyName}) for request ${params.laborRequestId} with ${craftCount} craft${craftCount > 1 ? 's' : ''}`
    );

    return { sent: true };
  } catch (error) {
    // Catch any unexpected errors (network issues, Resend API errors, etc.)
    // Don't throw - email sending should never break the main labor request flow
    console.error('Error in sendLaborRequestNotificationEmail:', error);
    return { sent: false, reason: 'unexpected_error', error };
  }
}
