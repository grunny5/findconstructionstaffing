/**
 * Compliance Expiration Check Cron Job
 *
 * GET /api/cron/compliance-expiration
 *
 * Runs daily to check for compliance items expiring in 30 days or 7 days
 * and sends reminder emails to agency owners.
 *
 * Security: Requires CRON_SECRET header for authentication
 * Schedule: Configured in vercel.json to run daily at 9:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import {
  generateComplianceExpiring30HTML,
  generateComplianceExpiring30Text,
} from '@/lib/emails/compliance-expiring-30';
import {
  generateComplianceExpiring7HTML,
  generateComplianceExpiring7Text,
} from '@/lib/emails/compliance-expiring-7';
import { COMPLIANCE_DISPLAY_NAMES, type ComplianceType } from '@/types/api';

export const dynamic = 'force-dynamic';

interface ComplianceExpiringItem {
  id: string;
  agency_id: string;
  compliance_type: ComplianceType;
  expiration_date: string;
  last_30_day_reminder_sent: string | null;
  last_7_day_reminder_sent: string | null;
}

interface AgencyOwner {
  id: string;
  email: string;
  full_name: string | null;
  agency_id: string;
  agency_name: string;
}

interface ProcessingResult {
  sent30DayReminders: number;
  sent7DayReminders: number;
  errors: string[];
  processedAgencies: string[];
}

/**
 * Check if a date is exactly N days from now (within a 24-hour window)
 */
function isExactlyNDaysFromNow(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + days);

  // Check if date is within 24 hours of target
  const diffMs = Math.abs(date.getTime() - targetDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= 1;
}

/**
 * Check if a reminder was already sent in the last 24 hours
 */
function wasRecentlySent(lastSentStr: string | null): boolean {
  if (!lastSentStr) return false;

  const lastSent = new Date(lastSentStr);
  const now = new Date();
  const hoursSinceLastSent =
    (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  // Don't send again if sent within last 24 hours
  return hoursSinceLastSent < 24;
}

/**
 * Group expiring items by agency and owner
 */
async function groupItemsByAgency(
  items: ComplianceExpiringItem[],
  reminderType: '30' | '7'
): Promise<
  Map<string, { owner: AgencyOwner; items: ComplianceExpiringItem[] }>
> {
  const grouped = new Map<
    string,
    { owner: AgencyOwner; items: ComplianceExpiringItem[] }
  >();

  for (const item of items) {
    // Skip if reminder was recently sent
    const lastSent =
      reminderType === '30'
        ? item.last_30_day_reminder_sent
        : item.last_7_day_reminder_sent;

    if (wasRecentlySent(lastSent)) {
      continue;
    }

    // Fetch agency and owner info
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name, claimed_by')
      .eq('id', item.agency_id)
      .single();

    if (agencyError || !agency || !agency.claimed_by) {
      continue; // Skip unclaimed agencies
    }

    // Fetch owner profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', agency.claimed_by)
      .single();

    if (profileError || !profile) {
      continue; // Skip if owner not found
    }

    const owner: AgencyOwner = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      agency_id: agency.id,
      agency_name: agency.name,
    };

    // Group items by agency
    if (!grouped.has(agency.id)) {
      grouped.set(agency.id, { owner, items: [] });
    }

    grouped.get(agency.id)!.items.push(item);
  }

  return grouped;
}

/**
 * Send reminder email and update tracking
 */
async function sendReminder(
  owner: AgencyOwner,
  items: ComplianceExpiringItem[],
  reminderType: '30' | '7',
  resend: Resend,
  siteUrl: string
): Promise<boolean> {
  try {
    const expiringItems = items.map((item) => ({
      complianceType: item.compliance_type,
      expirationDate: item.expiration_date,
    }));

    const emailParams = {
      recipientEmail: owner.email,
      recipientName: owner.full_name || undefined,
      agencyName: owner.agency_name,
      expiringItems,
      siteUrl,
    };

    const subject =
      reminderType === '30'
        ? `Compliance Reminder: Certifications Expiring in 30 Days - ${owner.agency_name}`
        : `URGENT: Compliance Expiring in 7 Days - ${owner.agency_name}`;

    const html =
      reminderType === '30'
        ? generateComplianceExpiring30HTML(emailParams)
        : generateComplianceExpiring7HTML(emailParams);

    const text =
      reminderType === '30'
        ? generateComplianceExpiring30Text(emailParams)
        : generateComplianceExpiring7Text(emailParams);

    await resend.emails.send({
      from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
      to: owner.email,
      subject,
      html,
      text,
    });

    // Update tracking for all items
    const now = new Date().toISOString();
    const updateField =
      reminderType === '30'
        ? 'last_30_day_reminder_sent'
        : 'last_7_day_reminder_sent';

    const failedUpdates: Array<{ itemId: string; error: any }> = [];

    for (const item of items) {
      const { error: updateError } = await supabase
        .from('agency_compliance')
        .update({ [updateField]: now })
        .eq('id', item.id);

      if (updateError) {
        failedUpdates.push({ itemId: item.id, error: updateError });
        console.error(
          `[Cron] Failed to update ${updateField} for item ${item.id}:`,
          updateError
        );
      }
    }

    // If any updates failed, return false to indicate partial failure
    if (failedUpdates.length > 0) {
      console.error(
        `[Cron] Failed to update tracking for ${failedUpdates.length}/${items.length} items for ${owner.email}. Failed items:`,
        failedUpdates.map((f) => f.itemId)
      );
      return false;
    }

    console.log(
      `[Cron] Sent ${reminderType}-day reminder to ${owner.email} for ${items.length} items`
    );
    return true;
  } catch (error) {
    console.error(
      `[Cron] Failed to send ${reminderType}-day reminder to ${owner.email}:`,
      error
    );
    return false;
  }
}

/**
 * Main handler for the cron job
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ========================================================================
    // 2. INITIALIZE EMAIL SERVICE
    // ========================================================================
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Cron] RESEND_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured',
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // ========================================================================
    // 3. FETCH EXPIRING COMPLIANCE ITEMS
    // ========================================================================
    const now = new Date();
    const date30DaysFromNow = new Date(now);
    date30DaysFromNow.setDate(now.getDate() + 30);

    const date7DaysFromNow = new Date(now);
    date7DaysFromNow.setDate(now.getDate() + 7);

    // Fetch all active items with expiration dates
    const { data: allItems, error: fetchError } = await supabase
      .from('agency_compliance')
      .select(
        'id, agency_id, compliance_type, expiration_date, last_30_day_reminder_sent, last_7_day_reminder_sent'
      )
      .eq('is_active', true)
      .not('expiration_date', 'is', null);

    if (fetchError) {
      console.error('[Cron] Failed to fetch compliance items:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
        },
        { status: 500 }
      );
    }

    // Filter items by expiration timeframe
    const items30Days = (allItems || []).filter((item) =>
      isExactlyNDaysFromNow(item.expiration_date, 30)
    ) as ComplianceExpiringItem[];

    const items7Days = (allItems || []).filter((item) =>
      isExactlyNDaysFromNow(item.expiration_date, 7)
    ) as ComplianceExpiringItem[];

    console.log(
      `[Cron] Found ${items30Days.length} items expiring in 30 days, ${items7Days.length} items expiring in 7 days`
    );

    // ========================================================================
    // 4. PROCESS 30-DAY REMINDERS
    // ========================================================================
    const result: ProcessingResult = {
      sent30DayReminders: 0,
      sent7DayReminders: 0,
      errors: [],
      processedAgencies: [],
    };

    const grouped30Day = await groupItemsByAgency(items30Days, '30');

    for (const [agencyId, { owner, items }] of Array.from(
      grouped30Day.entries()
    )) {
      const success = await sendReminder(owner, items, '30', resend, siteUrl);

      if (success) {
        result.sent30DayReminders += items.length;
        result.processedAgencies.push(agencyId);
      } else {
        result.errors.push(`Failed to send 30-day reminder to ${owner.email}`);
      }
    }

    // ========================================================================
    // 5. PROCESS 7-DAY REMINDERS
    // ========================================================================
    const grouped7Day = await groupItemsByAgency(items7Days, '7');

    for (const [agencyId, { owner, items }] of Array.from(
      grouped7Day.entries()
    )) {
      const success = await sendReminder(owner, items, '7', resend, siteUrl);

      if (success) {
        result.sent7DayReminders += items.length;
        if (!result.processedAgencies.includes(agencyId)) {
          result.processedAgencies.push(agencyId);
        }
      } else {
        result.errors.push(`Failed to send 7-day reminder to ${owner.email}`);
      }
    }

    // ========================================================================
    // 6. RETURN SUMMARY
    // ========================================================================
    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Completed in ${duration}ms. Sent ${result.sent30DayReminders} 30-day and ${result.sent7DayReminders} 7-day reminders.`
    );

    return NextResponse.json({
      success: true,
      summary: {
        sent30DayReminders: result.sent30DayReminders,
        sent7DayReminders: result.sent7DayReminders,
        totalAgenciesNotified: result.processedAgencies.length,
        errors: result.errors,
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error('[Cron] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
