-- Migration: Create Profile Completion Auto-Calculation Trigger
-- Feature: Agency Claim and Profile Management (Feature #008, Task 5.1.2)
-- Description: Automatically calculates and updates profile_completion_percentage
--              when agency data changes (agencies, agency_trades, or agency_regions)

-- =============================================================================
-- FUNCTION: Calculate Profile Completion Percentage
-- =============================================================================
-- This function implements the same scoring logic as lib/utils/profile-completion.ts
--
-- Scoring breakdown (total 100):
-- - Basic Info (20): Name (5), Description (10), Website (5)
-- - Contact (15): Phone (5), Email (5), Headquarters (5)
-- - Services (40): Trades (20), Regions (20)
-- - Additional (15): Logo (10), Founded Year (5)
-- - Details (10): Employee Count (5), Company Size (5)

CREATE OR REPLACE FUNCTION calculate_profile_completion(agency_row agencies)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  score INTEGER := 0;
  trades_count INTEGER;
  regions_count INTEGER;
  current_year INTEGER;
BEGIN
  -- Get current year for founded_year validation
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- ========================================
  -- Basic Info (20)
  -- ========================================

  -- Name (5) - Required field, always present
  IF agency_row.name IS NOT NULL AND TRIM(agency_row.name) != '' THEN
    score := score + 5;
  END IF;

  -- Description (10)
  IF agency_row.description IS NOT NULL AND TRIM(agency_row.description) != '' THEN
    score := score + 10;
  END IF;

  -- Website (5)
  IF agency_row.website IS NOT NULL AND TRIM(agency_row.website) != '' THEN
    score := score + 5;
  END IF;

  -- ========================================
  -- Contact (15)
  -- ========================================

  -- Phone (5)
  IF agency_row.phone IS NOT NULL AND TRIM(agency_row.phone) != '' THEN
    score := score + 5;
  END IF;

  -- Email (5)
  IF agency_row.email IS NOT NULL AND TRIM(agency_row.email) != '' THEN
    score := score + 5;
  END IF;

  -- Headquarters (5)
  IF agency_row.headquarters IS NOT NULL AND TRIM(agency_row.headquarters) != '' THEN
    score := score + 5;
  END IF;

  -- ========================================
  -- Services (40)
  -- ========================================

  -- Trades (20) - Count from agency_trades junction table
  SELECT COUNT(*)
  INTO trades_count
  FROM agency_trades
  WHERE agency_id = agency_row.id;

  IF trades_count > 0 THEN
    score := score + 20;
  END IF;

  -- Regions (20) - Count from agency_regions junction table
  SELECT COUNT(*)
  INTO regions_count
  FROM agency_regions
  WHERE agency_id = agency_row.id;

  IF regions_count > 0 THEN
    score := score + 20;
  END IF;

  -- ========================================
  -- Additional (15)
  -- ========================================

  -- Logo (10)
  IF agency_row.logo_url IS NOT NULL AND TRIM(agency_row.logo_url) != '' THEN
    score := score + 10;
  END IF;

  -- Founded Year (5) - Must be between 1800 and current year
  IF agency_row.founded_year IS NOT NULL
     AND agency_row.founded_year > 1800
     AND agency_row.founded_year <= current_year THEN
    score := score + 5;
  END IF;

  -- ========================================
  -- Details (10)
  -- ========================================

  -- Employee Count (5)
  IF agency_row.employee_count IS NOT NULL AND TRIM(agency_row.employee_count) != '' THEN
    score := score + 5;
  END IF;

  -- Company Size (5)
  IF agency_row.company_size IS NOT NULL AND TRIM(agency_row.company_size) != '' THEN
    score := score + 5;
  END IF;

  -- Return final score (0-100)
  RETURN score;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION calculate_profile_completion IS 'Calculates profile completion percentage (0-100) based on agency data and relationships';

-- =============================================================================
-- TRIGGER FUNCTION: Auto-Update Completion on Agency Changes
-- =============================================================================
-- Automatically calculates and sets profile_completion_percentage
-- when agencies table is inserted or updated

CREATE OR REPLACE FUNCTION trigger_update_agency_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate and set the completion percentage
  NEW.profile_completion_percentage := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION trigger_update_agency_completion IS 'Trigger function to auto-update profile_completion_percentage on agencies INSERT/UPDATE';

-- =============================================================================
-- TRIGGER FUNCTION: Update Agency Completion on Relationship Changes
-- =============================================================================
-- Updates parent agency's completion when agency_trades or agency_regions change

CREATE OR REPLACE FUNCTION trigger_update_agency_completion_from_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_agency_id UUID;
  agency_record agencies;
BEGIN
  -- Determine which agency_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_agency_id := OLD.agency_id;
  ELSE
    affected_agency_id := NEW.agency_id;
  END IF;

  -- Fetch the full agency record
  SELECT * INTO agency_record
  FROM agencies
  WHERE id = affected_agency_id;

  -- Update the agency's completion percentage
  IF FOUND THEN
    UPDATE agencies
    SET profile_completion_percentage = calculate_profile_completion(agency_record),
        updated_at = NOW()
    WHERE id = affected_agency_id;
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION trigger_update_agency_completion_from_relations IS 'Trigger function to update agency completion when trades/regions relationships change';

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Trigger on agencies table (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS agencies_profile_completion_trigger ON agencies;
CREATE TRIGGER agencies_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_agency_completion();

COMMENT ON TRIGGER agencies_profile_completion_trigger ON agencies IS 'Auto-calculates profile_completion_percentage before INSERT/UPDATE';

-- Trigger on agency_trades table (AFTER INSERT OR UPDATE OR DELETE)
DROP TRIGGER IF EXISTS agency_trades_completion_trigger ON agency_trades;
CREATE TRIGGER agency_trades_completion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON agency_trades
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_agency_completion_from_relations();

COMMENT ON TRIGGER agency_trades_completion_trigger ON agency_trades IS 'Updates parent agency completion when trades change';

-- Trigger on agency_regions table (AFTER INSERT OR UPDATE OR DELETE)
DROP TRIGGER IF EXISTS agency_regions_completion_trigger ON agency_regions;
CREATE TRIGGER agency_regions_completion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON agency_regions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_agency_completion_from_relations();

COMMENT ON TRIGGER agency_regions_completion_trigger ON agency_regions IS 'Updates parent agency completion when regions change';

-- =============================================================================
-- BACKFILL: Update Existing Agencies
-- =============================================================================
-- Calculate completion percentage for all existing agencies

DO $$
DECLARE
  agency_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Backfilling profile_completion_percentage for existing agencies...';

  FOR agency_record IN SELECT * FROM agencies LOOP
    UPDATE agencies
    SET profile_completion_percentage = calculate_profile_completion(agency_record),
        updated_at = NOW()
    WHERE id = agency_record.id;

    updated_count := updated_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete. Updated % agencies.', updated_count;
END $$;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS agency_regions_completion_trigger ON agency_regions;
-- DROP TRIGGER IF EXISTS agency_trades_completion_trigger ON agency_trades;
-- DROP TRIGGER IF EXISTS agencies_profile_completion_trigger ON agencies;
-- DROP FUNCTION IF EXISTS trigger_update_agency_completion_from_relations();
-- DROP FUNCTION IF EXISTS trigger_update_agency_completion();
-- DROP FUNCTION IF EXISTS calculate_profile_completion(agencies);
--
-- UPDATE agencies SET profile_completion_percentage = 0;
