---
title: "seed-reset.test.ts Fails After Adding New Database Table"
component: "Testing/Database Seeding"
problem_type: "test_failure"
severity: "medium"
status: "resolved"
tags: ["testing", "database", "foreign-keys", "test-maintenance"]
related_files:
  - "scripts/__tests__/seed-reset.test.ts"
  - "scripts/database/seed-database.ts"
  - "supabase/migrations/20260120_001_create_agency_compliance_table.sql"
date_discovered: "2026-01-11"
date_resolved: "2026-01-11"
---

# Problem

CI test failure in `scripts/__tests__/seed-reset.test.ts` after adding `agency_compliance` table:

```
● Reset Database Function › resetDatabase › should delete all records in correct order

  expect(received).toEqual(expected) // deep equality

  - Expected  - 0
  + Received  + 1

  @@ -5,9 +5,10 @@
      "jobs",
      "placements",
      "staff",
      "agency_trades",
      "agency_regions",
  +   "agency_compliance",    ← Unexpected in test expectations
      "agencies",
      "trades",
      "regions",
```

## Symptoms

- CI "API Tests" check failing
- Only `scripts/__tests__/seed-reset.test.ts` failing (1798/1800 tests passing)
- Test expects 11 tables, actual deletion includes 12 tables
- Error: Expected array doesn't include `agency_compliance`

## Root Cause

When a new table with foreign key constraints is added to the database:

1. Migration creates table: `agency_compliance` with FK to `agencies.id`
2. Seed script (`seed-database.ts`) correctly adds deletion logic respecting FK order
3. **Test expectations (`seed-reset.test.ts`) are NOT automatically updated**
4. Test still expects old deletion order → FAIL

**Key Insight**: Test maintenance required when database schema changes.

## Investigation Steps

1. ✅ Checked CI logs: Found exact diff showing `agency_compliance` in actual but not expected
2. ✅ Read migration file: Confirmed FK constraint `agency_id REFERENCES agencies(id)`
3. ✅ Read `seed-database.ts`: Confirmed correct deletion order (lines 964-976)
4. ✅ Read test file: Found outdated expected array and mock call count

## Solution

Update test expectations to match actual (correct) implementation:

### File: `scripts/__tests__/seed-reset.test.ts`

**Change 1: Add table to expected deletion order (line 79)**
```typescript
// BEFORE
expect(deletionCalls).toEqual([
  'roaddog_jobs_configs',
  'sync_logs',
  'integration_configs',
  'jobs',
  'placements',
  'staff',
  'agency_trades',
  'agency_regions',
  'agencies',        // ← agency_compliance must come before this
  'trades',
  'regions',
]);

// AFTER
expect(deletionCalls).toEqual([
  'roaddog_jobs_configs',
  'sync_logs',
  'integration_configs',
  'jobs',
  'placements',
  'staff',
  'agency_trades',
  'agency_regions',
  'agency_compliance',  // ← Added (respects FK to agencies)
  'agencies',
  'trades',
  'regions',
]);
```

**Change 2: Update mock call count (line 154)**
```typescript
// BEFORE
expect(neqMock).toHaveBeenCalledTimes(11); // 6 integration + 5 core

// AFTER
expect(neqMock).toHaveBeenCalledTimes(12); // 6 integration + 6 core
```

## Why This Order Matters

**Deletion order follows foreign key dependency hierarchy:**

1. Integration tables (no FK to core tables)
2. Junction tables (many-to-many, no cascading issues)
3. **Child tables with FK constraints** ← agency_compliance goes here
4. Parent tables (referenced by FK)

**Foreign Key Chain:**
```
agency_compliance.agency_id → agencies.id (FK constraint)
```

Deleting `agencies` before `agency_compliance` would violate FK constraint. While `ON DELETE CASCADE` could handle this, the code explicitly deletes in correct order for safety and clarity.

## Prevention

**When adding a new table with foreign keys:**

1. Create migration with FK constraints
2. Add deletion logic to `seed-database.ts` in correct order
3. **Update `seed-reset.test.ts` expectations**:
   - Add table name to `deletionCalls` array in correct position
   - Increment `neqMock.toHaveBeenCalledTimes()` count
4. Run test locally: `npm test -- "seed-reset"`
5. Verify CI passes after push

**Checklist for New Tables:**
- [ ] Migration created with FK constraints documented
- [ ] Deletion logic added to resetDatabase() function
- [ ] Test expectations updated in seed-reset.test.ts
- [ ] Local tests passing
- [ ] CI tests passing

## Testing

```bash
# Run specific test
npm test -- "seed-reset"

# Expected output
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

## Related Issues

- Migration: `20260120_001_create_agency_compliance_table.sql`
- PR #659: Performance improvements and compliance features
- Related test: `compliance/verify` endpoint tests also updated

## References

- Foreign Key Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK
- Jest Mock Assertions: https://jestjs.io/docs/expect#tohavebeencalledtimesnumber
- Database Seeding Pattern: `scripts/database/seed-database.ts`
