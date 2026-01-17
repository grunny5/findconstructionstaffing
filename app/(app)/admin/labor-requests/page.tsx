import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LaborRequestsTable } from '@/components/admin/LaborRequestsTable';

export default async function AdminLaborRequestsPage() {
  const supabase = await createClient();

  // 1. Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect('/login');
    return null;
  }

  // 2. Admin role verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
    return null;
  }

  // 3. Render client table component
  return (
    <div className="container mx-auto px-4 py-8">
      <LaborRequestsTable />
    </div>
  );
}
