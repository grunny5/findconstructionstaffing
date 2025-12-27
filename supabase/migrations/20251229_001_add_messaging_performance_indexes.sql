-- Migration: Add performance indexes for messaging queries
-- Feature: Direct Messaging System (Feature #009)
-- Description: Adds compound indexes for optimized query performance
-- Related: Task 1.1.1 - CodeRabbit review suggestions

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Index for agency inquiry lookups
-- Optimizes: SELECT * FROM conversations WHERE context_id = ? AND context_type = 'agency_inquiry'
CREATE INDEX IF NOT EXISTS idx_conversations_context_id
  ON public.conversations(context_id) WHERE context_id IS NOT NULL;

COMMENT ON INDEX public.idx_conversations_context_id IS 'Optimizes agency inquiry conversation lookups';

-- Compound index for fetching non-deleted messages by conversation
-- Optimizes: SELECT * FROM messages WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_conversation_not_deleted
  ON public.messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX public.idx_messages_conversation_not_deleted IS 'Optimizes queries for active messages in a conversation';

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_messages_conversation_not_deleted;
-- DROP INDEX IF EXISTS idx_conversations_context_id;
