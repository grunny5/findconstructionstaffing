-- Fix search_path security issue in get_admin_integrations_summary function
-- Issue: Function has SECURITY DEFINER without explicit search_path, making it vulnerable
-- to search path manipulation attacks.
-- Remediation: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0011_function_search_path_mutable

-- Drop the existing function
DROP FUNCTION IF EXISTS get_admin_integrations_summary();

-- Recreate with explicit search_path set to 'public'
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
  FROM public.agencies a
  ORDER BY a.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

-- Restore grants
GRANT EXECUTE ON FUNCTION get_admin_integrations_summary() TO authenticated;

-- Restore comment
COMMENT ON FUNCTION get_admin_integrations_summary()
  IS 'Returns all agencies with integration configuration for admin dashboard. Uses explicit search_path for security.';
