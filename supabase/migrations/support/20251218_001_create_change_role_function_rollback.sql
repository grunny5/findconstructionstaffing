-- Rollback: Create change_user_role RPC function
-- Purpose: Remove the change_user_role function
-- Date: 2025-12-17

-- Revoke execute permission
REVOKE EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT, TEXT) FROM authenticated;

-- Drop the function
DROP FUNCTION IF EXISTS public.change_user_role(UUID, TEXT, TEXT) CASCADE;
