/**
 * Profile Completion Email Sender
 *
 * Utility function to send congratulations email when agency profile reaches 100% completion.
 * Includes duplicate prevention via database flag.
 */

import { Resend } from 'resend';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  generateProfileCompleteHTML,
  generateProfileCompleteText,
} from './profile-complete';

interface ProfileCompleteEmailResult {
  sent: boolean;
  reason?: string;
  error?: unknown;
}

/**
 * Check if profile completion milestone email should be sent and send it
 *
 * This function:
 * 1. Checks if profile has reached 100% completion
 * 2. Verifies completion_email_sent flag is FALSE
 * 3. Sends congratulations email via Resend
 * 4. Updates completion_email_sent flag to TRUE
 * 5. Handles errors gracefully without throwing
 *
 * @param supabase - Supabase client instance
 * @param agencyId - UUID of the agency to check
 * @returns Result object with sent status and optional reason/error
 *
 * @example
 * ```typescript
 * const result = await sendProfileCompleteEmailIfNeeded(supabase, agencyId);
 * if (result.sent) {
 *   console.log('Completion email sent successfully');
 * }
 * ```
 */
export async function sendProfileCompleteEmailIfNeeded(
  supabase: SupabaseClient,
  agencyId: string
): Promise<ProfileCompleteEmailResult> {
  try {
    // ========================================================================
    // 1. FETCH AGENCY DATA WITH PROFILE COMPLETION STATUS
    // ========================================================================
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select(
        'id, name, slug, profile_completion_percentage, completion_email_sent, claimed_by'
      )
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      console.warn(
        'Failed to fetch agency for completion email check:',
        agencyError
      );
      return { sent: false, reason: 'agency_not_found', error: agencyError };
    }

    // ========================================================================
    // 2. CHECK IF EMAIL SHOULD BE SENT
    // ========================================================================
    // Only send if profile is 100% complete AND email hasn't been sent yet
    if (agency.profile_completion_percentage !== 100) {
      return { sent: false, reason: 'profile_not_complete' };
    }

    if (agency.completion_email_sent) {
      return { sent: false, reason: 'email_already_sent' };
    }

    // ========================================================================
    // 3. FETCH OWNER PROFILE FOR EMAIL RECIPIENT
    // ========================================================================
    if (!agency.claimed_by) {
      return { sent: false, reason: 'agency_not_claimed' };
    }

    const { data: ownerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.claimed_by)
      .single();

    if (profileError || !ownerProfile) {
      console.warn(
        'Failed to fetch owner profile for completion email:',
        profileError
      );
      return {
        sent: false,
        reason: 'owner_profile_not_found',
        error: profileError,
      };
    }

    // ========================================================================
    // 4. CHECK RESEND API KEY
    // ========================================================================
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - skipping completion email');
      return { sent: false, reason: 'resend_api_key_missing' };
    }

    // ========================================================================
    // 5. SEND EMAIL VIA RESEND
    // ========================================================================
    const resend = new Resend(resendApiKey);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const emailHtml = generateProfileCompleteHTML({
      recipientEmail: ownerProfile.email,
      recipientName: ownerProfile.full_name || undefined,
      agencyName: agency.name,
      agencySlug: agency.slug,
      siteUrl,
    });

    const emailText = generateProfileCompleteText({
      recipientEmail: ownerProfile.email,
      recipientName: ownerProfile.full_name || undefined,
      agencyName: agency.name,
      agencySlug: agency.slug,
      siteUrl,
    });

    await resend.emails.send({
      from: 'FindConstructionStaffing <noreply@findconstructionstaffing.com>',
      to: ownerProfile.email,
      subject: `🎉 Your Profile is Complete - ${agency.name}`,
      html: emailHtml,
      text: emailText,
    });

    console.log(
      `Profile completion email sent to ${ownerProfile.email} for agency ${agency.name} (${agencyId})`
    );

    // ========================================================================
    // 6. UPDATE COMPLETION_EMAIL_SENT FLAG
    // ========================================================================
    const { error: updateError } = await supabase
      .from('agencies')
      .update({ completion_email_sent: true })
      .eq('id', agencyId);

    if (updateError) {
      console.error(
        'Failed to update completion_email_sent flag after sending email:',
        updateError
      );
      // Email was sent successfully, but flag update failed
      // This is non-critical - return success since email was delivered
      return { sent: true, reason: 'flag_update_failed', error: updateError };
    }

    return { sent: true };
  } catch (error) {
    // Catch any unexpected errors (network issues, Resend API errors, etc.)
    console.error('Error in sendProfileCompleteEmailIfNeeded:', error);
    return { sent: false, reason: 'unexpected_error', error };
  }
}
