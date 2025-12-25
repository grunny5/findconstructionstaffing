-- =============================================================================
-- ROLLBACK SCRIPT: Profile Completion Trigger
-- =============================================================================
-- This script rolls back migration 20251225_001_create_profile_completion_trigger.sql
-- ⚠️ WARNING: This will remove automatic profile completion calculation

-- Drop triggers first (in reverse order of creation)
DROP TRIGGER IF EXISTS agency_regions_completion_trigger ON agency_regions;
DROP TRIGGER IF EXISTS agency_trades_completion_trigger ON agency_trades;
DROP TRIGGER IF EXISTS agencies_profile_completion_trigger ON agencies;

-- Drop trigger functions
DROP FUNCTION IF EXISTS trigger_update_agency_completion_from_relations();
DROP FUNCTION IF EXISTS trigger_update_agency_completion();

-- Drop calculation function
DROP FUNCTION IF EXISTS calculate_profile_completion(agencies);

-- Optional: Reset all completion percentages to 0
-- Uncomment if you want to clear existing completion data
-- UPDATE agencies SET profile_completion_percentage = 0;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Rollback complete. Profile completion triggers and functions removed.';
  RAISE NOTICE 'Note: profile_completion_percentage column still exists but will not auto-update.';
END $$;
