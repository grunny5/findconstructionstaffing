-- Add RLS policies for admin access to profiles
-- Allows admins to view all user profiles (required for admin user management page)

-- Policy: Admins can view all profiles
-- This allows users with role='admin' to SELECT all rows from public.profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS caller_profile
      WHERE caller_profile.id = auth.uid()
        AND caller_profile.role = 'admin'
    )
  );

-- Note: We do NOT create an admin UPDATE policy here because:
-- 1. Role changes are handled via the SECURITY DEFINER RPC function change_user_role()
-- 2. The RPC function enforces admin authorization internally
-- 3. Users can still update their own profile via the existing "Users can update own profile" policy
-- 4. This prevents direct SQL UPDATE bypassing audit logging

-- Add comment explaining the security model
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
  'Allows authenticated users with role=admin to view all user profiles. Required for admin user management features. Role changes must go through the change_user_role() RPC function to ensure audit logging.';
