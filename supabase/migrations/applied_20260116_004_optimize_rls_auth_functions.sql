-- =============================================================================
-- Optimize RLS Policies - Wrap Auth Functions
-- Created: 2026-01-16
-- Issue: Supabase lint warning - auth_rls_initplan
-- Description: Wrap auth.jwt() and auth.uid() calls in (select ...) to prevent
--              re-evaluation for each row. This significantly improves query
--              performance at scale by evaluating auth functions once per query
--              instead of once per row.
--
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =============================================================================

-- =============================================================================
-- LABOR_REQUESTS TABLE - Optimize RLS Policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can read all requests" ON labor_requests;
CREATE POLICY "Admins can read all requests"
ON labor_requests FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update requests" ON labor_requests;
CREATE POLICY "Admins can update requests"
ON labor_requests FOR UPDATE
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin')
WITH CHECK ((select auth.jwt()->>'role') = 'admin');

-- =============================================================================
-- LABOR_REQUEST_CRAFTS TABLE - Optimize RLS Policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can read all crafts" ON labor_request_crafts;
CREATE POLICY "Admins can read all crafts"
ON labor_request_crafts FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS "Agencies can read crafts for their notifications" ON labor_request_crafts;
CREATE POLICY "Agencies can read crafts for their notifications"
ON labor_request_crafts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM labor_request_notifications lrn
    INNER JOIN agencies a ON lrn.agency_id = a.id
    WHERE lrn.labor_request_craft_id = labor_request_crafts.id
    AND a.claimed_by = (select auth.uid())
  )
);

-- =============================================================================
-- LABOR_REQUEST_NOTIFICATIONS TABLE - Optimize RLS Policies
-- =============================================================================

DROP POLICY IF EXISTS "System can insert notifications" ON labor_request_notifications;
CREATE POLICY "System can insert notifications"
ON labor_request_notifications FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.jwt()->>'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can read all notifications" ON labor_request_notifications;
CREATE POLICY "Admins can read all notifications"
ON labor_request_notifications FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS "Agencies can read their notifications" ON labor_request_notifications;
CREATE POLICY "Agencies can read their notifications"
ON labor_request_notifications FOR SELECT
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Agencies can update their notification status" ON labor_request_notifications;
CREATE POLICY "Agencies can update their notification status"
ON labor_request_notifications FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = (select auth.uid())
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = (select auth.uid())
  )
);

-- =============================================================================
-- AGENCIES TABLE - Optimize RLS Policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
CREATE POLICY "Admins can view all agencies"
ON agencies FOR SELECT
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert agencies" ON agencies;
CREATE POLICY "Admins can insert agencies"
ON agencies FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete agencies" ON agencies;
CREATE POLICY "Admins can delete agencies"
ON agencies FOR DELETE
TO authenticated
USING ((select auth.jwt()->>'role') = 'admin');

-- =============================================================================
-- AGENCY_COMPLIANCE TABLE - Optimize RLS Policies
-- =============================================================================

DROP POLICY IF EXISTS "Agency owner read own compliance" ON agency_compliance;
CREATE POLICY "Agency owner read own compliance"
ON agency_compliance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin read all compliance" ON agency_compliance;
CREATE POLICY "Admin read all compliance"
ON agency_compliance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Agency owner insert own compliance" ON agency_compliance;
CREATE POLICY "Agency owner insert own compliance"
ON agency_compliance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin insert any compliance" ON agency_compliance;
CREATE POLICY "Admin insert any compliance"
ON agency_compliance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Agency owner update own compliance" ON agency_compliance;
CREATE POLICY "Agency owner update own compliance"
ON agency_compliance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin update any compliance" ON agency_compliance;
CREATE POLICY "Admin update any compliance"
ON agency_compliance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Agency owner delete own compliance" ON agency_compliance;
CREATE POLICY "Agency owner delete own compliance"
ON agency_compliance
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin delete any compliance" ON agency_compliance;
CREATE POLICY "Admin delete any compliance"
ON agency_compliance
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- PERFORMANCE IMPACT
-- =============================================================================
--
-- Before: auth.jwt() and auth.uid() evaluated once per row
-- After:  auth.jwt() and auth.uid() evaluated once per query (InitPlan)
--
-- Example: Query returning 1000 notifications
--   Before: 1000 auth.uid() calls
--   After:  1 auth.uid() call
--
-- This provides significant performance improvement for:
-- - Large result sets
-- - Complex queries with multiple RLS policy evaluations
-- - High-concurrency scenarios
--
-- =============================================================================
