-- Migration: Fix Profile Completion Function Volatility and Validation
-- Fixes: Changes IMMUTABLE to STABLE and includes 1800 in founded_year validation
-- Related: 20251225_001_create_profile_completion_trigger.sql

-- Replace the function with corrected version
CREATE OR REPLACE FUNCTION calculate_profile_completion(agency_row agencies)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE  -- Changed from IMMUTABLE - function queries database tables
AS $$
DECLARE
  score INTEGER := 0;
  trades_count INTEGER;
  regions_count INTEGER;
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Basic Info (20)
  IF agency_row.name IS NOT NULL AND TRIM(agency_row.name) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.description IS NOT NULL AND TRIM(agency_row.description) != '' THEN
    score := score + 10;
  END IF;

  IF agency_row.website IS NOT NULL AND TRIM(agency_row.website) != '' THEN
    score := score + 5;
  END IF;

  -- Contact (15)
  IF agency_row.phone IS NOT NULL AND TRIM(agency_row.phone) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.email IS NOT NULL AND TRIM(agency_row.email) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.headquarters IS NOT NULL AND TRIM(agency_row.headquarters) != '' THEN
    score := score + 5;
  END IF;

  -- Services (40)
  SELECT COUNT(*)
  INTO trades_count
  FROM agency_trades
  WHERE agency_id = agency_row.id;

  IF trades_count > 0 THEN
    score := score + 20;
  END IF;

  SELECT COUNT(*)
  INTO regions_count
  FROM agency_regions
  WHERE agency_id = agency_row.id;

  IF regions_count > 0 THEN
    score := score + 20;
  END IF;

  -- Additional (15)
  IF agency_row.logo_url IS NOT NULL AND TRIM(agency_row.logo_url) != '' THEN
    score := score + 10;
  END IF;

  -- Founded Year (5) - Changed to >= 1800 to include 1800
  IF agency_row.founded_year IS NOT NULL
     AND agency_row.founded_year >= 1800
     AND agency_row.founded_year <= current_year THEN
    score := score + 5;
  END IF;

  -- Details (10)
  IF agency_row.employee_count IS NOT NULL AND TRIM(agency_row.employee_count) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.company_size IS NOT NULL AND TRIM(agency_row.company_size) != '' THEN
    score := score + 5;
  END IF;

  RETURN score;
END;
$$;

COMMENT ON FUNCTION calculate_profile_completion IS 'Calculates profile completion percentage (0-100) - STABLE function that queries agency_trades and agency_regions';
