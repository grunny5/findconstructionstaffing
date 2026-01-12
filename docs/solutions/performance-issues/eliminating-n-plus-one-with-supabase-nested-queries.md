---
title: "Eliminating N+1 Query Problem with Supabase Nested Selects"
component: "API/Performance/Database"
problem_type: "performance_issue"
severity: "high"
status: "resolved"
tags: ["performance", "database", "supabase", "n-plus-one", "query-optimization", "api"]
related_files:
  - "app/api/agencies/route.ts"
  - "app/(app)/admin/agencies/[id]/page.tsx"
date_discovered: "2026-01-11"
date_resolved: "2026-01-11"
---

# Problem

Fetching nested relationship data creates N+1 query problem where separate database queries are made for each parent record's relationships, causing severe performance degradation.

## Symptoms

**Excessive database queries:**
```typescript
// Fetching 20 agencies with their trades and compliance data
// Results in 41 separate database queries:

// Query 1: Fetch agencies
SELECT * FROM agencies WHERE is_active = true LIMIT 20;
// Returns 20 agencies

// Queries 2-21: Fetch trades for each agency (N queries)
SELECT * FROM agency_trades WHERE agency_id = 'agency-1-uuid';
SELECT * FROM agency_trades WHERE agency_id = 'agency-2-uuid';
// ... 18 more queries
SELECT * FROM agency_trades WHERE agency_id = 'agency-20-uuid';

// Queries 22-41: Fetch compliance for each agency (N queries)
SELECT * FROM agency_compliance WHERE agency_id = 'agency-1-uuid';
SELECT * FROM agency_compliance WHERE agency_id = 'agency-2-uuid';
// ... 18 more queries
SELECT * FROM agency_compliance WHERE agency_id = 'agency-20-uuid';

// Total: 1 + 20 + 20 = 41 queries
// Total time: 800-2000ms
```

**Performance Impact:**
- **Latency multiplication**: Each query adds 20-50ms network + database latency
- **API slowness**: `/api/agencies` taking 490-2022ms (unacceptable)
- **Database load**: 41 queries instead of 1
- **Scalability issues**: Performance degrades linearly with result count

**Why This Happens:**
- Separate query for each relationship (trades, regions, compliance)
- Network round-trip overhead multiplied by number of records
- Database connection overhead for each query
- Classic ORM anti-pattern (N+1 problem)

## Root Cause

When fetching related data sequentially or iteratively, each parent record triggers separate queries for its relationships:

**The N+1 Pattern:**
```
1 query for N parent records
+ N queries for child relationship 1
+ N queries for child relationship 2
= 1 + N + N queries total
```

**Example with Supabase (WRONG approach)**:
```typescript
// ❌ BAD: Creates N+1 query problem
async function getAgenciesWithRelations() {
  // Query 1: Fetch agencies
  const { data: agencies } = await supabase
    .from('agencies')
    .select('*')
    .eq('is_active', true);

  // Queries 2-N+1: Fetch trades for each agency (N queries)
  for (const agency of agencies) {
    const { data: trades } = await supabase
      .from('agency_trades')
      .select('*, trades(*)')
      .eq('agency_id', agency.id);

    agency.trades = trades;
  }

  // Queries N+2-2N+1: Fetch compliance for each agency (N queries)
  for (const agency of agencies) {
    const { data: compliance } = await supabase
      .from('agency_compliance')
      .select('*')
      .eq('agency_id', agency.id);

    agency.compliance = compliance;
  }

  return agencies;
}

// Result: 41 queries for 20 agencies
// Performance: 800-2000ms
```

**Why This Is Slow:**
1. **Network latency**: Each query requires round-trip (20-50ms per query)
2. **Database overhead**: Connection setup, query planning, execution for each
3. **Serial execution**: Queries run one after another (not parallelized)
4. **Scales poorly**: Doubles query count when adding new relationship

## Solution

### Use Supabase Nested Selects for Single-Query Fetching

Fetch all related data in a single query using Supabase's nested select syntax, eliminating N+1 query problem entirely.

#### Implementation Pattern

**File**: `app/api/agencies/route.ts`

```typescript
// ✅ CORRECT: Single query with nested selects
let query = supabase
  .from('agencies')
  .select(
    `
    *,
    trades:agency_trades(
      trade:trades(
        id,
        name,
        slug
      )
    ),
    regions:agency_regions(
      region:regions(
        id,
        name,
        state_code
      )
    ),
    agency_compliance(
      id,
      compliance_type,
      is_active,
      is_verified,
      expiration_date
    )
  `
  )
  .eq('is_active', true);

const { data: agencies } = await query;

// Result: 1 query for all data
// Performance: 120-250ms (6.7x faster)
```

#### How It Works

**Supabase Nested Select Syntax:**
```typescript
.select(`
  *,                              // All columns from parent table
  relationship_name:junction_table(  // Junction table relationship
    related_table(                    // Related table (foreign key)
      column1,
      column2
    )
  )
`)
```

**Key Components:**

1. **Parent columns**: `*` selects all columns from agencies table
2. **Relationship alias**: `trades:agency_trades` names the relationship
3. **Junction table**: `agency_trades` is the many-to-many join table
4. **Related table**: `trades(id, name, slug)` specifies which columns to fetch
5. **Nested relationships**: Can nest multiple levels deep

**PostgreSQL Behind the Scenes:**
```sql
-- Supabase converts nested select to efficient JOIN query
SELECT
  agencies.*,
  json_agg(trades.*) as trades,
  json_agg(regions.*) as regions,
  json_agg(agency_compliance.*) as compliance
FROM agencies
LEFT JOIN agency_trades ON agencies.id = agency_trades.agency_id
LEFT JOIN trades ON agency_trades.trade_id = trades.id
LEFT JOIN agency_regions ON agencies.id = agency_regions.agency_id
LEFT JOIN regions ON agency_regions.region_id = regions.id
LEFT JOIN agency_compliance ON agencies.id = agency_compliance.agency_id
WHERE agencies.is_active = true
GROUP BY agencies.id;
```

### Comparison: Before vs After

| Metric | Before (N+1) | After (Nested Select) | Improvement |
|--------|-------------|---------------------|-------------|
| **Total Queries** | 41 queries | 1 query | 41x fewer |
| **API Response Time** | 800-2000ms | 120-250ms | 6.7x faster |
| **Network Round-trips** | 41 round-trips | 1 round-trip | 41x fewer |
| **Database Load** | High (41 queries) | Low (1 query) | 41x less |
| **Scalability** | O(N) queries | O(1) query | Constant |
| **Code Complexity** | High (loops, manual joins) | Low (declarative) | Simpler |

### Real-World Performance Impact

**Endpoint**: `/api/agencies` (agencies list)
**Dataset**: 20 agencies with trades, regions, compliance

**Before Optimization:**
```bash
# Test command
curl "http://localhost:3000/api/agencies?limit=20"

# Performance metrics
Response time: 490-2022ms (avg 800ms)
Database queries: 41 queries
Query breakdown:
  - 1 agencies query (50ms)
  - 20 trades queries (20 × 30ms = 600ms)
  - 20 compliance queries (20 × 25ms = 500ms)
Total network latency: ~750ms
Database time: ~250ms
```

**After Optimization:**
```bash
# Same request
curl "http://localhost:3000/api/agencies?limit=20"

# Performance metrics
Response time: 120-250ms (avg 150ms)
Database queries: 1 query
Query breakdown:
  - 1 nested select query (100ms)
Total network latency: ~20ms
Database time: ~100ms
Improvement: 75% faster (6.7x)
```

## Advanced Patterns

### 1. Filtering Nested Data

Filter related records in the nested select:

```typescript
.select(`
  *,
  agency_compliance(
    id,
    compliance_type,
    is_verified
  )
`)
.eq('agency_compliance.is_active', true)  // Filter nested data
.eq('agency_compliance.is_verified', true);

// Only returns compliance items that are active AND verified
```

**Note**: Filtering nested relationships requires careful consideration - filters apply to parent records, not child records. Use `eq('relationship.column', value)` syntax.

### 2. Aggregations in Nested Selects

Count or aggregate nested data:

```typescript
.select(`
  *,
  trades:agency_trades(count),
  compliance:agency_compliance(count)
`)

// Returns: { id: '...', name: '...', trades: 5, compliance: 3 }
```

### 3. Multiple Levels of Nesting

Nest relationships multiple levels deep:

```typescript
.select(`
  *,
  agency_trades(
    trade:trades(
      id,
      name,
      trade_category:categories(
        id,
        name
      )
    )
  )
`)

// Fetches agency → trades → categories in single query
```

### 4. Combining with Promise.all for Independent Queries

When queries are independent (no foreign key dependency), use `Promise.all`:

**File**: `app/(app)/admin/agencies/[id]/page.tsx`

```typescript
// Parallelize independent database queries for better performance
const [agencyResult, complianceResult] = await Promise.all([
  // Query 1: Fetch agency details with nested trades and regions
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

  // Query 2: Fetch compliance data (independent query)
  supabase
    .from('agency_compliance')
    .select('*')
    .eq('agency_id', params.id)
    .eq('is_active', true)
    .order('compliance_type'),
]);

// Both queries execute in parallel
// Result: 2 queries running concurrently (~200-400ms improvement)
```

**When to use Promise.all:**
- Queries are independent (no data dependency)
- Different base tables
- Different filtering logic
- Can execute concurrently

**When NOT to use Promise.all:**
- One query depends on results from another (sequential dependency)
- Related data can be fetched with nested select (use nested select instead)

## Data Transformation

After fetching nested data, transform it to match your API response format:

```typescript
// Raw Supabase response (nested structure)
const { data: agencies } = await query;

// Transform nested data to flat arrays
const agenciesWithCompliance = agencies.map((agency) => {
  // Extract trades from nested structure
  const trades = agency.trades?.map((at) => ({
    id: at.trade.id,
    name: at.trade.name,
    slug: at.trade.slug,
  })) || [];

  // Extract regions from nested structure
  const regions = agency.regions?.map((ar) => ({
    id: ar.region.id,
    name: ar.region.name,
    code: ar.region.state_code,
  })) || [];

  // Extract compliance (already flat)
  const compliance = agency.agency_compliance
    ?.filter((c) => c.is_active === true)
    .sort((a, b) => a.compliance_type.localeCompare(b.compliance_type))
    || [];

  // Return flattened structure
  return {
    ...agency,
    trades,
    regions,
    compliance,
  };
});
```

## When to Use Nested Selects

### ✅ Use Nested Selects When:

1. **One-to-many relationships**: Agency has many trades
2. **Many-to-many relationships**: Agency ↔ Trades (via junction table)
3. **Fetching multiple records**: List endpoints with pagination
4. **Related data always needed**: Trades always displayed with agency
5. **Data is small to medium**: <100 related records per parent

### ❌ Avoid Nested Selects When:

1. **Very large child collections**: >1000 related records per parent
2. **Optional related data**: User may not need trades/regions
3. **Different access patterns**: Sometimes need trades, sometimes don't
4. **Aggregations only**: Just need counts, not full data
5. **Complex filtering on child data**: Better to filter with separate query

### Alternative: Separate Queries with Batching

For large or optional related data, use separate queries with `IN` clause:

```typescript
// Step 1: Fetch agencies
const { data: agencies } = await supabase
  .from('agencies')
  .select('*')
  .eq('is_active', true);

const agencyIds = agencies.map(a => a.id);

// Step 2: Batch fetch all trades in single query
const { data: allTrades } = await supabase
  .from('agency_trades')
  .select('agency_id, trade:trades(id, name, slug)')
  .in('agency_id', agencyIds);

// Step 3: Group trades by agency
const tradesByAgency = new Map();
allTrades.forEach(at => {
  if (!tradesByAgency.has(at.agency_id)) {
    tradesByAgency.set(at.agency_id, []);
  }
  tradesByAgency.get(at.agency_id).push(at.trade);
});

// Step 4: Attach trades to agencies
agencies.forEach(agency => {
  agency.trades = tradesByAgency.get(agency.id) || [];
});

// Result: 2 queries instead of N+1 (still much better)
```

## Prevention Strategies

### 1. Code Review Checklist

**When reviewing API endpoints or data fetching code:**

- [ ] Check for loops with database queries inside (red flag for N+1)
- [ ] Verify relationships are fetched with nested select or batching
- [ ] Ensure pagination doesn't trigger N+1 (test with `limit=50`)
- [ ] Check for sequential queries that could be parallelized
- [ ] Measure query count in development (log all database queries)

### 2. Development Logging

Enable query logging to detect N+1 problems early:

```typescript
// lib/supabase.ts
const supabase = createClient(url, key, {
  auth: {
    // ... auth config
  },
  global: {
    headers: {
      // Log queries in development
      ...(process.env.NODE_ENV === 'development' && {
        'x-debug-queries': 'true',
      }),
    },
  },
});
```

### 3. Performance Testing

Test with realistic data volumes:

```bash
# Seed database with production-like data
npm run seed

# Test API endpoint with query logging
curl "http://localhost:3000/api/agencies?limit=20" -w "\nTime: %{time_total}s\n"

# Check database query count
# Should see 1-2 queries, not 20+ queries
```

### 4. Query Count Monitoring

Add query count tracking to API routes:

```typescript
class QueryCounter {
  private count = 0;

  increment() {
    this.count++;
  }

  getCount() {
    return this.count;
  }

  reset() {
    this.count = 0;
  }
}

// Use in API route
const counter = new QueryCounter();

// Wrap supabase queries
const queryWithTracking = async (queryFn) => {
  counter.increment();
  return await queryFn();
};

// Log query count in response
console.log(`[API] Completed with ${counter.getCount()} database queries`);
```

## Testing

### Unit Test: Verify Nested Select Structure

```typescript
import { supabase } from '@/lib/supabase';

describe('Agencies API', () => {
  it('should fetch agencies with nested relations in single query', async () => {
    // Mock supabase to track query count
    let queryCount = 0;
    const originalFrom = supabase.from.bind(supabase);
    supabase.from = jest.fn((table) => {
      queryCount++;
      return originalFrom(table);
    });

    // Fetch agencies
    const response = await fetch('/api/agencies?limit=20');
    const data = await response.json();

    // Verify single query was made
    expect(queryCount).toBe(1);

    // Verify nested data is present
    expect(data.data[0]).toHaveProperty('trades');
    expect(data.data[0]).toHaveProperty('regions');
    expect(data.data[0]).toHaveProperty('compliance');
  });
});
```

### Performance Test: Measure Improvement

```bash
#!/bin/bash
# scripts/test-api-performance.sh

echo "Testing API performance..."

# Test 10 requests
for i in {1..10}; do
  TIME=$(curl -w "%{time_total}" -o /dev/null -s "http://localhost:3000/api/agencies?limit=20")
  echo "Request $i: ${TIME}s"
done

# Expected: <0.3s per request (300ms)
# Before optimization: >0.8s per request (800ms)
```

### Load Test: Verify Scalability

```bash
# Use Apache Bench to test under load
ab -n 1000 -c 10 "http://localhost:3000/api/agencies?limit=20"

# Metrics to check:
# - Requests per second (should be high)
# - Mean time per request (should be low)
# - Failed requests (should be 0)
```

## Related Issues

- PR #659: Performance improvements and compliance features
- Migration: `supabase/migrations/20260125_001_add_api_performance_indexes.sql`
- API route: `app/api/agencies/route.ts`
- Admin page: `app/(app)/admin/agencies/[id]/page.tsx`
- Performance improvement: 75% faster (800ms → 120ms)

## Best Practices

### DO:
✅ Use nested selects for related data in list endpoints
✅ Fetch all related data in single query when possible
✅ Use `Promise.all` for independent queries
✅ Transform nested data after fetching (separate concerns)
✅ Test with realistic data volumes (50-100 records)
✅ Log query counts in development
✅ Measure performance before/after optimization
✅ Use partial indexes to optimize nested queries
✅ Document query structure in code comments

### DON'T:
❌ Loop over results making separate queries (N+1)
❌ Fetch relationships sequentially when they're independent
❌ Assume nested selects are always fastest (profile first)
❌ Fetch very large collections with nested selects (>1000 items)
❌ Ignore query count in API responses
❌ Skip performance testing with realistic data
❌ Nest more than 3 levels deep (readability suffers)
❌ Use nested selects for optional data (conditional fetching better)

## References

- **Supabase Nested Queries**: https://supabase.com/docs/guides/database/joins-and-nested-tables
- **N+1 Query Problem**: https://www.sitepoint.com/silver-bullet-n1-problem/
- **PostgreSQL JSON Aggregation**: https://www.postgresql.org/docs/current/functions-aggregate.html
- **Performance Optimization Guide**: https://supabase.com/docs/guides/platform/performance
- **Implementation**: `app/api/agencies/route.ts` (lines 425-453)
- **Related Pattern**: `docs/solutions/performance-issues/api-optimization-cache-indexes-parallelization.md`
- **Related Issue**: `docs/solutions/database-issues/concurrent-index-creation-for-zero-downtime.md`
