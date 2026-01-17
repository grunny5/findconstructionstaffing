/**
 * Labor Requests Inbox Page
 * Feature: Phase 6.1 - Agency Dashboard Labor Requests
 *
 * Allows agency owners to view and manage incoming labor request notifications.
 * Follows the compliance page pattern for server-side authentication.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RequestsList } from '@/components/dashboard/RequestsList';

interface RequestsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function RequestsPage({
  params,
  searchParams,
}: RequestsPageProps) {
  const { slug } = await params;
  const { status, search } = await searchParams;
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

  // Fetch labor request notifications for this agency
  let query = supabase
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
        created_at
      )
    `)
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  // Apply filters from searchParams
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    // Escape search query to prevent PostgREST injection
    // First escape backslashes, then percent signs and underscores
    const escapedSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    // Search in project name or company name (wildcards now treated literally)
    query = query.or(
      `labor_request.project_name.ilike.%${escapedSearch}%,labor_request.company_name.ilike.%${escapedSearch}%`
    );
  }

  const { data: rawNotifications, error: notificationsError } = await query;

  if (notificationsError) {
    console.error(
      `Failed to fetch labor requests for agency ${agency.id}:`,
      notificationsError
    );
    throw new Error('Failed to load labor requests');
  }

  // Normalize nested arrays to single objects for RequestsList component
  const notifications = (rawNotifications || []).map((notification: any) => {
    const craftArray = notification.craft || [];
    const laborRequestArray = notification.labor_request || [];

    // Skip if missing required data
    if (craftArray.length === 0 || laborRequestArray.length === 0) {
      return null;
    }

    const craft = craftArray[0];
    const laborRequest = laborRequestArray[0];

    return {
      ...notification,
      craft: {
        ...craft,
        trade: Array.isArray(craft.trade) ? craft.trade[0] : craft.trade,
        region: Array.isArray(craft.region) ? craft.region[0] : craft.region,
      },
      labor_request: laborRequest,
    };
  }).filter(Boolean); // Remove any null entries

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-industrial-graphite-200 pb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Labor Requests
        </h1>
        <p className="font-body text-sm text-industrial-graphite-400 mt-2">
          View and manage incoming labor request notifications for {agency.name}.
        </p>
      </div>

      {/* Requests List Client Component */}
      <RequestsList
        initialData={notifications || []}
        agencySlug={slug}
        initialStatus={status || 'all'}
        initialSearch={search || ''}
      />
    </div>
  );
}
