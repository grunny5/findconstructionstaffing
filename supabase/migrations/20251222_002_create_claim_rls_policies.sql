-- Migration: Create Row Level Security policies for agency claim tables
-- Feature: Agency Claim and Profile Management (Feature #008)
-- Description: Implements RLS policies to secure claim data based on user roles

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================
-- Enable RLS on all new claim management tables
ALTER TABLE public.agency_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_claim_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_profile_edits ENABLE ROW LEVEL SECURITY;

-- Add comments documenting the security model
COMMENT ON TABLE public.agency_claim_requests IS 'Agency claim requests - RLS ENABLED - users see own claims, admins see all';
COMMENT ON TABLE public.agency_claim_audit_log IS 'Claim audit log - RLS ENABLED - admins manage, users view own claim audits';
COMMENT ON TABLE public.agency_profile_edits IS 'Profile edit history - RLS ENABLED - agency owners and admins';

-- =============================================================================
-- AGENCY_CLAIM_REQUESTS POLICIES
-- =============================================================================

-- Policy: Users can view their own claim requests
-- Allows authenticated users to SELECT claim requests they submitted
CREATE POLICY "Users can view own claims"
  ON public.agency_claim_requests FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own claim requests
-- Allows authenticated users to INSERT claim requests for themselves
-- Note: The WITH CHECK ensures user_id matches the authenticated user
CREATE POLICY "Users can create claims"
  ON public.agency_claim_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all claim requests
-- Allows users with role='admin' to SELECT all claim requests
CREATE POLICY "Admins can view all claims"
  ON public.agency_claim_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update claim requests
-- Allows admins to UPDATE claim status (approve/reject)
-- Used for reviewing and processing claims
CREATE POLICY "Admins can update claims"
  ON public.agency_claim_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view own claims" ON public.agency_claim_requests IS
  'Allows authenticated users to view their own claim submissions';
COMMENT ON POLICY "Users can create claims" ON public.agency_claim_requests IS
  'Allows authenticated users to submit new claim requests for agencies';
COMMENT ON POLICY "Admins can view all claims" ON public.agency_claim_requests IS
  'Allows admins to view all claim requests for review and management';
COMMENT ON POLICY "Admins can update claims" ON public.agency_claim_requests IS
  'Allows admins to update claim status (approve/reject) and add review notes';

-- =============================================================================
-- AGENCY_CLAIM_AUDIT_LOG POLICIES
-- =============================================================================

-- Policy: Users can view audit logs for their own claims
-- Allows users to see the history of their claim submissions
CREATE POLICY "Users can view own claim audit logs"
  ON public.agency_claim_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_claim_requests
      WHERE agency_claim_requests.id = agency_claim_audit_log.claim_id
        AND agency_claim_requests.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all audit logs
-- Allows admins to view complete audit trail for all claims
CREATE POLICY "Admins can view all audit logs"
  ON public.agency_claim_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert audit log entries
-- Allows both users and admins to create audit log entries
-- User-initiated actions (submitted, resubmitted) have admin_id = NULL
-- Admin-initiated actions (under_review, approved, rejected) have admin_id set
CREATE POLICY "Authenticated users can create audit logs"
  ON public.agency_claim_audit_log FOR INSERT
  WITH CHECK (
    -- User creating log for their own claim (admin_id NULL)
    (
      admin_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.agency_claim_requests
        WHERE agency_claim_requests.id = claim_id
          AND agency_claim_requests.user_id = auth.uid()
      )
    )
    OR
    -- Admin creating log entry (admin_id set)
    (
      admin_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
      )
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view own claim audit logs" ON public.agency_claim_audit_log IS
  'Allows users to view the audit trail for their own claim submissions';
COMMENT ON POLICY "Admins can view all audit logs" ON public.agency_claim_audit_log IS
  'Allows admins to view complete audit history for all claims';
COMMENT ON POLICY "Authenticated users can create audit logs" ON public.agency_claim_audit_log IS
  'Allows users to create audit logs for their own claims, and admins to create logs for any claim';

-- =============================================================================
-- AGENCY_PROFILE_EDITS POLICIES
-- =============================================================================

-- Policy: Agency owners can view edits for their agencies
-- Allows agency owners to see edit history for agencies they own
CREATE POLICY "Owners can view their agency edits"
  ON public.agency_profile_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = agency_profile_edits.agency_id
        AND agencies.claimed_by = auth.uid()
    )
  );

-- Policy: Admins can view all profile edits
-- Allows admins to view edit history for all agencies
CREATE POLICY "Admins can view all profile edits"
  ON public.agency_profile_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Agency owners can create edit records for their agencies
-- Allows agency owners to insert edit audit trail entries when updating their profile
CREATE POLICY "Owners can create edits for their agency"
  ON public.agency_profile_edits FOR INSERT
  WITH CHECK (
    edited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = agency_id
        AND agencies.claimed_by = auth.uid()
    )
  );

-- Policy: Admins can create edit records for any agency
-- Allows admins to insert edit audit trail entries when updating any profile
CREATE POLICY "Admins can create edits for any agency"
  ON public.agency_profile_edits FOR INSERT
  WITH CHECK (
    edited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Owners can view their agency edits" ON public.agency_profile_edits IS
  'Allows agency owners to view edit history for their claimed agency';
COMMENT ON POLICY "Admins can view all profile edits" ON public.agency_profile_edits IS
  'Allows admins to view edit history for all agencies';
COMMENT ON POLICY "Owners can create edits for their agency" ON public.agency_profile_edits IS
  'Allows agency owners to create audit trail entries when editing their profile';
COMMENT ON POLICY "Admins can create edits for any agency" ON public.agency_profile_edits IS
  'Allows admins to create audit trail entries when editing any agency profile';

-- =============================================================================
-- AGENCIES TABLE POLICIES (UPDATE)
-- =============================================================================

-- Policy: Agency owners can update their claimed agency
-- Allows users who have claimed an agency to UPDATE the agency profile
-- Note: Public SELECT policy already exists from earlier migration
-- WITH CHECK ensures ownership cannot be transferred
CREATE POLICY "Owners can update their agency"
  ON public.agencies FOR UPDATE
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

-- Policy: Admins can update any agency
-- Allows admins to UPDATE any agency profile
CREATE POLICY "Admins can update any agency"
  ON public.agencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Owners can update their agency" ON public.agencies IS
  'Allows agency owners to update their claimed agency profile';
COMMENT ON POLICY "Admins can update any agency" ON public.agencies IS
  'Allows admins to update any agency profile for moderation and management';

-- =============================================================================
-- VERIFICATION AND TESTING
-- =============================================================================

-- Verify RLS is enabled on all new tables
DO $$
DECLARE
    rls_count INTEGER;
    total_tables INTEGER := 3;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits')
      AND c.relrowsecurity = true;

    IF rls_count = total_tables THEN
        RAISE NOTICE 'Success: RLS enabled on all % claim management tables', total_tables;
    ELSE
        RAISE WARNING 'Warning: RLS only enabled on % of % claim management tables', rls_count, total_tables;
    END IF;
END $$;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP POLICY IF EXISTS "Admins can update any agency" ON public.agencies;
-- DROP POLICY IF EXISTS "Owners can update their agency" ON public.agencies;
-- DROP POLICY IF EXISTS "Admins can create edits for any agency" ON public.agency_profile_edits;
-- DROP POLICY IF EXISTS "Owners can create edits for their agency" ON public.agency_profile_edits;
-- DROP POLICY IF EXISTS "Admins can view all profile edits" ON public.agency_profile_edits;
-- DROP POLICY IF EXISTS "Owners can view their agency edits" ON public.agency_profile_edits;
-- DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.agency_claim_audit_log;
-- DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.agency_claim_audit_log;
-- DROP POLICY IF EXISTS "Users can view own claim audit logs" ON public.agency_claim_audit_log;
-- DROP POLICY IF EXISTS "Admins can update claims" ON public.agency_claim_requests;
-- DROP POLICY IF EXISTS "Admins can view all claims" ON public.agency_claim_requests;
-- DROP POLICY IF EXISTS "Users can create claims" ON public.agency_claim_requests;
-- DROP POLICY IF EXISTS "Users can view own claims" ON public.agency_claim_requests;
-- ALTER TABLE public.agency_profile_edits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agency_claim_audit_log DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agency_claim_requests DISABLE ROW LEVEL SECURITY;
