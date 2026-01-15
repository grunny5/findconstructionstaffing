-- =============================================================================
-- APPLY RLS POLICIES FOR LABOR REQUEST TABLES
-- =============================================================================
-- This file contains RLS policies extracted from the migration file.
-- Run this in Supabase SQL Editor if the policies weren't automatically applied.
--
-- Migration source: supabase/migrations/20260114_001_create_labor_request_tables.sql
-- =============================================================================

-- Enable RLS on all three tables
ALTER TABLE labor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_request_crafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_request_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- LABOR_REQUESTS TABLE POLICIES
-- =============================================================================

-- Allow anonymous users to insert labor requests (public form submission)
CREATE POLICY "Anyone can submit labor requests"
ON labor_requests FOR INSERT
TO anon
WITH CHECK (true);

-- Admins can read all labor requests
CREATE POLICY "Admins can read all requests"
ON labor_requests FOR SELECT
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- Admins can update labor requests (status changes)
CREATE POLICY "Admins can update requests"
ON labor_requests FOR UPDATE
TO authenticated
USING (auth.jwt()->>'role' = 'admin')
WITH CHECK (auth.jwt()->>'role' = 'admin');

-- =============================================================================
-- LABOR_REQUEST_CRAFTS TABLE POLICIES
-- =============================================================================

-- Allow anonymous users to insert crafts when creating request
CREATE POLICY "Anyone can add crafts to requests"
ON labor_request_crafts FOR INSERT
TO anon
WITH CHECK (true);

-- Admins can read all crafts
CREATE POLICY "Admins can read all crafts"
ON labor_request_crafts FOR SELECT
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- Agencies can read crafts for requests where they received notifications
CREATE POLICY "Agencies can read crafts for their notifications"
ON labor_request_crafts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM labor_request_notifications lrn
    WHERE lrn.labor_request_craft_id = labor_request_crafts.id
    AND lrn.agency_id IN (
      SELECT id FROM agencies WHERE claimed_by = auth.uid()
    )
  )
);

-- =============================================================================
-- LABOR_REQUEST_NOTIFICATIONS TABLE POLICIES
-- =============================================================================

-- System/API can insert notifications (server-side only)
-- Note: service_role bypasses RLS entirely via service-role API keys
CREATE POLICY "System can insert notifications"
ON labor_request_notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'role' = 'admin'
);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications"
ON labor_request_notifications FOR SELECT
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- Agencies can read their own notifications
CREATE POLICY "Agencies can read their notifications"
ON labor_request_notifications FOR SELECT
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = auth.uid()
  )
);

-- Agencies can update status of their notifications (viewed_at, responded_at, status)
CREATE POLICY "Agencies can update their notification status"
ON labor_request_notifications FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE claimed_by = auth.uid()
  )
);

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this after applying policies to verify they were created:
--
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('labor_requests', 'labor_request_crafts', 'labor_request_notifications')
-- ORDER BY tablename, policyname;
