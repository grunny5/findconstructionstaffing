-- Migration: Create agency claim request tables and extend agencies table
-- Feature: Agency Claim and Profile Management (Feature #008)
-- Description: Adds tables for claim requests, audit logging, and profile edit tracking

-- =============================================================================
-- AGENCY CLAIM REQUESTS TABLE
-- =============================================================================
-- Stores claim requests from users wanting to claim agency profiles
CREATE TABLE IF NOT EXISTS public.agency_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request Information
  business_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  position_title TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'phone', 'manual')),
  additional_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Verification Flags
  email_domain_verified BOOLEAN DEFAULT FALSE,
  documents_uploaded BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(agency_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.agency_claim_requests IS 'Stores agency claim requests from users';
COMMENT ON COLUMN public.agency_claim_requests.business_email IS 'Business email used for verification';
COMMENT ON COLUMN public.agency_claim_requests.verification_method IS 'Method chosen for claim verification: email, phone, or manual';
COMMENT ON COLUMN public.agency_claim_requests.status IS 'Current status of claim request';
COMMENT ON COLUMN public.agency_claim_requests.email_domain_verified IS 'Whether email domain matches agency website domain';

-- =============================================================================
-- AGENCY CLAIM AUDIT LOG TABLE
-- =============================================================================
-- Tracks all status changes and admin actions on claim requests
CREATE TABLE IF NOT EXISTS public.agency_claim_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.agency_claim_requests(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.agency_claim_audit_log IS 'Audit log for claim request status changes';
COMMENT ON COLUMN public.agency_claim_audit_log.action IS 'Action taken on claim request';
COMMENT ON COLUMN public.agency_claim_audit_log.admin_id IS 'Admin who performed action (null for user-initiated actions)';

-- =============================================================================
-- AGENCY PROFILE EDITS TABLE
-- =============================================================================
-- Audit trail for all changes made to agency profiles
CREATE TABLE IF NOT EXISTS public.agency_profile_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.agency_profile_edits IS 'Audit trail for agency profile changes';
COMMENT ON COLUMN public.agency_profile_edits.field_name IS 'Name of the field that was edited';
COMMENT ON COLUMN public.agency_profile_edits.old_value IS 'Previous value (stored as JSONB for flexibility)';
COMMENT ON COLUMN public.agency_profile_edits.new_value IS 'New value (stored as JSONB for flexibility)';

-- =============================================================================
-- EXTEND AGENCIES TABLE
-- =============================================================================
-- Add new columns for claim management and profile completion tracking
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0
    CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);

-- Add comments for new columns
COMMENT ON COLUMN public.agencies.profile_completion_percentage IS 'Calculated completion score (0-100%)';
COMMENT ON COLUMN public.agencies.last_edited_at IS 'Timestamp of last profile edit';
COMMENT ON COLUMN public.agencies.last_edited_by IS 'User who last edited the profile';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
-- Index for finding claims by agency owner
CREATE INDEX IF NOT EXISTS idx_agencies_claimed_by ON public.agencies(claimed_by);

-- Index for filtering claims by status
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.agency_claim_requests(status);

-- Composite index for finding specific agency-user claim combinations
CREATE INDEX IF NOT EXISTS idx_claim_requests_agency_user ON public.agency_claim_requests(agency_id, user_id);

-- Index for audit log queries by claim
CREATE INDEX IF NOT EXISTS idx_claim_audit_claim_id ON public.agency_claim_audit_log(claim_id);

-- Index for profile edit history queries
CREATE INDEX IF NOT EXISTS idx_profile_edits_agency ON public.agency_profile_edits(agency_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
-- Auto-update updated_at timestamp on claim requests
CREATE TRIGGER update_agency_claim_requests_updated_at
  BEFORE UPDATE ON public.agency_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS update_agency_claim_requests_updated_at ON public.agency_claim_requests;
-- DROP INDEX IF EXISTS idx_profile_edits_agency;
-- DROP INDEX IF EXISTS idx_claim_audit_claim_id;
-- DROP INDEX IF EXISTS idx_claim_requests_agency_user;
-- DROP INDEX IF EXISTS idx_claim_requests_status;
-- DROP INDEX IF EXISTS idx_agencies_claimed_by;
-- ALTER TABLE public.agencies DROP COLUMN IF EXISTS last_edited_by;
-- ALTER TABLE public.agencies DROP COLUMN IF EXISTS last_edited_at;
-- ALTER TABLE public.agencies DROP COLUMN IF EXISTS profile_completion_percentage;
-- DROP TABLE IF EXISTS public.agency_profile_edits;
-- DROP TABLE IF EXISTS public.agency_claim_audit_log;
-- DROP TABLE IF EXISTS public.agency_claim_requests;
