import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminUsersActions } from '@/components/admin/AdminUsersActions';
import type { Profile } from '@/types/database';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
    return null;
  }

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, created_at, updated_at, last_password_change'
    )
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600 mb-6">
          User Management
        </h1>
        <div className="bg-industrial-orange-100 border-2 border-industrial-orange-300 rounded-industrial-sharp px-4 py-3">
          <p className="font-body text-sm text-industrial-orange-800">
            Error loading users. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600">
          User Management
        </h1>
        <AdminUsersActions />
      </div>
      <UsersTable users={(users as Profile[]) || []} currentUserId={user.id} />
    </div>
  );
}
