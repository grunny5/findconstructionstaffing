-- Rollback script for 20251219_001_add_admin_rls_policies.sql
-- Removes admin RLS policies from profiles table

-- Drop the admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Note: This rollback only removes the admin view policy.
-- The existing user policies ("Users can view own profile" and "Users can update own profile")
-- remain unchanged. Admins will no longer be able to view all profiles after this rollback.
