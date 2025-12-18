-- Fix infinite recursion in admin RLS policy
-- The previous policy caused infinite recursion by querying profiles table within a profiles policy
-- Solution: Use a SECURITY DEFINER function to break the recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a helper function to check if caller is admin
-- This function uses SECURITY DEFINER to bypass RLS and break recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current user has admin role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion in policies.';

-- Create new admin policy using the helper function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Add comment explaining the policy
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
  'Allows authenticated users with role=admin to view all user profiles. Uses is_admin() function to prevent infinite recursion.';
