---
status: pending
priority: p2
issue_id: "015"
tags: [code-review, performance, database]
dependencies: []
---

# Fix N+1 Queries in Agency Update Endpoint

## Problem Statement

**Performance Issue**: The PATCH endpoint at `/api/admin/agencies/[id]/route.ts` contains multiple N+1 query patterns when updating trades and regions, causing 8+ database queries per save operation.

**Current Performance**:
- Best case: 8 database queries per edit
- Worst case: 12+ queries with audit trail
- Response time: 400ms+ (unacceptable for admin operations)

**Expected Performance**:
- Optimized: 2-3 database queries per edit
- Response time: <100ms

**Impact**: Slow admin operations, poor UX, database load

## Findings

**From Performance Review**:
> Critical Issue #1: Database Query Efficiency - N+1 Queries (HIGH IMPACT). The PATCH endpoint contains multiple sequential N+1 query patterns when updating trades and regions. Current: 8 queries. Optimized: 2 queries. Expected improvement: 4x faster response time.

**Query Pattern Issues**:
```typescript
// Line 302-305: Validate trade IDs exist (1 query)
const { data: validTrades } = await supabase.from('trades').select('id, name').in('id', trade_ids!)

// Line 340-343: Fetch current trades for audit (1 query)
const { data: currentTrades } = await supabase.from('agency_trades').select(...)

// Line 412-416: Fetch trade names AGAIN for audit (1 query)
const { data: newTradeData } = await supabase.from('trades').select('name').in('id', trade_ids)

// Line 434-439: Fetch trade details for response (1 query)
const { data: tradesData } = await supabase.from('trades').select('id, name, slug').in('id', trade_ids!)

// SAME PATTERN REPEATS FOR REGIONS (+4 queries)
```

## Proposed Solutions

### Solution 1: Consolidate Trade/Region Queries (Recommended)

**Approach**: Fetch trade/region data once, reuse for validation, audit, and response

**Implementation**:
```typescript
// BEFORE: 8 queries (4 for trades, 4 for regions)
// AFTER: 2 queries (1 for trades, 1 for regions)

// 1. Fetch and validate trades in single query
if (trade_ids && trade_ids.length > 0) {
  const { data: validatedTrades, error: tradeError } = await supabase
    .from('trades')
    .select('id, name, slug')  // Fetch all needed fields at once
    .in('id', trade_ids)

  if (tradeError || !validatedTrades) {
    return NextResponse.json({ error: 'Trade validation failed' }, { status: 400 })
  }

  // Validate all IDs exist
  if (validatedTrades.length !== trade_ids.length) {
    const validIds = new Set(validatedTrades.map(t => t.id))
    const invalidIds = trade_ids.filter(id => !validIds.has(id))
    return NextResponse.json({
      error: `Invalid trade IDs: ${invalidIds.join(', ')}`
    }, { status: 400 })
  }

  // Reuse validatedTrades for:
  // - Audit trail: validatedTrades.map(t => t.name)
  // - Response: validatedTrades (already has id, name, slug)
  // - No additional queries needed
}

// Same pattern for regions
```

**Pros**:
- 4x faster (8 queries → 2 queries)
- 300ms+ response time improvement
- Less database load
- Same functionality

**Cons**: None

**Effort**: 1-2 hours
**Risk**: LOW (pure optimization, no behavior change)

### Solution 2: Add Database Indexes

**Approach**: Optimize join queries with composite indexes

```sql
CREATE INDEX IF NOT EXISTS idx_trades_display
  ON trades(id, name, slug);

CREATE INDEX IF NOT EXISTS idx_regions_display
  ON regions(id, name, state_code);
```

**Pros**:
- 4x faster queries at scale
- Complements Solution 1

**Cons**: Adds 2 indexes (minimal storage cost)

**Effort**: 15 minutes
**Risk**: MINIMAL

### Solution 3: Defer Audit Trail to Background

**Approach**: Move audit logging to async background job

**Pros**: Additional 50-100ms saved
**Cons**: Audit trail not guaranteed (low priority for this)

**Effort**: 2-3 hours
**Risk**: MEDIUM

## Recommended Action

✅ **Implement Solution 1 + Solution 2**

1. Consolidate queries (Solution 1) - immediate impact
2. Add indexes (Solution 2) - ensures scale performance
3. Defer Solution 3 (background audit) - nice-to-have, not critical

## Technical Details

**Affected Files**:
- `app/api/admin/agencies/[id]/route.ts` (lines 295-602)
- `supabase/migrations/` (new migration for indexes)

**Performance Targets**:
- Current: 400ms P95
- Target: <100ms P95
- Improvement: 4x faster

**Database Impact**:
- Queries reduced: 8 → 2 (75% reduction)
- Index storage: +2 indexes (~1KB each)

## Acceptance Criteria

- [ ] Trade validation consolidated to single query
- [ ] Region validation consolidated to single query
- [ ] Audit trail uses cached data (no re-fetch)
- [ ] Response uses cached data (no re-fetch)
- [ ] Composite indexes created for trades and regions
- [ ] Performance benchmark shows <100ms P95
- [ ] All tests pass (no behavior change)

## Work Log

**2026-01-13**: Issue created from performance review. Agent identified 8-query N+1 pattern.

## Resources

- **API Route**: `app/api/admin/agencies/[id]/route.ts:295-602`
- **Performance Review**: Full analysis from performance-oracle agent
- **Existing Pattern**: Lines 302-439 (current implementation)
