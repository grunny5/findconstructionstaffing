-- Migration: Create agency_compliance table
-- Purpose: Stores compliance certifications and verification status for agencies
-- Feature: 013 - Industry Compliance & Verification

-- Create the agency_compliance table
CREATE TABLE IF NOT EXISTS agency_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN (
    'osha_certified',
    'drug_testing',
    'background_checks',
    'workers_comp',
    'general_liability',
    'bonding'
  )),
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  document_url TEXT,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, compliance_type)
);

-- Create index on agency_id for query performance
CREATE INDEX IF NOT EXISTS idx_agency_compliance_agency_id ON agency_compliance(agency_id);

-- Create index for expiration date queries (for cron job)
CREATE INDEX IF NOT EXISTS idx_agency_compliance_expiration ON agency_compliance(expiration_date)
  WHERE expiration_date IS NOT NULL AND is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agency_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agency_compliance_updated_at ON agency_compliance;
CREATE TRIGGER trigger_agency_compliance_updated_at
  BEFORE UPDATE ON agency_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_compliance_updated_at();

-- Enable RLS
ALTER TABLE agency_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read for active compliance items (for public profile display)
CREATE POLICY "Public read active compliance"
ON agency_compliance
FOR SELECT
USING (is_active = true);

-- RLS Policy: Agency owner can read all their compliance items
CREATE POLICY "Agency owner read own compliance"
ON agency_compliance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = auth.uid()
  )
);

-- RLS Policy: Admin can read all compliance items
CREATE POLICY "Admin read all compliance"
ON agency_compliance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy: Agency owner can insert for their claimed agency
CREATE POLICY "Agency owner insert own compliance"
ON agency_compliance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = auth.uid()
  )
);

-- RLS Policy: Admin can insert for any agency
CREATE POLICY "Admin insert any compliance"
ON agency_compliance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy: Agency owner can update their compliance items
CREATE POLICY "Agency owner update own compliance"
ON agency_compliance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = auth.uid()
  )
  -- Agency owner cannot modify verification fields
  AND (
    OLD.is_verified = NEW.is_verified
    AND OLD.verified_by IS NOT DISTINCT FROM NEW.verified_by
    AND OLD.verified_at IS NOT DISTINCT FROM NEW.verified_at
  )
);

-- RLS Policy: Admin can update any compliance items (including verification)
CREATE POLICY "Admin update any compliance"
ON agency_compliance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy: Agency owner can delete their compliance items
CREATE POLICY "Agency owner delete own compliance"
ON agency_compliance
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = agency_compliance.agency_id
    AND agencies.claimed_by = auth.uid()
  )
);

-- RLS Policy: Admin can delete any compliance items
CREATE POLICY "Admin delete any compliance"
ON agency_compliance
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comment to table
COMMENT ON TABLE agency_compliance IS 'Stores compliance certifications and verification status for staffing agencies';
COMMENT ON COLUMN agency_compliance.compliance_type IS 'Type of compliance: osha_certified, drug_testing, background_checks, workers_comp, general_liability, bonding';
COMMENT ON COLUMN agency_compliance.is_active IS 'Whether the agency claims to have this compliance';
COMMENT ON COLUMN agency_compliance.is_verified IS 'Whether an admin has verified the compliance document';
COMMENT ON COLUMN agency_compliance.document_url IS 'URL to the uploaded verification document in Supabase Storage';
COMMENT ON COLUMN agency_compliance.expiration_date IS 'Optional expiration date for the certification';
