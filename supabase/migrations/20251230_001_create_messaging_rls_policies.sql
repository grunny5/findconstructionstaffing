-- Migration: Create Row Level Security policies for messaging tables
-- Feature: Direct Messaging System (Feature #009)
-- Description: Implements RLS policies to secure messaging data based on conversation participation and user roles

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================
-- Enable RLS on all messaging tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add comments documenting the security model
COMMENT ON TABLE public.conversations IS 'Conversations - RLS ENABLED - participants see their conversations, admins see all';
COMMENT ON TABLE public.conversation_participants IS 'Conversation participants - RLS ENABLED - users manage own participation, admins see all';
COMMENT ON TABLE public.messages IS 'Messages - RLS ENABLED - participants see conversation messages, admins see all';

-- =============================================================================
-- CONVERSATIONS POLICIES
-- =============================================================================

-- Policy: Users can view conversations they participate in
-- Allows authenticated users to SELECT conversations where they are a participant
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can create conversations
-- Allows any authenticated user to INSERT new conversations
-- Participant validation handled by database function
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Admins can view all conversations
-- Allows users with role='admin' to SELECT all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view own conversations" ON public.conversations IS
  'Allows participants to view conversations they are part of';
COMMENT ON POLICY "Authenticated users can create conversations" ON public.conversations IS
  'Allows authenticated users to create new conversations (participant validation via DB function)';
COMMENT ON POLICY "Admins can view all conversations" ON public.conversations IS
  'Allows admins to view all conversations for moderation';

-- =============================================================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- =============================================================================

-- Policy: Users can view their own participant records
-- Allows users to see which conversations they are part of
CREATE POLICY "Users can view own participation"
  ON public.conversation_participants FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can update their own last_read_at
-- Allows users to mark conversations as read
CREATE POLICY "Users can update own last_read_at"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all participants
-- Allows admins to see all conversation participants
CREATE POLICY "Admins can view all participants"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view own participation" ON public.conversation_participants IS
  'Allows users to view their own conversation participation records';
COMMENT ON POLICY "Users can update own last_read_at" ON public.conversation_participants IS
  'Allows users to update their read status for conversations';
COMMENT ON POLICY "Admins can view all participants" ON public.conversation_participants IS
  'Allows admins to view all conversation participants for moderation';

-- =============================================================================
-- MESSAGES POLICIES
-- =============================================================================

-- Policy: Users can view messages in conversations they participate in
-- Allows users to SELECT messages from their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Policy: Users can insert messages in conversations they participate in
-- Allows users to send messages to their conversations
CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own messages
-- Allows users to edit their own messages (e.g., within 5-minute window)
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Policy: Users can soft-delete their own messages
-- Allows users to mark their messages as deleted
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Policy: Admins can view all messages
-- Allows admins to view all messages for moderation
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can soft-delete any message
-- Allows admins to moderate content by soft-deleting messages
CREATE POLICY "Admins can delete any message"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add policy comments for documentation
COMMENT ON POLICY "Users can view messages in own conversations" ON public.messages IS
  'Allows participants to view messages in their conversations';
COMMENT ON POLICY "Users can send messages in own conversations" ON public.messages IS
  'Allows participants to send messages in their conversations';
COMMENT ON POLICY "Users can update own messages" ON public.messages IS
  'Allows users to edit their own messages (e.g., typo corrections)';
COMMENT ON POLICY "Users can delete own messages" ON public.messages IS
  'Allows users to soft-delete their own messages';
COMMENT ON POLICY "Admins can view all messages" ON public.messages IS
  'Allows admins to view all messages for content moderation';
COMMENT ON POLICY "Admins can delete any message" ON public.messages IS
  'Allows admins to soft-delete any message for content moderation';

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- To rollback this migration, run:
--
-- -- Drop all policies
-- DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
-- DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
-- DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
-- DROP POLICY IF EXISTS "Admins can view all participants" ON public.conversation_participants;
-- DROP POLICY IF EXISTS "Users can update own last_read_at" ON public.conversation_participants;
-- DROP POLICY IF EXISTS "Users can view own participation" ON public.conversation_participants;
-- DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
-- DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
-- DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
--
-- -- Disable RLS
-- ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
