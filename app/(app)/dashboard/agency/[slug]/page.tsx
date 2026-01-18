/**
 * Dashboard Page - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.2 - Update Dashboard Pages
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ComplianceExpirationAlert } from '@/components/compliance/ComplianceExpirationAlert';
import { toComplianceItemFull } from '@/types/api';

interface DashboardPageProps {
  params: { slug: string };
}

/**
 * Fetch labor request statistics for an agency with caching
 * Cached for 5 minutes to reduce database load
 */
const getLaborRequestStats = unstable_cache(
  async (agencyId: string) => {
    const supabase = await createClient();

    // Fetch total and new counts in parallel
    const [totalResult, newResult] = await Promise.all([
      supabase
        .from('labor_request_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId),
      supabase
        .from('labor_request_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'new'),
    ]);

    // Handle errors gracefully - return zeros if queries fail
    if (totalResult.error || newResult.error) {
      console.error('Failed to fetch labor request stats:', {
        totalError: totalResult.error,
        newError: newResult.error,
      });
      return { total: 0, new: 0 };
    }

    return {
      total: totalResult.count || 0,
      new: newResult.count || 0,
    };
  },
  ['labor-request-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['notifications', 'stats'],
  }
);

export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
    return null;
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'agency_owner') {
    redirect('/');
    return null;
  }

  // Fetch agency and verify ownership
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select(
      `
      id,
      name,
      slug,
      description,
      logo_url,
      website,
      email,
      phone,
      is_claimed,
      claimed_by,
      claimed_at,
      verified,
      featured,
      profile_completion_percentage,
      last_edited_at,
      headquarters,
      founded_year,
      employee_count,
      rating,
      review_count,
      project_count
    `
    )
    .eq('slug', params.slug)
    .single();

  if (agencyError || !agency) {
    notFound();
  }

  // Verify ownership - user must own this agency
  if (agency.claimed_by !== user.id) {
    redirect('/');
    return null;
  }

  // Fetch compliance data for expiration alerts
  const { data: complianceData, error: complianceError } = await supabase
    .from('agency_compliance')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .not('expiration_date', 'is', null);

  // Log compliance fetch errors but don't block rendering
  const complianceFetchError = complianceError
    ? `Failed to load compliance data: ${complianceError.message}`
    : null;

  if (complianceError) {
    console.error(
      `Failed to fetch compliance data for agency ${agency.id}:`,
      complianceError
    );
  }

  const complianceItems =
    !complianceError && complianceData
      ? complianceData.map(toComplianceItemFull)
      : [];

  // Fetch labor request stats
  const laborRequestStats = await getLaborRequestStats(agency.id);

  return (
    <div className="space-y-6">
      {/* Compliance Expiration Alert */}
      <ComplianceExpirationAlert
        expiringItems={complianceItems}
        complianceUrl={`/dashboard/agency/${agency.slug}/compliance`}
        agencyId={agency.id}
        fetchError={complianceFetchError}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        {agency.logo_url && (
          <Image
            src={agency.logo_url}
            alt={`${agency.name} logo`}
            width={80}
            height={80}
            className="rounded-industrial-sharp object-contain border-2 border-industrial-graphite-200"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
              {agency.name}
            </h1>
            {agency.verified && (
              <Badge variant="orange" className="gap-1">
                Verified
              </Badge>
            )}
            {agency.featured && (
              <Badge variant="secondary" className="gap-1">
                Featured
              </Badge>
            )}
          </div>
          {agency.description && (
            <p className="font-body text-industrial-graphite-400 mt-2">
              {agency.description}
            </p>
          )}
        </div>
      </div>

      {/* Dashboard Overview */}
      <DashboardOverview agency={agency} laborRequestStats={laborRequestStats} />
    </div>
  );
}
