# Database Migrations

This directory contains SQL migration files for the FindConstructionStaffing database.

## Migration Naming Convention

Migrations follow the pattern: `YYYYMMDD_NNN_description.sql`

- `YYYYMMDD`: Date the migration was created
- `NNN`: Sequential number (001, 002, etc.)
- `description`: Brief description of what the migration does

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

**Rollback:** `20251215_001_add_last_password_change_rollback.sql`

**Testing:** `20251215_001_add_last_password_change_test.sql`

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

## Testing Migrations

### Automated Testing

Run the test script after applying a migration:

```bash
# Apply the migration
supabase db push

# Run the test script
psql postgres://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/20251215_001_add_last_password_change_test.sql
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
# Apply the rollback script
psql postgres://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/[migration]_rollback.sql
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
