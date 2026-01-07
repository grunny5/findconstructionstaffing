/**
 * Agency Compliance Dashboard Page
 * Feature: 013-industry-compliance-and-verification
 * Task: 2.1.2 - Create Compliance Dashboard Page
 *
 * Allows agency owners to view and manage their compliance certifications.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';

interface CompliancePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompliancePage({ params }: CompliancePageProps) {
  const { slug } = await params;
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

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

  // Fetch compliance data
  const { data: complianceData } = await supabase
    .from('agency_compliance')
    .select('*')
    .eq('agency_id', agency.id)
    .order('compliance_type');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-industrial-graphite-200 pb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Compliance Settings
        </h1>
        <p className="font-body text-sm text-industrial-graphite-400 mt-2">
          Manage your agency&apos;s compliance certifications and verification
          status.
        </p>
      </div>

      {/* Compliance Dashboard Client Component */}
      <ComplianceDashboard
        agencyId={agency.id}
        initialData={complianceData || []}
      />
    </div>
  );
}
