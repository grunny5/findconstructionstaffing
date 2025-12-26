-- Migration: Fix Empty Array Validation Bug in create_conversation_with_participants
-- Feature: Direct Messaging System (Feature #009)
-- Description: Fixes critical bug where empty array bypasses participant count validation
-- Related: CodeRabbit review comment on 20260101_001_create_messaging_functions.sql

-- =============================================================================
-- FIX: Replace array_length() with cardinality() for NULL-safe validation
-- =============================================================================
-- Issue: array_length() returns NULL for empty arrays, causing NULL < 2 to
--        evaluate to NULL (not TRUE), which bypasses the RAISE EXCEPTION
-- Fix: Use cardinality() which returns 0 for empty arrays and NULL for NULL

CREATE OR REPLACE FUNCTION create_conversation_with_participants(
  p_context_type TEXT,
  p_context_id UUID DEFAULT NULL,
  p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_caller_id UUID;
  v_participant_id UUID;
  v_participant_count INTEGER;
BEGIN
  -- Get authenticated user ID
  v_caller_id := auth.uid();

  -- Validation 1: Caller must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create conversation';
  END IF;

  -- Validation 2: At least 2 participants required
  -- FIXED: Use cardinality() instead of array_length() to handle empty arrays
  IF cardinality(p_participant_ids) < 2 THEN
    RAISE EXCEPTION 'At least 2 participants required for conversation';
  END IF;

  -- Validation 3: Caller must be in participant list
  IF NOT (v_caller_id = ANY(p_participant_ids)) THEN
    RAISE EXCEPTION 'Caller must be included in participant list';
  END IF;

  -- Validation 4: All participants must exist in profiles table
  SELECT COUNT(*)
  INTO v_participant_count
  FROM public.profiles
  WHERE id = ANY(p_participant_ids);

  IF v_participant_count != cardinality(p_participant_ids) THEN
    RAISE EXCEPTION 'One or more participant IDs do not exist in profiles table';
  END IF;

  -- Validation 5: If context_type is 'agency_inquiry', context_id must be provided
  IF p_context_type = 'agency_inquiry' AND p_context_id IS NULL THEN
    RAISE EXCEPTION 'context_id required when context_type is agency_inquiry';
  END IF;

  -- Validation 6: If context_id provided, verify agency exists
  IF p_context_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.agencies WHERE id = p_context_id) THEN
      RAISE EXCEPTION 'Agency with id % does not exist', p_context_id;
    END IF;
  END IF;

  -- Create conversation
  INSERT INTO public.conversations (context_type, context_id)
  VALUES (p_context_type, p_context_id)
  RETURNING id INTO v_conversation_id;

  -- Add all participants atomically
  FOREACH v_participant_id IN ARRAY p_participant_ids
  LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, v_participant_id);
  END LOOP;

  -- Return conversation ID
  RETURN v_conversation_id;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION create_conversation_with_participants IS 'Atomically creates a conversation and adds participants to prevent race conditions (fixed empty array validation)';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Test that empty array now raises exception:
--
-- DO $$
-- BEGIN
--   -- This should now raise: "At least 2 participants required"
--   PERFORM create_conversation_with_participants('general', NULL, ARRAY[]::UUID[]);
-- EXCEPTION WHEN OTHERS THEN
--   RAISE NOTICE 'Expected error: %', SQLERRM;
-- END $$;
