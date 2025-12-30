import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

interface AgencyDetailPageProps {
  params: {
    id: string;
  };
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

  // Fetch agency details
  const { data: agency, error: agencyError } = await supabase
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
      is_active,
      is_claimed,
      claimed_by,
      created_at,
      updated_at,
      profile_completion_percentage
    `
    )
    .eq('id', params.id)
    .single();

  if (agencyError || !agency) {
    notFound();
    return null;
  }

  // Fetch owner profile if agency is claimed
  let ownerProfile: { email: string | null; full_name: string | null } | null =
    null;
  if (agency.claimed_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.claimed_by)
      .single();

    ownerProfile = profile || null;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/admin/agencies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agencies
          </Button>
        </Link>
      </div>

      {/* Page title with edit button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Agency Details</h1>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Agency
        </Button>
      </div>

      {/* Basic Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Agency Name
              </label>
              <p className="mt-1 text-base">{agency.name}</p>
            </div>

            {/* Slug */}
            <div>
              <label className="text-sm font-medium text-gray-500">Slug</label>
              <p className="mt-1 text-base font-mono text-sm">{agency.slug}</p>
            </div>

            {/* Email */}
            {agency.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="mt-1 text-base">{agency.email}</p>
              </div>
            )}

            {/* Phone */}
            {agency.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Phone
                </label>
                <p className="mt-1 text-base">{agency.phone}</p>
              </div>
            )}

            {/* Website */}
            {agency.website && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Website
                </label>
                <p className="mt-1 text-base">
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {agency.website}
                  </a>
                </p>
              </div>
            )}

            {/* Headquarters */}
            {agency.headquarters && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Headquarters
                </label>
                <p className="mt-1 text-base">{agency.headquarters}</p>
              </div>
            )}

            {/* Founded Year */}
            {agency.founded_year && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Founded Year
                </label>
                <p className="mt-1 text-base">{agency.founded_year}</p>
              </div>
            )}

            {/* Employee Count */}
            {agency.employee_count && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Employee Count
                </label>
                <p className="mt-1 text-base">{agency.employee_count}</p>
              </div>
            )}

            {/* Company Size */}
            {agency.company_size && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Company Size
                </label>
                <p className="mt-1 text-base">{agency.company_size}</p>
              </div>
            )}

            {/* Offers Per Diem */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Offers Per Diem
              </label>
              <p className="mt-1 text-base">
                {agency.offers_per_diem ? 'Yes' : 'No'}
              </p>
            </div>

            {/* Is Union */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Union Shop
              </label>
              <p className="mt-1 text-base">{agency.is_union ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Description - full width */}
          {agency.description && (
            <div className="pt-2">
              <label className="text-sm font-medium text-gray-500">
                Description
              </label>
              <p className="mt-1 text-base whitespace-pre-wrap">
                {agency.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status & Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Status */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={agency.is_active ? 'default' : 'secondary'}>
                  {agency.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Claimed Status */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Claimed
              </label>
              <div className="mt-1">
                <Badge variant={agency.is_claimed ? 'default' : 'outline'}>
                  {agency.is_claimed ? 'Claimed' : 'Unclaimed'}
                </Badge>
              </div>
            </div>

            {/* Owner Profile */}
            {agency.is_claimed && ownerProfile && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Owner Name
                  </label>
                  <p className="mt-1 text-base">
                    {ownerProfile.full_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Owner Email
                  </label>
                  <p className="mt-1 text-base">
                    {ownerProfile.email || 'Not provided'}
                  </p>
                </div>
              </>
            )}

            {/* Profile Completion */}
            {agency.profile_completion_percentage !== null && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Profile Completion
                </label>
                <p className="mt-1 text-base">
                  {agency.profile_completion_percentage}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timestamps Card */}
      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Created At */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Created
              </label>
              <p className="mt-1 text-base">{formatDate(agency.created_at)}</p>
            </div>

            {/* Updated At */}
            {agency.updated_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="mt-1 text-base">
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
