# Migration Test: 20251222_002_create_claim_rls_policies

## Migration Overview
Creates Row Level Security (RLS) policies for the agency claim management tables, ensuring proper data access control based on user roles.

## Pre-Requisites
- Docker must be running
- Supabase local instance must be started (`supabase start`)
- Migration 20251222_001 must be applied (creates the tables)
- Test users must exist with different roles (user, admin, agency_owner)

## Test Setup

### 1. Apply Migration
```bash
supabase db reset
```

### 2. Create Test Users

```sql
-- Create test users for different roles
-- Note: In real environment, these would be created via auth.users
-- For testing, we'll simulate with profiles

-- Insert test user IDs (these would normally come from auth.users)
-- User 1: Regular user (will submit claims)
-- User 2: Admin user
-- User 3: Agency owner

-- Verify profiles table has test users
SELECT id, email, role FROM public.profiles ORDER BY role;
```

## RLS Policy Tests

### 3. Verify RLS is Enabled

```sql
-- Check RLS is enabled on all claim tables
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits')
ORDER BY tablename;

-- Expected: 3 rows with rls_enabled = true
```

### 4. Verify Policies Created

```sql
-- List all policies for claim management tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits', 'agencies')
ORDER BY tablename, policyname;

-- Expected policies:
-- agency_claim_requests: 4 policies (Users view own, Users create, Admins view all, Admins update)
-- agency_claim_audit_log: 3 policies (Users view own, Admins view all, Authenticated create)
-- agency_profile_edits: 4 policies (Owners view, Admins view, Owners create, Admins create)
-- agencies: 2 new policies (Owners update, Admins update)
```

### 5. Test agency_claim_requests Policies

#### Test: Users can view their own claims

```sql
-- Set session to regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Should return only claims by this user
SELECT id, user_id, agency_id, status
FROM public.agency_claim_requests
WHERE user_id = '<user_id_1>';

-- Expected: Only returns claims where user_id = <user_id_1>
```

#### Test: Users cannot view other users' claims

```sql
-- Set session to user 1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Attempt to view user 2's claims (should return empty)
SELECT id, user_id, agency_id, status
FROM public.agency_claim_requests
WHERE user_id = '<user_id_2>';

-- Expected: 0 rows (user 1 cannot see user 2's claims)
```

#### Test: Users can insert their own claims

```sql
-- Set session to regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Insert a claim for this user
INSERT INTO public.agency_claim_requests (
  agency_id,
  user_id,
  business_email,
  phone_number,
  position_title,
  verification_method
) VALUES (
  '<agency_id>',
  '<user_id_1>',
  'owner@example.com',
  '+1-555-0100',
  'CEO',
  'email'
)
RETURNING id, user_id, status;

-- Expected: Insert succeeds, returns new claim with status='pending'
```

#### Test: Users cannot insert claims for other users

```sql
-- Set session to user 1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Attempt to insert claim with different user_id (should fail)
INSERT INTO public.agency_claim_requests (
  agency_id,
  user_id,
  business_email,
  phone_number,
  position_title,
  verification_method
) VALUES (
  '<agency_id>',
  '<user_id_2>',  -- Different user!
  'fake@example.com',
  '+1-555-0101',
  'Manager',
  'email'
);

-- Expected: ERROR - new row violates row-level security policy
```

#### Test: Admins can view all claims

```sql
-- Set session to admin user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- Should return ALL claims
SELECT id, user_id, agency_id, status
FROM public.agency_claim_requests
ORDER BY created_at DESC;

-- Expected: Returns claims from all users
```

#### Test: Admins can update claim status

```sql
-- Set session to admin user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- Update claim status
UPDATE public.agency_claim_requests
SET
  status = 'approved',
  reviewed_by = '<admin_user_id>',
  reviewed_at = NOW()
WHERE id = '<claim_id>';

-- Expected: Update succeeds
```

#### Test: Regular users cannot update claims

```sql
-- Set session to regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Attempt to update own claim status (should fail)
UPDATE public.agency_claim_requests
SET status = 'approved'
WHERE id = '<user_id_1_claim_id>'
  AND user_id = '<user_id_1>';

-- Expected: ERROR - new row violates row-level security policy
-- Note: Users can view their claims but cannot update status
```

### 6. Test agency_claim_audit_log Policies

#### Test: Users can view audit logs for their own claims

```sql
-- Set session to regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- View audit logs for own claims
SELECT
  acal.id,
  acal.claim_id,
  acal.action,
  acal.notes,
  acr.user_id
FROM public.agency_claim_audit_log acal
JOIN public.agency_claim_requests acr ON acr.id = acal.claim_id
WHERE acr.user_id = '<user_id_1>';

-- Expected: Returns audit logs only for user 1's claims
```

#### Test: Users cannot view audit logs for other users' claims

```sql
-- Set session to user 1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Attempt to view audit logs for user 2's claims
SELECT
  acal.id,
  acal.claim_id,
  acal.action
FROM public.agency_claim_audit_log acal
JOIN public.agency_claim_requests acr ON acr.id = acal.claim_id
WHERE acr.user_id = '<user_id_2>';

-- Expected: 0 rows
```

#### Test: Users can create audit logs for their own claims

```sql
-- Set session to regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id_1>"}';

-- Insert audit log for own claim
INSERT INTO public.agency_claim_audit_log (
  claim_id,
  admin_id,
  action,
  notes
) VALUES (
  '<user_id_1_claim_id>',
  NULL,  -- User-initiated action
  'submitted',
  'Initial claim submission'
)
RETURNING id, action;

-- Expected: Insert succeeds
```

#### Test: Admins can view all audit logs

```sql
-- Set session to admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- View all audit logs
SELECT id, claim_id, action, admin_id, created_at
FROM public.agency_claim_audit_log
ORDER BY created_at DESC;

-- Expected: Returns all audit logs
```

#### Test: Admins can create audit logs for any claim

```sql
-- Set session to admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- Insert audit log as admin
INSERT INTO public.agency_claim_audit_log (
  claim_id,
  admin_id,
  action,
  notes
) VALUES (
  '<any_claim_id>',
  '<admin_user_id>',
  'under_review',
  'Admin reviewing claim'
)
RETURNING id, action, admin_id;

-- Expected: Insert succeeds with admin_id set
```

### 7. Test agency_profile_edits Policies

#### Test: Agency owners can view edits for their agency

```sql
-- Set session to agency owner
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<agency_owner_user_id>"}';

-- View edits for owned agency
SELECT
  ape.id,
  ape.agency_id,
  ape.field_name,
  ape.edited_by,
  a.claimed_by
FROM public.agency_profile_edits ape
JOIN public.agencies a ON a.id = ape.agency_id
WHERE a.claimed_by = '<agency_owner_user_id>';

-- Expected: Returns edits only for agencies owned by this user
```

#### Test: Agency owners cannot view edits for other agencies

```sql
-- Set session to agency owner 1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<agency_owner_1_id>"}';

-- Attempt to view edits for agency owner 2's agency
SELECT
  ape.id,
  ape.agency_id,
  ape.field_name
FROM public.agency_profile_edits ape
JOIN public.agencies a ON a.id = ape.agency_id
WHERE a.claimed_by = '<agency_owner_2_id>';

-- Expected: 0 rows
```

#### Test: Agency owners can create edit records for their agency

```sql
-- Set session to agency owner
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<agency_owner_user_id>"}';

-- Insert edit record
INSERT INTO public.agency_profile_edits (
  agency_id,
  edited_by,
  field_name,
  old_value,
  new_value
) VALUES (
  '<owned_agency_id>',
  '<agency_owner_user_id>',
  'description',
  '"Old description"'::jsonb,
  '"New description"'::jsonb
)
RETURNING id, agency_id, field_name;

-- Expected: Insert succeeds
```

#### Test: Admins can view all profile edits

```sql
-- Set session to admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- View all profile edits
SELECT id, agency_id, field_name, edited_by, created_at
FROM public.agency_profile_edits
ORDER BY created_at DESC;

-- Expected: Returns all profile edits for all agencies
```

#### Test: Admins can create edit records for any agency

```sql
-- Set session to admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- Insert edit record for any agency
INSERT INTO public.agency_profile_edits (
  agency_id,
  edited_by,
  field_name,
  old_value,
  new_value
) VALUES (
  '<any_agency_id>',
  '<admin_user_id>',
  'verified',
  'false'::jsonb,
  'true'::jsonb
)
RETURNING id, agency_id, field_name;

-- Expected: Insert succeeds
```

### 8. Test agencies Table Policies

#### Test: Agency owners can update their agency

```sql
-- Set session to agency owner
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<agency_owner_user_id>"}';

-- Update owned agency
UPDATE public.agencies
SET
  description = 'Updated by owner',
  last_edited_at = NOW(),
  last_edited_by = '<agency_owner_user_id>'
WHERE claimed_by = '<agency_owner_user_id>';

-- Expected: Update succeeds
```

#### Test: Agency owners cannot update other agencies

```sql
-- Set session to agency owner 1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<agency_owner_1_id>"}';

-- Attempt to update agency owned by owner 2 (should fail)
UPDATE public.agencies
SET description = 'Unauthorized update'
WHERE claimed_by = '<agency_owner_2_id>';

-- Expected: 0 rows updated (policy prevents access)
```

#### Test: Admins can update any agency

```sql
-- Set session to admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';

-- Update any agency
UPDATE public.agencies
SET
  verified = true,
  last_edited_at = NOW(),
  last_edited_by = '<admin_user_id>'
WHERE id = '<any_agency_id>';

-- Expected: Update succeeds
```

### 9. Test Rollback

```sql
-- Run rollback commands from migration file
DROP POLICY IF EXISTS "Admins can update any agency" ON public.agencies;
DROP POLICY IF EXISTS "Owners can update their agency" ON public.agencies;
DROP POLICY IF EXISTS "Admins can create edits for any agency" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Owners can create edits for their agency" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Admins can view all profile edits" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Owners can view their agency edits" ON public.agency_profile_edits;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.agency_claim_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.agency_claim_audit_log;
DROP POLICY IF EXISTS "Users can view own claim audit logs" ON public.agency_claim_audit_log;
DROP POLICY IF EXISTS "Admins can update claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Admins can view all claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Users can create claims" ON public.agency_claim_requests;
DROP POLICY IF EXISTS "Users can view own claims" ON public.agency_claim_requests;
ALTER TABLE public.agency_profile_edits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_claim_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_claim_requests DISABLE ROW LEVEL SECURITY;

-- Verify policies are removed
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agency_claim_requests', 'agency_claim_audit_log', 'agency_profile_edits')
  AND policyname LIKE '%claim%' OR policyname LIKE '%edit%';

-- Expected: 0 rows
```

## Acceptance Criteria Checklist

- [ ] RLS enabled on `agency_claim_requests`, `agency_claim_audit_log`, `agency_profile_edits`
- [ ] Policy: Users can SELECT their own claim requests ✓
- [ ] Policy: Users can INSERT their own claim requests ✓
- [ ] Policy: Users CANNOT view or modify other users' claims ✓
- [ ] Policy: Admins can SELECT all claim requests ✓
- [ ] Policy: Admins can UPDATE all claim requests ✓
- [ ] Policy: Users can view audit logs for their own claims ✓
- [ ] Policy: Admins can view all audit logs ✓
- [ ] Policy: Authenticated users can create audit logs (users for own claims, admins for any) ✓
- [ ] Policy: Agency owners can view edits for their agencies ✓
- [ ] Policy: Agency owners can create edit records for their agencies ✓
- [ ] Policy: Admins can view all profile edits ✓
- [ ] Policy: Admins can create edit records for any agency ✓
- [ ] Policy: Agency owners can UPDATE their claimed agency ✓
- [ ] Policy: Admins can UPDATE any agency ✓
- [ ] All policies tested with different user roles (user, admin, agency_owner)
- [ ] Verified users cannot access other users' data
- [ ] Verified admins can access all data
- [ ] Migration runs successfully with no errors
- [ ] Rollback script tested

## Security Test Scenarios

### Scenario 1: Regular User Flow
1. User authenticates
2. User submits claim request → SUCCESS
3. User views own claims → SUCCESS (sees only own claims)
4. User attempts to view other user's claims → FAILURE (empty result)
5. User attempts to update claim status → FAILURE (RLS violation)

### Scenario 2: Admin Flow
1. Admin authenticates
2. Admin views all claims → SUCCESS
3. Admin updates claim status → SUCCESS
4. Admin creates audit log entry → SUCCESS
5. Admin views all audit logs → SUCCESS
6. Admin updates any agency profile → SUCCESS

### Scenario 3: Agency Owner Flow
1. Agency owner authenticates
2. Owner views edit history for owned agency → SUCCESS
3. Owner attempts to view other agency's edits → FAILURE (empty result)
4. Owner updates owned agency profile → SUCCESS
5. Owner attempts to update non-owned agency → FAILURE (0 rows affected)
6. Owner creates edit audit record → SUCCESS

## Notes

- All tests should be run after `supabase db reset` to ensure clean state
- Replace placeholder IDs (`<user_id_1>`, etc.) with actual UUIDs from test data
- Session simulation uses `SET LOCAL` which only affects current transaction
- In production, `auth.uid()` automatically returns the authenticated user's ID from JWT
- RLS policies are enforced at the database level, providing defense-in-depth security
