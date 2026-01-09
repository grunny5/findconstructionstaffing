# Manual Migration Application Guide

## Migration: 20260121_001_fix_function_search_path.sql

Due to migration history conflicts in the Supabase CLI (duplicate version numbers for 20260105), this migration needs to be applied manually through the Supabase Dashboard.

---

## Issue with Automated Application

The CLI detected conflicts:

```text
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20260105) already exists.
```

There are two local migrations with the same version:

- `20260105_001_add_integration_columns_to_agencies.sql` (already on remote)
- `20260105_001_create_agency_logos_bucket.sql` (not on remote)

This prevents the automated `supabase db push` from working correctly.

---

## Manual Application Steps

### Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to: <https://supabase.com/dashboard/project/YOUR_PROJECT_REF>
   - Navigate to: **SQL Editor**

2. **Copy the SQL**

   ```sql
   -- Fix search_path security issue in get_admin_integrations_summary function
   -- Issue: Function has SECURITY DEFINER without explicit search_path, making it vulnerable
   -- to search path manipulation attacks.
   -- Remediation: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0011_function_search_path_mutable

   -- Drop the existing function
   DROP FUNCTION IF EXISTS get_admin_integrations_summary();

   -- Recreate with explicit search_path set to 'public'
   CREATE OR REPLACE FUNCTION get_admin_integrations_summary()
   RETURNS TABLE (
     id UUID,
     name TEXT,
     slug TEXT,
     created_at TIMESTAMPTZ,
     integration_enabled BOOLEAN,
     integration_provider TEXT,
     integration_config JSONB,
     integration_last_sync_at TIMESTAMPTZ,
     integration_sync_status TEXT,
     integration_sync_error TEXT
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT
       a.id,
       a.name,
       a.slug,
       a.created_at,
       a.integration_enabled,
       a.integration_provider,
       a.integration_config,
       a.integration_last_sync_at,
       a.integration_sync_status,
       a.integration_sync_error
     FROM public.agencies a
     ORDER BY a.name;
   END;
   $$ LANGUAGE plpgsql STABLE SECURITY DEFINER
   SET search_path = public;

   -- Restore grants
   GRANT EXECUTE ON FUNCTION get_admin_integrations_summary() TO authenticated;

   -- Restore comment
   COMMENT ON FUNCTION get_admin_integrations_summary()
     IS 'Returns all agencies with integration configuration for admin dashboard. Uses explicit search_path for security.';
   ```

3. **Execute the SQL**
   - Paste the SQL into the editor
   - Click **Run** or press **Ctrl+Enter**
   - Verify: "Success. No rows returned"

4. **Record the migration** _(Required for Supabase CLI tracking)_

   > **Important:** While the SQL was executed in steps 2-3 above, this INSERT is required so the
   > Supabase CLI recognizes the migration as applied and won't attempt to re-run it on future deployments.

   ```sql
   -- Mark the migration as applied in the history
   -- Use 14-digit timestamp format: YYYYMMDDHHMMSS
   INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES (
     '20260121120000',
     '20260121_001_fix_function_search_path'
   )
   ON CONFLICT (version) DO NOTHING;
   ```

5. **Verify the fix**
   - Navigate to: **Database** → **Reports** → **Database Health**
   - Check that the "Function Search Path Mutable" warning is resolved
   - Or run: `SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260121120000';`

---

### Option 2: psql Command Line

If you have direct database access:

> **Security Note:** Avoid leaving credentials in shell history. Either:
>
> - Store DATABASE_URL in a `.env` file and use `source .env` to load it
> - Clear shell history after use with `history -c` or `history -d <line_number>`

```bash
# Export connection string (get from Supabase Dashboard → Settings → Database)
export DATABASE_URL="<YOUR_POSTGRES_CONNECTION_STRING>"

# Apply the migration
psql $DATABASE_URL -f supabase/migrations/20260121_001_fix_function_search_path.sql

# Record in migration history (use 14-digit timestamp format: YYYYMMDDHHMMSS)
psql $DATABASE_URL -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260121120000', '20260121_001_fix_function_search_path') ON CONFLICT DO NOTHING;"
```

---

## Verification

After applying the migration, verify it worked:

1. **Check function definition:**

   ```sql
   SELECT
     proname as function_name,
     prosecdef as security_definer,
     proconfig as config_settings
   FROM pg_proc
   WHERE proname = 'get_admin_integrations_summary';
   ```

   Expected result:
   - `security_definer`: `true`
   - `config_settings`: `{search_path=public}`

2. **Run Database Linter:**
   - Dashboard: **Database** → **Reports** → **Database Health**
   - The "Function Search Path Mutable" warning should be **RESOLVED**

3. **Test the function:**

   ```sql
   SELECT * FROM get_admin_integrations_summary() LIMIT 1;
   ```

   Should return agency integration data without errors.

---

## Future Prevention

To avoid version conflicts in the future:

1. **Always use unique timestamps:**

   ```bash
   # Generate new migration with current timestamp
   supabase migration new migration_name
   ```

2. **Check for conflicts before creating:**

   ```bash
   # List existing migrations
   ls -1 supabase/migrations/ | grep "^2026"
   ```

3. **Sync migration history regularly:**

   ```bash
   # Pull remote migrations
   supabase db pull

   # Or repair migration history
   supabase migration list --linked
   ```

---

## Status

- ✅ Migration SQL created
- ✅ Documentation complete
- ⚠️ **PENDING:** Manual application required
- ⚠️ **PENDING:** Verification in Database Linter

---

## Next Steps

1. Apply the SQL through Supabase Dashboard (Option 1 above)
2. Verify the warning is resolved in Database Health
3. Mark this task as complete

For questions, refer to the [Supabase Database Advisors Documentation](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0011_function_search_path_mutable).
