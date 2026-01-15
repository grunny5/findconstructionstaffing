-- =============================================================================
-- Agency Matching Algorithm Function
-- Created: 2026-01-14
-- Feature: 062-request-labor
-- Description: SQL RPC function to match agencies to craft requirements based on
--              trade and region. Returns top 5 active agencies ranked by match score.
-- =============================================================================

CREATE OR REPLACE FUNCTION match_agencies_to_craft(
  p_trade_id UUID,
  p_region_id UUID
) RETURNS TABLE(
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  match_score INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION match_agencies_to_craft IS 'Matches top 5 verified agencies to a craft requirement based on trade and region. Returns agencies ranked by match score (static score of 100 for all matches).';
