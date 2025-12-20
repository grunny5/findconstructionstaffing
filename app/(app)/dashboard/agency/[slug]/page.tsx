import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

interface DashboardPageProps {
  params: { slug: string };
}

/**
 * Render the dashboard page for an agency identified by the route slug.
 *
 * Checks authentication and user role, loads the agency by `params.slug`, verifies ownership,
 * and returns the agency dashboard UI. If the user is unauthenticated, not an agency owner,
 * not the owner of the agency, or the agency is missing, the function triggers navigation (redirect or 404)
 * and returns `null`.
 *
 * @param params.slug - The agency slug from the route
 * @returns A React element representing the agency dashboard, or `null` when navigation is redirected or a 404 is triggered
 */
export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = createClient();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {agency.logo_url && (
          <Image
            src={agency.logo_url}
            alt={`${agency.name} logo`}
            width={80}
            height={80}
            className="rounded-lg object-contain border"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{agency.name}</h1>
            {agency.verified && (
              <Badge variant="default" className="gap-1">
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
            <p className="text-muted-foreground mt-2">{agency.description}</p>
          )}
        </div>
      </div>

      {/* Dashboard Overview */}
      <DashboardOverview agency={agency} />
    </div>
  );
}