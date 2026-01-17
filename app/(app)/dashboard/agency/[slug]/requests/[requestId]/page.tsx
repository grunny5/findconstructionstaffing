/**
 * Labor Request Detail Page
 * Feature: Phase 6.1 - Agency Dashboard Labor Requests
 *
 * Displays detailed information about a specific labor request notification.
 * Follows the compliance page pattern for server-side authentication.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RequestDetail } from '@/components/dashboard/RequestDetail';

interface RequestDetailPageProps {
  params: Promise<{ slug: string; requestId: string }>;
  searchParams: Promise<{ notificationId?: string }>;
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: RequestDetailPageProps) {
  const { slug, requestId } = await params;
  const { notificationId } = await searchParams;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  // Check user role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Handle database errors separately from permission issues
  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    throw new Error('Unable to verify user permissions');
  }

  // User exists but is not an agency owner
  if (!profile || profile.role !== 'agency_owner') {
    redirect('/');
  }

  // Fetch agency and verify ownership
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id, name, slug, claimed_by')
    .eq('slug', slug)
    .single();

  if (agencyError || !agency) {
    notFound();
  }

  // Verify ownership - user must own this agency
  if (agency.claimed_by !== user.id) {
    redirect('/');
  }

  // If no notificationId provided, try to find one for this request and agency
  let finalNotificationId = notificationId;

  if (!finalNotificationId) {
    // Query for notification associated with this labor request and agency
    const { data: notificationLookup, error: lookupError } = await supabase
      .from('labor_request_notifications')
      .select('id')
      .eq('labor_request_id', requestId)
      .eq('agency_id', agency.id)
      .single();

    if (lookupError || !notificationLookup) {
      // Request doesn't exist or doesn't belong to this agency - 404
      notFound();
    }

    finalNotificationId = notificationLookup.id;
  }

  // Fetch the complete notification with all related data
  const { data: notification, error: notificationError } = await supabase
    .from('labor_request_notifications')
    .select(`
      id,
      status,
      created_at,
      sent_at,
      viewed_at,
      responded_at,
      delivery_error,
      craft:labor_request_crafts (
        id,
        worker_count,
        start_date,
        duration_days,
        hours_per_week,
        experience_level,
        pay_rate_min,
        pay_rate_max,
        per_diem_rate,
        notes,
        trade:trades (id, name),
        region:regions (id, name, state_code)
      ),
      labor_request:labor_requests (
        id,
        project_name,
        company_name,
        contact_email,
        contact_phone,
        additional_details,
        created_at
      )
    `)
    .eq('id', finalNotificationId)
    .eq('agency_id', agency.id)
    .single();

  if (notificationError || !notification) {
    console.error(
      `Failed to fetch notification ${finalNotificationId} for agency ${agency.id}:`,
      notificationError
    );
    // Either doesn't exist or doesn't belong to this agency - 404
    notFound();
  }

  // Verify the labor request ID matches (double-check ownership)
  if (notification.labor_request?.id !== requestId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-industrial-graphite-200 pb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Labor Request Details
        </h1>
        <p className="font-body text-sm text-industrial-graphite-400 mt-2">
          Viewing request for {agency.name}
        </p>
      </div>

      {/* Request Detail Client Component */}
      <RequestDetail
        notification={notification}
        agencySlug={slug}
        notificationId={finalNotificationId}
      />
    </div>
  );
}
