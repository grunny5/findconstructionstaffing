# FSD: Standardize Test Mock Setup Across All API Tests

* **ID:** 004
* **Status:** Draft
* **Related Epic:** Testing & Quality Assurance
* **Author:** Ted Grunwald
* **Last Updated:** 2025-06-27
* **Designs:** N/A - Infrastructure feature

## 1. Problem & Goal

### Problem Statement
The current test suite has inconsistent mock setups across different test files, leading to:
- Failing tests due to incorrect mock method chaining
- Duplicated mock setup code across test files
- Difficult-to-maintain test infrastructure
- Tests that previously hit the real database (now fixed but mocks need standardization)

Currently, 38 out of 257 tests are failing due to mock setup inconsistencies, even though the core functionality works correctly.

### Goal & Hypothesis
We believe that by creating a standardized, centralized mock setup system for all API tests, we will achieve:
- 100% test pass rate
- Reduced test maintenance overhead
- Easier onboarding for new developers
- Consistent test behavior across the codebase

We will know this is successful when:
- All 257 tests pass consistently
- Mock setup code is DRY (Don't Repeat Yourself)
- New tests can be written without duplicating mock logic

## 2. User Stories & Acceptance Criteria

### Story 1: Centralized Mock Configuration
> As a **Developer**, I want **a single source of truth for Supabase mock configuration**, so that **I don't have to duplicate mock setup in every test file**.

**Acceptance Criteria:**
* [ ] **Given** a test file needs Supabase mocking, **When** I import the centralized mock, **Then** all Supabase methods are properly mocked with correct chaining
* [ ] **Given** a mock method is called, **When** it should return chainable methods, **Then** it returns the mock object for method chaining
* [ ] **Given** a count query is executed, **When** the mock handles it, **Then** it returns the appropriate count structure

### Story 2: Test-Specific Mock Customization
> As a **Developer**, I want **to override default mock behavior for specific test cases**, so that **I can test different scenarios like errors or empty results**.

**Acceptance Criteria:**
* [ ] **Given** a test needs to simulate an error, **When** I override the mock behavior, **Then** the mock returns the specified error
* [ ] **Given** a test needs specific data, **When** I configure the mock with that data, **Then** subsequent calls return that data
* [ ] **Given** mock overrides are set, **When** the test completes, **Then** mocks are reset to defaults

### Story 3: Mock Assertion Helpers
> As a **Developer**, I want **helper functions to assert mock method calls**, so that **I can easily verify the correct database operations were attempted**.

**Acceptance Criteria:**
* [ ] **Given** a test needs to verify a query was made, **When** I use the assertion helper, **Then** it correctly validates the mock was called with expected parameters
* [ ] **Given** multiple similar calls are made, **When** I assert on specific calls, **Then** the helper can distinguish between them
* [ ] **Given** an assertion fails, **When** the test reports the error, **Then** it provides clear information about expected vs actual calls

## 3. Technical & Design Requirements

### Technical Impact Analysis

**File Structure:**
```
__tests__/
├── utils/
│   ├── supabase-mock.ts      # Core mock factory and utilities
│   ├── mock-helpers.ts       # Assertion and setup helpers
│   └── test-data.ts         # Centralized test data
├── setup/
│   └── jest-setup-after-env.ts  # Global test setup
```

**Core Mock Factory Implementation:**
```typescript
// __tests__/utils/supabase-mock.ts
export interface SupabaseMockConfig {
  defaultData?: any[];
  defaultCount?: number;
  errorToThrow?: Error;
}

export function createSupabaseMock(config?: SupabaseMockConfig) {
  // Implementation that handles:
  // - Method chaining
  // - Count queries
  // - Error simulation
  // - Data returns
}
```

**Affected Files to Update:**
- All files in `app/api/agencies/__tests__/`
- `jest.setup.js` (to be replaced with TypeScript version)
- `jest.config.js` (updated paths)
- Remove duplicate mocks in `__mocks__/` directories

### Testing Requirements
- All existing tests must pass without modification to their assertions
- Mock setup code reduction of at least 50%
- Performance: Mock creation should take <1ms

## 4. Scope

### In Scope
- Centralized Supabase mock factory
- Mock setup helpers for common scenarios
- Assertion helpers for mock verification
- Migration of all existing API tests to use new system
- Documentation of mock usage patterns

### Out of Scope
- Changing test assertions or test logic
- Adding new tests (only fixing existing ones)
- Mocking non-Supabase dependencies
- Integration testing against real database
- Frontend component test mocks

### Open Questions
* [ ] Should we use the same mock system for database seed script tests?
* [ ] Do we need to support partial mocking (some methods real, some mocked)?
* [ ] Should mock data be type-validated against Supabase types?

## 5. Implementation Plan

### Phase 1: Core Infrastructure (Day 1)
1. Create `createSupabaseMock` factory function
2. Implement method chaining logic
3. Handle count query edge cases
4. Create mock assertion helpers

### Phase 2: Migration (Day 2-3)
1. Update `jest.setup.js` to use new mock system
2. Migrate `integration.test.ts` as proof of concept
3. Update remaining test files one by one
4. Remove old mock implementations

### Phase 3: Documentation (Day 4)
1. Create mock usage guide in `__tests__/README.md`
2. Add JSDoc comments to all mock utilities
3. Create example test file showing best practices

## 6. Success Metrics

- **Test Pass Rate**: 100% (currently 85%)
- **Mock Setup Lines**: <10 lines per test file (currently 20-50)
- **Mock-related Test Failures**: 0 (currently 38)
- **Developer Satisfaction**: Measured via team feedback

## 7. Dependencies

- No external dependencies
- Must maintain compatibility with:
  - Jest 29.x
  - @supabase/supabase-js
  - Next.js test environment

## 8. Risks & Mitigation

**Risk**: Breaking working tests during migration
- **Mitigation**: Migrate one test file at a time, ensure it passes before proceeding

**Risk**: Mock becomes too complex to understand
- **Mitigation**: Keep mock API surface minimal, document thoroughly

**Risk**: Performance regression in test execution
- **Mitigation**: Benchmark before/after, ensure mock creation is lightweight