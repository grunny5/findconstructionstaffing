-- =============================================================================
-- Fix Function Search Path Security
-- Created: 2026-01-16
-- Issue: Supabase lint warning - function_search_path_mutable
-- Description: Add explicit search_path to functions to prevent search path
--              hijacking attacks. Sets search_path to 'public, pg_catalog' which
--              restricts functions to only access public schema and system catalog.
-- =============================================================================

-- Fix update_labor_request_updated_at function
CREATE OR REPLACE FUNCTION update_labor_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_labor_request_updated_at() IS
'Trigger function to automatically update updated_at timestamp on labor_requests table.
search_path is explicitly set to prevent search path hijacking attacks.';

-- Fix match_agencies_to_craft function
CREATE OR REPLACE FUNCTION match_agencies_to_craft(
  p_trade_id UUID,
  p_region_id UUID
) RETURNS TABLE(
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  match_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    100::INTEGER AS match_score -- Base score for all matches
  FROM agencies a
  WHERE
    -- Only active and verified agencies can receive labor requests
    a.is_active = TRUE
    AND a.verified = TRUE
    -- Must offer the requested trade
    AND EXISTS (
      SELECT 1 FROM agency_trades at
      WHERE at.agency_id = a.id AND at.trade_id = p_trade_id
    )
    -- Must operate in the requested region
    AND EXISTS (
      SELECT 1 FROM agency_regions ar
      WHERE ar.agency_id = a.id AND ar.region_id = p_region_id
    )
  ORDER BY a.name ASC
  LIMIT 5;
END;
$$;

COMMENT ON FUNCTION match_agencies_to_craft(UUID, UUID) IS
'Matches top 5 verified agencies to a craft requirement based on trade and region.
Returns agencies ranked by match score (static score of 100 for all matches).
search_path is explicitly set to prevent search path hijacking attacks.';

-- =============================================================================
-- VERIFICATION QUERIES (Optional - run manually to verify)
-- =============================================================================

-- Verify search_path is set on functions
-- SELECT
--   proname as function_name,
--   prosecdef as is_security_definer,
--   proconfig as search_path_config
-- FROM pg_proc
-- WHERE proname IN ('update_labor_request_updated_at', 'match_agencies_to_craft')
-- AND pronamespace = 'public'::regnamespace;

-- Expected output should show proconfig with 'search_path=public, pg_catalog'
