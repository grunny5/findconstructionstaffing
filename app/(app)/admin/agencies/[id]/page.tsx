import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { AgencyStatusToggle } from '@/components/admin/AgencyStatusToggle';
import { AgencyEditButton } from '@/components/admin/AgencyEditButton';
import { ComplianceBadges } from '@/components/compliance/ComplianceBadges';
import { COMPLIANCE_DISPLAY_NAMES, isComplianceExpired, type ComplianceType } from '@/types/api';
import { secureLog } from '@/lib/utils/secure-logging';

interface AgencyDetailPageProps {
  params: {
    id: string;
  };
}

interface ComplianceRow {
  id: string;
  compliance_type: string;
  is_active: boolean;
  is_verified: boolean;
  expiration_date: string | null;
  document_url: string | null;
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default async function AgencyDetailPage({
  params,
}: AgencyDetailPageProps) {
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

  // Check admin authorization
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    profileError ||
    !currentUserProfile ||
    currentUserProfile.role !== 'admin'
  ) {
    redirect('/');
    return null;
  }

  // Parallelize independent database queries for better performance
  const [agencyResult, complianceResult] = await Promise.all([
    // Query 1: Fetch agency details with trades and regions
    supabase
      .from('agencies')
      .select(
        `
        id,
        name,
        slug,
        description,
        website,
        phone,
        email,
        headquarters,
        founded_year,
        employee_count,
        company_size,
        offers_per_diem,
        is_union,
        verified,
        is_active,
        is_claimed,
        claimed_by,
        created_at,
        updated_at,
        profile_completion_percentage,
        trades:agency_trades(
          trade:trades(
            id,
            name,
            slug
          )
        ),
        regions:agency_regions(
          region:regions(
            id,
            name,
            slug,
            state_code
          )
        )
      `
      )
      .eq('id', params.id)
      .single(),

    // Query 2: Fetch compliance data
    supabase
      .from('agency_compliance')
      .select(
        'id, compliance_type, is_active, is_verified, expiration_date, document_url, notes, verified_by, verified_at'
      )
      .eq('agency_id', params.id)
      .eq('is_active', true)
      .order('compliance_type'),
  ]);

  const { data: agency, error: agencyError } = agencyResult;
  const { data: complianceData, error: complianceError } = complianceResult;

  // Transform trades and regions from nested structure to flat arrays
  const agencyWithRelations = agency
    ? {
        ...agency,
        trades: (
          agency.trades as unknown as Array<{
            trade: { id: string; name: string; slug: string } | null;
          }>
        )
          ?.map((at) => at.trade)
          .filter(
            (t): t is { id: string; name: string; slug: string } => t !== null
          ),
        regions: (
          agency.regions as unknown as Array<{
            region: {
              id: string;
              name: string;
              slug: string;
              state_code: string;
            } | null;
          }>
        )
          ?.map((ar) => ar.region)
          .filter(
            (
              r
            ): r is {
              id: string;
              name: string;
              slug: string;
              state_code: string;
            } => r !== null
          ),
      }
    : null;

  if (agencyError || !agencyWithRelations) {
    notFound();
    return null;
  }

  // Fetch owner profile if agency is claimed (sequential - depends on agency data)
  let ownerProfile: { email: string | null; full_name: string | null } | null =
    null;
  if (agencyWithRelations.claimed_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agencyWithRelations.claimed_by)
      .single();

    ownerProfile = profile || null;
  }

  // Log error but don't fail the page if compliance data can't be fetched
  if (complianceError) {
    secureLog.error('Error fetching compliance data for agency', {
      agencyId: params.id,
      error: complianceError,
    });
  }

  const complianceItems = (complianceData || []).map((c: ComplianceRow) => ({
    id: c.id,
    type: c.compliance_type as ComplianceType,
    displayName: COMPLIANCE_DISPLAY_NAMES[c.compliance_type as keyof typeof COMPLIANCE_DISPLAY_NAMES] || String(c.compliance_type),
    isActive: c.is_active,
    isVerified: c.is_verified,
    expirationDate: c.expiration_date,
    isExpired: isComplianceExpired(c.expiration_date),
    documentUrl: c.document_url,
    notes: c.notes,
    verifiedBy: c.verified_by,
    verifiedAt: c.verified_at,
  }));

  return (
    <div className="container mx-auto p-4 max-w-5xl min-h-screen">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/admin/agencies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agencies
          </Button>
        </Link>
      </div>

      {/* Page title with action buttons */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Agency Details
        </h1>
        <div className="flex gap-2">
          <AgencyStatusToggle
            agencyId={agencyWithRelations.id}
            agencyName={agencyWithRelations.name}
            currentStatus={
              agencyWithRelations.is_active ? 'active' : 'inactive'
            }
          />
          <AgencyEditButton agency={agencyWithRelations} />
        </div>
      </div>

      {/* Basic Information Card */}
      <Card className="mb-6 border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Agency Name
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {agencyWithRelations.name}
              </p>
            </div>

            {/* Slug */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Slug
              </label>
              <p className="mt-1 font-mono text-sm text-industrial-graphite-600">
                {agencyWithRelations.slug}
              </p>
            </div>

            {/* Email */}
            {agencyWithRelations.email && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Email
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.email}
                </p>
              </div>
            )}

            {/* Phone */}
            {agencyWithRelations.phone && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Phone
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.phone}
                </p>
              </div>
            )}

            {/* Website */}
            {agencyWithRelations.website && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Website
                </label>
                <p className="mt-1 font-body text-base">
                  <a
                    href={agencyWithRelations.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-industrial-orange hover:text-industrial-orange-500 hover:underline"
                  >
                    {agencyWithRelations.website}
                  </a>
                </p>
              </div>
            )}

            {/* Headquarters */}
            {agencyWithRelations.headquarters && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Headquarters
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.headquarters}
                </p>
              </div>
            )}

            {/* Founded Year */}
            {agencyWithRelations.founded_year && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Founded Year
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.founded_year}
                </p>
              </div>
            )}

            {/* Employee Count */}
            {agencyWithRelations.employee_count && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Employee Count
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.employee_count}
                </p>
              </div>
            )}

            {/* Company Size */}
            {agencyWithRelations.company_size && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Company Size
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.company_size}
                </p>
              </div>
            )}

            {/* Offers Per Diem */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Offers Per Diem
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {agencyWithRelations.offers_per_diem ? 'Yes' : 'No'}
              </p>
            </div>

            {/* Is Union */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Union Shop
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {agencyWithRelations.is_union ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Description - full width */}
          {agencyWithRelations.description && (
            <div className="pt-2">
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Description
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600 whitespace-pre-wrap">
                {agencyWithRelations.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="mb-6 border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Status & Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Status */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Status
              </label>
              <div className="mt-1">
                <Badge
                  variant={
                    agencyWithRelations.is_active ? 'orange' : 'secondary'
                  }
                >
                  {agencyWithRelations.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Claimed Status */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Claimed
              </label>
              <div className="mt-1">
                <Badge
                  variant={
                    agencyWithRelations.is_claimed ? 'default' : 'outline'
                  }
                >
                  {agencyWithRelations.is_claimed ? 'Claimed' : 'Unclaimed'}
                </Badge>
              </div>
            </div>

            {/* Owner Profile */}
            {agencyWithRelations.is_claimed && ownerProfile && (
              <>
                <div>
                  <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                    Owner Name
                  </label>
                  <p className="mt-1 font-body text-base text-industrial-graphite-600">
                    {ownerProfile.full_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                    Owner Email
                  </label>
                  <p className="mt-1 font-body text-base text-industrial-graphite-600">
                    {ownerProfile.email || 'Not provided'}
                  </p>
                </div>
              </>
            )}

            {/* Profile Completion */}
            {agencyWithRelations.profile_completion_percentage !== null && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Profile Completion
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {agencyWithRelations.profile_completion_percentage}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Verification Card */}
      <Card className="mb-6 border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Compliance & Verification</span>
            <Badge variant="outline" className="font-body">
              {complianceItems.length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {complianceItems.length === 0 ? (
            <div className="text-center py-8 bg-industrial-graphite-50 rounded-industrial-base">
              <FileWarning className="h-12 w-12 text-industrial-graphite-300 mx-auto mb-3" />
              <p className="font-body text-sm text-industrial-graphite-400">
                No compliance certifications added yet
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-industrial-graphite-200">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-green-600">
                    {complianceItems.filter((c) => c.isVerified && !c.isExpired).length}
                  </div>
                  <div className="text-xs font-body text-industrial-graphite-400 uppercase">
                    Verified
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-industrial-orange-600">
                    {complianceItems.filter((c) => !c.isVerified && !c.isExpired).length}
                  </div>
                  <div className="text-xs font-body text-industrial-graphite-400 uppercase">
                    Pending
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-red-600">
                    {complianceItems.filter((c) => c.isExpired).length}
                  </div>
                  <div className="text-xs font-body text-industrial-graphite-400 uppercase">
                    Expired
                  </div>
                </div>
              </div>

              <ComplianceBadges compliance={complianceItems} variant="default" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Timestamps Card */}
      <Card className="border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Created At */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Created
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {formatDate(agency.created_at)}
              </p>
            </div>

            {/* Updated At */}
            {agencyWithRelations.updated_at && (
              <div>
                <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                  Last Updated
                </label>
                <p className="mt-1 font-body text-base text-industrial-graphite-600">
                  {formatDate(agency.updated_at)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
