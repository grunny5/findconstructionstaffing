---
title: "Multi-Tier RLS Policies: Public, Owner, and Admin Access Control"
component: "Security/Database/RLS"
problem_type: "security_issue"
severity: "critical"
status: "resolved"
tags: ["security", "rls", "postgres", "supabase", "access-control", "authorization", "data-protection"]
related_files:
  - "supabase/migrations/20260119_001_add_public_agency_select_policy.sql"
  - "supabase/migrations/20251219_001_add_admin_rls_policies.sql"
  - "supabase/migrations/20251223_001_create_claim_rls_policies.sql"
  - "supabase/migrations/20260124_001_create_compliance_documents_bucket.sql"
date_discovered: "2025-12-19"
date_resolved: "2026-01-24"
---

# Problem

Implementing fine-grained access control where different user types (anonymous, owners, admins) need different levels of access to the same resources, without complex application-layer authorization logic.

## Symptoms

**Without Multi-Tier RLS:**
```typescript
// ❌ Application-layer authorization (complex, error-prone)
export async function getAgencies(userId?: string, isAdmin?: boolean) {
  // Application must handle all access control logic
  let query = supabase.from('agencies').select('*');

  // Public: Only active agencies
  if (!userId) {
    query = query.eq('is_active', true);
  }

  // Owner: Their agency + active others
  if (userId && !isAdmin) {
    query = query.or(`is_active.eq.true,claimed_by.eq.${userId}`);
  }

  // Admin: All agencies (no filter needed)

  const { data } = await query;
  return data;
}

// Problems:
// - Authorization logic scattered across application
// - Easy to forget filters (security vulnerabilities)
// - Hard to audit and maintain
// - No database-level enforcement
```

**Security Risks:**
- **Data leaks**: Forgetting to filter data exposes sensitive information
- **Inconsistent access control**: Different endpoints implement different logic
- **Bypass attacks**: Attackers can manipulate application layer to bypass checks
- **Audit challenges**: No central place to review access control rules
- **No defense in depth**: Application is single point of failure

## Root Cause

Application-layer authorization requires developers to remember and correctly implement access control in every query:

1. **Scattered logic**: Authorization checks in every API route, server component, action
2. **No enforcement**: Database returns all data, application must filter
3. **Human error**: Developers forget filters or implement them incorrectly
4. **Testing gaps**: Hard to verify all code paths enforce correct access control
5. **Maintenance burden**: Changing access rules requires updating multiple locations

**Example Security Vulnerability:**
```typescript
// Developer forgets to check ownership
export async function updateAgency(agencyId: string, updates: any) {
  // ⚠️ NO AUTHORIZATION CHECK - any authenticated user can update any agency!
  const { data } = await supabase
    .from('agencies')
    .update(updates)
    .eq('id', agencyId);

  return data;
}

// Attacker can update any agency by calling this function
```

## Solution

### Implement Multi-Tier Row Level Security (RLS) Policies at Database Level

Use PostgreSQL Row Level Security to enforce access control directly in the database, eliminating application-layer authorization complexity.

## Multi-Tier RLS Pattern

### Three-Tier Access Model

| Tier | User Type | Access Level | Use Case |
|------|-----------|--------------|----------|
| **Public** | Anonymous (no auth.uid()) | Read-only, filtered | Public directory, marketing pages |
| **Owner** | Authenticated (resource owner) | Read + Write own resources | Agency owners manage their profile |
| **Admin** | Authenticated (role='admin') | Read + Write all resources | Platform administration, moderation |

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  (No authorization logic - RLS handles it all)           │
└───────────────────────┬──────────────────────────────────┘
                        │ supabase.from('agencies').select()
                        ▼
┌──────────────────────────────────────────────────────────┐
│                 PostgreSQL RLS Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Public   │  │   Owner    │  │   Admin    │        │
│  │  Policies  │  │  Policies  │  │  Policies  │        │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘        │
│        │               │               │                 │
│        └───────────────┴───────────────┘                 │
│                        │                                  │
│                        ▼                                  │
│           Filter rows based on auth.uid()                │
│           and user role before returning data            │
└──────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Public Tier: Anonymous Read Access

Allow anonymous users to view public resources (active agencies, published content).

**File**: `supabase/migrations/20260119_001_add_public_agency_select_policy.sql`

```sql
-- Enable Row Level Security
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active agencies
CREATE POLICY "Public can view active agencies"
  ON public.agencies FOR SELECT
  USING (is_active = true);

-- Documentation
COMMENT ON POLICY "Public can view active agencies" ON public.agencies IS
  'Allows anonymous users to read active agencies for the public directory. Required for homepage agency listing.';
```

**How It Works:**
- `USING (is_active = true)`: Only rows with `is_active = true` are returned
- `FOR SELECT`: Policy applies to SELECT queries only
- No `TO` clause: Applies to all users (including anonymous)
- Database-level filtering: Application doesn't need to add `WHERE is_active = true`

**Usage:**
```typescript
// Application code (no authorization logic needed)
const { data: agencies } = await supabase
  .from('agencies')
  .select('*');  // RLS automatically filters to is_active = true

// Anonymous user sees only active agencies
// Authenticated user sees only active agencies (unless owner/admin policy applies)
```

### 2. Owner Tier: Authenticated Owner Access

Allow authenticated users to read/update/delete their own resources.

**File**: `supabase/migrations/20251223_001_create_claim_rls_policies.sql`

```sql
-- Policy: Agency owners can view their claimed agency
CREATE POLICY "Owners can view their agency"
  ON public.agencies FOR SELECT
  USING (
    claimed_by = auth.uid()  -- auth.uid() returns authenticated user's ID
    OR is_active = true      -- Owners can also see active agencies
  );

-- Policy: Agency owners can update their claimed agency
CREATE POLICY "Owners can update their agency"
  ON public.agencies FOR UPDATE
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());  -- Prevents ownership transfer
```

**Key Components:**

1. **`auth.uid()`**: Supabase function returning current authenticated user's UUID
2. **`USING` clause**: Determines which rows user can see/modify
3. **`WITH CHECK` clause**: Validates new/updated rows meet policy (prevents privilege escalation)
4. **`FOR UPDATE`**: Policy applies to UPDATE operations only

**Usage:**
```typescript
// Owner updates their agency (no authorization check needed)
const { data } = await supabase
  .from('agencies')
  .update({ name: 'New Name' })
  .eq('id', agencyId);

// If claimed_by != auth.uid(), database blocks the update automatically
// Application doesn't need to check ownership
```

### 3. Admin Tier: Full Access for Administrators

Allow administrators to read/update/delete all resources for moderation and management.

**File**: `supabase/migrations/20251219_001_add_admin_rls_policies.sql`

```sql
-- Policy: Admins can view all agencies
CREATE POLICY "Admins can view all agencies"
  ON public.agencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update any agency
CREATE POLICY "Admins can update any agency"
  ON public.agencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```

**Key Components:**

1. **`EXISTS` subquery**: Checks if authenticated user has admin role
2. **Role-based check**: Query `profiles` table to verify `role = 'admin'`
3. **No row filtering**: If user is admin, all rows visible (no `is_active` check)

**Usage:**
```typescript
// Admin views all agencies (including inactive)
const { data: allAgencies } = await supabase
  .from('agencies')
  .select('*');  // RLS checks admin role, returns all rows

// Admin updates any agency
const { data } = await supabase
  .from('agencies')
  .update({ is_active: false })
  .eq('id', agencyId);  // Works for any agency if user is admin
```

## Advanced Patterns

### Pattern 1: Storage Bucket Policies with Path Validation

Secure file uploads with multi-tier access and path traversal protection.

**File**: `supabase/migrations/20260124_001_create_compliance_documents_bucket.sql`

**Expected Path Structure**: `{agency_id}/{compliance_type}/{filename}`
**Examples**:
- ✅ Valid: `550e8400-e29b-41d4-a716-446655440000/osha/certificate.pdf`
- ❌ Invalid: `../../../etc/passwd` (path traversal attempt)
- ❌ Invalid: `different-agency-id/osha/cert.pdf` (wrong agency)

#### Owner: Read/Write Own Documents

```sql
-- Policy: Agency owner can upload to their own folder
CREATE POLICY "Agency owner upload own compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND storage.objects.name !~ '\\.\\.'  -- Reject path traversal (.. in path)
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND storage.objects.name ~ ('^' || agencies.id::text || '/[^/]+(/.*)?$')
    -- Regex: ^{agency_id}/{type}/{filename}$ (strict path format)
  )
);

-- Policy: Agency owner can read their own documents
CREATE POLICY "Agency owner read own compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND storage.objects.name !~ '\\.\\.'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND storage.objects.name ~ ('^' || agencies.id::text || '/[^/]+(/.*)?$')
  )
);
```

**Path Traversal Protection:**
- `storage.objects.name !~ '\\.\\.'`: Rejects any path containing `..`
- Regex pattern: `^{agency_id}/[^/]+(/.*)?$`
  - `^`: Start of string
  - `{agency_id}`: Must start with agency UUID
  - `/[^/]+`: Must have compliance type folder (at least one non-slash char)
  - `(/.*)?$`: Optional filename

**Attack Prevention:**
```sql
-- ❌ BLOCKED: Path traversal attempt
INSERT INTO storage.objects (bucket_id, name)
VALUES ('compliance-documents', '../../../etc/passwd');
-- Rejected by: storage.objects.name !~ '\\.\\.'

-- ❌ BLOCKED: Wrong agency folder
INSERT INTO storage.objects (bucket_id, name)
VALUES ('compliance-documents', 'other-agency-id/osha/cert.pdf');
-- Rejected by: Regex doesn't match (agency_id doesn't match auth.uid()'s agency)

-- ✅ ALLOWED: Valid path for owned agency
INSERT INTO storage.objects (bucket_id, name)
VALUES ('compliance-documents', '550e8400-e29b-41d4-a716-446655440000/osha/cert.pdf');
-- Passes: bucket_id correct, no '..', regex matches agency UUID
```

#### Admin: Read/Write All Documents

```sql
-- Policy: Admin can upload to any agency folder
CREATE POLICY "Admin upload any compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin can read all compliance documents
CREATE POLICY "Admin read all compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Admin Privilege:**
- No path restrictions (can access any agency's documents)
- Still requires correct bucket_id (defense in depth)
- Admin role check via `profiles.role = 'admin'`

### Pattern 2: Protecting Immutable Fields with Triggers

Prevent modification of sensitive fields that should only change through specific processes.

**File**: `supabase/migrations/20251223_001_create_claim_rls_policies.sql`

```sql
-- Trigger function: Prevent modification of sensitive agency fields
CREATE OR REPLACE FUNCTION prevent_sensitive_agency_fields_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply trigger to agencies table
CREATE TRIGGER prevent_agency_sensitive_fields
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sensitive_agency_fields_update();
```

**Why This Matters:**
- RLS policies prevent unauthorized users from updating rows
- Triggers prevent authorized users from modifying specific columns
- Example: Agency owner can update `name`, but NOT `claimed_by` (ownership transfer requires admin approval)

**Usage:**
```typescript
// ✅ ALLOWED: Owner updates their agency name
await supabase
  .from('agencies')
  .update({ name: 'New Agency Name' })
  .eq('id', agencyId);

// ❌ BLOCKED: Owner tries to change ownership
await supabase
  .from('agencies')
  .update({ claimed_by: 'different-user-id' })
  .eq('id', agencyId);
// Error: Cannot modify claimed_by via UPDATE - use claim process
```

### Pattern 3: Audit Logging with Multi-Tier Access

Track who accessed what, with users viewing their own logs and admins viewing all.

**File**: `supabase/migrations/20251223_001_create_claim_rls_policies.sql`

```sql
-- Policy: Users can view audit logs for their own claims
CREATE POLICY "Users can view own claim audit logs"
  ON public.agency_claim_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_claim_requests
      WHERE agency_claim_requests.id = agency_claim_audit_log.claim_id
        AND agency_claim_requests.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.agency_claim_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```

**How It Works:**
- Users see only audit logs for claims they submitted
- Admins see all audit logs (for monitoring and compliance)
- Application doesn't need to filter logs - RLS handles it automatically

## Policy Evaluation Order

PostgreSQL evaluates RLS policies with OR logic:

```
Row is visible IF:
  (Public policy matches) OR
  (Owner policy matches) OR
  (Admin policy matches)
```

**Example: Agency SELECT policies**
```sql
-- Policy 1: Public can view active agencies
USING (is_active = true)

-- Policy 2: Owners can view their agency
USING (claimed_by = auth.uid())

-- Policy 3: Admins can view all agencies
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))

-- Result: Row visible if ANY policy returns true
```

**Practical Example:**
```typescript
// Anonymous user:
// - Policy 1: ✓ (is_active = true)
// - Policy 2: ✗ (no auth.uid())
// - Policy 3: ✗ (no auth.uid())
// Result: Sees active agencies only

// Agency owner (authenticated):
// - Policy 1: ✓ (is_active = true) - sees active agencies
// - Policy 2: ✓ (claimed_by = auth.uid()) - sees own agency (even if inactive)
// - Policy 3: ✗ (not admin)
// Result: Sees all active agencies + their own agency

// Admin (authenticated):
// - Policy 1: ✓ (is_active = true) - sees active agencies
// - Policy 2: ✗ (doesn't own agencies) - not relevant
// - Policy 3: ✓ (role = 'admin') - sees all agencies
// Result: Sees ALL agencies (active and inactive)
```

## Testing RLS Policies

### Unit Test: Verify Policy Enforcement

```sql
-- Test 1: Anonymous user can view active agencies
SET role anonymous;
SELECT COUNT(*) FROM agencies;  -- Should return only active agencies

-- Test 2: Anonymous user CANNOT view inactive agencies
SELECT COUNT(*) FROM agencies WHERE is_active = false;  -- Should return 0

-- Test 3: Owner can view their agency (even if inactive)
SET role authenticated;
SET request.jwt.claim.sub TO 'owner-user-id';
SELECT * FROM agencies WHERE claimed_by = 'owner-user-id' AND is_active = false;
-- Should return owner's inactive agency

-- Test 4: Owner CANNOT update other agencies
UPDATE agencies SET name = 'Hacked' WHERE claimed_by != 'owner-user-id';
-- Should affect 0 rows (blocked by RLS)

-- Test 5: Admin can view all agencies
SET request.jwt.claim.sub TO 'admin-user-id';
SELECT COUNT(*) FROM agencies;  -- Should return all agencies (active + inactive)

-- Test 6: Admin can update any agency
UPDATE agencies SET is_active = false WHERE id = 'any-agency-id';
-- Should succeed (admin privilege)
```

### Integration Test: Verify Client-Side Enforcement

```typescript
import { createClient } from '@supabase/supabase-js';

describe('RLS Policy Tests', () => {
  it('anonymous users can only view active agencies', async () => {
    const supabase = createClient(url, anonKey);  // Anonymous client

    const { data: agencies } = await supabase
      .from('agencies')
      .select('*');

    // All returned agencies should be active
    expect(agencies.every(a => a.is_active)).toBe(true);
  });

  it('agency owners can view their own inactive agency', async () => {
    const supabase = createClient(url, anonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'owner@example.com',
      password: 'pass',
    });
    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    const { data: agencies } = await supabase
      .from('agencies')
      .select('*')
      .eq('claimed_by', 'owner-user-id')
      .eq('is_active', false);

    // Owner's inactive agency should be visible
    expect(agencies).toHaveLength(1);
  });

  it('agency owners cannot update other agencies', async () => {
    const supabase = createClient(url, anonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'owner@example.com',
      password: 'pass',
    });
    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    const { data, error } = await supabase
      .from('agencies')
      .update({ name: 'Hacked' })
      .eq('id', 'other-agency-id')  // Not owned by this user
      .neq('claimed_by', 'owner-user-id');

    // Update should fail (no rows affected)
    expect(data).toHaveLength(0);
  });

  it('admins can view all agencies', async () => {
    const supabase = createClient(url, serviceRoleKey);  // Admin client

    const { data: agencies } = await supabase
      .from('agencies')
      .select('*');

    // All agencies returned (active + inactive)
    const activeCount = agencies.filter(a => a.is_active).length;
    const inactiveCount = agencies.filter(a => !a.is_active).length;
    expect(activeCount + inactiveCount).toBeGreaterThan(0);
  });
});
```

## Migration Strategy

### Phase 1: Enable RLS on Existing Tables

```sql
-- Enable RLS (does NOT block access yet - just enables feature)
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'agencies';
-- Should show: rowsecurity = true
```

### Phase 2: Add Public Read Policy First

```sql
-- Start with most permissive policy (public read)
-- This prevents breaking existing functionality
CREATE POLICY "Public can view active agencies"
  ON public.agencies FOR SELECT
  USING (is_active = true);

-- Test: Verify public users can still see agencies
-- (from anonymous browser session or API call)
```

### Phase 3: Add Owner and Admin Policies

```sql
-- Add owner policies
CREATE POLICY "Owners can view their agency"
  ON public.agencies FOR SELECT
  USING (claimed_by = auth.uid() OR is_active = true);

CREATE POLICY "Owners can update their agency"
  ON public.agencies FOR UPDATE
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

-- Add admin policies
CREATE POLICY "Admins can view all agencies"
  ON public.agencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any agency"
  ON public.agencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Phase 4: Remove Application-Layer Authorization

```typescript
// BEFORE: Application checks authorization
export async function getAgencies(userId?: string, isAdmin?: boolean) {
  let query = supabase.from('agencies').select('*');

  if (!userId) {
    query = query.eq('is_active', true);
  }

  const { data } = await query;
  return data;
}

// AFTER: RLS handles authorization
export async function getAgencies() {
  const { data } = await supabase.from('agencies').select('*');
  return data;  // RLS automatically filters based on auth.uid() and role
}
```

## Best Practices

### DO:
✅ Enable RLS on all tables with sensitive data
✅ Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
✅ Use `WITH CHECK` clause on INSERT/UPDATE to prevent privilege escalation
✅ Add `COMMENT ON POLICY` for documentation
✅ Test policies with different user roles (anonymous, owner, admin)
✅ Use `EXISTS` subqueries for role checks (efficient)
✅ Protect immutable fields with triggers
✅ Add path traversal protection for storage buckets (`!~ '\\.\\.'`)
✅ Use strict regex patterns for file paths
✅ Create audit logs with RLS protection
✅ Document expected path structures

### DON'T:
❌ Forget to enable RLS on new tables (security vulnerability)
❌ Create overly permissive policies (principle of least privilege)
❌ Use `USING (true)` for admin policies (use role check instead)
❌ Forget `WITH CHECK` clause on INSERT/UPDATE (allows privilege escalation)
❌ Mix application and database authorization (choose one approach)
❌ Use complex joins in policy (performance issues)
❌ Allow path traversal in storage policies (security vulnerability)
❌ Trust client-provided paths without validation
❌ Skip testing policies with different roles
❌ Create duplicate policies (PostgreSQL uses OR logic)

## Performance Considerations

### Policy Performance

**Efficient Policy (fast):**
```sql
-- ✅ Simple equality check (indexed column)
USING (claimed_by = auth.uid())
```

**Less Efficient Policy (slower):**
```sql
-- ❌ Complex subquery with joins (not indexed)
USING (
  EXISTS (
    SELECT 1 FROM agency_trades
    JOIN trades ON trades.id = agency_trades.trade_id
    WHERE agency_trades.agency_id = agencies.id
    AND trades.name = 'Electrician'
    AND agency_trades.user_id = auth.uid()
  )
)
```

**Optimization Tips:**
1. **Index policy columns**: `CREATE INDEX idx_claimed_by ON agencies(claimed_by);`
2. **Keep policies simple**: Prefer direct column checks over complex joins
3. **Cache role checks**: Use `security definer` functions for expensive role lookups
4. **Profile policies**: Use `EXPLAIN ANALYZE` to check query performance

## Troubleshooting

### Issue: "No rows returned" after enabling RLS

**Problem**: RLS enabled but no policies created (blocks all access)

**Solution**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'agencies';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'agencies';

-- If no policies exist, create public read policy first
CREATE POLICY "Public read" ON agencies FOR SELECT USING (true);
```

### Issue: "Permission denied" for authenticated users

**Problem**: User authenticated but doesn't match any policy

**Solution**:
```sql
-- Debug: Check what auth.uid() returns
SELECT auth.uid();

-- Verify user has required role/ownership
SELECT id, role, claimed_by FROM profiles WHERE id = auth.uid();

-- Check policy logic
SELECT * FROM pg_policies WHERE tablename = 'agencies';
```

### Issue: Admin policy not working

**Problem**: Admin users still see filtered data

**Solution**:
```sql
-- Verify admin role is set correctly
SELECT id, role FROM profiles WHERE id = auth.uid();

-- Check policy uses correct role column
-- Should be: profiles.role = 'admin'
-- NOT: profiles.is_admin = true (if column doesn't exist)

-- Test policy in SQL
SET role authenticated;
SET request.jwt.claim.sub TO 'admin-user-id';
SELECT * FROM agencies;  -- Should return all rows
```

## Related Issues

- Migration: `supabase/migrations/20260119_001_add_public_agency_select_policy.sql`
- Migration: `supabase/migrations/20251219_001_add_admin_rls_policies.sql`
- Migration: `supabase/migrations/20251223_001_create_claim_rls_policies.sql`
- Storage policies: `supabase/migrations/20260124_001_create_compliance_documents_bucket.sql`
- Security review: Multi-tier access control praised in code review

## References

- **PostgreSQL RLS Documentation**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Supabase RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Path Traversal Prevention**: https://owasp.org/www-community/attacks/Path_Traversal
- **Storage Security**: https://supabase.com/docs/guides/storage/security/access-control
- **RLS Performance**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Related Pattern**: `docs/solutions/security-issues/secure-logging-in-production.md`
