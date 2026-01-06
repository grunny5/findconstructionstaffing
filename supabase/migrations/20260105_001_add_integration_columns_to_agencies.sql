-- Add integration configuration columns to agencies table
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS integration_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS integration_provider TEXT,
  ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integration_last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS integration_sync_status TEXT,
  ADD COLUMN IF NOT EXISTS integration_sync_error TEXT;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agencies_integration_enabled
  ON agencies(integration_enabled) WHERE integration_enabled = true;

CREATE INDEX IF NOT EXISTS idx_agencies_integration_provider
  ON agencies(integration_provider) WHERE integration_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agencies_integration_last_sync
  ON agencies(integration_last_sync_at DESC) WHERE integration_enabled = true;

-- Add comments for documentation
COMMENT ON COLUMN agencies.integration_enabled IS 'Whether integration is enabled for this agency';
COMMENT ON COLUMN agencies.integration_provider IS 'Integration provider name (e.g., roaddog_jobs)';
COMMENT ON COLUMN agencies.integration_config IS 'JSON configuration for the integration';
COMMENT ON COLUMN agencies.integration_last_sync_at IS 'Timestamp of last successful sync';
COMMENT ON COLUMN agencies.integration_sync_status IS 'Status: success, failed, in_progress';
COMMENT ON COLUMN agencies.integration_sync_error IS 'Error message from last sync if failed';

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
