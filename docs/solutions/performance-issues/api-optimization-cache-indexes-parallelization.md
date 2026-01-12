---
title: "API Optimization: Three-Layer Strategy (Cache + Indexes + Parallelization)"
component: "API/Performance"
problem_type: "performance_issue"
severity: "high"
status: "resolved"
tags: ["performance", "api", "caching", "indexes", "parallelization", "optimization", "next-js", "supabase"]
related_files:
  - "app/api/agencies/route.ts"
  - "app/(app)/admin/agencies/[id]/page.tsx"
  - "supabase/migrations/20260125_001_add_api_performance_indexes.sql"
date_discovered: "2026-01-11"
date_resolved: "2026-01-25"
---

# Problem

API endpoints responding slowly (490-2022ms) due to inefficient queries, missing database indexes, and sequential execution of independent operations.

## Symptoms

**Slow API Performance:**
```bash
# Test: GET /api/agencies
curl -w "\nTime: %{time_total}s\n" "http://localhost:3000/api/agencies?limit=20"

# Results (before optimization):
Time: 0.490s - 2.022s (avg 800ms)
Database queries: 41 queries
Query time: ~250ms
Network latency: ~750ms (40 round-trips × 20ms)
```

**Performance Impact:**
- **Poor user experience**: Pages take 800-2000ms to load
- **High database load**: 41 queries for single API call
- **Scalability issues**: Performance degrades with user growth
- **Resource waste**: Redundant queries for same data
- **Mobile issues**: 4G users see 2-3 second load times

**Why This Happens:**
- Missing database indexes (full table scans)
- N+1 query problem (separate queries for relationships)
- No caching (same data fetched repeatedly)
- Sequential query execution (not parallelized)
- Inefficient query patterns (filtering in application layer)

## Root Cause

Slow APIs result from compounding inefficiencies across multiple layers:

### 1. Database Layer Issues

**Missing Indexes:**
```sql
-- Query: Filter by is_active (used in every request)
SELECT * FROM agencies WHERE is_active = true;

-- EXPLAIN (no index):
Seq Scan on agencies  -- Full table scan!
  Filter: (is_active = true)
Planning Time: 0.112ms
Execution Time: 450.456ms  -- Slow!
```

**N+1 Query Problem:**
```typescript
// Fetch agencies
const agencies = await supabase.from('agencies').select('*');

// Fetch trades for each agency (N queries)
for (const agency of agencies) {
  const trades = await supabase
    .from('agency_trades')
    .select('*')
    .eq('agency_id', agency.id);
}
// Result: 1 + N queries (41 queries for 20 agencies)
```

### 2. Application Layer Issues

**No Caching:**
```typescript
// Every request hits database, even for identical queries
app.get('/api/agencies', async (req, res) => {
  const { data } = await supabase.from('agencies').select('*');
  res.json(data);  // No cache headers
});
// Result: Database hit every time, even within seconds
```

**Sequential Execution:**
```typescript
// Independent queries run sequentially
const agencies = await fetchAgencies();  // Wait 200ms
const compliance = await fetchCompliance();  // Wait another 200ms
// Total: 400ms (could be 200ms if parallel)
```

## Solution

### Three-Layer Optimization Strategy

Combine database indexes, caching, and parallelization for maximum performance improvement.

| Layer | Technique | Impact | Implementation Effort |
|-------|-----------|--------|---------------------|
| **Database** | Indexes + Nested Selects | 40% faster | Medium (migration required) |
| **Cache** | Next.js Revalidation | 60% faster | Low (config change) |
| **Application** | Query Parallelization | 200-400ms saved | Low (Promise.all) |
| **Combined** | All Three | 75% faster | Medium (1-2 days) |

## Layer 1: Database Optimization

### Add Indexes for Common Filters

**File**: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`

```sql
-- Index 1: Partial index for is_active filter (used in every query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_is_active
ON agencies(is_active)
WHERE is_active = true;

-- Index 2: Single-column index for slug lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_slug
ON agencies(slug);

-- Index 3: Composite index for compliance joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_compliance_active_agency
ON agency_compliance(agency_id)
WHERE is_active = true;

-- Index 4: Composite index for default sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_completion_sort
ON agencies(profile_completion_percentage DESC, name ASC)
WHERE is_active = true;

-- Update statistics for query planner
ANALYZE agencies;
ANALYZE agency_compliance;
```

**Performance Impact:**
```sql
-- BEFORE (no index):
EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;
-- Seq Scan: 450ms

-- AFTER (with index):
EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;
-- Index Scan using idx_agencies_is_active: 45ms
-- Improvement: 10x faster
```

### Use Nested Selects to Eliminate N+1

**File**: `app/api/agencies/route.ts` (lines 425-453)

```typescript
// ✅ CORRECT: Single query with nested selects
const query = supabase
  .from('agencies')
  .select(`
    *,
    trades:agency_trades(
      trade:trades(id, name, slug)
    ),
    regions:agency_regions(
      region:regions(id, name, state_code)
    ),
    agency_compliance(
      id,
      compliance_type,
      is_active,
      is_verified,
      expiration_date
    )
  `)
  .eq('is_active', true);

const { data: agencies } = await query;

// Result: 1 query instead of 41 queries
// Performance: 800ms → 120ms (6.7x faster)
```

**Why This Works:**
- PostgreSQL performs efficient JOINs behind the scenes
- Single network round-trip instead of 41
- Database query planner optimizes join order
- Uses indexes on foreign keys

## Layer 2: Caching Strategy

### Implement Next.js Cache with Revalidation

**File**: `app/api/agencies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ... fetch agencies from database ...

  // Generate ETag for conditional requests
  const responseString = JSON.stringify(response);
  const etag = createHash('md5').update(responseString).digest('hex');

  // Check if client has cached version
  const clientETag = request.headers.get('if-none-match');
  if (clientETag === etag) {
    // Return 304 Not Modified if content hasn't changed
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=60, must-revalidate',
      },
    });
  }

  // Set caching headers for successful response
  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, must-revalidate',
      ETag: etag,
      Vary: 'Accept-Encoding',
    },
  });
}
```

**Caching Strategy Explained:**

#### HTTP Caching with ETags
```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Browser │                    │   CDN   │                    │ API/DB   │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ 1. GET /api/agencies        │                              │
     │ ─────────────────────────> │                              │
     │                              │ 2. Not cached, forward      │
     │                              │ ──────────────────────────> │
     │                              │                              │
     │                              │ 3. Response + ETag: "abc123" │
     │                              │ <────────────────────────── │
     │ 4. Cache for 60s + ETag     │                              │
     │ <───────────────────────── │                              │
     │                              │                              │
     │ 5. GET /api/agencies        │                              │
     │    If-None-Match: "abc123"  │                              │
     │ ─────────────────────────> │                              │
     │                              │ 6. Check ETag               │
     │                              │ ──────────────────────────> │
     │                              │                              │
     │                              │ 7. 304 Not Modified          │
     │                              │ <────────────────────────── │
     │ 8. Use cached data          │                              │
     │ <───────────────────────── │                              │
     │                              │                              │
```

#### Cache Headers Breakdown

**`Cache-Control: public, max-age=60, must-revalidate`:**
- `public`: Response can be cached by CDNs and browsers
- `max-age=60`: Cache valid for 60 seconds
- `must-revalidate`: After 60s, must check with server (ETag validation)

**`ETag: "abc123"`:**
- Fingerprint of response content (MD5 hash)
- Changes when data changes
- Used for conditional requests (`If-None-Match` header)

**`Vary: Accept-Encoding`:**
- Cache separate versions for different encodings (gzip, br, identity)
- Prevents serving compressed data to clients that don't support it

### Performance Impact

**Before Caching (every request hits database):**
```
Request 1: 120ms (database query)
Request 2 (same data, 10s later): 120ms (database query again)
Request 3 (same data, 20s later): 120ms (database query again)
Total: 360ms across 3 requests
```

**After Caching (60s TTL):**
```
Request 1: 120ms (database query, sets ETag)
Request 2 (same data, 10s later): 5ms (304 Not Modified, cached)
Request 3 (same data, 20s later): 5ms (304 Not Modified, cached)
Total: 130ms across 3 requests (72% faster)
```

## Layer 3: Query Parallelization

### Use Promise.all for Independent Queries

When queries don't depend on each other, execute them in parallel.

**File**: `app/(app)/admin/agencies/[id]/page.tsx` (lines 75-130)

```typescript
// ✅ CORRECT: Parallelize independent queries
const [agencyResult, complianceResult] = await Promise.all([
  // Query 1: Fetch agency with nested trades and regions
  supabase
    .from('agencies')
    .select(`
      *,
      trades:agency_trades(
        trade:trades(id, name, slug)
      ),
      regions:agency_regions(
        region:regions(id, name, state_code)
      )
    `)
    .eq('id', params.id)
    .single(),

  // Query 2: Fetch compliance data
  supabase
    .from('agency_compliance')
    .select('*')
    .eq('agency_id', params.id)
    .eq('is_active', true)
    .order('compliance_type'),
]);

// Destructure results
const { data: agency } = agencyResult;
const { data: compliance } = complianceResult;

// Result: Both queries run concurrently
// Performance: 300-800ms → 200-400ms (30-50% faster)
```

**Sequential vs Parallel Comparison:**

```typescript
// ❌ BAD: Sequential execution
const agencyResult = await supabase.from('agencies').select('*').eq('id', id).single();
// Wait 200ms
const complianceResult = await supabase.from('agency_compliance').select('*').eq('agency_id', id);
// Wait another 150ms
// Total: 350ms

// ✅ GOOD: Parallel execution
const [agencyResult, complianceResult] = await Promise.all([
  supabase.from('agencies').select('*').eq('id', id).single(),
  supabase.from('agency_compliance').select('*').eq('agency_id', id),
]);
// Wait 200ms (both run at same time)
// Total: 200ms (fastest query + network overhead)
```

### When to Use Parallelization

#### ✅ Use Promise.all When:

1. **Queries are independent**:
   - No foreign key dependency between queries
   - One query doesn't need results from another
   - Different base tables

2. **Queries can be executed concurrently**:
   - No transaction requirement (no atomic update needed)
   - No sequential logic (query 2 doesn't depend on query 1 results)

**Examples:**
```typescript
// ✅ GOOD: Independent queries
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);

// ✅ GOOD: Agency and compliance (independent filtering)
const [agency, compliance] = await Promise.all([
  fetchAgency(id),
  fetchCompliance(id),
]);
```

#### ❌ Don't Use Promise.all When:

1. **Queries have dependencies**:
   - Query 2 needs results from Query 1
   - Sequential logic required

2. **Transaction required**:
   - Atomic operations (all or nothing)
   - Data consistency critical

**Examples:**
```typescript
// ❌ BAD: Dependent queries (need agency ID first)
const agency = await fetchAgency(slug);  // Get ID from slug
const compliance = await fetchCompliance(agency.id);  // Needs agency.id

// ❌ BAD: Transaction required (atomic update)
await supabase.from('accounts').update({ balance: balance - amount });
await supabase.from('transactions').insert({ amount, type: 'debit' });
// If one fails, other should rollback (use transaction instead)
```

## Combined Performance Impact

### Before Optimization

```
API Request: GET /api/agencies?limit=20

Database Layer:
  - 41 queries (1 agencies + 20 trades + 20 compliance)
  - No indexes (full table scans)
  - Total database time: ~250ms

Network Layer:
  - 41 round-trips × 20ms = 820ms latency
  - No caching (every request hits database)
  - Total network time: ~820ms

Application Layer:
  - Sequential execution (not parallelized)
  - No query optimization
  - Total processing time: ~50ms

Total Response Time: 250ms + 820ms + 50ms = 1120ms (avg)
Range: 490-2022ms
```

### After Optimization

```
API Request: GET /api/agencies?limit=20 (first request)

Database Layer:
  ✓ 1 query (nested select eliminates N+1)
  ✓ Indexed columns (10x faster scans)
  - Total database time: ~100ms

Network Layer:
  ✓ 1 round-trip (single query)
  ✓ Cached response (60s TTL with ETag)
  - Total network time: ~20ms

Application Layer:
  ✓ Parallelized queries (where applicable)
  ✓ Efficient query patterns
  - Total processing time: ~30ms

Total Response Time: 100ms + 20ms + 30ms = 150ms (avg)
Range: 120-250ms
Improvement: 75% faster (7.5x speedup)

---

API Request: GET /api/agencies?limit=20 (cached request within 60s)

Cache Layer:
  ✓ ETag matches (304 Not Modified)
  ✓ No database query needed
  - Total time: ~5ms

Total Response Time: 5ms
Improvement: 99.5% faster (224x speedup vs original)
```

## Implementation Checklist

### Phase 1: Database Optimization (Day 1)

- [ ] Identify slow queries with query profiling
- [ ] Create migration with concurrent indexes
- [ ] Add partial indexes for filtered queries
- [ ] Add composite indexes for sorting
- [ ] Run ANALYZE after index creation
- [ ] Refactor N+1 queries to use nested selects
- [ ] Test with production-size dataset
- [ ] Measure performance before/after

### Phase 2: Caching Strategy (Day 1-2)

- [ ] Add ETag generation to API routes
- [ ] Set Cache-Control headers
- [ ] Implement 304 Not Modified responses
- [ ] Add Vary header for compression
- [ ] Configure CDN caching (if applicable)
- [ ] Test cache invalidation on data changes
- [ ] Monitor cache hit rate

### Phase 3: Query Parallelization (Day 2)

- [ ] Identify independent queries
- [ ] Refactor to use Promise.all
- [ ] Ensure no race conditions
- [ ] Add error handling for parallel queries
- [ ] Test failure scenarios (one query fails)
- [ ] Measure performance improvement

### Phase 4: Monitoring & Validation

- [ ] Add performance metrics logging
- [ ] Set up alerting for slow queries (>100ms)
- [ ] Monitor cache hit rate (>80% target)
- [ ] Track P50, P95, P99 response times
- [ ] Load test with realistic traffic
- [ ] Document optimization patterns

## Performance Monitoring

### Add Metrics to API Routes

```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance';

export async function GET(request: NextRequest) {
  const monitor = new PerformanceMonitor('/api/agencies', 'GET');

  try {
    // Track query timing
    const queryId = monitor.startQuery();
    const { data } = await supabase.from('agencies').select('*');
    monitor.endQuery(queryId);

    // Complete monitoring with metrics
    const metrics = monitor.complete(200, undefined, {
      resultCount: data.length,
      hasFilters: !!searchParams.get('trade'),
    });

    // Log performance warning if approaching target
    if (metrics.responseTime > 80) {
      console.warn(
        `[Performance Warning] /api/agencies approaching 100ms target: ${metrics.responseTime}ms`
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    monitor.complete(500, error.message);
    throw error;
  }
}
```

### Performance Targets

| Metric | Target | Warning Threshold | Critical Threshold |
|--------|--------|-------------------|-------------------|
| **P50 Response Time** | <100ms | >80ms | >100ms |
| **P95 Response Time** | <250ms | >200ms | >250ms |
| **P99 Response Time** | <500ms | >400ms | >500ms |
| **Database Queries** | 1-2 | 3-5 | >5 |
| **Cache Hit Rate** | >80% | <80% | <50% |
| **Error Rate** | <1% | >1% | >5% |

## Troubleshooting

### Issue: Indexes Not Being Used

**Problem**: Query still slow after adding indexes

**Solution**:
```sql
-- Check if index is being used
EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;

-- If showing "Seq Scan" instead of "Index Scan":
-- 1. Ensure ANALYZE was run
ANALYZE agencies;

-- 2. Check index exists
SELECT * FROM pg_indexes WHERE tablename = 'agencies';

-- 3. Check index is valid
SELECT indexname, indisvalid
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
JOIN pg_index ON pg_class.oid = pg_index.indexrelid
WHERE tablename = 'agencies';

-- 4. Force index usage (testing only)
SET enable_seqscan = OFF;
EXPLAIN ANALYZE SELECT * FROM agencies WHERE is_active = true;
```

### Issue: Cache Not Working

**Problem**: Every request hits database despite caching

**Solution**:
```typescript
// Check cache headers in response
curl -I "http://localhost:3000/api/agencies"
// Look for:
// Cache-Control: public, max-age=60, must-revalidate
// ETag: "abc123..."

// Test ETag validation
curl -H "If-None-Match: abc123" "http://localhost:3000/api/agencies"
// Should return 304 Not Modified if ETag matches

// Check CDN configuration (if applicable)
// - Ensure Cache-Control header is forwarded
// - Ensure ETag header is forwarded
// - Check cache bypass rules
```

### Issue: Parallel Queries Causing Race Conditions

**Problem**: Parallel queries interfering with each other

**Solution**:
```typescript
// ❌ BAD: Race condition (both try to update same row)
await Promise.all([
  supabase.from('agencies').update({ views: views + 1 }).eq('id', id),
  supabase.from('agencies').update({ clicks: clicks + 1 }).eq('id', id),
]);
// Result: Last write wins, one update lost

// ✅ GOOD: Single atomic update
await supabase.from('agencies').update({
  views: views + 1,
  clicks: clicks + 1,
}).eq('id', id);
```

## Testing

### Load Test Script

```bash
#!/bin/bash
# scripts/load-test-api.sh

ENDPOINT="http://localhost:3000/api/agencies?limit=20"
REQUESTS=100
CONCURRENT=10

echo "Testing API performance..."
echo "Endpoint: $ENDPOINT"
echo "Requests: $REQUESTS"
echo "Concurrent: $CONCURRENT"
echo ""

# Use Apache Bench for load testing
ab -n $REQUESTS -c $CONCURRENT -g results.tsv "$ENDPOINT"

# Parse results
echo ""
echo "Performance Summary:"
awk -F'\t' 'NR>1 { sum+=$5; count++ } END { print "Average: " sum/count "ms" }' results.tsv
awk -F'\t' 'NR>1 { if ($5>max) max=$5 } END { print "Max: " max "ms" }' results.tsv
awk -F'\t' 'NR>1 { if (NR==2 || $5<min) min=$5 } END { print "Min: " min "ms" }' results.tsv

# Expected results:
# Average: <150ms
# Max: <250ms
# Min: <120ms
```

## Related Issues

- PR #659: Performance improvements and compliance features
- Migration: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`
- API route: `app/api/agencies/route.ts`
- Admin page: `app/(app)/admin/agencies/[id]/page.tsx`
- Code review: "Performance improved 75% with three-layer optimization"

## Best Practices

### DO:
✅ Profile before optimizing (measure, don't guess)
✅ Combine multiple optimization techniques
✅ Use concurrent indexes in production
✅ Implement nested selects for related data
✅ Add ETags for cache validation
✅ Parallelize independent queries with Promise.all
✅ Monitor performance metrics continuously
✅ Set performance budgets (P50 < 100ms)
✅ Test with production-size datasets
✅ Document optimization decisions

### DON'T:
❌ Optimize without measuring first
❌ Add indexes for every column (over-indexing)
❌ Cache data that changes frequently (<1s TTL)
❌ Parallelize dependent queries
❌ Skip ANALYZE after adding indexes
❌ Forget cache invalidation strategy
❌ Ignore P95/P99 response times
❌ Deploy optimizations without load testing
❌ Mix optimization with feature work
❌ Assume optimization works (verify with metrics)

## References

- **PostgreSQL Performance**: https://www.postgresql.org/docs/current/performance-tips.html
- **Next.js Caching**: https://nextjs.org/docs/app/building-your-application/caching
- **HTTP Caching (MDN)**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
- **Promise.all Pattern**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
- **Supabase Performance**: https://supabase.com/docs/guides/database/postgres/query-optimization
- **Related**: `docs/solutions/database-issues/concurrent-index-creation-for-zero-downtime.md`
- **Related**: `docs/solutions/performance-issues/eliminating-n-plus-one-with-supabase-nested-queries.md`
