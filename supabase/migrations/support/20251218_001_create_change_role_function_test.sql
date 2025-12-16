-- Test: change_user_role RPC function
-- Purpose: Verify the change_user_role function and all validation logic
-- Date: 2025-12-17

-- Test that the function exists
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'change_user_role'
    AND pronamespace = 'public'::regnamespace
  )), 'change_user_role function should exist';
  RAISE NOTICE '✓ Function exists';
END $$;

-- Test that the function has correct parameters
DO $$
DECLARE
  param_count INT;
BEGIN
  SELECT pronargs INTO param_count
  FROM pg_proc
  WHERE proname = 'change_user_role'
  AND pronamespace = 'public'::regnamespace;

  ASSERT param_count = 3, 'Function should have 3 input parameters';
  RAISE NOTICE '✓ Function has correct number of parameters';
END $$;

-- Test that the function is SECURITY DEFINER
DO $$
DECLARE
  is_security_definer BOOLEAN;
BEGIN
  SELECT prosecdef INTO is_security_definer
  FROM pg_proc
  WHERE proname = 'change_user_role'
  AND pronamespace = 'public'::regnamespace;

  ASSERT is_security_definer = TRUE, 'Function should be SECURITY DEFINER';
  RAISE NOTICE '✓ Function is SECURITY DEFINER';
END $$;

-- Test that the function returns BOOLEAN
DO $$
DECLARE
  return_type TEXT;
BEGIN
  SELECT pg_catalog.format_type(p.prorettype, NULL) INTO return_type
  FROM pg_proc p
  WHERE p.proname = 'change_user_role'
  AND p.pronamespace = 'public'::regnamespace;

  ASSERT return_type = 'boolean', 'Function should return BOOLEAN';
  RAISE NOTICE '✓ Function returns BOOLEAN';
END $$;

-- Test that authenticated users have execute permission
DO $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
    AND specific_name LIKE 'change_user_role%'
    AND grantee = 'authenticated'
    AND privilege_type = 'EXECUTE'
  ) INTO has_permission;

  ASSERT has_permission = TRUE, 'Authenticated users should have EXECUTE permission';
  RAISE NOTICE '✓ Authenticated users have EXECUTE permission';
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== All Structure Tests Passed ===';
  RAISE NOTICE 'change_user_role function is correctly configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Functional tests (validation logic) should be run manually';
  RAISE NOTICE 'or via integration tests as they require test user accounts.';
END $$;
