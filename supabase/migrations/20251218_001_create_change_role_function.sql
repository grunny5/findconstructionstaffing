-- Migration: Create change_user_role RPC function
-- Purpose: Secure function for admins to change user roles with audit logging
-- Date: 2025-12-17

-- Create the change_user_role function
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  current_role TEXT;
BEGIN
  -- Get the ID of the user calling this function
  caller_id := auth.uid();

  -- Validation 1: Caller must be authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please log in to change user roles.'
      USING HINT = 'You must be logged in as an admin to perform this action.';
  END IF;

  -- Validation 2: Get caller's role and verify they are an admin
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = caller_id;

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found for authenticated user.'
      USING HINT = 'Your user profile may not be properly configured.';
  END IF;

  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Insufficient permissions. Only admins can change user roles. Current role: %', caller_role
      USING HINT = 'Contact an administrator if you need elevated permissions.';
  END IF;

  -- Validation 3: Target user must exist
  SELECT role INTO current_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF current_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found. User ID: %', target_user_id
      USING HINT = 'Verify the user ID is correct.';
  END IF;

  -- Validation 4: Prevent self-demotion (admins cannot change their own role)
  IF caller_id = target_user_id THEN
    RAISE EXCEPTION 'Self-modification not allowed. Admins cannot change their own role.'
      USING HINT = 'Ask another administrator to change your role if needed.';
  END IF;

  -- Validation 5: New role must be valid
  IF new_role NOT IN ('user', 'agency_owner', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified: ''%''. Must be one of: user, agency_owner, admin.', new_role
      USING HINT = 'Valid roles are: ''user'', ''agency_owner'', ''admin''.';
  END IF;

  -- Validation 6: Check if role is actually changing
  IF current_role = new_role THEN
    RAISE EXCEPTION 'Target user already has role ''%''. No change needed.', new_role
      USING HINT = 'The user already has the requested role.';
  END IF;

  -- Atomic operation: Update role AND insert audit log
  -- Both must succeed or both will be rolled back
  BEGIN
    -- Step 1: Update the user's role in profiles table
    UPDATE public.profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Step 2: Insert audit log entry
    -- SECURITY DEFINER allows this to bypass RLS policies
    INSERT INTO public.role_change_audit (
      user_id,
      admin_id,
      old_role,
      new_role,
      changed_at,
      notes
    ) VALUES (
      target_user_id,
      caller_id,
      current_role,
      new_role,
      NOW(),
      admin_notes
    );

    -- Success
    RETURN TRUE;

  EXCEPTION
    WHEN OTHERS THEN
      -- If anything fails, re-raise the error (transaction will roll back)
      RAISE EXCEPTION 'Failed to change user role: %', SQLERRM
        USING HINT = 'The operation was rolled back. Please contact support if this persists.';
  END;
END;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.change_user_role(UUID, TEXT, TEXT) IS
'Securely change a user''s role with automatic audit logging. Only admins can call this function.
Prevents self-demotion and validates all inputs. Atomically updates role and creates audit record.

Parameters:
  - target_user_id: UUID of the user whose role should be changed
  - new_role: New role to assign (''user'', ''agency_owner'', or ''admin'')
  - admin_notes: Optional notes explaining the reason for the role change

Returns: TRUE on success, raises exception on failure

Example:
  SELECT change_user_role(
    ''123e4567-e89b-12d3-a456-426614174000''::UUID,
    ''agency_owner'',
    ''Promoted to agency owner after verification''
  );';

-- Grant execute permission to authenticated users
-- (The function itself checks if the caller is an admin)
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT, TEXT) TO authenticated;
