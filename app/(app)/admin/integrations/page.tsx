import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Type definitions for the integration data
interface IntegrationSummary {
  id: string;
  name: string;
  created_at: string;
  config: {
    is_active: boolean;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  last_sync: {
    status: string;
    created_at: string;
  } | null;
}

interface CompanyData {
  id: string;
  name: string;
  created_at: string;
  roaddog_jobs_configs?: Array<{
    company_id: string;
    is_active: boolean;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

interface SyncLog {
  company_id: string;
  status: string;
  created_at: string;
}

export default async function AdminIntegrationsPage() {
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

  // TODO: Consider migrating to the optimized RPC approach
  // The page-optimized.tsx version uses a single RPC call (get_admin_integrations_summary)
  // which consolidates the queries below into one database round-trip for better performance.
  // Once the RPC method is properly implemented in your database, you can switch to that approach.

  // Option 1: Single query with joins (recommended for PostgreSQL)
  const { data: integrationsData, error } = await supabase
    .from('companies')
    .select(
      `
      id,
      name,
      created_at,
      roaddog_jobs_configs!left (
        company_id,
        is_active,
        last_sync_at,
        created_at,
        updated_at
      )
    `
    )
    .order('name');

  if (error) {
    console.error('Error fetching integrations:', error);
    return <div>Error loading integrations</div>;
  }

  // Get latest sync status for each company with a config
  // Note: This second query is eliminated in the optimized version which uses RPC
  const companiesWithConfigs =
    integrationsData
      ?.filter(
        (company: any) =>
          Array.isArray(company.roaddog_jobs_configs) &&
          company.roaddog_jobs_configs.length > 0
      )
      .map((company: any) => company.id) || [];

  let syncLogs: SyncLog[] = [];
  if (companiesWithConfigs.length > 0) {
    // Get latest sync log for each company
    const { data: logs, error: syncError } = await supabase
      .from('roaddog_jobs_sync_logs')
      .select('company_id, status, created_at')
      .in('company_id', companiesWithConfigs)
      .order('created_at', { ascending: false });

    if (syncError) {
      console.error('Error fetching sync logs:', syncError);
      // Continue with empty syncLogs array rather than failing entirely
    }

    // Group by company_id and get the latest for each
    const latestSyncByCompany = new Map<string, SyncLog>();
    logs?.forEach((log: SyncLog) => {
      if (!latestSyncByCompany.has(log.company_id)) {
        latestSyncByCompany.set(log.company_id, log);
      }
    });
    syncLogs = Array.from(latestSyncByCompany.values());
  }

  // Transform data into the format needed for the UI
  const integrations: IntegrationSummary[] =
    integrationsData?.map((company: CompanyData) => {
      const config = company.roaddog_jobs_configs?.[0] || null;
      const lastSync =
        syncLogs.find((log: SyncLog) => log.company_id === company.id) || null;

      return {
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        config: config
          ? {
              is_active: config.is_active,
              last_sync_at: config.last_sync_at,
              created_at: config.created_at,
              updated_at: config.updated_at,
            }
          : null,
        last_sync: lastSync
          ? {
              status: lastSync.status,
              created_at: lastSync.created_at,
            }
          : null,
      };
    }) || [];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Integration Management</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {integrations.map((integration) => (
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
                      integration.config?.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {integration.config?.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {integration.last_sync && (
                    <p className="mt-1 text-sm text-gray-500">
                      Last sync: {integration.last_sync.status} -
                      {new Date(
                        integration.last_sync.created_at
                      ).toLocaleString()}
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
