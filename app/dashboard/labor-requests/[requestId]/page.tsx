/**
 * Labor Request Detail Page - DEPRECATED
 * Feature: Phase 6.1 - Agency Dashboard Labor Requests
 *
 * This page redirects to the new agency-scoped labor request detail page.
 * Old URL: /dashboard/labor-requests/[requestId]
 * New URL: /dashboard/agency/[slug]/requests/[requestId]
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface RequestDetailPageProps {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ notificationId?: string }>;
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: RequestDetailPageProps) {
  const supabase = await createClient();
  const { requestId } = await params;
  const { notificationId } = await searchParams;

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

  // Build query string preserving notificationId
  const params_new = new URLSearchParams();
  if (notificationId) {
    params_new.append('notificationId', notificationId);
  }

  const queryString = params_new.toString();
  const newUrl = `/dashboard/agency/${agency.slug}/requests/${requestId}${queryString ? `?${queryString}` : ''}`;

  redirect(newUrl);
}
