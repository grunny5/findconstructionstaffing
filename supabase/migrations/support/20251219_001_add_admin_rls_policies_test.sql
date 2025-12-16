-- Test script for 20251219_001_add_admin_rls_policies.sql
-- Validates that admin RLS policies are correctly configured

\echo '=== Testing Admin RLS Policies ==='

-- Test 1: Verify admin policy exists
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Admins can view all profiles';

  IF policy_count = 0 THEN
    RAISE EXCEPTION 'FAIL: Admin view policy not found';
  END IF;

  RAISE NOTICE 'PASS: Admin view policy exists';
END $$;

-- Test 2: Verify policy is for SELECT command
DO $$
DECLARE
  policy_cmd TEXT;
BEGIN
  SELECT cmd
  INTO policy_cmd
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Admins can view all profiles';

  IF policy_cmd != 'SELECT' THEN
    RAISE EXCEPTION 'FAIL: Admin policy should be for SELECT, got: %', policy_cmd;
  END IF;

  RAISE NOTICE 'PASS: Admin policy is for SELECT command';
END $$;

-- Test 3: Verify existing user policies still exist
DO $$
DECLARE
  user_view_policy_count INTEGER;
  user_update_policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO user_view_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can view own profile';

  SELECT COUNT(*)
  INTO user_update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can update own profile';

  IF user_view_policy_count = 0 THEN
    RAISE EXCEPTION 'FAIL: User view policy missing';
  END IF;

  IF user_update_policy_count = 0 THEN
    RAISE EXCEPTION 'FAIL: User update policy missing';
  END IF;

  RAISE NOTICE 'PASS: Existing user policies unchanged';
END $$;

-- Test 4: Verify RLS is still enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity
  INTO rls_enabled
  FROM pg_class
  WHERE oid = 'public.profiles'::regclass;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAIL: RLS is not enabled on profiles table';
  END IF;

  RAISE NOTICE 'PASS: RLS is enabled on profiles table';
END $$;

-- Test 5: Count total policies (should be 3 now: 2 user + 1 admin)
DO $$
DECLARE
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles';

  IF total_policies < 3 THEN
    RAISE EXCEPTION 'FAIL: Expected at least 3 policies, found: %', total_policies;
  END IF;

  RAISE NOTICE 'PASS: Total policies count is correct: %', total_policies;
END $$;

\echo '=== All Admin RLS Policy Tests Passed ==='
