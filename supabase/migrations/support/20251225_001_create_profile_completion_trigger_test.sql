-- =============================================================================
-- TEST SCRIPT: Profile Completion Trigger
-- =============================================================================
-- This script tests the profile completion calculation trigger
-- Run this after applying migration 20251225_001_create_profile_completion_trigger.sql
--
-- To run: psql -U postgres -d your_database -f 20251225_001_create_profile_completion_trigger_test.sql

-- =============================================================================
-- TEST 1: Verify Functions Exist
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 1: Verify Functions Exist ===';

  -- Check calculate_profile_completion function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_profile_completion') THEN
    RAISE NOTICE 'PASS: calculate_profile_completion function exists';
  ELSE
    RAISE EXCEPTION 'FAIL: calculate_profile_completion function not found';
  END IF;

  -- Check trigger functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_update_agency_completion') THEN
    RAISE NOTICE 'PASS: trigger_update_agency_completion function exists';
  ELSE
    RAISE EXCEPTION 'FAIL: trigger_update_agency_completion function not found';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_update_agency_completion_from_relations') THEN
    RAISE NOTICE 'PASS: trigger_update_agency_completion_from_relations function exists';
  ELSE
    RAISE EXCEPTION 'FAIL: trigger_update_agency_completion_from_relations function not found';
  END IF;
END $$;

-- =============================================================================
-- TEST 2: Verify Triggers Exist
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== TEST 2: Verify Triggers Exist ===';

  -- Check agencies trigger
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'agencies_profile_completion_trigger') THEN
    RAISE NOTICE 'PASS: agencies_profile_completion_trigger exists';
  ELSE
    RAISE EXCEPTION 'FAIL: agencies_profile_completion_trigger not found';
  END IF;

  -- Check agency_trades trigger
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'agency_trades_completion_trigger') THEN
    RAISE NOTICE 'PASS: agency_trades_completion_trigger exists';
  ELSE
    RAISE EXCEPTION 'FAIL: agency_trades_completion_trigger not found';
  END IF;

  -- Check agency_regions trigger
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'agency_regions_completion_trigger') THEN
    RAISE NOTICE 'PASS: agency_regions_completion_trigger exists';
  ELSE
    RAISE EXCEPTION 'FAIL: agency_regions_completion_trigger not found';
  END IF;
END $$;

-- =============================================================================
-- TEST 3: Test Minimal Profile (Only Name)
-- =============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  completion_pct INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 3: Minimal Profile (Only Name) ===';

  -- Create test agency with only name
  INSERT INTO agencies (name, slug, is_claimed, is_active, offers_per_diem, is_union)
  VALUES ('Test Minimal Agency', 'test-minimal', false, true, false, false)
  RETURNING id INTO test_agency_id;

  -- Get completion percentage
  SELECT profile_completion_percentage INTO completion_pct
  FROM agencies WHERE id = test_agency_id;

  IF completion_pct = 5 THEN
    RAISE NOTICE 'PASS: Minimal profile completion = % (expected 5)', completion_pct;
  ELSE
    RAISE EXCEPTION 'FAIL: Minimal profile completion = % (expected 5)', completion_pct;
  END IF;

  -- Cleanup
  DELETE FROM agencies WHERE id = test_agency_id;
END $$;

-- =============================================================================
-- TEST 4: Test Complete Profile
-- =============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  test_trade_id UUID;
  test_region_id UUID;
  completion_pct INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 4: Complete Profile ===';

  -- Create test trade and region (if they don't exist)
  INSERT INTO trades (name, slug)
  VALUES ('Test Trade', 'test-trade')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO test_trade_id;

  IF test_trade_id IS NULL THEN
    SELECT id INTO test_trade_id FROM trades WHERE slug = 'test-trade';
  END IF;

  INSERT INTO regions (name, state_code, slug)
  VALUES ('Test State', 'TS', 'test-state')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO test_region_id;

  IF test_region_id IS NULL THEN
    SELECT id INTO test_region_id FROM regions WHERE slug = 'test-state';
  END IF;

  -- Create complete agency profile
  INSERT INTO agencies (
    name, slug, description, website, phone, email, headquarters,
    logo_url, founded_year, employee_count, company_size,
    is_claimed, is_active, offers_per_diem, is_union
  )
  VALUES (
    'Test Complete Agency',
    'test-complete',
    'A comprehensive description of our agency',
    'https://example.com',
    '+1-555-1234',
    'test@example.com',
    'Houston, TX',
    'https://example.com/logo.png',
    2010,
    '50-100',
    'Medium',
    false,
    true,
    false,
    false
  )
  RETURNING id INTO test_agency_id;

  -- Add trade relationship
  INSERT INTO agency_trades (agency_id, trade_id)
  VALUES (test_agency_id, test_trade_id);

  -- Add region relationship
  INSERT INTO agency_regions (agency_id, region_id)
  VALUES (test_agency_id, test_region_id);

  -- Get completion percentage (should be recalculated by trades/regions triggers)
  SELECT profile_completion_percentage INTO completion_pct
  FROM agencies WHERE id = test_agency_id;

  IF completion_pct = 100 THEN
    RAISE NOTICE 'PASS: Complete profile completion = % (expected 100)', completion_pct;
  ELSE
    RAISE EXCEPTION 'FAIL: Complete profile completion = % (expected 100)', completion_pct;
  END IF;

  -- Cleanup
  DELETE FROM agency_trades WHERE agency_id = test_agency_id;
  DELETE FROM agency_regions WHERE agency_id = test_agency_id;
  DELETE FROM agencies WHERE id = test_agency_id;
  DELETE FROM trades WHERE id = test_trade_id;
  DELETE FROM regions WHERE id = test_region_id;
END $$;

-- =============================================================================
-- TEST 5: Test UPDATE Trigger
-- =============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  completion_before INTEGER;
  completion_after INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 5: UPDATE Trigger ===';

  -- Create minimal agency
  INSERT INTO agencies (name, slug, is_claimed, is_active, offers_per_diem, is_union)
  VALUES ('Test Update Agency', 'test-update', false, true, false, false)
  RETURNING id INTO test_agency_id;

  SELECT profile_completion_percentage INTO completion_before
  FROM agencies WHERE id = test_agency_id;

  -- Update to add description
  UPDATE agencies
  SET description = 'Now we have a description'
  WHERE id = test_agency_id;

  SELECT profile_completion_percentage INTO completion_after
  FROM agencies WHERE id = test_agency_id;

  IF completion_after = 15 AND completion_before = 5 THEN
    RAISE NOTICE 'PASS: Completion updated from % to % after adding description', completion_before, completion_after;
  ELSE
    RAISE EXCEPTION 'FAIL: Completion should be 15 (5+10), got %', completion_after;
  END IF;

  -- Cleanup
  DELETE FROM agencies WHERE id = test_agency_id;
END $$;

-- =============================================================================
-- TEST 6: Test Trades Relationship Trigger
-- =============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  test_trade_id UUID;
  completion_before INTEGER;
  completion_after INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 6: Trades Relationship Trigger ===';

  -- Create test trade
  INSERT INTO trades (name, slug)
  VALUES ('Test Trade Rel', 'test-trade-rel')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO test_trade_id;

  IF test_trade_id IS NULL THEN
    SELECT id INTO test_trade_id FROM trades WHERE slug = 'test-trade-rel';
  END IF;

  -- Create minimal agency
  INSERT INTO agencies (name, slug, is_claimed, is_active, offers_per_diem, is_union)
  VALUES ('Test Trades Trigger', 'test-trades-trigger', false, true, false, false)
  RETURNING id INTO test_agency_id;

  SELECT profile_completion_percentage INTO completion_before
  FROM agencies WHERE id = test_agency_id;

  -- Add trade relationship (should trigger recalculation)
  INSERT INTO agency_trades (agency_id, trade_id)
  VALUES (test_agency_id, test_trade_id);

  SELECT profile_completion_percentage INTO completion_after
  FROM agencies WHERE id = test_agency_id;

  IF completion_after = 25 AND completion_before = 5 THEN
    RAISE NOTICE 'PASS: Completion updated from % to % after adding trade', completion_before, completion_after;
  ELSE
    RAISE EXCEPTION 'FAIL: Completion should be 25 (5+20), got %', completion_after;
  END IF;

  -- Cleanup
  DELETE FROM agency_trades WHERE agency_id = test_agency_id;
  DELETE FROM agencies WHERE id = test_agency_id;
  DELETE FROM trades WHERE id = test_trade_id;
END $$;

-- =============================================================================
-- TEST 7: Test Founded Year Validation
-- =============================================================================

DO $$
DECLARE
  test_agency_id UUID;
  completion_valid INTEGER;
  completion_invalid INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 7: Founded Year Validation ===';

  -- Create agency with valid founded year
  INSERT INTO agencies (name, slug, founded_year, is_claimed, is_active, offers_per_diem, is_union)
  VALUES ('Test Founded Valid', 'test-founded-valid', 2010, false, true, false, false)
  RETURNING id INTO test_agency_id;

  SELECT profile_completion_percentage INTO completion_valid
  FROM agencies WHERE id = test_agency_id;

  DELETE FROM agencies WHERE id = test_agency_id;

  -- Create agency with invalid founded year (future)
  INSERT INTO agencies (name, slug, founded_year, is_claimed, is_active, offers_per_diem, is_union)
  VALUES ('Test Founded Invalid', 'test-founded-invalid', 9999, false, true, false, false)
  RETURNING id INTO test_agency_id;

  SELECT profile_completion_percentage INTO completion_invalid
  FROM agencies WHERE id = test_agency_id;

  IF completion_valid = 10 AND completion_invalid = 5 THEN
    RAISE NOTICE 'PASS: Valid year = %, Invalid year = %', completion_valid, completion_invalid;
  ELSE
    RAISE EXCEPTION 'FAIL: Valid year should be 10, invalid should be 5. Got % and %', completion_valid, completion_invalid;
  END IF;

  -- Cleanup
  DELETE FROM agencies WHERE id = test_agency_id;
END $$;

-- =============================================================================
-- TEST 8: Verify Existing Agencies Have Completion Calculated
-- =============================================================================

DO $$
DECLARE
  total_agencies INTEGER;
  agencies_with_completion INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 8: Backfill Verification ===';

  SELECT COUNT(*) INTO total_agencies FROM agencies;
  SELECT COUNT(*) INTO agencies_with_completion
  FROM agencies
  WHERE profile_completion_percentage IS NOT NULL;

  IF total_agencies = agencies_with_completion THEN
    RAISE NOTICE 'PASS: All % agencies have completion percentage calculated', total_agencies;
  ELSE
    RAISE EXCEPTION 'FAIL: Only %/% agencies have completion calculated', agencies_with_completion, total_agencies;
  END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'ALL TESTS PASSED';
  RAISE NOTICE '=====================================================';
END $$;
