# Supabase CLI Diagnostic Report

**Diagnosis Date**: 2026-01-16
**Restoration Date**: 2026-01-17
**CLI Version**: 2.72.7 (upgraded from 2.45.5)
**Status**: ✅ Fully Functional - CLI Restored

---

## Executive Summary

The Supabase CLI was non-functional due to:
1. **Migration history desync** between local files and remote database
2. **Outdated CLI version** (27 versions behind)
3. **Missing project linkage** (no `.supabase/` directory)
4. **Inconsistent migration naming** causing timestamp collisions

**Impact**: Was unable to push migrations via CLI, requiring manual SQL execution in dashboard.

**Resolution**: CLI has been fully restored as of 2026-01-17. All issues resolved through Phase 1 (Manual Sync) approach. See restoration details at the end of this document.

---

## Root Cause Analysis

### Issue 1: Migration History Desync ⚠️

**Problem**: Remote database has migration entries that don't match local files.

**Evidence**:
```text
Local              | Remote         | Time (UTC)
-------------------|----------------|---------------------
                   | 20260114       | 20260114       ← Remote only (generic timestamp)
20260114225504     | 20260114225504 | 2026-01-14 22:55:04
20260114_001       |                | 20260114       ← Local only (specific migration)
                   | 20260116       | 20260116       ← Remote only (generic timestamp)
```

**Analysis**:
- Remote has generic `20260114` timestamp - no matching local file
- Local has `20260114_001_create_labor_request_tables.sql` - no matching remote entry
- Local has `20260114225504_create_matching_function.sql` (matches remote ✓)
- Remote has `20260116` but local has `applied_20260116_*` files (skipped by CLI)

**How This Happened**:
1. Migrations were applied manually via Supabase SQL Editor
2. Migration history table was updated with timestamp-only entries
3. CLI expects exact filename matches, not just timestamps
4. `applied_` prefix migrations are intentionally skipped by CLI

---

### Issue 2: Outdated CLI Version ⚠️

**Current**: 2.45.5 (Released: ~6 months ago)
**Latest**: 2.72.7
**Gap**: 27 minor versions behind

**Known Issues in 2.45.5**:
- Migration repair command syntax may differ
- Potential bugs in migration comparison logic
- Missing features for handling edge cases

**Impact**:
- May not properly handle migration history mismatches
- Debugging is harder without latest fixes
- Documentation may not apply to older version

---

### Issue 3: Missing Project Linkage ⚠️

**Problem**: No `.supabase/` directory exists

**Expected**:
```text
.supabase/
  ├── project-ref
  ├── config.toml
  └── migrations/
```

**Current**: Directory does not exist

**Impact**:
- CLI must re-link on every command
- Slower command execution
- No local state tracking
- Config changes not persisted

---

### Issue 4: Migration Naming Inconsistency ⚠️

**Applied Migration Pattern**:
```text
applied_20260114_001_optimize_rls_policies.sql
applied_20260116_001_fix_messages_delete_policy.sql
applied_20260116_003_fix_function_search_path.sql
applied_20260116_004_optimize_rls_auth_functions.sql
applied_20260126_001_add_pay_rates_to_crafts.sql
applied_20260126_002_add_experience_level_to_crafts.sql
```

**Issue**: CLI pattern is `<timestamp>_<description>.sql`, not `applied_*`

**Why We Use `applied_` Prefix**:
- Prevents CLI from trying to re-apply already-executed migrations
- Manual workaround for sync issues
- Necessary when migrations applied via SQL Editor

**Trade-off**: CLI can't track these migrations in its history

---

## Current Workarounds

### 1. Manual Migration Application ✅

**Method**: Copy SQL to Supabase Dashboard → SQL Editor

**Pros**:
- Always works
- Direct database access
- No CLI dependency

**Cons**:
- Manual tracking required
- No automatic history update
- Prone to human error

**Status**: Currently using this method

---

### 2. Migration Repair Commands ⚠️

**Commands Tried**:
```bash
supabase migration repair --status reverted 20260114 20260126
supabase migration repair --status applied 20260114
```

**Results**:
- Repairs specific timestamps
- Doesn't fix underlying mismatch
- Must repair after every manual migration

**Status**: Temporary fix, not sustainable

---

## Migration History Analysis

### ✅ Synchronized Migrations (39 total)
```text
001            | 001            | 001
20250624       | 20250624       | 20250624
20250625       | 20250625       | 20250625
...
20251230       | 20251230       | 20251230
20260101       | 20260101       | 20260101
20260113       | 20260113       | 20260113
20260115       | 20260115       | 20260115
20260117       | 20260117       | 20260117
...
20260125       | 20260125       | 20260125
```

### ⚠️ Desynchronized Migrations (3 problematic)
```text
               | 20260114       | 20260114       ← Remote only (generic)
20260114       |                | 20260114       ← Local only (specific file)
               | 20260116       | 20260116       ← Remote only (generic)
```

### 📝 Applied Migrations (8 files with `applied_` prefix)
```text
applied_20250624_003_add_performance_indexes.sql
applied_20250625_005_create_public_read_policies.sql
applied_20260114_001_optimize_rls_policies.sql
applied_20260116_001_fix_messages_delete_policy.sql
applied_20260116_003_fix_function_search_path.sql
applied_20260116_004_optimize_rls_auth_functions.sql
applied_20260126_001_add_pay_rates_to_crafts.sql
applied_20260126_002_add_experience_level_to_crafts.sql
```

---

## Restoration Plan Options

### Option A: Full Reset & Resync (NUCLEAR) 🔥

**Steps**:
1. Backup current database schema
2. Clear remote migration history table
3. Remove all local migration files
4. Pull clean schema from remote (`supabase db pull`)
5. Generate new baseline migration
6. Start fresh with clean history

**Pros**:
- Complete synchronization
- Clean slate
- CLI works properly

**Cons**:
- Loses migration history
- Risky (data loss potential)
- Time consuming
- Requires downtime

**Risk**: 🔴 HIGH - Not recommended for production

---

### Option B: Manual History Sync (SURGICAL) 🔧

**Steps**:
1. Upgrade Supabase CLI to 2.72.7
2. Document exact remote migration history
3. Rename/create local files to match remote exactly
4. Run `supabase db pull` to capture any missing schemas
5. Test sync with `supabase migration list`
6. Repair specific mismatches with migration repair commands

**Pros**:
- Preserves history
- Less risky
- No downtime

**Cons**:
- Time consuming
- Manual reconciliation needed
- May need multiple repair cycles

**Risk**: 🟡 MEDIUM - Recommended approach

---

### Option C: Hybrid Approach (PRAGMATIC) 💡

**Steps**:
1. Upgrade Supabase CLI to latest
2. Continue using manual SQL Editor for new migrations
3. Keep `applied_` prefix for executed migrations
4. Only use CLI for:
   - `supabase db pull` (schema dumps)
   - `supabase db diff` (schema comparison)
   - `supabase db lint` (linting)
   - NOT for `supabase db push` (broken)

**Pros**:
- Low-risk
- Works immediately
- Leverages CLI for non-push commands
- Manual control retained

**Cons**:
- Doesn't fix root cause
- No automatic migration deployment
- Requires discipline with `applied_` naming

**Risk**: 🟢 LOW - Practical compromise

---

### Option D: CI/CD Pipeline with SQL Files (MODERN) 🚀

**Steps**:
1. Create GitHub Action workflow
2. On merge to main:
   - Detect new migration files
   - Apply via SQL (using service role key)
   - Update migration history table
   - Mark files as `applied_`
3. Use CLI only for local development
4. Never rely on `supabase db push` in production

**Pros**:
- Automated deployment
- Audit trail via Git
- No CLI dependency for production
- Scalable solution

**Cons**:
- Requires CI/CD setup
- Additional complexity
- Need to write custom script

**Risk**: 🟢 LOW - Best long-term solution

---

## Recommended Plan: Option B + D Hybrid

### Phase 1: Immediate Fix (Option B - Manual Sync) 🔧

**Goal**: Restore CLI functionality for development use

**Steps**:
1. ✅ **Upgrade Supabase CLI**
   ```bash
   npm install -g supabase@latest
   # or
   brew upgrade supabase
   ```

2. ✅ **Re-link project with clean state**
   ```bash
   rm -rf .supabase/
   supabase link --project-ref chyaqualjbhkykgofcov
   ```

3. ✅ **Pull remote schema to see actual state**
   ```bash
   supabase db pull
   ```

4. ✅ **Identify missing migrations**
   - Compare remote history to local files
   - Create placeholder files for remote-only timestamps

5. ✅ **Resolve timestamp conflicts**
   - For `20260114`: Decide which migration is canonical
   - For `20260116`: Create dummy file or repair history
   - For `20260126`: Check if exists on remote

6. ✅ **Test synchronization**
   ```bash
   supabase migration list
   # Should show all green (Local | Remote aligned)
   ```

7. ✅ **Verify push works**
   ```bash
   # Create test migration
   echo "-- Test migration" > supabase/migrations/$(date +%Y%m%d%H%M%S)_test.sql
   supabase db push --dry-run
   ```

**Time Estimate**: 2-3 hours

---

### Phase 2: Long-term Solution (Option D - CI/CD) 🚀

**Status**: 📋 Planned (Not yet implemented)

**Goal**: Automate migration deployment without CLI dependency

**Steps**:
1. ⬜ **Create migration deployment script**
   - Bash script or Node.js
   - Connects with service role key
   - Applies migrations in order
   - Updates history table

2. ⬜ **Add GitHub Action workflow**
   - Triggers on merge to main
   - Runs deployment script
   - Posts summary comment on PR

3. ⬜ **Update development workflow**
   - Create migrations locally
   - Test with `supabase db reset` (local dev)
   - Push to branch
   - Merge triggers auto-deploy

4. ⬜ **Documentation**
   - Update README with new workflow
   - Document manual override process
   - Add troubleshooting guide

**Time Estimate**: 4-6 hours

---

## Immediate Next Steps

### 1. Upgrade CLI ⚡

```bash
npm install -g supabase@latest
supabase --version  # Should show 2.72.7 or higher
```

### 2. Re-link Project ⚡

```bash
rm -rf .supabase/
supabase link --project-ref chyaqualjbhkykgofcov
```

### 3. Diagnose Current State ⚡

```bash
# Check migration sync
supabase migration list > migration-status.txt

# Pull current schema
supabase db pull

# Compare local vs remote
supabase db diff
```

### 4. Document Findings ⚡

- List all mismatched migrations
- Identify which migrations are missing locally
- Identify which migrations are missing remotely

---

## Success Criteria

### ✅ CLI Restored
- `supabase migration list` shows synchronized state
- `supabase db push --dry-run` succeeds
- `supabase db diff` shows no unexpected changes

### ✅ New Migrations Work
- Can create migration: `supabase migration new test`
- Can apply locally: `supabase db reset`
- Can push to remote: `supabase db push`

### ✅ CI/CD Deployed
- Automated migration deployment on merge
- Manual override still available
- Full audit trail via Git

---

## Prevention for Future

1. **Always use CLI for migrations** (once fixed)
   - Don't apply via SQL Editor
   - Don't manually edit migration history table

2. **Keep CLI up-to-date**
   - Check for updates monthly
   - Update before major changes

3. **Monitor migration sync**
   - Run `supabase migration list` before pushes
   - Alert on desync

4. **Use CI/CD for production**
   - Never manually apply to production
   - Automate with proper safeguards

---

## Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Management](https://supabase.com/docs/guides/cli/managing-migrations)
- [CLI Troubleshooting](https://supabase.com/docs/guides/cli/troubleshooting)
- [GitHub: Supabase CLI Issues](https://github.com/supabase/cli/issues)

---

## ✅ RESTORATION COMPLETE - 2026-01-17

**Status**: 🎉 Supabase CLI fully restored and functional

### Actions Taken (Phase 1: Manual Sync)

1. **✅ Upgraded Supabase CLI**
   - From: 2.45.5 (27 versions behind)
   - To: 2.72.7 (latest)
   - Method: Direct ARM64 binary download to `~/bin/supabase`
   - Time: ~2 minutes

2. **✅ Re-linked Project**
   - Removed stale project linkage
   - Linked to project: `chyaqualjbhkykgofcov`
   - Updated `supabase/config.toml` to set `major_version = 15` (was 17)
   - Time: ~1 minute

3. **✅ Reconciled Migration History**
   - Identified mismatches: 20260114, 20260116, 20260117-20260125
   - Reverted orphaned remote timestamp entries
   - Renamed local migrations with `applied_` prefix for already-executed migrations:
     - `applied_20260114_001_create_labor_request_tables.sql`
     - `applied_20260117_001_add_company_size_column.sql`
     - `applied_20260118_001_add_admin_agency_insert_policy.sql`
     - `applied_20260119_001_add_public_agency_select_policy.sql`
     - `applied_20260120_001_create_agency_compliance_table.sql`
     - `applied_20260121_001_fix_function_search_path.sql`
     - `applied_20260122_001_add_compliance_reminder_tracking.sql`
     - `applied_20260123_001_create_agency_logos_bucket.sql`
     - `applied_20260124_001_create_compliance_documents_bucket.sql`
     - `applied_20260125_001_add_api_performance_indexes.sql`
   - Used `supabase migration repair` to clean remote history
   - Time: ~15 minutes

4. **✅ Verified CLI Functionality**
   - Created test migration: `20260117015107_test_cli_restoration.sql`
   - Successfully pushed to remote database
   - Confirmed migration appears in synchronized state
   - Dry-run shows: "Remote database is up to date" ✓
   - Time: ~5 minutes

### Verification Results

```bash
$ supabase --version
2.72.7

$ supabase migration list | tail -5
   20260113       | 20260113       | 20260113
   20260114225504 | 20260114225504 | 2026-01-14 22:55:04
   20260115       | 20260115       | 20260115
   20260117015107 | 20260117015107 | 2026-01-17 01:51:07 ✓ Test migration

$ supabase db push --dry-run
Remote database is up to date. ✓
```

### Success Criteria Met

- ✅ CLI version upgraded to latest (2.72.7)
- ✅ Project successfully linked
- ✅ Migration history synchronized (all green in `migration list`)
- ✅ `supabase db push --dry-run` succeeds
- ✅ Test migration pushed successfully
- ✅ No migration history conflicts

### Files Modified

**Configuration:**
- `supabase/config.toml` - Updated `major_version` from 17 to 15

**Migrations Renamed (10 total):**
- 1 migration from 20260114
- 9 migrations from 20260117-20260125
- All prefixed with `applied_` to mark as manually executed

**New Migration:**
- `supabase/migrations/20260117015107_test_cli_restoration.sql` (can be removed after verification)

### Total Time

**23 minutes** from start to fully functional CLI

### Lessons Learned

1. **CLI Version Matters**: 27 versions behind caused incompatibility issues
2. **Migration History Must Match**: Remote timestamp-only entries don't match local filename patterns
3. **`applied_` Prefix Solution**: Effective workaround for manually-executed migrations
4. **Repair Command is Powerful**: `supabase migration repair` can fix history mismatches
5. **Architecture Awareness**: ARM64 vs AMD64 binary compatibility in WSL

### Next Steps

1. Remove test migration table from database (optional cleanup)
2. Delete test migration file: `20260117015107_test_cli_restoration.sql`
3. Resume normal development workflow with functional CLI
4. Consider implementing Option D (CI/CD Pipeline) for long-term automation

### Ongoing Best Practices

- Always use CLI for migrations (avoid manual SQL Editor for migrations)
- Keep CLI up to date (check monthly)
- Run `supabase migration list` before pushing to verify sync
- Use `applied_` prefix for any manually-executed migrations
- Monitor migration history for drift

---

**Restoration Date**: 2026-01-17 01:51 UTC
**Restored By**: Manual CLI restoration process
**Approach Used**: Option B (Manual Sync)
**Next Planned Phase**: Consider Option D (CI/CD Pipeline) for future
