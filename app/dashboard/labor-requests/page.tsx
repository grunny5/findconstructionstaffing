/**
 * Labor Requests Inbox Page - DEPRECATED
 * Feature: Phase 6.1 - Agency Dashboard Labor Requests
 *
 * This page redirects to the new agency-scoped labor requests page.
 * Old URL: /dashboard/labor-requests
 * New URL: /dashboard/agency/[slug]/requests
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface LaborRequestsPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function LaborRequestsPage({
  searchParams,
}: LaborRequestsPageProps) {
  const supabase = await createClient();
  const { status, search } = await searchParams;

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  // Get user's agency slug
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('slug')
    .eq('claimed_by', user.id)
    .single();

  if (agencyError || !agency) {
    // User doesn't have an agency - redirect to home
    redirect('/');
  }

  // Build query string preserving filters
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (search) {
    params.append('search', search);
  }

  const queryString = params.toString();
  const newUrl = `/dashboard/agency/${agency.slug}/requests${queryString ? `?${queryString}` : ''}`;

  redirect(newUrl);
}
