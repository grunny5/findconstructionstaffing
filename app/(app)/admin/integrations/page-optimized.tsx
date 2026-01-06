import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Type definition for the RPC response
interface IntegrationSummaryRPC {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  integration_enabled?: boolean;
  integration_provider?: string | null;
  integration_config?: Record<string, any>;
  integration_last_sync_at?: string | null;
  integration_sync_status?: string | null;
  integration_sync_error?: string | null;
}

export default async function AdminIntegrationsPageOptimized() {
  const supabase = await createClient();

  // Check authentication and admin status
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
    return null; // Ensure we don't continue execution in tests
  }

  // Check authorization - fetch profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    // Not an admin - redirect to home
    redirect('/');
    return null; // Ensure we don't continue execution in tests
  }

  // Single optimized RPC call to get all integration data
  const { data: integrations, error } = (await supabase.rpc(
    'get_admin_integrations_summary'
  )) as {
    data: IntegrationSummaryRPC[] | null;
    error: any;
  };

  if (error) {
    console.error('Error fetching integrations:', error);
    return <div>Error loading integrations</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Integration Management</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {integrations?.map((integration: IntegrationSummaryRPC) => (
            <li key={integration.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{integration.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created:{' '}
                    {new Date(integration.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      integration.integration_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {integration.integration_enabled ? 'Active' : 'Inactive'}
                  </span>
                  {integration.integration_provider && (
                    <p className="text-xs text-gray-500 mt-1">
                      Provider: {integration.integration_provider}
                    </p>
                  )}
                  {integration.integration_last_sync_at && (
                    <p className="mt-1 text-sm text-gray-500">
                      Last sync:{' '}
                      {integration.integration_sync_status || 'Unknown'}
                      {' - '}
                      {new Date(
                        integration.integration_last_sync_at
                      ).toLocaleString()}
                    </p>
                  )}
                  {integration.integration_sync_error && (
                    <p className="mt-1 text-xs text-red-500">
                      Error: {integration.integration_sync_error}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
