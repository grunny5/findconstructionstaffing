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
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { timingSafeEqual } from 'crypto';
import {
  generateComplianceExpiring30HTML,
  generateComplianceExpiring30Text,
} from '@/lib/emails/compliance-expiring-30';
import {
  generateComplianceExpiring7HTML,
  generateComplianceExpiring7Text,
} from '@/lib/emails/compliance-expiring-7';
import { type ComplianceType } from '@/types/api';
import { validateSiteUrl } from '@/lib/emails/utils';

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
  agency_slug: string;
}

interface ProcessingResult {
  sent30DayReminders: number;
  sent7DayReminders: number;
  errors: string[];
  processedAgencies: string[];
}

// Simple email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * Timing-safe comparison of authorization header against expected secret
 * Protects against timing attacks on the cron secret
 */
function isValidAuthHeader(
  authHeader: string | null,
  expectedSecret: string
): boolean {
  if (!authHeader) return false;

  // Extract token from "Bearer <token>" format
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return false;

  const tokenBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

  // If lengths differ, compare against same-length buffer to maintain constant time
  if (tokenBuffer.length !== expectedBuffer.length) {
    // Create a buffer of same length as token filled with the expected value repeated
    const paddedExpected = Buffer.alloc(tokenBuffer.length);
    expectedBuffer.copy(
      paddedExpected,
      0,
      0,
      Math.min(expectedBuffer.length, tokenBuffer.length)
    );
    timingSafeEqual(tokenBuffer, paddedExpected);
    return false;
  }

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * Check if a date is within N days from now (with a small window for flexibility)
 * Uses a window to allow for slight timing variations in cron execution
 *
 * For 30-day reminders: matches days 28-30
 * For 7-day reminders: matches days 5-7
 */
function isDaysFromNowInWindow(
  dateStr: string,
  targetDays: number,
  windowStart: number,
  windowEnd: number
): boolean {
  const date = new Date(dateStr);
  const dateUTC = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  const now = new Date();
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.floor((dateUTC - nowUTC) / msPerDay);

  return daysUntil >= windowStart && daysUntil <= windowEnd;
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
 * Optimized to avoid N+1 queries by fetching all agencies and profiles in bulk
 */
async function groupItemsByAgency(
  supabaseAdmin: SupabaseClient,
  items: ComplianceExpiringItem[],
  reminderType: '30' | '7'
): Promise<
  Map<string, { owner: AgencyOwner; items: ComplianceExpiringItem[] }>
> {
  // Filter items that need reminders sent
  const filteredItems = items.filter((item) => {
    const lastSent =
      reminderType === '30'
        ? item.last_30_day_reminder_sent
        : item.last_7_day_reminder_sent;
    return !wasRecentlySent(lastSent);
  });

  if (filteredItems.length === 0) {
    return new Map();
  }

  // Get unique agency IDs
  const agencyIds = Array.from(
    new Set(filteredItems.map((item) => item.agency_id))
  );

  // Fetch all agencies in one query
  const { data: agencies, error: agencyError } = await supabaseAdmin
    .from('agencies')
    .select('id, name, slug, claimed_by')
    .in('id', agencyIds)
    .not('claimed_by', 'is', null);

  if (agencyError) {
    console.error('[Cron] Error fetching agencies:', agencyError);
    throw new Error(`Failed to fetch agencies: ${agencyError.message}`);
  }

  if (!agencies || agencies.length === 0) {
    return new Map();
  }

  // Create agency lookup map
  const agencyMap = new Map(agencies.map((a) => [a.id, a]));

  // Get unique owner IDs
  const ownerIds = Array.from(
    new Set(agencies.map((a) => a.claimed_by).filter(Boolean))
  ) as string[];

  if (ownerIds.length === 0) {
    return new Map();
  }

  // Fetch all profiles in one query
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', ownerIds);

  if (profileError) {
    console.error('[Cron] Error fetching profiles:', profileError);
    throw new Error(`Failed to fetch profiles: ${profileError.message}`);
  }

  if (!profiles) {
    return new Map();
  }

  // Create profile lookup map
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Group items by agency
  const grouped = new Map<
    string,
    { owner: AgencyOwner; items: ComplianceExpiringItem[] }
  >();

  for (const item of filteredItems) {
    const agency = agencyMap.get(item.agency_id);
    if (!agency || !agency.claimed_by) {
      continue; // Skip unclaimed agencies
    }

    const profile = profileMap.get(agency.claimed_by);
    if (!profile) {
      continue; // Skip if owner not found
    }

    // Validate email before adding to grouped results
    if (!isValidEmail(profile.email)) {
      console.error(
        `[Cron] Skipping agency ${agency.id}: owner ${profile.id} has invalid email`
      );
      continue;
    }

    const owner: AgencyOwner = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      agency_id: agency.id,
      agency_name: agency.name,
      agency_slug: agency.slug,
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
 *
 * Uses idempotent update-then-send pattern with rollback on email failure:
 * 1. Update tracking timestamp FIRST (prevents duplicate sends on retry)
 * 2. Send email with idempotencyKey for Resend deduplication
 * 3. If email fails, rollback the tracking timestamp
 */
async function sendReminder(
  supabaseAdmin: SupabaseClient,
  owner: AgencyOwner,
  items: ComplianceExpiringItem[],
  reminderType: '30' | '7',
  resend: Resend,
  siteUrl: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const updateField =
    reminderType === '30'
      ? 'last_30_day_reminder_sent'
      : 'last_7_day_reminder_sent';
  const itemIds = items.map((item) => item.id);

  // Generate deterministic idempotency key based on agency, owner, reminder type, and date
  // This prevents duplicate sends if cron runs multiple times on same day
  const today = new Date().toISOString().split('T')[0];
  const idempotencyKey = `${owner.agency_id}-${owner.id}-${reminderType}day-${today}`;

  try {
    // STEP 1: Update tracking FIRST (idempotent - prevents duplicate sends on retry)
    const { error: updateError } = await supabaseAdmin
      .from('agency_compliance')
      .update({ [updateField]: now })
      .in('id', itemIds);

    if (updateError) {
      console.error(
        `[Cron] Failed to update ${updateField} for items (email NOT sent):`,
        itemIds,
        updateError
      );
      return false;
    }

    // STEP 2: Send email AFTER tracking is updated
    const expiringItems = items.map((item) => ({
      complianceType: item.compliance_type,
      expirationDate: item.expiration_date,
    }));

    const emailParams = {
      recipientName: owner.full_name || undefined,
      agencyName: owner.agency_name,
      agencySlug: owner.agency_slug,
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

    // Send email with idempotency key and check response
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
      to: owner.email,
      subject,
      html,
      text,
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
    });

    if (emailError) {
      // STEP 3: Rollback tracking timestamp on email failure
      console.error(
        `[Cron] Email send failed for ${owner.email}, rolling back tracking:`,
        emailError
      );

      const { error: rollbackError } = await supabaseAdmin
        .from('agency_compliance')
        .update({ [updateField]: null })
        .in('id', itemIds)
        .eq(updateField, now);

      if (rollbackError) {
        console.error(
          `[Cron] Failed to rollback ${updateField} for items:`,
          itemIds,
          rollbackError
        );
      }

      return false;
    }

    console.log(
      `[Cron] Sent ${reminderType}-day reminder to ${owner.email} for ${items.length} items (id: ${emailData?.id})`
    );
    return true;
  } catch (error) {
    // Unexpected error - attempt rollback
    console.error(
      `[Cron] Unexpected error sending ${reminderType}-day reminder to ${owner.email}:`,
      error
    );

    // Attempt rollback
    try {
      await supabaseAdmin
        .from('agency_compliance')
        .update({ [updateField]: null })
        .in('id', itemIds)
        .eq(updateField, now);
    } catch (rollbackError) {
      console.error('[Cron] Rollback also failed:', rollbackError);
    }

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
    // 1. AUTHENTICATION CHECK (timing-safe)
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

    if (!isValidAuthHeader(authHeader, cronSecret)) {
      console.error('[Cron] Invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ========================================================================
    // 2. INITIALIZE SUPABASE ADMIN CLIENT (bypasses RLS)
    // ========================================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[Cron] Supabase configuration missing');
      return NextResponse.json(
        {
          success: false,
          error: 'Database configuration error',
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // ========================================================================
    // 3. INITIALIZE EMAIL SERVICE
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
    const siteUrl = validateSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || '');

    // ========================================================================
    // 4. FETCH EXPIRING COMPLIANCE ITEMS
    // ========================================================================
    // Fetch all active items with expiration dates
    const { data: allItems, error: fetchError } = await supabaseAdmin
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

    // Filter items by expiration timeframe (with windows for flexibility)
    // 30-day reminders: 28-30 days out
    const items30Days = (allItems || []).filter((item) =>
      isDaysFromNowInWindow(item.expiration_date, 30, 28, 30)
    ) as ComplianceExpiringItem[];

    // 7-day reminders: 5-7 days out
    const items7Days = (allItems || []).filter((item) =>
      isDaysFromNowInWindow(item.expiration_date, 7, 5, 7)
    ) as ComplianceExpiringItem[];

    console.log(
      `[Cron] Found ${items30Days.length} items expiring in ~30 days, ${items7Days.length} items expiring in ~7 days`
    );

    // ========================================================================
    // 5. PROCESS 30-DAY REMINDERS
    // ========================================================================
    const result: ProcessingResult = {
      sent30DayReminders: 0,
      sent7DayReminders: 0,
      errors: [],
      processedAgencies: [],
    };

    const grouped30Day = await groupItemsByAgency(
      supabaseAdmin,
      items30Days,
      '30'
    );

    for (const [agencyId, { owner, items }] of Array.from(
      grouped30Day.entries()
    )) {
      const success = await sendReminder(
        supabaseAdmin,
        owner,
        items,
        '30',
        resend,
        siteUrl
      );

      if (success) {
        result.sent30DayReminders += items.length;
        result.processedAgencies.push(agencyId);
      } else {
        console.error(
          `[Cron] Failed to send 30-day reminder for agency ${agencyId}`
        );
        result.errors.push(
          `Failed to send 30-day reminder for agency ${agencyId}`
        );
      }
    }

    // ========================================================================
    // 6. PROCESS 7-DAY REMINDERS
    // ========================================================================
    const grouped7Day = await groupItemsByAgency(
      supabaseAdmin,
      items7Days,
      '7'
    );

    for (const [agencyId, { owner, items }] of Array.from(
      grouped7Day.entries()
    )) {
      const success = await sendReminder(
        supabaseAdmin,
        owner,
        items,
        '7',
        resend,
        siteUrl
      );

      if (success) {
        result.sent7DayReminders += items.length;
        if (!result.processedAgencies.includes(agencyId)) {
          result.processedAgencies.push(agencyId);
        }
      } else {
        console.error(
          `[Cron] Failed to send 7-day reminder for agency ${agencyId}`
        );
        result.errors.push(
          `Failed to send 7-day reminder for agency ${agencyId}`
        );
      }
    }

    // ========================================================================
    // 7. RETURN SUMMARY
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
      },
      { status: 500 }
    );
  }
}
