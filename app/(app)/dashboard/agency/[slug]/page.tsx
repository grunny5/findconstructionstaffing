import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { Building2, Globe, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardPageProps {
  params: { slug: string };
}

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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agency.profile_completion_percentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Complete your profile to increase visibility
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agency.rating ? agency.rating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {agency.review_count} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agency.project_count}</div>
            <p className="text-xs text-muted-foreground">
              Total completed projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agency Information */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agency.headquarters && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Headquarters</p>
                <p className="text-sm text-muted-foreground">
                  {agency.headquarters}
                </p>
              </div>
            </div>
          )}

          {agency.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Website</p>
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {agency.website}
                </a>
              </div>
            </div>
          )}

          {agency.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{agency.email}</p>
              </div>
            </div>
          )}

          {agency.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{agency.phone}</p>
              </div>
            </div>
          )}

          {agency.founded_year && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Founded</p>
                <p className="text-sm text-muted-foreground">
                  {agency.founded_year}
                </p>
              </div>
            </div>
          )}

          {agency.employee_count && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Team Size</p>
                <p className="text-sm text-muted-foreground">
                  {agency.employee_count} employees
                </p>
              </div>
            </div>
          )}

          {agency.last_edited_at && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated:{' '}
                {new Date(agency.last_edited_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
