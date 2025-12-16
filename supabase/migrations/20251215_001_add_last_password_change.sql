-- Migration: Add last_password_change to profiles table
-- Purpose: Track when users last changed their password for security auditing
-- Date: 2025-12-15

-- Add last_password_change column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing users with current timestamp
UPDATE public.profiles
SET last_password_change = NOW()
WHERE last_password_change IS NULL;

-- Make the column NOT NULL after backfilling
ALTER TABLE public.profiles
ALTER COLUMN last_password_change SET NOT NULL;

-- Function to update last_password_change when password changes
CREATE OR REPLACE FUNCTION public.update_last_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the encrypted_password has actually changed
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    UPDATE public.profiles
    SET last_password_change = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to detect password changes
DROP TRIGGER IF EXISTS on_auth_user_password_change ON auth.users;
CREATE TRIGGER on_auth_user_password_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_password_change();

-- Create index for querying by last_password_change
CREATE INDEX IF NOT EXISTS idx_profiles_last_password_change
ON public.profiles(last_password_change);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.last_password_change IS
'Timestamp of when the user last changed their password. Updated automatically via trigger on auth.users.';
