-- Create a function to get admin integrations summary with optimized query
CREATE OR REPLACE FUNCTION get_admin_integrations_summary()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  config_is_active BOOLEAN,
  config_last_sync_at TIMESTAMPTZ,
  config_created_at TIMESTAMPTZ,
  config_updated_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_sync_logs AS (
    -- Get the latest sync log for each company
    SELECT DISTINCT ON (company_id)
      company_id,
      status,
      created_at AS sync_created_at
    FROM roaddog_jobs_sync_logs
    ORDER BY company_id, created_at DESC
  )
  SELECT 
    c.id,
    c.name,
    c.created_at,
    cfg.is_active AS config_is_active,
    cfg.last_sync_at AS config_last_sync_at,
    cfg.created_at AS config_created_at,
    cfg.updated_at AS config_updated_at,
    lsl.status AS last_sync_status,
    lsl.sync_created_at AS last_sync_created_at
  FROM companies c
  LEFT JOIN roaddog_jobs_configs cfg ON c.id = cfg.company_id
  LEFT JOIN latest_sync_logs lsl ON c.id = lsl.company_id
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users (adjust based on your needs)
GRANT EXECUTE ON FUNCTION get_admin_integrations_summary() TO authenticated;

-- Create an index to optimize the sync logs query if not exists
CREATE INDEX IF NOT EXISTS idx_sync_logs_company_created 
ON roaddog_jobs_sync_logs(company_id, created_at DESC);

-- Create an index on companies name for sorting if not exists
CREATE INDEX IF NOT EXISTS idx_companies_name 
ON companies(name);