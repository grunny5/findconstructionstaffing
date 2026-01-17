/**
 * Migration: Fix Missing Messages DELETE Policy
 *
 * Issue: Migration 20260114_001_optimize_rls_policies.sql dropped the DELETE
 * policies for messages but only recreated the UPDATE policy, leaving DELETE
 * operations blocked.
 *
 * Fix: Add combined DELETE policy for messages table.
 */

-- =============================================================================
-- MESSAGES TABLE: Add missing DELETE policy
-- =============================================================================

-- Combined DELETE policy: own messages OR admin
DROP POLICY IF EXISTS "Users can delete messages" ON public.messages;
CREATE POLICY "Users can delete messages"
  ON public.messages FOR DELETE
  USING (
    sender_id = (select auth.uid())
    OR public.is_admin()
  );

COMMENT ON POLICY "Users can delete messages" ON public.messages IS
'Combined policy: users can delete own messages, admins can delete any. Optimized with (select auth.uid()).';
