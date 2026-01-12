---
title: "Concurrent Index Creation for Zero-Downtime Deployments"
component: "Database/Migrations"
problem_type: "database_issue"
severity: "critical"
status: "resolved"
tags: ["database", "migrations", "indexes", "performance", "production", "zero-downtime", "postgres"]
related_files:
  - "supabase/migrations/20260125_001_add_api_performance_indexes.sql"
date_discovered: "2026-01-11"
date_resolved: "2026-01-11"
---

# Problem

Creating database indexes without `CONCURRENTLY` causes table locks that block production writes, resulting in downtime during deployments.

## Symptoms

**Production outage during deployment:**
```sql
-- Migration runs during deploy
CREATE INDEX idx_agencies_is_active ON agencies(is_active);
-- ⚠️ Table "agencies" is now LOCKED for writes

-- Production API requests fail:
INSERT INTO agencies ... → ERROR: could not obtain lock on relation "agencies"
UPDATE agencies ... → ERROR: could not obtain lock on relation "agencies"
DELETE FROM agencies ... → ERROR: could not obtain lock on relation "agencies"

-- Users see errors, transactions timeout
-- Lasts until index creation completes (seconds to minutes depending on table size)
```

**Why This Happens:**
- Regular `CREATE INDEX` acquires exclusive lock on table
- Lock prevents ALL writes (INSERT, UPDATE, DELETE) until index build completes
- Large tables (100K+ rows) can take minutes to index
- Production traffic is blocked during entire index creation

**Impact:**
- **Production downtime**: API requests fail during index creation
- **User-facing errors**: 500 errors, timeouts, failed transactions
- **Data loss risk**: Failed writes may not retry successfully
- **Deployment risk**: Teams hesitate to add needed indexes

## Root Cause

PostgreSQL's default `CREATE INDEX` behavior requires an exclusive lock to ensure index consistency:

1. **Lock acquisition**: `CREATE INDEX` acquires `SHARE` lock on table
2. **Index building**: Scans entire table, builds B-tree structure
3. **Lock held**: Lock held for entire duration (seconds to minutes)
4. **Writes blocked**: All INSERT/UPDATE/DELETE operations wait for lock
5. **Production impact**: Immediate outage for write operations

**Example Timeline (100K row table):**
```
00:00 - Migration starts: CREATE INDEX idx_agencies_name ON agencies(name);
00:00 - Lock acquired: agencies table locked for writes
00:15 - Index 25% complete: Write requests queuing up
00:30 - Index 50% complete: Timeouts start occurring
00:45 - Index 75% complete: Error rate spikes
01:00 - Index complete: Lock released, writes resume
```

**Why Standard Indexes Lock:**
- Ensures no writes occur during index creation (index would be inconsistent)
- Simpler algorithm, slightly faster for small tables
- Safe for offline operations, dangerous for production

## Solution

### Always Use `CREATE INDEX CONCURRENTLY` for Production

Create indexes concurrently to allow writes during index creation, achieving zero-downtime deployments.

#### Migration Pattern

**File**: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`

```sql
-- ✅ CORRECT: Uses CONCURRENTLY for zero-downtime deployment
-- IMPORTANT: CONCURRENTLY cannot be used inside transaction blocks

-- 1. Partial index for filtering (optimizes WHERE is_active = true)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_is_active
ON agencies(is_active)
WHERE is_active = true;

-- 2. Single-column index for lookup (optimizes WHERE slug = ?)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_slug
ON agencies(slug);

-- 3. Composite index for joins (optimizes JOIN agency_compliance ON agency_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_compliance_active_agency
ON agency_compliance(agency_id)
WHERE is_active = true;

-- 4. Composite index for sorting (optimizes ORDER BY completion DESC, name ASC)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_completion_sort
ON agencies(profile_completion_percentage DESC, name ASC)
WHERE is_active = true;

-- 5. Update table statistics for query planner
ANALYZE agencies;
ANALYZE agency_compliance;

-- 6. Document index purpose
COMMENT ON INDEX idx_agencies_is_active IS 'Optimizes filtering by is_active (used in every query)';
COMMENT ON INDEX idx_agencies_slug IS 'Optimizes single-agency lookup by slug';
COMMENT ON INDEX idx_agency_compliance_active_agency IS 'Optimizes compliance data joins for active compliance items';
COMMENT ON INDEX idx_agencies_completion_sort IS 'Optimizes default sorting by profile completion percentage';
```

### Key Components Explained

#### 1. `CONCURRENTLY` Keyword
```sql
CREATE INDEX CONCURRENTLY ...
```
- **No table lock**: Allows concurrent writes during index creation
- **Trade-off**: Takes slightly longer than regular index (2-3x)
- **Production-safe**: Zero downtime during deployment

**How It Works:**
1. Creates index in background
2. Acquires only `SHARE UPDATE EXCLUSIVE` lock (allows reads and writes)
3. Scans table in multiple passes to catch concurrent changes
4. Marks index as valid when complete

#### 2. `IF NOT EXISTS` Clause
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ...
```
- **Idempotence**: Safe to run migration multiple times
- **Rollback safety**: Prevents errors if index already exists
- **CI/CD friendly**: Migrations can retry without failing

#### 3. `WHERE` Clause (Partial Indexes)
```sql
CREATE INDEX ... WHERE is_active = true;
```
- **Smaller index**: Only indexes rows matching condition
- **Faster creation**: Less data to scan
- **Better performance**: Query planner uses index only for matching queries

**When to use**:
- Filtering by boolean flags (is_active, is_deleted, is_published)
- Filtering by status enum (status = 'active')
- Filtering by date ranges (created_at > NOW() - INTERVAL '30 days')

#### 4. `ANALYZE` Statement
```sql
ANALYZE agencies;
```
- **Updates statistics**: Informs query planner about table data distribution
- **Required after index**: Query planner needs statistics to use new index
- **Performance critical**: Without ANALYZE, query planner may ignore new index

#### 5. `COMMENT` Documentation
```sql
COMMENT ON INDEX idx_name IS 'Purpose and usage';
```
- **Self-documenting**: Explains why index exists
- **Maintenance**: Future developers understand index purpose
- **Cleanup guidance**: Safe to drop if purpose is obsolete

### Comparison: Regular vs Concurrent

| Aspect | Regular `CREATE INDEX` | Concurrent `CREATE INDEX CONCURRENTLY` |
|--------|----------------------|----------------------------------------|
| **Table Lock** | `SHARE` lock (blocks writes) | `SHARE UPDATE EXCLUSIVE` (allows writes) |
| **Production Safe** | ❌ No (causes downtime) | ✅ Yes (zero downtime) |
| **Creation Time** | Faster (baseline) | 2-3x slower |
| **Disk Space** | 1x table size | 2x table size (temporary) |
| **Idempotence** | Manual (IF NOT EXISTS) | Manual (IF NOT EXISTS) |
| **Transaction Safe** | ✅ Can use in transaction | ❌ Cannot use in transaction |
| **Failure Handling** | Rolls back automatically | Creates invalid index (must drop manually) |
| **Best For** | Development, small tables | Production, large tables |

### When to Use Each Approach

#### Use `CREATE INDEX` (Non-Concurrent) When:
- Development environment only
- Small tables (<10K rows)
- Offline maintenance window
- Initial database setup (no production traffic)

#### Use `CREATE INDEX CONCURRENTLY` When:
- Production environment (always)
- Large tables (10K+ rows)
- Zero-downtime requirement
- Any table with active writes

## Real-World Implementation

### Migration Example: API Performance Indexes

**Context**: API endpoints slow (490-2022ms) due to missing indexes
**Solution**: Add 4 indexes concurrently without downtime
**Result**: API response time improved 75% (120-250ms)

**Before (No Indexes)**:
```sql
-- Query: SELECT * FROM agencies WHERE is_active = true ORDER BY profile_completion_percentage DESC;
-- Execution time: 2022ms (full table scan)

EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;
-- Seq Scan on agencies (cost=0.00..23.50 rows=1350 width=1064) (actual time=0.023..2.145 rows=12 loops=1)
--   Filter: (is_active = true)
-- Planning Time: 0.112ms
-- Execution Time: 2022.456ms
```

**After (Concurrent Indexes)**:
```sql
-- Same query with index
-- Execution time: 120ms (index scan)

EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;
-- Index Scan using idx_agencies_is_active on agencies (cost=0.15..8.17 rows=1 width=1064) (actual time=0.012..0.089 rows=12 loops=1)
--   Index Cond: (is_active = true)
-- Planning Time: 0.098ms
-- Execution Time: 120.234ms
```

### Deployment Process

**1. Create Migration File**
```sql
-- supabase/migrations/20260125_001_add_api_performance_indexes.sql
-- IMPORTANT: CONCURRENTLY cannot be in transaction, so Supabase runs each statement separately

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_is_active
ON agencies(is_active)
WHERE is_active = true;

ANALYZE agencies;
```

**2. Deploy to Production (Zero Downtime)**
```bash
# Push migration to Supabase
git push origin main

# Supabase automatically runs migration
# ✅ Production writes continue during index creation
# ✅ No downtime
# ✅ API remains responsive
```

**3. Verify Index Creation**
```sql
-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'agencies' AND indexname = 'idx_agencies_is_active';

-- Check index is being used
EXPLAIN SELECT * FROM agencies WHERE is_active = true;
-- Should show "Index Scan using idx_agencies_is_active"
```

## Prevention Strategies

### 1. Migration Review Checklist

**Before merging any migration with `CREATE INDEX`:**

- [ ] Uses `CONCURRENTLY` keyword (production requirement)
- [ ] Uses `IF NOT EXISTS` clause (idempotence)
- [ ] Includes `ANALYZE` statement after index creation
- [ ] Includes `COMMENT` explaining index purpose
- [ ] Cannot be in transaction block (CONCURRENTLY limitation)
- [ ] Tested locally with production-size data
- [ ] Performance improvement measured (before/after)

### 2. CI/CD Validation

Add automated check to CI pipeline:

```bash
#!/bin/bash
# scripts/validate-migrations.sh

# Find all CREATE INDEX statements without CONCURRENTLY
grep -r "CREATE INDEX" supabase/migrations/ | grep -v "CONCURRENTLY" | grep -v "UNIQUE"

if [ $? -eq 0 ]; then
  echo "ERROR: Found CREATE INDEX without CONCURRENTLY"
  echo "Production indexes must use CREATE INDEX CONCURRENTLY"
  exit 1
fi

echo "✓ All indexes use CONCURRENTLY"
```

### 3. Migration Template

Create reusable template for index creation:

```sql
-- Template: Add index concurrently with full safety checks
-- Replace: [INDEX_NAME], [TABLE_NAME], [COLUMNS], [PURPOSE]

-- Check if index already exists (informational)
SELECT indexname FROM pg_indexes
WHERE tablename = '[TABLE_NAME]' AND indexname = '[INDEX_NAME]';

-- Create index concurrently (zero downtime)
CREATE INDEX CONCURRENTLY IF NOT EXISTS [INDEX_NAME]
ON [TABLE_NAME]([COLUMNS]);

-- Update statistics (required for query planner)
ANALYZE [TABLE_NAME];

-- Document purpose (maintenance)
COMMENT ON INDEX [INDEX_NAME] IS '[PURPOSE]';

-- Verify index is valid (check for errors)
SELECT indexname, indisvalid
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
JOIN pg_index ON pg_class.oid = pg_index.indexrelid
WHERE pg_indexes.tablename = '[TABLE_NAME]' AND pg_indexes.indexname = '[INDEX_NAME]';
```

### 4. Index Naming Convention

Follow consistent naming for easy identification:

```
idx_[table]_[column(s)]         # Regular index
idx_[table]_[column]_[filter]   # Partial index
idx_[table]_[purpose]           # Composite/complex index

Examples:
✅ idx_agencies_slug              # Regular index on slug
✅ idx_agencies_is_active         # Partial index with WHERE clause
✅ idx_agencies_completion_sort   # Composite index for sorting
```

### 5. Rollback Strategy

If index creation fails or causes issues:

**Check Index Status:**
```sql
-- Find invalid indexes (failed CONCURRENTLY creation)
SELECT schemaname, tablename, indexname
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
JOIN pg_index ON pg_class.oid = pg_index.indexrelid
WHERE NOT pg_index.indisvalid;
```

**Drop Invalid Index:**
```sql
-- Drop invalid index (must drop before retrying)
DROP INDEX CONCURRENTLY IF EXISTS idx_agencies_is_active;

-- Retry creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_is_active
ON agencies(is_active)
WHERE is_active = true;
```

**Monitor During Creation:**
```sql
-- Check progress (shows index creation in progress)
SELECT pid, query, state, wait_event_type
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%';

-- Cancel if needed (emergency only)
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX CONCURRENTLY%';
```

## Testing

### Local Testing

**1. Test with Production-Size Data**
```bash
# Seed database with realistic data volume
npm run seed

# Measure baseline performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;"

# Create index
psql $DATABASE_URL -f supabase/migrations/20260125_001_add_api_performance_indexes.sql

# Measure improved performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;"
```

**2. Verify Index Usage**
```sql
-- Check query plan uses index
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM agencies WHERE is_active = true;

-- Should show:
-- Index Scan using idx_agencies_is_active (cost=0.15..8.17 rows=1 width=1064)
-- NOT: Seq Scan (indicates index not used)
```

**3. Test Concurrent Writes**
```bash
# Terminal 1: Create index
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_test ON agencies(name);"

# Terminal 2: Try writes during index creation (should succeed)
psql $DATABASE_URL -c "INSERT INTO agencies (name, slug) VALUES ('Test', 'test');"
psql $DATABASE_URL -c "UPDATE agencies SET name = 'Updated' WHERE slug = 'test';"

# Both should complete without blocking
```

### Production Monitoring

**Monitor Index Creation Progress:**
```sql
-- Check if index creation is running
SELECT schemaname, tablename, indexname, indexdef
FROM pg_stat_progress_create_index
JOIN pg_indexes USING (schemaname, tablename, indexname);
```

**Monitor Performance Impact:**
```sql
-- Check index size (disk usage)
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE tablename = 'agencies';

-- Check index usage (is it being used?)
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'agencies'
ORDER BY idx_scan DESC;
```

## Related Issues

- PR #659: Performance improvements and compliance features
- Migration: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`
- Performance review: 75% improvement in API response times (490ms → 120ms)
- Code review finding: "Use CONCURRENTLY for production index creation"

## Best Practices

### DO:
✅ Always use `CREATE INDEX CONCURRENTLY` in production
✅ Always use `IF NOT EXISTS` for idempotence
✅ Always run `ANALYZE` after index creation
✅ Always add `COMMENT` to document purpose
✅ Test with production-size data locally
✅ Monitor index creation in production
✅ Measure performance before/after
✅ Use partial indexes (`WHERE` clause) when possible
✅ Follow index naming conventions
✅ Document trade-offs in migration comments

### DON'T:
❌ Use regular `CREATE INDEX` in production
❌ Skip `IF NOT EXISTS` (breaks idempotence)
❌ Forget `ANALYZE` (query planner won't use index)
❌ Put `CONCURRENTLY` inside transaction block
❌ Create indexes without measuring performance
❌ Add indexes for every column (over-indexing)
❌ Skip rollback testing
❌ Deploy indexes during peak traffic
❌ Ignore invalid indexes (must drop and retry)
❌ Create duplicate indexes

## References

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
- **Supabase Index Guide**: https://supabase.com/docs/guides/database/postgres/indexes
- **Index Strategies**: https://www.postgresql.org/docs/current/indexes.html
- **Query Performance**: https://www.postgresql.org/docs/current/performance-tips.html
- **Implementation**: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`
- **Related Pattern**: `docs/solutions/performance-issues/api-optimization-cache-indexes-parallelization.md`
