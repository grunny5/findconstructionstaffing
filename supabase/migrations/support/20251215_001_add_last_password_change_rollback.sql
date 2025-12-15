-- Rollback Migration: Remove last_password_change from profiles table
-- Purpose: Undo the addition of password change tracking
-- Date: 2025-12-15
-- WARNING: This will permanently delete password change history data

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_password_change ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_last_password_change();

-- Drop the index
DROP INDEX IF EXISTS public.idx_profiles_last_password_change;

-- Remove the column (this will delete all password change history data)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS last_password_change;
