-- =============================================================================
-- Migration: Create Notification Preferences Table
-- Description: Store user preferences for email notifications
-- Version: 20251230_001
-- =============================================================================

-- =============================================================================
-- TABLE: notification_preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  -- Primary Key
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification Preferences
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_batch_enabled BOOLEAN NOT NULL DEFAULT true,
  email_daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notification_preferences IS 'User preferences for email notifications';
COMMENT ON COLUMN public.notification_preferences.user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.notification_preferences.email_enabled IS 'Enable/disable email notifications for new messages';
COMMENT ON COLUMN public.notification_preferences.email_batch_enabled IS 'Wait 5 minutes before sending email (batch mode)';
COMMENT ON COLUMN public.notification_preferences.email_daily_digest_enabled IS 'Send daily digest at 8:00 AM instead of real-time notifications';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Update updated_at timestamp on UPDATE
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for looking up preferences by user_id (primary key already provides this)
-- No additional indexes needed for this simple table

-- =============================================================================
-- SEED DEFAULT PREFERENCES FOR EXISTING USERS
-- =============================================================================

-- Insert default preferences for any existing users who don't have preferences yet
INSERT INTO public.notification_preferences (user_id, email_enabled, email_batch_enabled, email_daily_digest_enabled)
SELECT
  id,
  true,  -- email_enabled
  true,  -- email_batch_enabled
  false  -- email_daily_digest_enabled
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
