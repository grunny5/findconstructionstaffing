-- Migration: Create role_change_audit table
-- Purpose: Track all user role changes for security auditing and compliance
-- Date: 2025-12-15

-- Create role_change_audit table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_role TEXT NOT NULL CHECK (old_role IN ('user', 'agency_owner', 'admin')),
  new_role TEXT NOT NULL CHECK (new_role IN ('user', 'agency_owner', 'admin')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on role_change_audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.role_change_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.role_change_audit FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_role_audit_user_id
  ON public.role_change_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_role_audit_admin_id
  ON public.role_change_audit(admin_id);

CREATE INDEX IF NOT EXISTS idx_role_audit_changed_at
  ON public.role_change_audit(changed_at DESC);

-- Composite index for common query pattern: user's role history
CREATE INDEX IF NOT EXISTS idx_role_audit_user_changed
  ON public.role_change_audit(user_id, changed_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.role_change_audit IS
'Audit log of all user role changes. Records who changed whose role, when, and why.';

COMMENT ON COLUMN public.role_change_audit.user_id IS
'The user whose role was changed';

COMMENT ON COLUMN public.role_change_audit.admin_id IS
'The admin who made the role change';

COMMENT ON COLUMN public.role_change_audit.old_role IS
'The user''s role before the change';

COMMENT ON COLUMN public.role_change_audit.new_role IS
'The user''s role after the change';

COMMENT ON COLUMN public.role_change_audit.changed_at IS
'Timestamp when the role change occurred';

COMMENT ON COLUMN public.role_change_audit.notes IS
'Optional notes from the admin explaining the role change';
