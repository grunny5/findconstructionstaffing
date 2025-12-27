-- Migration: Update context_id index to compound index
-- Feature: Direct Messaging System (Feature #009)
-- Description: Replaces single-column context_id index with compound (context_id, context_type) index
-- Related: CodeRabbit review feedback on commit a4f0403

-- =============================================================================
-- UPDATE INDEX FOR BETTER QUERY OPTIMIZATION
-- =============================================================================

-- Drop the existing single-column index
DROP INDEX IF EXISTS public.idx_conversations_context_id;

-- Create compound index for agency inquiry lookups
-- Optimizes: SELECT * FROM conversations WHERE context_id = ? AND context_type = 'agency_inquiry'
-- Also optimizes: SELECT * FROM conversations WHERE context_id = ?
-- (Since context_id is the leading column, it can be used for queries on context_id alone)
CREATE INDEX IF NOT EXISTS idx_conversations_context_id_type
  ON public.conversations(context_id, context_type) WHERE context_id IS NOT NULL;

COMMENT ON INDEX public.idx_conversations_context_id_type IS 'Compound index optimizing agency inquiry conversation lookups by context_id and context_type';

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_conversations_context_id_type;
-- CREATE INDEX IF NOT EXISTS idx_conversations_context_id
--   ON public.conversations(context_id) WHERE context_id IS NOT NULL;
