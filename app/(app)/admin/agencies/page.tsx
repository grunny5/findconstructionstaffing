import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { AdminAgenciesTable } from '@/components/admin/AdminAgenciesTable';

export interface AdminAgency {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_claimed: boolean;
  claimed_by: string | null;
  created_at: string;
  profile_completion_percentage: number | null;
  owner_profile?: {
    email: string | null;
    full_name: string | null;
  } | null;
}

export default async function AdminAgenciesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
  }

  const { data: agencies, error: agenciesError } = await supabase
    .from('agencies')
    .select(
      `
      id,
      name,
      slug,
      is_active,
      is_claimed,
      claimed_by,
      created_at,
      profile_completion_percentage
    `
    )
    .order('created_at', { ascending: false });

  let agenciesWithOwners: AdminAgency[] = [];

  if (agencies && !agenciesError) {
    const claimedByIds = agencies
      .filter((a) => a.claimed_by)
      .map((a) => a.claimed_by as string);

    let ownerProfiles: Record<
      string,
      { email: string | null; full_name: string | null }
    > = {};

    if (claimedByIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', claimedByIds);

      if (profiles) {
        ownerProfiles = profiles.reduce(
          (acc, p) => {
            acc[p.id] = { email: p.email, full_name: p.full_name };
            return acc;
          },
          {} as Record<
            string,
            { email: string | null; full_name: string | null }
          >
        );
      }
    }

    agenciesWithOwners = agencies.map((agency) => ({
      ...agency,
      owner_profile: agency.claimed_by
        ? ownerProfiles[agency.claimed_by] || null
        : null,
    }));
  }

  if (agenciesError) {
    console.error('Error fetching agencies:', agenciesError);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Agency Management</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Error loading agencies. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Agency Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="download-template-button">
            <Link href="/api/admin/agencies/template" download>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Link>
          </Button>
          <Button variant="outline" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Agency
          </Button>
        </div>
      </div>
      <AdminAgenciesTable agencies={agenciesWithOwners} />
    </div>
  );
}
