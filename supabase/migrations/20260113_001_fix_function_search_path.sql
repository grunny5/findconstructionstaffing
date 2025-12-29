/**
 * Migration: Fix Supabase Security Linter Warnings
 *
 * This migration addresses multiple Supabase security linter warnings:
 *
 * ISSUE 1: function_search_path_mutable (8 functions)
 * ====================================================
 * Functions without explicit search_path can be exploited if a malicious schema
 * is injected into the search path, potentially executing unintended code.
 *
 * Fix: Add SET search_path = '' to each function definition, which forces fully
 * qualified table/function names and prevents search path manipulation.
 *
 * Functions fixed:
 * 1. update_updated_at_column()
 * 2. update_last_password_change()
 * 3. prevent_sensitive_agency_fields_update()
 * 4. calculate_profile_completion(agencies)
 * 5. trigger_update_agency_completion()
 * 6. trigger_update_agency_completion_from_relations()
 * 7. trigger_update_conversation_last_message()
 * 8. create_conversation_with_participants(TEXT, UUID, UUID[])
 *
 * Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
 *
 * ISSUE 2: rls_enabled_no_policy (2 tables)
 * =========================================
 * Tables have RLS enabled but no policies exist, blocking all access.
 *
 * Fix: Create public SELECT policies for reference/lookup tables.
 *
 * Tables fixed:
 * 9. trades - public read access for filtering
 * 10. regions - public read access for filtering
 *
 * Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
 */

-- =============================================================================
-- 1. update_updated_at_column()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
'Trigger function to auto-update updated_at timestamp. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 2. update_last_password_change()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_last_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only update if the encrypted_password has actually changed
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    UPDATE public.profiles
    SET last_password_change = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_last_password_change() IS
'Trigger function to update profiles.last_password_change when auth.users password changes. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 3. prevent_sensitive_agency_fields_update()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.prevent_sensitive_agency_fields_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Prevent modification of primary key
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Cannot modify agency id';
  END IF;

  -- Prevent modification of ownership - must use claim process
  IF OLD.claimed_by IS DISTINCT FROM NEW.claimed_by THEN
    RAISE EXCEPTION 'Cannot modify claimed_by via UPDATE - use claim process';
  END IF;

  -- Prevent modification of claim timestamp
  IF OLD.claimed_at IS DISTINCT FROM NEW.claimed_at THEN
    RAISE EXCEPTION 'Cannot modify claimed_at timestamp';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_sensitive_agency_fields_update() IS
'Trigger function to prevent modification of immutable agency fields (id, claimed_by, claimed_at). Fixed: search_path set to empty for security.';


-- =============================================================================
-- 4. calculate_profile_completion(agency_row agencies)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(agency_row public.agencies)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  score INTEGER := 0;
  trades_count INTEGER;
  regions_count INTEGER;
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Basic Info (20)
  IF agency_row.name IS NOT NULL AND TRIM(agency_row.name) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.description IS NOT NULL AND TRIM(agency_row.description) != '' THEN
    score := score + 10;
  END IF;

  IF agency_row.website IS NOT NULL AND TRIM(agency_row.website) != '' THEN
    score := score + 5;
  END IF;

  -- Contact (15)
  IF agency_row.phone IS NOT NULL AND TRIM(agency_row.phone) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.email IS NOT NULL AND TRIM(agency_row.email) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.headquarters IS NOT NULL AND TRIM(agency_row.headquarters) != '' THEN
    score := score + 5;
  END IF;

  -- Services (40)
  SELECT COUNT(*)
  INTO trades_count
  FROM public.agency_trades
  WHERE agency_id = agency_row.id;

  IF trades_count > 0 THEN
    score := score + 20;
  END IF;

  SELECT COUNT(*)
  INTO regions_count
  FROM public.agency_regions
  WHERE agency_id = agency_row.id;

  IF regions_count > 0 THEN
    score := score + 20;
  END IF;

  -- Additional (15)
  IF agency_row.logo_url IS NOT NULL AND TRIM(agency_row.logo_url) != '' THEN
    score := score + 10;
  END IF;

  -- Founded Year (5)
  IF agency_row.founded_year IS NOT NULL
     AND agency_row.founded_year >= 1800
     AND agency_row.founded_year <= current_year THEN
    score := score + 5;
  END IF;

  -- Details (10)
  IF agency_row.employee_count IS NOT NULL AND TRIM(agency_row.employee_count) != '' THEN
    score := score + 5;
  END IF;

  IF agency_row.company_size IS NOT NULL AND TRIM(agency_row.company_size) != '' THEN
    score := score + 5;
  END IF;

  RETURN score;
END;
$$;

COMMENT ON FUNCTION public.calculate_profile_completion IS
'Calculates profile completion percentage (0-100). STABLE function that queries agency_trades and agency_regions. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 5. trigger_update_agency_completion()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_agency_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Calculate and set the completion percentage
  NEW.profile_completion_percentage := public.calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_update_agency_completion IS
'Trigger function to auto-update profile_completion_percentage on agencies INSERT/UPDATE. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 6. trigger_update_agency_completion_from_relations()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_agency_completion_from_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  affected_agency_id UUID;
  agency_record public.agencies;
BEGIN
  -- Determine which agency_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_agency_id := OLD.agency_id;
  ELSE
    affected_agency_id := NEW.agency_id;
  END IF;

  -- Fetch the full agency record
  SELECT * INTO agency_record
  FROM public.agencies
  WHERE id = affected_agency_id;

  -- Update the agency's completion percentage
  IF FOUND THEN
    UPDATE public.agencies
    SET profile_completion_percentage = public.calculate_profile_completion(agency_record),
        updated_at = NOW()
    WHERE id = affected_agency_id;
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.trigger_update_agency_completion_from_relations IS
'Trigger function to update agency completion when trades/regions relationships change. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 7. trigger_update_conversation_last_message()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
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

COMMENT ON FUNCTION public.trigger_update_conversation_last_message IS
'Trigger function to update conversation last_message_at when new messages are inserted. Fixed: search_path set to empty for security.';


-- =============================================================================
-- 8. create_conversation_with_participants(TEXT, UUID, UUID[])
-- =============================================================================
-- First drop the existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS public.create_conversation_with_participants(TEXT, UUID, UUID[]);

CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  p_context_type TEXT,
  p_context_id UUID DEFAULT NULL,
  p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

COMMENT ON FUNCTION public.create_conversation_with_participants IS
'Creates a new conversation with multiple participants atomically.
Validates authentication, participant count (min 2), caller inclusion,
participant existence, context_type validity, and agency context.
Fixed: search_path set to empty for security.';


-- =============================================================================
-- 9. RLS POLICIES: trades table
-- =============================================================================
-- Issue: RLS enabled but no policies exist (rls_enabled_no_policy warning)
-- Fix: Create public read policy for reference data

DROP POLICY IF EXISTS "Public can view all trades" ON public.trades;
CREATE POLICY "Public can view all trades" ON public.trades
    FOR SELECT
    USING (true);

COMMENT ON POLICY "Public can view all trades" ON public.trades IS
'Allows anonymous users to read all trade specialties for filtering. Reference data is publicly accessible.';


-- =============================================================================
-- 10. RLS POLICIES: regions table
-- =============================================================================
-- Issue: RLS enabled but no policies exist (rls_enabled_no_policy warning)
-- Fix: Create public read policy for reference data

DROP POLICY IF EXISTS "Public can view all regions" ON public.regions;
CREATE POLICY "Public can view all regions" ON public.regions
    FOR SELECT
    USING (true);

COMMENT ON POLICY "Public can view all regions" ON public.regions IS
'Allows anonymous users to read all regions for filtering. Reference data is publicly accessible.';


-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify functions with:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proname IN (
--   'update_updated_at_column',
--   'update_last_password_change',
--   'prevent_sensitive_agency_fields_update',
--   'calculate_profile_completion',
--   'trigger_update_agency_completion',
--   'trigger_update_agency_completion_from_relations',
--   'trigger_update_conversation_last_message',
--   'create_conversation_with_participants'
-- );
-- The proconfig column should show: {search_path=}
--
-- Verify RLS policies with:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('trades', 'regions');
