import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/admin/UsersTable';
import type { Profile } from '@/types/database';

export default async function AdminUsersPage() {
  const supabase = createClient();

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
    .select('id, email, full_name, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Error loading users. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UsersTable users={(users as Profile[]) || []} />
    </div>
  );
}
