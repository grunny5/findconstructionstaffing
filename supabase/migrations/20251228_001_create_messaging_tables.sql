-- Migration: Create messaging tables for direct messaging system
-- Feature: Direct Messaging System (Feature #009)
-- Description: Adds conversations, participants, and messages tables with real-time support

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================
-- Stores conversation metadata and context (e.g., agency inquiry)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context Information
  context_type TEXT NOT NULL DEFAULT 'general'
    CHECK (context_type IN ('agency_inquiry', 'general')),
  context_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.conversations IS 'Stores conversation metadata and context for direct messaging';
COMMENT ON COLUMN public.conversations.context_type IS 'Type of conversation: agency_inquiry (from profile) or general';
COMMENT ON COLUMN public.conversations.context_id IS 'Agency ID if context_type is agency_inquiry';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of last message (for sorting)';

-- =============================================================================
-- CONVERSATION PARTICIPANTS TABLE
-- =============================================================================
-- Many-to-many relationship between conversations and users
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(conversation_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.conversation_participants IS 'Links users to conversations (many-to-many)';
COMMENT ON COLUMN public.conversation_participants.last_read_at IS 'Last time user read messages in this conversation (for unread tracking)';

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Message Content
  content TEXT NOT NULL
    CHECK (char_length(content) > 0 AND char_length(content) <= 10000),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.messages IS 'Stores individual messages in conversations';
COMMENT ON COLUMN public.messages.content IS 'Message text content (1-10,000 characters)';
COMMENT ON COLUMN public.messages.edited_at IS 'Timestamp when message was last edited (null if never edited)';
COMMENT ON COLUMN public.messages.deleted_at IS 'Timestamp when message was soft-deleted (null if active)';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
-- Index for sorting conversations by last activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON public.conversations(last_message_at DESC);

-- Composite index for fetching messages in a conversation (sorted by time)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

-- Index for finding all conversations for a user
CREATE INDEX IF NOT EXISTS idx_participants_user_id
  ON public.conversation_participants(user_id);

-- Index for finding all participants in a conversation
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id
  ON public.conversation_participants(conversation_id);

-- Index for unread message queries (last_read_at comparisons)
CREATE INDEX IF NOT EXISTS idx_participants_last_read_at
  ON public.conversation_participants(last_read_at);

-- Index for filtering non-deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at
  ON public.messages(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================
-- Auto-update updated_at timestamp on conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
-- DROP INDEX IF EXISTS idx_messages_deleted_at;
-- DROP INDEX IF EXISTS idx_participants_last_read_at;
-- DROP INDEX IF EXISTS idx_participants_conversation_id;
-- DROP INDEX IF EXISTS idx_participants_user_id;
-- DROP INDEX IF EXISTS idx_messages_conversation_created;
-- DROP INDEX IF EXISTS idx_conversations_last_message_at;
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.conversation_participants;
-- DROP TABLE IF EXISTS public.conversations;
