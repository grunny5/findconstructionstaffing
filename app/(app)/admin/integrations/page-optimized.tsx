import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Type definition for the RPC response
interface IntegrationSummaryRPC {
  id: string;
  name: string;
  created_at: string;
  config_is_active: boolean | null;
  config_last_sync_at: string | null;
  config_created_at: string | null;
  config_updated_at: string | null;
  last_sync_status: string | null;
  last_sync_created_at: string | null;
}

export default async function AdminIntegrationsPageOptimized() {
  const supabase = createClient();

  // Check authentication and admin status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user || authError) {
    redirect('/login');
  }

  // Check if user is admin (implement based on your auth setup)
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('is_admin')
  //   .eq('id', user.id)
  //   .single();
  
  // if (!profile?.is_admin) {
  //   redirect('/');
  // }

  // Single optimized RPC call to get all integration data
  const { data: integrations, error } = await supabase
    .rpc('get_admin_integrations_summary')
    .returns<IntegrationSummaryRPC[]>();

  if (error) {
    console.error('Error fetching integrations:', error);
    return <div>Error loading integrations</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Integration Management</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {integrations?.map((integration) => (
            <li key={integration.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{integration.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(integration.created_at).toLocaleDateString()}
                  </p>
                  {integration.config_created_at && (
                    <p className="text-sm text-gray-500">
                      Config updated: {new Date(integration.config_updated_at || integration.config_created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    integration.config_is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.config_is_active ? 'Active' : 'Inactive'}
                  </span>
                  {integration.last_sync_status && (
                    <p className="mt-1 text-sm text-gray-500">
                      Last sync: {integration.last_sync_status}
                    </p>
                  )}
                  {integration.last_sync_created_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(integration.last_sync_created_at).toLocaleString()}
                    </p>
                  )}
                  {integration.config_last_sync_at && (
                    <p className="text-xs text-gray-400">
                      Config sync: {new Date(integration.config_last_sync_at).toLocaleString()}
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