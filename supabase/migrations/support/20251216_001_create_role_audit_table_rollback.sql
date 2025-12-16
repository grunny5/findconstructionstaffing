-- Rollback: Create role_change_audit table
-- Purpose: Remove role_change_audit table and all associated objects
-- Date: 2025-12-15

-- Drop indexes
DROP INDEX IF EXISTS public.idx_role_audit_user_changed;
DROP INDEX IF EXISTS public.idx_role_audit_changed_at;
DROP INDEX IF EXISTS public.idx_role_audit_admin_id;
DROP INDEX IF EXISTS public.idx_role_audit_user_id;

-- Drop RLS policies
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.role_change_audit;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.role_change_audit;

-- Drop table (CASCADE will remove any dependent objects)
DROP TABLE IF EXISTS public.role_change_audit CASCADE;
