/**
 * Migration: Fix Empty Array Validation in create_conversation_with_participants
 *
 * Purpose: Corrects validation bug where empty participant arrays would bypass
 * the minimum participant check due to array_length() returning NULL.
 *
 * Bug: array_length([], 1) returns NULL, and NULL < 2 evaluates to NULL (not TRUE)
 * Fix: Use COALESCE(array_length(...), 0) to convert NULL to 0
 *
 * Related: CodeRabbit AI code review finding
 * Feature: #009 Direct Messaging System
 */

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_conversation_with_participants(
  p_context_type TEXT,
  p_context_id UUID,
  p_participant_ids UUID[]
);

-- Recreate with corrected validation
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
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
  v_participant_count INT;
  v_agency_exists BOOLEAN;
BEGIN
  -- Get authenticated user ID
  v_caller_id := auth.uid();

  -- Validation 1: Authentication required
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create conversation';
  END IF;

  -- Validation 2: At least 2 participants required
  -- FIX: Use COALESCE to handle NULL from empty array
  IF COALESCE(array_length(p_participant_ids, 1), 0) < 2 THEN
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

  IF v_participant_count < array_length(p_participant_ids, 1) THEN
    RAISE EXCEPTION 'One or more participant IDs do not exist in profiles table';
  END IF;

  -- Validation 5: context_type must be valid
  IF p_context_type NOT IN ('agency_inquiry', 'general') THEN
    RAISE EXCEPTION 'Invalid context_type: %. Must be either ''agency_inquiry'' or ''general''', p_context_type;
  END IF;

  -- Validation 6: context_id required for agency_inquiry
  IF p_context_type = 'agency_inquiry' AND p_context_id IS NULL THEN
    RAISE EXCEPTION 'context_id required when context_type is agency_inquiry';
  END IF;

  -- Validation 7: Agency must exist if context_id provided
  IF p_context_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.agencies WHERE id = p_context_id
    ) INTO v_agency_exists;

    IF NOT v_agency_exists THEN
      RAISE EXCEPTION 'Agency with id % does not exist', p_context_id;
    END IF;
  END IF;

  -- Create conversation
  INSERT INTO public.conversations (context_type, context_id)
  VALUES (p_context_type, p_context_id)
  RETURNING id INTO v_conversation_id;

  -- Add all participants
  FOREACH v_participant_id IN ARRAY p_participant_ids
  LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, v_participant_id);
  END LOOP;

  RETURN v_conversation_id;
END;
$$;

-- Restore GRANT permissions
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_conversation_with_participants IS
'Creates a new conversation with multiple participants atomically.
Validates authentication, participant count (min 2), caller inclusion,
participant existence, and agency context. Fixed in v2 to handle empty arrays correctly.';
