---
status: pending
priority: p1
issue_id: "009"
tags: [code-quality, refactoring, complexity]
dependencies: []
---

# Refactor 469-line GET function in agencies/[slug]/route.ts

Reduce cyclomatic complexity and improve maintainability by extracting functions from monolithic GET handler.

## Problem Statement

GET function in `app/api/agencies/[slug]/route.ts` is 469 lines with cyclomatic complexity > 30, violating Single Responsibility Principle. Difficult to test, maintain, and debug.

**Code Quality Impact:** CRITICAL
- 469 lines in single function
- Cyclomatic complexity > 30 (should be < 10)
- Violates SRP (handles env validation, query, transform, error handling)
- Hard to unit test individual concerns
- 150+ lines of duplicated environment validation

## Findings

**File:** `app/api/agencies/[slug]/route.ts:40-509`

**Breakdown:**
- Lines 40-190: Environment variable validation (duplicated in agencies/route.ts)
- Lines 191-280: Database query with retry logic
- Lines 281-420: Data transformation (compliance, trades, regions)
- Lines 421-509: Error handling and response formatting

**Complexity drivers:**
- Nested conditionals for compliance checking
- Multiple transformation loops
- Inline error handling
- Environment validation repeated across files

## Proposed Solutions

### Option 1: Extract 4+ functions (Recommended)

**Approach:** Break into focused, testable functions.

```typescript
// 1. Environment validation (shared utility)
function validateEnvironment(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  // ... other checks
}

// 2. Query with retry
async function queryAgencyBySlug(slug: string) {
  return await dbQueryWithTimeout(
    async () => supabase.from('agencies').select('...').eq('slug', slug).single(),
    { retries: 3, totalTimeout: TIMEOUT_CONFIG.DB_RETRY_TOTAL }
  );
}

// 3. Data transformation
function transformAgencyData(rawAgency: any) {
  return {
    ...rawAgency,
    trades: rawAgency.agency_trades.map(transformTrade),
    regions: rawAgency.agency_regions.map(transformRegion),
    compliance: transformCompliance(rawAgency.agency_compliance),
  };
}

// 4. Error response
function handleAgencyError(error: Error): Response {
  if (error instanceof TimeoutError) {
    return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
  }
  // ... other error types
}

// Main GET function (now < 50 lines)
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  validateEnvironment();
  
  const { data, error } = await queryAgencyBySlug(params.slug);
  if (error) return handleAgencyError(error);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  const transformed = transformAgencyData(data);
  return NextResponse.json({ data: transformed }, { status: 200 });
}
```

**Pros:**
- Each function < 100 lines
- Easy to unit test individually
- Clear separation of concerns
- Reusable functions (validateEnvironment shared across routes)

**Cons:**
- More files/functions
- Need to maintain function boundaries

**Effort:** 3-4 hours
**Risk:** Low (with good tests)

## Acceptance Criteria

- [ ] Extract validateEnvironment() to shared utility
- [ ] Extract queryAgencyBySlug()
- [ ] Extract transformAgencyData() with sub-functions
- [ ] Extract handleAgencyError()
- [ ] Reduce GET function to < 150 lines
- [ ] Each extracted function < 100 lines
- [ ] Cyclomatic complexity < 10 per function
- [ ] Maintain 100% test coverage
- [ ] All existing tests pass
- [ ] Verify behavior unchanged (integration test)

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Code Quality Review Agent)
- Measured GET function: 469 lines, complexity > 30
- Identified 4 distinct responsibilities
- Found 150+ lines of duplicated validation code
- Drafted refactoring plan with function boundaries

## Notes

- **Duplication:** validateEnvironment() is copied in agencies/route.ts (fix both)
- **Testing:** Keep integration test to verify refactoring doesn't break behavior
- **Pattern:** Apply same refactoring to agencies/route.ts
