-- Migration: Add public SELECT policy for agencies table
--
-- Description: Allows anonymous/public users to view active agencies.
-- This policy was missing from the production database, preventing
-- the homepage directory from displaying any agencies.
--
-- Related: applied_20250625_005_create_public_read_policies.sql (original policy)

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Public can view active agencies" ON public.agencies;

-- Create policy: Public can view active agencies
-- This allows anonymous users (no auth.uid()) to SELECT agencies where is_active = true
CREATE POLICY "Public can view active agencies"
  ON public.agencies FOR SELECT
  USING (is_active = true);

-- Add comment documenting the policy
COMMENT ON POLICY "Public can view active agencies" ON public.agencies IS
  'Allows anonymous users to read active agencies for the public directory. Required for homepage agency listing.';
