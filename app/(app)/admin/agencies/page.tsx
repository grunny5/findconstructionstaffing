import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminAgenciesTable } from '@/components/admin/AdminAgenciesTable';
import { AdminAgenciesActions } from '@/components/admin/AdminAgenciesActions';
import type { AdminAgency } from '@/types/admin';

export default async function AdminAgenciesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
    return null; // Ensure we don't continue execution in tests
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
    return null; // Ensure we don't continue execution in tests
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
      <div className="container mx-auto p-6 min-h-screen">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600 mb-6">
          Agency Management
        </h1>
        <div className="bg-industrial-orange-100 border-2 border-industrial-orange-300 rounded-industrial-sharp px-4 py-3">
          <p className="font-body text-sm text-industrial-orange-800">
            Error loading agencies. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600">
          Agency Management
        </h1>
        <AdminAgenciesActions />
      </div>
      <AdminAgenciesTable agencies={agenciesWithOwners} />
    </div>
  );
}
