# Migration Test: 20251222_001_create_agency_claim_tables

## Migration Overview
Creates three new tables for agency claim management and extends the agencies table.

## Pre-Requisites
- Docker must be running
- Supabase local instance must be started (`supabase start`)
- Database should be reset before testing (`supabase db reset`)

## Test Commands

### 1. Apply Migration
```bash
supabase db reset
```

### 2. Verify Tables Created
```sql
-- Check agency_claim_requests table exists
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agency_claim_requests'
ORDER BY ordinal_position;

-- Expected columns:
-- id, agency_id, user_id, business_email, phone_number, position_title,
-- verification_method, additional_notes, status, reviewed_by, reviewed_at,
-- rejection_reason, email_domain_verified, documents_uploaded, created_at, updated_at

-- Check agency_claim_audit_log table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agency_claim_audit_log'
ORDER BY ordinal_position;

-- Expected columns:
-- id, claim_id, admin_id, action, notes, created_at

-- Check agency_profile_edits table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agency_profile_edits'
ORDER BY ordinal_position;

-- Expected columns:
-- id, agency_id, edited_by, field_name, old_value, new_value, created_at
```

### 3. Verify Agencies Table Columns Added
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
  AND column_name IN ('profile_completion_percentage', 'last_edited_at', 'last_edited_by')
ORDER BY column_name;

-- Expected: 3 new columns
```

### 4. Verify Indexes Created
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_agencies_claimed_by',
    'idx_claim_requests_status',
    'idx_claim_requests_agency_user',
    'idx_claim_audit_claim_id',
    'idx_profile_edits_agency'
  )
ORDER BY indexname;

-- Expected: 5 indexes
```

### 5. Verify Constraints
```sql
-- Check UNIQUE constraint on (agency_id, user_id)
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'agency_claim_requests'
  AND constraint_type = 'UNIQUE';

-- Check CHECK constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%agency_claim%'
ORDER BY constraint_name;

-- Expected CHECK constraints:
-- - verification_method IN ('email', 'phone', 'manual')
-- - status IN ('pending', 'under_review', 'approved', 'rejected')
-- - action IN ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted')
-- - profile_completion_percentage >= 0 AND <= 100
```

### 6. Verify Foreign Keys
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits', 'agencies')
ORDER BY tc.table_name, kcu.column_name;

-- Expected foreign keys:
-- agency_claim_requests.agency_id -> agencies.id (CASCADE)
-- agency_claim_requests.user_id -> auth.users.id (CASCADE)
-- agency_claim_requests.reviewed_by -> auth.users.id
-- agency_claim_audit_log.claim_id -> agency_claim_requests.id (CASCADE)
-- agency_claim_audit_log.admin_id -> auth.users.id
-- agency_profile_edits.agency_id -> agencies.id (CASCADE)
-- agency_profile_edits.edited_by -> auth.users.id
-- agencies.last_edited_by -> auth.users.id
```

### 7. Verify Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('agency_claim_requests')
ORDER BY event_object_table, trigger_name;

-- Expected trigger: update_agency_claim_requests_updated_at on UPDATE
```

### 8. Test Data Insertion
```sql
-- Test inserting a claim request
INSERT INTO public.agency_claim_requests (
  agency_id,
  user_id,
  business_email,
  phone_number,
  position_title,
  verification_method,
  additional_notes
) VALUES (
  (SELECT id FROM public.agencies LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'owner@agency.com',
  '555-0100',
  'CEO',
  'email',
  'I am the owner of this agency'
)
RETURNING id, status, email_domain_verified, created_at;

-- Expected: New row with status='pending', email_domain_verified=false

-- Test inserting audit log entry
INSERT INTO public.agency_claim_audit_log (
  claim_id,
  action,
  notes
) VALUES (
  (SELECT id FROM public.agency_claim_requests LIMIT 1),
  'submitted',
  'Initial submission'
)
RETURNING id, action, created_at;

-- Expected: New audit log entry

-- Test inserting profile edit
INSERT INTO public.agency_profile_edits (
  agency_id,
  edited_by,
  field_name,
  old_value,
  new_value
) VALUES (
  (SELECT id FROM public.agencies LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'description',
  '"Old description"'::jsonb,
  '"New description"'::jsonb
)
RETURNING id, field_name, created_at;

-- Expected: New profile edit entry
```

### 9. Test Constraint Violations
```sql
-- Test duplicate claim (should fail with UNIQUE constraint violation)
INSERT INTO public.agency_claim_requests (
  agency_id,
  user_id,
  business_email,
  phone_number,
  position_title,
  verification_method
) VALUES (
  (SELECT agency_id FROM public.agency_claim_requests LIMIT 1),
  (SELECT user_id FROM public.agency_claim_requests LIMIT 1),
  'duplicate@test.com',
  '555-0101',
  'Manager',
  'email'
);
-- Expected: ERROR: duplicate key value violates unique constraint

-- Test invalid verification_method (should fail with CHECK constraint violation)
INSERT INTO public.agency_claim_requests (
  agency_id,
  user_id,
  business_email,
  phone_number,
  position_title,
  verification_method
) VALUES (
  (SELECT id FROM public.agencies LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'test@test.com',
  '555-0102',
  'Owner',
  'invalid_method'
);
-- Expected: ERROR: new row violates check constraint

-- Test invalid status (should fail with CHECK constraint violation)
UPDATE public.agency_claim_requests
SET status = 'invalid_status'
WHERE id = (SELECT id FROM public.agency_claim_requests LIMIT 1);
-- Expected: ERROR: new row violates check constraint

-- Test invalid profile_completion_percentage (should fail with CHECK constraint violation)
UPDATE public.agencies
SET profile_completion_percentage = 150
WHERE id = (SELECT id FROM public.agencies LIMIT 1);
-- Expected: ERROR: new row violates check constraint
```

### 10. Test Rollback
```sql
-- Run rollback commands from migration file
DROP TRIGGER IF EXISTS update_agency_claim_requests_updated_at ON public.agency_claim_requests;
DROP INDEX IF EXISTS idx_profile_edits_agency;
DROP INDEX IF EXISTS idx_claim_audit_claim_id;
DROP INDEX IF EXISTS idx_claim_requests_agency_user;
DROP INDEX IF EXISTS idx_claim_requests_status;
DROP INDEX IF EXISTS idx_agencies_claimed_by;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS last_edited_by;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS last_edited_at;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS profile_completion_percentage;
DROP TABLE IF EXISTS public.agency_profile_edits;
DROP TABLE IF EXISTS public.agency_claim_audit_log;
DROP TABLE IF EXISTS public.agency_claim_requests;

-- Verify tables are removed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits')
ORDER BY table_name;
-- Expected: 0 rows
```

## Acceptance Criteria Checklist

- [ ] `agency_claim_requests` table created with all fields from FSD
- [ ] `agency_claim_audit_log` table created
- [ ] `agency_profile_edits` table created
- [ ] `agencies` table altered to add: `profile_completion_percentage`, `last_edited_at`, `last_edited_by`
- [ ] Indexes created: `idx_agencies_claimed_by`, `idx_claim_requests_status`, `idx_claim_requests_agency_user`, `idx_claim_audit_claim_id`, `idx_profile_edits_agency`
- [ ] Check constraints enforce valid enum values (status, verification_method, action)
- [ ] UNIQUE constraint on `agency_id + user_id` in claim_requests
- [ ] Migration runs successfully with no errors
- [ ] All tables and indexes verified with SQL queries
- [ ] Rollback script tested
- [ ] Documentation added to migration comments

## Notes

- Docker daemon must be running to execute these tests
- All tests should be run after `supabase db reset`
- Save test results for documentation
