-- Migration: Create Database Functions and Triggers for Messaging
-- Feature: Direct Messaging System (Feature #009)
-- Description: Atomic conversation creation function and auto-update triggers

-- =============================================================================
-- FUNCTION: Create Conversation with Participants (Atomic)
-- =============================================================================
-- Creates a conversation and adds participants in a single transaction
-- Prevents race conditions where conversation exists without participants
--
-- Parameters:
--   p_context_type: 'agency_inquiry' or 'general'
--   p_context_id: UUID of agency (required if context_type = 'agency_inquiry')
--   p_participant_ids: Array of user IDs to add as participants
--
-- Returns: UUID of created conversation
--
-- Validations:
--   - Caller must be authenticated (auth.uid() IS NOT NULL)
--   - Caller must be in participant list
--   - At least 2 participants required (conversation needs 2+ people)
--   - All participant IDs must exist in profiles table
--
-- Example:
--   SELECT create_conversation_with_participants(
--     'agency_inquiry',
--     'a1b2c3d4-...',
--     ARRAY['user1-uuid', 'user2-uuid']::UUID[]
--   );

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

  IF v_participant_count != array_length(p_participant_ids, 1) THEN
    RAISE EXCEPTION 'One or more participant IDs do not exist in profiles table';
  END IF;

  -- Validation 5: context_type must be valid
  IF p_context_type NOT IN ('agency_inquiry', 'general') THEN
    RAISE EXCEPTION 'Invalid context_type: %%. Must be either ''agency_inquiry'' or ''general''', p_context_type;
  END IF;

  -- Validation 6: If context_type is 'agency_inquiry', context_id must be provided
  IF p_context_type = 'agency_inquiry' AND p_context_id IS NULL THEN
    RAISE EXCEPTION 'context_id required when context_type is agency_inquiry';
  END IF;

  -- Validation 7: If context_id provided, verify agency exists
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

-- Add function comment
COMMENT ON FUNCTION create_conversation_with_participants IS 'Atomically creates a conversation and adds participants to prevent race conditions';

-- =============================================================================
-- TRIGGER FUNCTION: Update Conversation Last Message Timestamp
-- =============================================================================
-- Automatically updates conversations.last_message_at and updated_at
-- when a new message is inserted into the messages table
--
-- Fires: AFTER INSERT on messages
-- Updates: conversations.last_message_at = message.created_at
--          conversations.updated_at = NOW()

CREATE OR REPLACE FUNCTION trigger_update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the parent conversation's last_message_at and updated_at
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION trigger_update_conversation_last_message IS 'Trigger function to update conversation last_message_at when new messages are inserted';

-- =============================================================================
-- CREATE TRIGGER
-- =============================================================================
-- Trigger fires AFTER INSERT on messages to update conversation timestamp

DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_conversation_last_message();

COMMENT ON TRIGGER update_conversation_last_message_trigger ON public.messages IS 'Updates parent conversation last_message_at when new message inserted';

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
-- DROP FUNCTION IF EXISTS trigger_update_conversation_last_message();
-- DROP FUNCTION IF EXISTS create_conversation_with_participants(TEXT, UUID, UUID[]);
