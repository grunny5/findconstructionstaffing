# Manual Migration Tracking

This file tracks SQL migrations that were manually applied to the Supabase database instead of being automatically applied by the migration system.

## Why Manual Migrations?

During development, some migrations need to be applied manually through the Supabase SQL Editor because:
1. The local migration file was created after the database tables already existed
2. The migration system doesn't track which migrations have been applied
3. We're working directly with a shared Supabase instance

## Manually Applied Migrations

### 2026-01-14: Labor Request RLS Policies
**File:** `supabase/migrations/20260114_001_create_labor_request_tables.sql`
**Lines:** 143-234 (RLS policies section)
**Applied:** 2026-01-14
**Reason:** Migration file created after tables existed. Policies needed to allow anonymous form submissions.

**Status:** ✅ Applied successfully (tested by submitting labor request form)

**Notes:**
- Encountered error "policy already exists" which confirmed policies were already in database
- No action needed - policies were correct

---

### 2026-01-14: Update match_agencies_to_craft Function Signature
**File:** `supabase/migrations/20260114225504_create_matching_function.sql`
**Applied:** 2026-01-14
**Reason:** Function signature changed (removed `p_worker_count` parameter in commit 031cd71) but database had old 3-parameter version.

**SQL Applied:**
```sql
-- Drop old version with 3 parameters
DROP FUNCTION IF EXISTS match_agencies_to_craft(UUID, UUID, INTEGER);

-- Create new version with 2 parameters
CREATE OR REPLACE FUNCTION match_agencies_to_craft(
  p_trade_id UUID,
  p_region_id UUID
) RETURNS TABLE(
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    100::INTEGER AS match_score
  FROM agencies a
  WHERE
    a.is_active = TRUE
    AND a.verified = TRUE
    AND EXISTS (
      SELECT 1 FROM agency_trades at
      WHERE at.agency_id = a.id AND at.trade_id = p_trade_id
    )
    AND EXISTS (
      SELECT 1 FROM agency_regions ar
      WHERE ar.agency_id = a.id AND ar.region_id = p_region_id
    )
  ORDER BY a.name ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

**Status:** ✅ Applied successfully (tested by submitting form and receiving `totalMatches: 1`)

**Error Before Fix:**
```
PGRST202: Could not find the function public.match_agencies_to_craft(p_region_id, p_trade_id) in the schema cache
Hint: Perhaps you meant to call the function public.match_agencies_to_craft(p_region_id, p_trade_id, p_worker_count)
```

---

## Best Practices for Future Migrations

1. **Before Creating Migration File:**
   - Check if tables/functions already exist in Supabase
   - If they exist, verify the schema matches your intended migration

2. **After Creating Migration File:**
   - Manually apply it through Supabase SQL Editor
   - Document it here with date, reason, and verification

3. **When Modifying Existing Schema:**
   - Use `DROP ... IF EXISTS` and `CREATE OR REPLACE` to be idempotent
   - Test thoroughly after applying

4. **Verification:**
   - Always test the feature that depends on the migration
   - Check Supabase logs for any errors
   - Document the verification method

---

## Future: Automated Migration Tracking

Consider implementing:
- [ ] Supabase CLI for automated migration application
- [ ] Migration tracking table in database
- [ ] CI/CD pipeline that applies migrations automatically
- [ ] Migration rollback scripts

For now, this manual tracking file ensures we have a record of what was applied and when.
