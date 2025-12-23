import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClaimsTable } from '@/components/admin/ClaimsTable';

export default async function AdminClaimsPage() {
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

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Claim Requests Management</h1>
      <ClaimsTable />
    </div>
  );
}
