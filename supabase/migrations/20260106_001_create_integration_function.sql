-- Drop old function (references non-existent companies table)
DROP FUNCTION IF EXISTS get_admin_integrations_summary();

-- Create new function querying agencies table
CREATE OR REPLACE FUNCTION get_admin_integrations_summary()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ,
  integration_enabled BOOLEAN,
  integration_provider TEXT,
  integration_config JSONB,
  integration_last_sync_at TIMESTAMPTZ,
  integration_sync_status TEXT,
  integration_sync_error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    a.created_at,
    a.integration_enabled,
    a.integration_provider,
    a.integration_config,
    a.integration_last_sync_at,
    a.integration_sync_status,
    a.integration_sync_error
  FROM agencies a
  ORDER BY a.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_integrations_summary() TO authenticated;

COMMENT ON FUNCTION get_admin_integrations_summary()
  IS 'Returns all agencies with integration configuration for admin dashboard';
