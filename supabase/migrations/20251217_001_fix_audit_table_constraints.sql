-- Migration: Fix role_change_audit foreign key constraints
-- Purpose: Change CASCADE to SET NULL for audit data preservation
-- Date: 2025-12-16
-- Fixes: CodeRabbit feedback on PR #129

-- Drop existing foreign key constraints that use CASCADE
ALTER TABLE public.role_change_audit
DROP CONSTRAINT IF EXISTS role_change_audit_user_id_fkey CASCADE;

ALTER TABLE public.role_change_audit
DROP CONSTRAINT IF EXISTS role_change_audit_admin_id_fkey CASCADE;

-- Make columns nullable (required for SET NULL)
ALTER TABLE public.role_change_audit
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.role_change_audit
ALTER COLUMN admin_id DROP NOT NULL;

-- Recreate foreign keys with SET NULL to preserve audit history
-- When a user or admin is deleted, their ID becomes NULL but the audit record remains
ALTER TABLE public.role_change_audit
ADD CONSTRAINT role_change_audit_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.role_change_audit
ADD CONSTRAINT role_change_audit_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add comment explaining the design decision
COMMENT ON CONSTRAINT role_change_audit_user_id_fkey ON public.role_change_audit IS
'SET NULL on delete preserves audit records for compliance. User ID becomes NULL when user is deleted, but the audit trail remains.';

COMMENT ON CONSTRAINT role_change_audit_admin_id_fkey ON public.role_change_audit IS
'SET NULL on delete preserves audit records for compliance. Admin ID becomes NULL when admin is deleted, but the audit trail remains.';
