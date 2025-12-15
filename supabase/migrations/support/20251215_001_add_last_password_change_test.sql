-- Test script for last_password_change migration
-- Run this after applying the migration to verify it works correctly
-- Usage: psql -f 20251215_001_add_last_password_change_test.sql

-- Test 1: Verify column exists and has correct type
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'last_password_change';

-- Expected output:
-- column_name           | data_type                   | is_nullable | column_default
-- last_password_change  | timestamp with time zone    | NO          | now()

-- Test 2: Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_password_change';

-- Expected output:
-- trigger_name                     | event_manipulation | event_object_table | action_statement
-- on_auth_user_password_change     | UPDATE             | users              | EXECUTE FUNCTION public.update_last_password_change()

-- Test 3: Verify function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_last_password_change';

-- Expected output:
-- routine_name                  | routine_type | security_type
-- update_last_password_change   | FUNCTION     | DEFINER

-- Test 4: Verify index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND indexname = 'idx_profiles_last_password_change';

-- Expected output:
-- indexname                          | indexdef
-- idx_profiles_last_password_change  | CREATE INDEX idx_profiles_last_password_change ON public.profiles USING btree (last_password_change)

-- Test 5: Check that all existing profiles have a last_password_change value
SELECT
  COUNT(*) as total_profiles,
  COUNT(last_password_change) as profiles_with_timestamp,
  COUNT(*) - COUNT(last_password_change) as profiles_missing_timestamp
FROM public.profiles;

-- Expected output: profiles_missing_timestamp should be 0

-- Test 6: Verify NOT NULL constraint
SELECT
  conname,
  contype,
  convalidated
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'n';

-- Manual test instructions:
-- ==========================================
-- To test the trigger manually (requires admin access):
--
-- 1. Create a test user or use an existing one
-- 2. Note the current last_password_change timestamp:
--    SELECT id, email, last_password_change FROM public.profiles WHERE email = 'test@example.com';
--
-- 3. Change the user's password using Supabase auth.updateUser()
--    (This happens automatically when user changes password in the UI)
--
-- 4. Verify the timestamp updated:
--    SELECT id, email, last_password_change FROM public.profiles WHERE email = 'test@example.com';
--    -- The timestamp should be more recent than the previous value
--
-- 5. Update user without changing password (e.g., update email):
--    -- The last_password_change should NOT update
