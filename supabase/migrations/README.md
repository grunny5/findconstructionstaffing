# Database Migrations

This directory contains SQL migration files for the FindConstructionStaffing database.

## Migration Naming Convention

Migrations follow the pattern: `YYYYMMDD_NNN_description.sql`

- `YYYYMMDD`: Date the migration was created
- `NNN`: Sequential number (001, 002, etc.)
- `description`: Brief description of what the migration does

**Support Files:**
- Rollback scripts and test scripts are stored in the `support/` directory
- This prevents them from being treated as migrations by the Supabase CLI
- Naming: Same as the migration file they support

## Running Migrations

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --include-all
```

### Production

Migrations are automatically applied when pushed to the main branch via CI/CD.

## Migration Files

### 20251215_001_add_last_password_change.sql

**Purpose:** Add password change tracking to user profiles

**Changes:**
- Adds `last_password_change TIMESTAMPTZ` column to `public.profiles`
- Creates trigger on `auth.users` to automatically update the field when password changes
- Backfills existing users with current timestamp
- Adds index for efficient querying

**Rollback:** `support/20251215_001_add_last_password_change_rollback.sql`

**Testing:** `support/20251215_001_add_last_password_change_test.sql`

**Related Tasks:** Task 3.4.2 - Update Profile Schema to Track Password Changes

**How it works:**
1. When a user changes their password via `supabase.auth.updateUser({ password })`, Supabase updates the `encrypted_password` field in `auth.users`
2. The `on_auth_user_password_change` trigger detects this change
3. The trigger calls `update_last_password_change()` function
4. The function updates the corresponding `public.profiles.last_password_change` timestamp

**Use cases:**
- Security auditing: Track when users last changed passwords
- Force password change: Identify accounts with old passwords
- Compliance: Meet security requirements for password rotation policies

---

### 20251216_001_create_role_audit_table.sql

**Purpose:** Create audit log table for tracking user role changes

**Changes:**
- Creates `role_change_audit` table with columns:
  - `id` (UUID, primary key)
  - `user_id` (UUID, nullable, references profiles - who was changed)
  - `admin_id` (UUID, nullable, references profiles - who made the change)
  - `old_role` (TEXT, CHECK constraint for valid roles)
  - `new_role` (TEXT, CHECK constraint for valid roles)
  - `changed_at` (TIMESTAMPTZ, when the change occurred)
  - `notes` (TEXT, optional admin notes)
  - `created_at` (TIMESTAMPTZ, record creation time)
- Enables RLS with admin-only policies:
  - Admins can SELECT (view all audit logs)
  - Admins can INSERT (create audit records)
- Creates performance indexes:
  - `idx_role_audit_user_id` - for querying changes by user
  - `idx_role_audit_admin_id` - for querying changes by admin
  - `idx_role_audit_changed_at` - for chronological queries
  - `idx_role_audit_user_changed` - composite index for user role history
- Adds foreign key constraints with SET NULL on delete (preserves audit history)
- Includes comprehensive documentation comments

**Rollback:** `support/20251216_001_create_role_audit_table_rollback.sql`

**Testing:** `support/20251216_001_create_role_audit_table_test.sql`

**Related Tasks:** Task 4.1.1 - Create Role Change Audit Log Table

**Security considerations:**
- Only admins can view or create audit records (enforced via RLS)
- Audit records are immutable (no UPDATE or DELETE policies)
- SET NULL on delete preserves audit history even after user deletion (compliance requirement)
- When a user/admin is deleted, their ID becomes NULL but the audit record remains for investigation
- CHECK constraints ensure only valid roles ('user', 'agency_owner', 'admin') are recorded

**Use cases:**
- Security auditing: Track all role changes for compliance
- Investigation: Identify who changed a user's role and when
- Accountability: Permanent record of administrative actions
- Compliance: Meet regulatory requirements for access control auditing

---

### 20251218_001_create_change_role_function.sql

**Purpose:** Create secure RPC function for admins to change user roles with automatic audit logging

**Changes:**
- Creates `change_user_role(target_user_id UUID, new_role TEXT, admin_notes TEXT)` function
- Function security features:
  - Uses `SECURITY DEFINER` to bypass RLS for audit log insertion
  - Validates caller is authenticated admin
  - Prevents self-demotion (admins cannot change their own role)
  - Validates new_role is one of: 'user', 'agency_owner', 'admin'
  - Checks target user exists
  - Verifies role is actually changing
- Atomic transaction:
  - Updates `profiles.role` and `profiles.updated_at`
  - Inserts record into `role_change_audit`
  - Both operations succeed or both roll back
- Clear error messages for all validation failures
- Granted to `authenticated` role (function validates admin internally)

**Rollback:** `support/20251218_001_create_change_role_function_rollback.sql`

**Testing:** `support/20251218_001_create_change_role_function_test.sql`

**Related Tasks:** Task 4.1.2 - Create Change User Role RPC Function

**Function signature:**
```sql
change_user_role(
  target_user_id UUID,     -- User whose role to change
  new_role TEXT,           -- New role: 'user' | 'agency_owner' | 'admin'
  admin_notes TEXT         -- Optional notes explaining the change
) RETURNS BOOLEAN
```

**Usage example:**
```sql
-- Promote a user to agency owner
SELECT change_user_role(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'agency_owner',
  'Verified as legitimate staffing agency'
);

-- Returns: TRUE on success
-- Raises exception with clear message on failure
```

**Security validations:**
1. Caller must be authenticated
2. Caller must have 'admin' role
3. Target user must exist
4. Caller cannot modify their own role (prevent self-demotion)
5. New role must be valid enum value
6. Role must actually be changing (not already the target role)

**Error handling:**
- Each validation failure raises a specific exception
- All exceptions include helpful hints for resolution
- Transaction rolls back automatically on any failure
- No partial updates possible (atomic operation)

---

### 20251219_001_add_admin_rls_policies.sql

**Purpose:** Add RLS policies to allow admins to view all user profiles

**Changes:**
- Creates policy "Admins can view all profiles" for SELECT operations
- Policy uses subquery to check if caller has 'admin' role
- Existing user policies remain unchanged
- Does NOT add UPDATE policy (role changes use SECURITY DEFINER RPC)

**Rollback:** `support/20251219_001_add_admin_rls_policies_rollback.sql`

**Testing:** `support/20251219_001_add_admin_rls_policies_test.sql`

**Related Tasks:** Task 4.2.2 - Add RLS Policies for Admin Access to All Profiles

**Policy logic:**
```sql
-- Admin can SELECT if they have role='admin'
EXISTS (
  SELECT 1 FROM public.profiles AS caller_profile
  WHERE caller_profile.id = auth.uid()
    AND caller_profile.role = 'admin'
)
```

**Security design:**
- Admins can view all profiles (needed for user management page)
- Regular users can only view their own profile (via existing policy)
- Role changes MUST use `change_user_role()` RPC (not direct UPDATE)
- This ensures all role changes are audited properly
- No admin UPDATE policy prevents bypassing audit logging

**Use cases:**
- Admin user management interface: View list of all users
- User search and filtering: Find users by email or name
- Role verification: See current roles of all users
- Security monitoring: Identify users with elevated permissions

## Testing Migrations

### Automated Testing

Run the test script after applying a migration:

```bash
# Apply the migration
supabase db push

# Run the test script
psql postgres://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/support/20251215_001_add_last_password_change_test.sql
```

### Manual Testing

1. Create a test user account
2. Note the `last_password_change` timestamp
3. Change the password using the settings UI
4. Verify the timestamp updated
5. Update profile (not password) and verify timestamp doesn't change

## Rollback Procedures

If a migration causes issues:

```bash
# Apply the rollback script from the support directory
psql postgres://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/support/[migration]_rollback.sql
```

**⚠️ Warning:** Rollbacks may cause data loss. Always backup before rolling back.

## Best Practices

1. **Always create rollback scripts** for each migration
2. **Test locally first** before deploying to production
3. **Use transactions** when possible (wrap in BEGIN/COMMIT)
4. **Add comments** to explain complex logic
5. **Create indexes** for columns used in WHERE clauses
6. **Use IF NOT EXISTS** for idempotent migrations
7. **Document breaking changes** in this README
8. **Never modify existing migrations** - create new ones instead

## Migration Checklist

Before committing a migration:

- [ ] Migration file created with correct naming convention
- [ ] Rollback script created
- [ ] Test script created (if applicable)
- [ ] TypeScript types updated (if schema changes)
- [ ] Migration tested locally with `supabase db push`
- [ ] Rollback tested locally
- [ ] Documentation updated in this README
- [ ] PR created and reviewed

## Troubleshooting

### Docker not running

If you see "Cannot connect to the Docker daemon":

```bash
# On Windows WSL, start Docker Desktop
# Or on Linux, start Docker daemon
sudo service docker start
```

### Migration already applied

If a migration was already applied:

```bash
# Check migration history
supabase migration list

# Force reapply (use with caution)
supabase db reset
```

### Permission errors

Ensure your local Supabase has proper permissions:

```bash
# Check connection
supabase status

# Reset if needed
supabase db reset
```
