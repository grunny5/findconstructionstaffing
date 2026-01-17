-- Migration: Add compliance reminder tracking columns
-- Purpose: Track when expiration reminder emails were sent to prevent duplicates
-- Feature: 013 - Industry Compliance & Verification (Phase 6: Expiration Tracking)

-- Add columns to track when reminder emails were sent
ALTER TABLE agency_compliance
ADD COLUMN IF NOT EXISTS last_30_day_reminder_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_7_day_reminder_sent TIMESTAMPTZ;

-- Add comments to explain the columns
COMMENT ON COLUMN agency_compliance.last_30_day_reminder_sent IS 'Timestamp when 30-day expiration reminder email was last sent';
COMMENT ON COLUMN agency_compliance.last_7_day_reminder_sent IS 'Timestamp when 7-day expiration reminder email was last sent';

-- Create index for cron job queries to find items needing reminders
CREATE INDEX IF NOT EXISTS idx_agency_compliance_expiring_30 ON agency_compliance(expiration_date, last_30_day_reminder_sent)
  WHERE is_active = true AND expiration_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agency_compliance_expiring_7 ON agency_compliance(expiration_date, last_7_day_reminder_sent)
  WHERE is_active = true AND expiration_date IS NOT NULL;
