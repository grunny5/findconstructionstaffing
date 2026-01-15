-- =============================================================================
-- Add Pay Rate and Per Diem Fields to Labor Request Crafts
-- Created: 2026-01-15
-- Feature: 062-request-labor
-- Description: Adds pay rate range and per diem rate fields to allow requestors
--              to specify established rates that staffing firms need to work with
-- =============================================================================

ALTER TABLE labor_request_crafts
ADD COLUMN IF NOT EXISTS pay_rate_min DECIMAL(10,2) CHECK (pay_rate_min >= 0),
ADD COLUMN IF NOT EXISTS pay_rate_max DECIMAL(10,2) CHECK (pay_rate_max >= 0),
ADD COLUMN IF NOT EXISTS per_diem_rate DECIMAL(10,2) CHECK (per_diem_rate >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_pay_rate_range'
  ) THEN
    ALTER TABLE labor_request_crafts
    ADD CONSTRAINT valid_pay_rate_range CHECK (
      (pay_rate_min IS NULL AND pay_rate_max IS NULL) OR
      (pay_rate_min IS NOT NULL AND pay_rate_max IS NOT NULL AND pay_rate_max >= pay_rate_min)
    );
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN labor_request_crafts.pay_rate_min IS 'Minimum hourly pay rate in USD (optional, must be specified with pay_rate_max)';
COMMENT ON COLUMN labor_request_crafts.pay_rate_max IS 'Maximum hourly pay rate in USD (optional, must be specified with pay_rate_min)';
COMMENT ON COLUMN labor_request_crafts.per_diem_rate IS 'Daily per diem allowance in USD (optional)';
