-- =============================================================================
-- Multi-Craft Labor Request System Migration
-- Created: 2026-01-14
-- Feature: 062-request-labor
-- Description: Creates tables for labor request submissions, craft requirements,
--              and agency notifications with proper constraints and RLS policies
-- =============================================================================

-- =============================================================================
-- LABOR_REQUESTS TABLE
-- =============================================================================
CREATE TABLE labor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL CHECK (length(project_name) BETWEEN 3 AND 200),
  company_name TEXT NOT NULL CHECK (length(company_name) BETWEEN 2 AND 200),
  contact_email TEXT NOT NULL CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  contact_phone TEXT NOT NULL CHECK (length(contact_phone) BETWEEN 10 AND 20),
  additional_details TEXT CHECK (length(additional_details) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'fulfilled', 'cancelled')),
  confirmation_token TEXT UNIQUE,
  confirmation_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_labor_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER labor_requests_updated_at
BEFORE UPDATE ON labor_requests
FOR EACH ROW
EXECUTE FUNCTION update_labor_request_updated_at();

-- =============================================================================
-- LABOR_REQUEST_CRAFTS TABLE
-- =============================================================================
CREATE TABLE labor_request_crafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_request_id UUID NOT NULL REFERENCES labor_requests(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  worker_count INTEGER NOT NULL CHECK (worker_count BETWEEN 1 AND 500),
  start_date DATE NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  hours_per_week INTEGER NOT NULL CHECK (hours_per_week BETWEEN 1 AND 168),
  notes TEXT CHECK (length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure start date is not in the past and not more than 1 year in future
  CONSTRAINT valid_start_date CHECK (start_date >= CURRENT_DATE),
  CONSTRAINT valid_future_date CHECK (start_date <= CURRENT_DATE + INTERVAL '1 year')
);

-- =============================================================================
-- LABOR_REQUEST_NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE labor_request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_request_id UUID NOT NULL REFERENCES labor_requests(id) ON DELETE CASCADE,
  labor_request_craft_id UUID NOT NULL REFERENCES labor_request_crafts(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'new', 'viewed', 'responded', 'archived')),
  delivery_error TEXT,
  responded_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure valid status transitions (pending must have null sent_at, others must have sent_at)
  CONSTRAINT valid_status_transitions CHECK (
    (status = 'pending' AND sent_at IS NULL) OR
    (status IN ('sent', 'new', 'viewed', 'responded', 'archived') AND sent_at IS NOT NULL) OR
    (status = 'failed')
  )
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Composite index for matching queries
CREATE INDEX idx_craft_trade_region ON labor_request_crafts(trade_id, region_id);

-- Status filtering
CREATE INDEX idx_request_status ON labor_requests(status, created_at DESC);

-- Agency notification lookups
CREATE INDEX idx_notifications_agency ON labor_request_notifications(agency_id, sent_at);
CREATE INDEX idx_notifications_request ON labor_request_notifications(labor_request_id);

-- B-tree indexes for agency_trades junction table (supports EXISTS subqueries in matching RPC)
-- Note: trade_id and region_id are scalar UUIDs, not arrays (GIN would be inappropriate)
CREATE INDEX IF NOT EXISTS idx_agency_trades_trade ON agency_trades(trade_id, agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_trades_agency ON agency_trades(agency_id, trade_id);

-- B-tree indexes for agency_regions junction table
CREATE INDEX IF NOT EXISTS idx_agency_regions_region ON agency_regions(region_id, agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_regions_agency ON agency_regions(agency_id, region_id);

-- These composite B-tree indexes efficiently serve the EXISTS subqueries:
--   EXISTS (SELECT 1 FROM agency_trades WHERE agency_id = a.id AND trade_id = p_trade_id)
--   EXISTS (SELECT 1 FROM agency_regions WHERE agency_id = a.id AND region_id = p_region_id)

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
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

-- NOTE: Success page does NOT use anonymous RLS access
-- Token validation happens in API route using service role client
-- This prevents security vulnerability where any non-null token could query all requests
-- See app/api/labor-requests/success/route.ts for proper token validation

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
    INNER JOIN agencies a ON lrn.agency_id = a.id
    WHERE lrn.labor_request_craft_id = labor_request_crafts.id
    AND a.claimed_by = auth.uid()
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
-- TABLE COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE labor_requests IS 'Main table storing labor request submissions from companies';
COMMENT ON TABLE labor_request_crafts IS 'Individual craft/trade requirements within a labor request (1:many)';
COMMENT ON TABLE labor_request_notifications IS 'Tracks notifications sent to agencies for each craft requirement';

COMMENT ON COLUMN labor_requests.confirmation_token IS 'Cryptographic token for success page access (64-char hex, 2-hour expiry)';
COMMENT ON COLUMN labor_request_crafts.worker_count IS 'Number of workers needed (1-500)';
COMMENT ON COLUMN labor_request_crafts.duration_days IS 'Project duration in days (1-365)';
COMMENT ON COLUMN labor_request_crafts.hours_per_week IS 'Hours per week per worker (1-168)';
COMMENT ON COLUMN labor_request_notifications.status IS 'pending → sent/failed → new → viewed → responded/archived';
