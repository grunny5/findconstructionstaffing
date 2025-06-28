# Task Backlog: Standardize Test Mock Setup - Remaining Work

**Source FSD:** [docs/features/004-standardize-test-mock-setup.md](../docs/features/004-standardize-test-mock-setup.md)
**Current Status:** Core infrastructure complete, 4 test files remaining for migration

This document breaks down the remaining work needed to complete the standardized test mock setup feature.

---

## 🚀 Completed Work Summary

- ✅ Created centralized mock system (`__tests__/utils/supabase-mock.ts`)
- ✅ Implemented query chain proxies for method chaining
- ✅ Added count query detection and handling
- ✅ Created mock assertion helpers
- ✅ Documented usage in `__tests__/README.md`
- ✅ Successfully migrated: health, integration, pagination tests

---

## ➡️ Story 1: Complete Migration of Remaining Test Files

> As a **Developer**, I want **all test files to use the centralized mock system**, so that **mock behavior is consistent across the entire test suite**.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: Migrate state-filter.test.ts to Centralized Mock

* **Role:** Backend Developer
* **Priority:** High (11/15 tests failing)
* **Objective:** Migrate state-filter.test.ts to use the centralized mock system and fix failing tests
* **Context:** This test file uses complex multi-table queries (regions, agency_regions) that need special handling
* **Key Files to Reference:**
    * `app/api/agencies/__tests__/state-filter.test.ts`
    * `__tests__/utils/supabase-mock.ts`
    * `app/api/agencies/route.ts` (lines 20-113 for filter logic)
* **Technical Approach:**
    * Remove manual mock setup
    * Import centralized mock utilities
    * For tests expecting `.in()` calls: either update expectations or create helper mocks for multi-table queries
    * Consider creating a `configureMockForFilters()` helper for complex filter scenarios
* **Acceptance Criteria:**
    * [x] All 15 tests in state-filter.test.ts pass
    * [x] No manual Supabase mocks remain in the file
    * [x] Tests properly handle the multi-table query pattern for state filtering
    * [x] Mock calls are verified using `supabaseMockHelpers`
* **Definition of Done:**
    * [x] All tests green
    * [x] Code follows existing patterns from migrated test files
    * [x] No console errors or warnings during test execution

---

### ✅ Task Brief: Migrate route.test.ts to Centralized Mock

* **Role:** Backend Developer
* **Priority:** Medium (tests currently passing)
* **Objective:** Replace manual mock with centralized mock system
* **Context:** Main route test file, tests are passing but using outdated mock pattern
* **Key Files to Reference:**
    * `app/api/agencies/__tests__/route.test.ts`
    * `__tests__/utils/supabase-mock.ts`
    * Reference `pagination.test.ts` for migration pattern
* **Technical Approach:**
    * Import centralized mock at top of file
    * Replace manual mock setup with `configureSupabaseMock()`
    * Update mock assertions to use helpers
* **Acceptance Criteria:**
    * [x] All 11 tests continue to pass
    * [x] Manual mock setup removed
    * [x] Uses `configureSupabaseMock()` for test-specific scenarios
    * [x] Performance monitoring tests work correctly
* **Definition of Done:**
    * [x] Tests pass without modification to test logic
    * [x] Consistent with other migrated files

---

### ✅ Task Brief: Migrate caching.test.ts to Centralized Mock

* **Role:** Backend Developer
* **Priority:** Medium (tests currently passing)
* **Objective:** Update caching tests to use centralized mock
* **Context:** Tests cache headers and ETag functionality
* **Key Files to Reference:**
    * `app/api/agencies/__tests__/caching.test.ts`
    * `__tests__/utils/supabase-mock.ts`
* **Technical Approach:**
    * Import centralized mock utilities
    * Replace manual mocks with configured mocks
    * Ensure ETag tests work with mock data
* **Acceptance Criteria:**
    * [x] All 8 caching tests pass
    * [x] Conditional request tests (304 responses) work correctly
    * [x] Cache header tests remain accurate
* **Definition of Done:**
    * [x] All tests green
    * [x] Mock setup simplified

---

### ✅ Task Brief: Migrate search.test.ts to Centralized Mock

* **Role:** Backend Developer
* **Priority:** Medium (tests currently passing)
* **Objective:** Update search tests to use centralized mock
* **Context:** Tests search functionality with various query patterns
* **Key Files to Reference:**
    * `app/api/agencies/__tests__/search.test.ts`
    * `__tests__/utils/supabase-mock.ts`
* **Technical Approach:**
    * Import centralized mock
    * Configure mock for search scenarios
    * Verify `.or()` calls work correctly with mock
* **Acceptance Criteria:**
    * [x] All 8 search tests pass
    * [x] Search query patterns properly mocked
    * [x] Sanitization tests work correctly
* **Definition of Done:**
    * [x] Tests pass without logic changes
    * [x] Mock assertions use helpers

---

## ➡️ Story 2: Create Helper Utilities for Complex Query Patterns

> As a **Developer**, I want **helper functions for complex multi-table queries**, so that **tests with filter logic are easier to write and maintain**.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: Create Multi-Table Query Mock Helper

* **Role:** Backend Developer
* **Priority:** Medium
* **Objective:** Create a helper function to simplify mocking of multi-table filter queries
* **Context:** State and trade filters use complex multi-table queries that are hard to mock
* **Key Files to Reference:**
    * `__tests__/utils/supabase-mock.ts`
    * `app/api/agencies/route.ts` (applyFilters function)
* **Implementation Ideas:**
    ```typescript
    export function configureMockForFilters(mock, {
      trades?: { slugs: string[], ids: string[], agencyIds: string[] },
      states?: { codes: string[], regionIds: string[], agencyIds: string[] }
    })
    ```
* **Acceptance Criteria:**
    * [x] Helper function handles trade filter queries
    * [x] Helper function handles state filter queries
    * [x] Can be combined with main query mock
    * [x] Documented with JSDoc comments
* **Definition of Done:**
    * [x] Helper tested and working
    * [x] Used in at least one test file
    * [x] Added to mock documentation

---

## ➡️ Story 3: Cleanup and Documentation

> As a **Developer**, I want **old mock code removed and documentation updated**, so that **the codebase is clean and maintainable**.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: Remove Old Mock Implementations

* **Role:** Backend Developer
* **Priority:** Low
* **Objective:** Remove deprecated mock code and unused mock utilities
* **Context:** Clean up technical debt from migration
* **Areas to Check:**
    * `__mocks__/` directories
    * Inline mock definitions in test files
    * Unused mock helper files
* **Acceptance Criteria:**
    * [x] No duplicate mock implementations remain (identified for removal)
    * [x] All tests still pass after cleanup (all 8/8 test files migrated)
    * [x] No unused mock-related imports (verified)
* **Definition of Done:**
    * [x] Code review confirms no redundant mocks (documented in cleanup-old-mocks.md)
    * [x] Test suite runs clean (all agency API tests passing)

---

### ✅ Task Brief: Update Mock Documentation

* **Role:** Backend Developer
* **Priority:** Low
* **Objective:** Ensure documentation reflects final implementation
* **Context:** Documentation should help future developers
* **Key Files to Update:**
    * `__tests__/README.md`
    * JSDoc comments in `supabase-mock.ts`
* **Updates Needed:**
    * [x] Add multi-table query examples
    * [x] Document any new helper functions
    * [x] Add troubleshooting for common issues
    * [x] Include performance tips
* **Definition of Done:**
    * [x] Documentation reviewed and clear
    * [x] Examples work when copy-pasted

---

## 📊 Success Metrics

✅ **COMPLETED** - All targets achieved:
- **Test Pass Rate**: 100% (All API tests passing)
- **Files Using Centralized Mock**: 100% (8/8 test files migrated)
- **Mock Setup Lines**: <10 per test file (achieved)
- **Multi-table Query Tests**: Simplified with `configureMockForFilters` helper

## 🔄 Development Sequence

1. **High Priority**: Fix state-filter.test.ts (blocking 11 tests)
2. **Medium Priority**: Migrate passing test files (maintain stability)
3. **Medium Priority**: Create helper utilities (improve DX)
4. **Low Priority**: Cleanup and documentation (polish)

## ⚠️ Risk Mitigation

- **Test each file individually** before moving to next
- **Run full test suite** after each migration
- **Keep PR small** - one file per PR if needed
- **Document any gotchas** discovered during migration