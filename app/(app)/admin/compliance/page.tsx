/**
 * Admin Compliance Overview Page
 * Feature: 013-industry-compliance-and-verification
 * Task: 6.1.6 - Create Admin Compliance Overview Page
 *
 * Displays all agencies with compliance issues for admin monitoring
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ComplianceOverviewTable } from '@/components/admin/ComplianceOverviewTable';

export default async function AdminCompliancePage() {
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

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
    return null;
  }

  // Fetch all compliance items with expiration dates or pending verification
  const { data: complianceData, error: complianceError } = await supabase
    .from('agency_compliance')
    .select(
      `
      id,
      agency_id,
      compliance_type,
      is_active,
      is_verified,
      verified_by,
      verified_at,
      document_url,
      expiration_date,
      notes,
      agencies!inner(
        id,
        name,
        slug,
        is_active
      )
    `
    )
    .eq('is_active', true)
    .eq('agencies.is_active', true)
    .or('expiration_date.not.is.null,is_verified.eq.false')
    .order('expiration_date', { ascending: true, nullsFirst: false });

  if (complianceError) {
    console.error('Error fetching compliance data:', complianceError);
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600 mb-6">
          Compliance Overview
        </h1>
        <div className="bg-industrial-orange-100 border-2 border-industrial-orange-300 rounded-industrial-sharp px-4 py-3">
          <p className="font-body text-sm text-industrial-orange-800">
            Error loading compliance data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Transform the data to match ComplianceDataRow interface
  // Supabase returns agencies as an array due to the join, but we need a single object
  const transformedData = (complianceData || []).map((row) => ({
    ...row,
    agencies: Array.isArray(row.agencies) ? row.agencies[0] : row.agencies,
  }));

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Compliance Overview
        </h1>
        <p className="font-body text-sm text-industrial-graphite-400 mt-2">
          Monitor and manage agency compliance certifications
        </p>
      </div>
      <ComplianceOverviewTable complianceData={transformedData} />
    </div>
  );
}
