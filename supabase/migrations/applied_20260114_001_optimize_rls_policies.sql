/**
 * Migration: Optimize RLS Policies for Performance
 *
 * This migration addresses Supabase performance linter warnings:
 *
 * ISSUE 1: auth_rls_initplan (33 policies)
 * =========================================
 * Problem: auth.uid() is re-evaluated for every row instead of once per query.
 * Fix: Wrap auth.uid() with (select auth.uid()) to evaluate once.
 *
 * ISSUE 2: multiple_permissive_policies (affects 8 tables)
 * =========================================================
 * Problem: Multiple permissive policies for same role/action causes ALL to be
 * evaluated for every query, even if only one would match.
 * Fix: Combine into single policy with OR conditions.
 *
 * ISSUE 3: is_admin() function search_path
 * ========================================
 * The is_admin() helper function uses SET search_path = public, but should use
 * SET search_path = '' for security consistency.
 *
 * Reference: https://supabase.com/docs/guides/database/database-linter
 */

-- =============================================================================
-- HELPER FUNCTION: Fix is_admin() search_path
-- =============================================================================
-- Update to use empty search_path for security consistency

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
'Returns true if the current user has admin role. Uses SECURITY DEFINER to bypass RLS. Fixed: search_path set to empty for security.';


-- =============================================================================
-- PROFILES TABLE: Combine SELECT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Combined SELECT policy: Users can view own OR admin can view all
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  USING (
    id = (select auth.uid())
    OR public.is_admin()
  );

-- UPDATE policy with fixed auth.uid()
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

COMMENT ON POLICY "Users can view profiles" ON public.profiles IS
'Combined policy: users see own profile, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
'Users can update their own profile. Optimized with (select auth.uid()).';


-- =============================================================================
-- CONVERSATIONS TABLE: Combine SELECT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

-- Combined SELECT policy
CREATE POLICY "Users can view conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = (select auth.uid())
    )
    OR public.is_admin()
  );

-- INSERT policy with fixed auth.uid()
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

COMMENT ON POLICY "Users can view conversations" ON public.conversations IS
'Combined policy: participants see own conversations, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Authenticated users can create conversations" ON public.conversations IS
'Authenticated users can create conversations. Optimized with (select auth.uid()).';


-- =============================================================================
-- CONVERSATION_PARTICIPANTS TABLE: Combine SELECT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can view all participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own last_read_at" ON public.conversation_participants;

-- Combined SELECT policy
CREATE POLICY "Users can view participation"
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_admin()
  );

-- UPDATE policy with fixed auth.uid()
CREATE POLICY "Users can update own last_read_at"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

COMMENT ON POLICY "Users can view participation" ON public.conversation_participants IS
'Combined policy: users see own participation, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can update own last_read_at" ON public.conversation_participants IS
'Users can update their read status. Optimized with (select auth.uid()).';


-- =============================================================================
-- MESSAGES TABLE: Combine SELECT + UPDATE policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;

-- Combined SELECT policy
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = (select auth.uid())
    )
    OR public.is_admin()
  );

-- INSERT policy with fixed auth.uid()
CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = (select auth.uid())
    )
  );

-- Combined UPDATE policy: own messages OR admin
CREATE POLICY "Users can update messages"
  ON public.messages FOR UPDATE
  USING (
    sender_id = (select auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    sender_id = (select auth.uid())
    OR public.is_admin()
  );

COMMENT ON POLICY "Users can view messages" ON public.messages IS
'Combined policy: participants see conversation messages, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can send messages in own conversations" ON public.messages IS
'Participants can send messages. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can update messages" ON public.messages IS
'Combined policy: users can update own messages, admins can update any. Optimized with (select auth.uid()).';


-- =============================================================================
-- AGENCY_CLAIM_REQUESTS TABLE: Combine SELECT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Admins can view all claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Users can create claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Admins can update claims" ON public.agency_claim_requests;

-- Combined SELECT policy
CREATE POLICY "Users can view claims"
  ON public.agency_claim_requests FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_admin()
  );

-- INSERT policy with fixed auth.uid()
CREATE POLICY "Users can create claims"
  ON public.agency_claim_requests FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE policy (admin only) with fixed auth.uid()
CREATE POLICY "Admins can update claims"
  ON public.agency_claim_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Users can view claims" ON public.agency_claim_requests IS
'Combined policy: users see own claims, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can create claims" ON public.agency_claim_requests IS
'Users can create claim requests. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Admins can update claims" ON public.agency_claim_requests IS
'Admins can update claim status. Uses is_admin() helper.';


-- =============================================================================
-- AGENCY_CLAIM_AUDIT_LOG TABLE: Combine SELECT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own claim audit logs" ON public.agency_claim_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.agency_claim_audit_log;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.agency_claim_audit_log;

-- Combined SELECT policy
CREATE POLICY "Users can view audit logs"
  ON public.agency_claim_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_claim_requests
      WHERE agency_claim_requests.id = agency_claim_audit_log.claim_id
        AND agency_claim_requests.user_id = (select auth.uid())
    )
    OR public.is_admin()
  );

-- INSERT policy with fixed auth.uid()
CREATE POLICY "Authenticated users can create audit logs"
  ON public.agency_claim_audit_log FOR INSERT
  WITH CHECK (
    -- User creating log for their own claim (admin_id NULL)
    (
      admin_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.agency_claim_requests
        WHERE agency_claim_requests.id = claim_id
          AND agency_claim_requests.user_id = (select auth.uid())
      )
    )
    OR
    -- Admin creating log entry
    public.is_admin()
  );

COMMENT ON POLICY "Users can view audit logs" ON public.agency_claim_audit_log IS
'Combined policy: users see own claim audits, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Authenticated users can create audit logs" ON public.agency_claim_audit_log IS
'Users can log own claim actions, admins can log any. Optimized with (select auth.uid()).';


-- =============================================================================
-- AGENCIES TABLE: Combine UPDATE policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing UPDATE policies (keep SELECT policy as is)
DROP POLICY IF EXISTS "Owners can update their agency" ON public.agencies;
DROP POLICY IF EXISTS "Admins can update any agency" ON public.agencies;

-- Combined UPDATE policy
CREATE POLICY "Owners or admins can update agencies"
  ON public.agencies FOR UPDATE
  USING (
    claimed_by = (select auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    claimed_by = (select auth.uid())
    OR public.is_admin()
  );

COMMENT ON POLICY "Owners or admins can update agencies" ON public.agencies IS
'Combined policy: owners can update their agency, admins can update any. Optimized with (select auth.uid()).';


-- =============================================================================
-- AGENCY_PROFILE_EDITS TABLE: Combine SELECT + INSERT policies + fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can view their agency edits" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Admins can view all profile edits" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Owners can create edits for their agency" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Admins can create edits for any agency" ON public.agency_profile_edits;

-- Combined SELECT policy
CREATE POLICY "Users can view profile edits"
  ON public.agency_profile_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = agency_profile_edits.agency_id
        AND agencies.claimed_by = (select auth.uid())
    )
    OR public.is_admin()
  );

-- Combined INSERT policy
CREATE POLICY "Users can create profile edits"
  ON public.agency_profile_edits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE agencies.id = agency_id
        AND agencies.claimed_by = (select auth.uid())
    )
    OR public.is_admin()
  );

COMMENT ON POLICY "Users can view profile edits" ON public.agency_profile_edits IS
'Combined policy: owners see own agency edits, admins see all. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can create profile edits" ON public.agency_profile_edits IS
'Combined policy: owners can edit own agency, admins can edit any. Optimized with (select auth.uid()).';


-- =============================================================================
-- ROLE_CHANGE_AUDIT TABLE: Fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.role_change_audit;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.role_change_audit;

-- Recreate with optimized auth.uid()
CREATE POLICY "Admins can view all audit logs"
  ON public.role_change_audit FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON public.role_change_audit FOR INSERT
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can view all audit logs" ON public.role_change_audit IS
'Admins can view role change audit logs. Uses is_admin() helper.';
COMMENT ON POLICY "Admins can insert audit logs" ON public.role_change_audit IS
'Admins can insert role change audit logs. Uses is_admin() helper.';


-- =============================================================================
-- NOTIFICATION_PREFERENCES TABLE: Fix auth_rls_initplan
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

-- Recreate with optimized auth.uid()
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = (select auth.uid()));

COMMENT ON POLICY "Users can view own notification preferences" ON public.notification_preferences IS
'Users can view their notification preferences. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can insert own notification preferences" ON public.notification_preferences IS
'Users can create their notification preferences. Optimized with (select auth.uid()).';
COMMENT ON POLICY "Users can update own notification preferences" ON public.notification_preferences IS
'Users can update their notification preferences. Optimized with (select auth.uid()).';


-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify with:
--
-- Check policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
--
-- Check for auth_rls_initplan issues (should return empty):
-- Run Supabase linter in dashboard
