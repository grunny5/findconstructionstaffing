-- Migration: Add RLS policies for admin INSERT on agencies table
--
-- Description: Allows admins to create new agencies via the admin dashboard.
-- Previously only UPDATE was allowed for admins.

-- Policy: Admins can insert new agencies
-- This allows users with role='admin' to INSERT new rows into public.agencies
CREATE POLICY "Admins can insert agencies"
  ON public.agencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Admins can insert agencies" ON public.agencies IS
  'Allows authenticated users with role=admin to create new agency listings via the admin dashboard.';

-- Also add a SELECT policy for admins to view all agencies (including inactive ones)
-- This is needed so admins can view agencies they just created
CREATE POLICY "Admins can view all agencies"
  ON public.agencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view all agencies" ON public.agencies IS
  'Allows authenticated users with role=admin to view all agencies, including inactive ones.';

-- Add DELETE policy for admins (for future use)
CREATE POLICY "Admins can delete agencies"
  ON public.agencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can delete agencies" ON public.agencies IS
  'Allows authenticated users with role=admin to delete agency listings.';
