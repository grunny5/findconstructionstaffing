-- Test: Create role_change_audit table
-- Purpose: Verify the role_change_audit table and all associated objects
-- Date: 2025-12-15

-- Test that the table exists
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
  )), 'role_change_audit table should exist';
  RAISE NOTICE '✓ Table exists';
END $$;

-- Test that all required columns exist with correct types
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'id' AND data_type = 'uuid'
  )), 'id column should exist as UUID';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'user_id' AND data_type = 'uuid'
  )), 'user_id column should exist as UUID';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'admin_id' AND data_type = 'uuid'
  )), 'admin_id column should exist as UUID';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'old_role' AND data_type = 'text'
  )), 'old_role column should exist as TEXT';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'new_role' AND data_type = 'text'
  )), 'new_role column should exist as TEXT';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'changed_at' AND data_type = 'timestamp with time zone'
  )), 'changed_at column should exist as TIMESTAMPTZ';

  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND column_name = 'notes' AND data_type = 'text'
  )), 'notes column should exist as TEXT';

  RAISE NOTICE '✓ All columns exist with correct types';
END $$;

-- Test that RLS is enabled
DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class
    WHERE oid = 'public.role_change_audit'::regclass
  ), 'RLS should be enabled on role_change_audit';
  RAISE NOTICE '✓ RLS is enabled';
END $$;

-- Test that RLS policies exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) >= 2 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
  ), 'At least 2 RLS policies should exist (SELECT and INSERT)';
  RAISE NOTICE '✓ RLS policies exist';
END $$;

-- Test that indexes exist
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
    AND indexname = 'idx_role_audit_user_id'
  )), 'idx_role_audit_user_id index should exist';

  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
    AND indexname = 'idx_role_audit_admin_id'
  )), 'idx_role_audit_admin_id index should exist';

  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
    AND indexname = 'idx_role_audit_changed_at'
  )), 'idx_role_audit_changed_at index should exist';

  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_change_audit'
    AND indexname = 'idx_role_audit_user_changed'
  )), 'idx_role_audit_user_changed composite index should exist';

  RAISE NOTICE '✓ All indexes exist';
END $$;

-- Test that foreign key constraints exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) >= 2 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'role_change_audit'
    AND constraint_type = 'FOREIGN KEY'
  ), 'At least 2 foreign key constraints should exist (user_id and admin_id)';
  RAISE NOTICE '✓ Foreign key constraints exist';
END $$;

-- Test that CHECK constraints exist for role values
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) >= 2 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
    ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public' AND ccu.table_name = 'role_change_audit'
    AND (ccu.column_name = 'old_role' OR ccu.column_name = 'new_role')
  ), 'CHECK constraints should exist for old_role and new_role';
  RAISE NOTICE '✓ CHECK constraints exist for role validation';
END $$;

RAISE NOTICE '';
RAISE NOTICE '=== All Tests Passed ===';
RAISE NOTICE 'role_change_audit table is correctly configured';
