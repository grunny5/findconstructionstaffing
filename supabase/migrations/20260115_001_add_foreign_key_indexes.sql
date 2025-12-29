/**
 * Migration: Add Missing Foreign Key Indexes
 *
 * This migration addresses Supabase linter warning: unindexed_foreign_keys
 *
 * Problem: Foreign key columns without indexes can cause performance issues:
 * - Slow JOIN operations when querying related data
 * - Slow CASCADE DELETE operations when parent records are deleted
 * - Full table scans instead of index lookups
 *
 * Fix: Create indexes on all foreign key columns that lack them.
 *
 * Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
 */

-- =============================================================================
-- 1. agencies.last_edited_by
-- =============================================================================
-- Used for: Finding agencies edited by a specific user, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_agencies_last_edited_by
  ON public.agencies(last_edited_by);

COMMENT ON INDEX idx_agencies_last_edited_by IS
'Index on agencies.last_edited_by foreign key for efficient lookups and JOINs.';


-- =============================================================================
-- 2. agency_claim_audit_log.admin_id
-- =============================================================================
-- Used for: Finding audit logs by admin, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_claim_audit_admin_id
  ON public.agency_claim_audit_log(admin_id);

COMMENT ON INDEX idx_claim_audit_admin_id IS
'Index on agency_claim_audit_log.admin_id foreign key for efficient lookups and JOINs.';


-- =============================================================================
-- 3. agency_claim_requests.reviewed_by
-- =============================================================================
-- Used for: Finding claims reviewed by a specific admin, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_claim_requests_reviewed_by
  ON public.agency_claim_requests(reviewed_by);

COMMENT ON INDEX idx_claim_requests_reviewed_by IS
'Index on agency_claim_requests.reviewed_by foreign key for efficient lookups and JOINs.';


-- =============================================================================
-- 4. agency_claim_requests.user_id
-- =============================================================================
-- Used for: Finding claims by a specific user, RLS policies, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_id
  ON public.agency_claim_requests(user_id);

COMMENT ON INDEX idx_claim_requests_user_id IS
'Index on agency_claim_requests.user_id foreign key for efficient lookups, RLS policies, and JOINs.';


-- =============================================================================
-- 5. agency_profile_edits.edited_by
-- =============================================================================
-- Used for: Finding edits by a specific user, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_profile_edits_edited_by
  ON public.agency_profile_edits(edited_by);

COMMENT ON INDEX idx_profile_edits_edited_by IS
'Index on agency_profile_edits.edited_by foreign key for efficient lookups and JOINs.';


-- =============================================================================
-- 6. messages.sender_id
-- =============================================================================
-- Used for: Finding messages by sender, RLS policies, JOIN with profiles
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages(sender_id);

COMMENT ON INDEX idx_messages_sender_id IS
'Index on messages.sender_id foreign key for efficient lookups, RLS policies, and JOINs.';


-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify indexes with:
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname IN (
--   'idx_agencies_last_edited_by',
--   'idx_claim_audit_admin_id',
--   'idx_claim_requests_reviewed_by',
--   'idx_claim_requests_user_id',
--   'idx_profile_edits_edited_by',
--   'idx_messages_sender_id'
-- );
