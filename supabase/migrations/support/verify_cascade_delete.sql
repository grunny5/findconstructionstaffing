-- ============================================================================
-- CASCADE Delete Verification Test
-- ============================================================================
-- Purpose: Verify that deleting a user from auth.users automatically
--          deletes the corresponding profile from public.profiles
--
-- Expected Behavior:
--   1. Create test user in auth.users
--   2. Create corresponding profile in public.profiles
--   3. Delete user from auth.users
--   4. Profile should be automatically deleted (CASCADE)
--
-- Run this script manually to verify CASCADE delete works correctly.
-- DO NOT run this in production - for testing only!
-- ============================================================================

-- Test Setup
DO $$
DECLARE
  test_user_id UUID;
  profile_count INT;
BEGIN
  -- Step 1: Create a test user (simulating what auth.users would have)
  -- Note: In production, users are created via Supabase Auth, not direct INSERT
  -- This is just for testing the CASCADE constraint

  RAISE NOTICE '=== CASCADE Delete Verification Test ===';
  RAISE NOTICE '';

  -- Generate a unique test user ID
  test_user_id := gen_random_uuid();

  RAISE NOTICE 'Step 1: Creating test user with ID: %', test_user_id;

  -- Insert test user into auth.users
  -- (In real scenario, this would be done by Supabase Auth)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'cascade-test-' || test_user_id || '@example.com',
    crypt('test_password', gen_salt('bf')),
    NOW(),
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✓ Test user created';
  RAISE NOTICE '';

  -- Step 2: Create corresponding profile
  RAISE NOTICE 'Step 2: Creating test profile';

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    last_password_change,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'cascade-test-' || test_user_id || '@example.com',
    'CASCADE Test User',
    'job_seeker',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE '✓ Test profile created';
  RAISE NOTICE '';

  -- Step 3: Verify profile exists
  RAISE NOTICE 'Step 3: Verifying profile exists before delete';

  SELECT COUNT(*) INTO profile_count
  FROM public.profiles
  WHERE id = test_user_id;

  IF profile_count = 1 THEN
    RAISE NOTICE '✓ Profile exists (count: %)', profile_count;
  ELSE
    RAISE EXCEPTION 'ERROR: Profile not found! Expected 1, got %', profile_count;
  END IF;

  RAISE NOTICE '';

  -- Step 4: Delete the user
  RAISE NOTICE 'Step 4: Deleting test user from auth.users';

  DELETE FROM auth.users WHERE id = test_user_id;

  RAISE NOTICE '✓ User deleted';
  RAISE NOTICE '';

  -- Step 5: Verify profile was automatically deleted (CASCADE)
  RAISE NOTICE 'Step 5: Verifying profile was CASCADE deleted';

  SELECT COUNT(*) INTO profile_count
  FROM public.profiles
  WHERE id = test_user_id;

  IF profile_count = 0 THEN
    RAISE NOTICE '✓✓✓ SUCCESS: Profile was CASCADE deleted (count: %)', profile_count;
    RAISE NOTICE '';
    RAISE NOTICE '=== CASCADE Delete Test PASSED ===';
  ELSE
    RAISE EXCEPTION 'ERROR: Profile still exists! Expected 0, got %. CASCADE delete FAILED!', profile_count;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Cleanup: Try to delete test data if test failed
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;

    RAISE NOTICE '';
    RAISE NOTICE '=== CASCADE Delete Test FAILED ===';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;
