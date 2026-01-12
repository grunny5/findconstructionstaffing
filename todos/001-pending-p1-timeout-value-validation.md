---
status: pending
priority: p1
issue_id: "001"
tags: [security, validation, timeout]
dependencies: []
---

# Add timeout value input validation

Prevent potential DoS attacks by validating timeout parameter bounds in withTimeout and fetchWithTimeout functions.

## Problem Statement

The `withTimeout()` and `fetchWithTimeout()` functions in `lib/fetch/timeout.ts` accept arbitrary timeout values without validation. A malicious actor or programming error could pass extreme values like `Number.MAX_SAFE_INTEGER` (9 quadrillion milliseconds), effectively disabling timeout protection and enabling DoS attacks.

**Security Impact:** MEDIUM
- Allows bypassing timeout protection mechanism
- Could exhaust server resources with indefinite waits
- No defense against accidental or malicious extreme values

## Findings

**File:** `lib/fetch/timeout.ts:30-45`

- No minimum bound checking (could pass 0ms or negative values)
- No maximum bound checking (could pass Number.MAX_SAFE_INTEGER)
- Function accepts any number without validation
- No runtime TypeError for invalid inputs
-

**Attack vector:**
```typescript
// Bypasses timeout protection
await withTimeout(slowOperation(), Number.MAX_SAFE_INTEGER);
```

## Proposed Solutions

### Option 1: Add validation with sensible bounds (Recommended)

**Approach:** Validate timeout parameter at function entry with min 100ms and max 60000ms (60s).

```typescript
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  // Validation
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
    throw new TypeError('Timeout must be a finite number');
  }
  if (timeoutMs < 100 || timeoutMs > 60000) {
    throw new RangeError('Timeout must be between 100ms and 60000ms');
  }

  // ... existing implementation
}
```

**Pros:**
- Prevents DoS via extreme values
- Catches programming errors early
- Clear error messages for debugging
- Minimal performance overhead

**Cons:**
- Breaking change if code relies on extreme values
- Requires updating tests

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Configurable bounds via environment variables

**Approach:** Allow deployment-specific configuration of min/max bounds.

**Pros:**
- Flexible for different environments
- Can adjust limits based on infrastructure

**Cons:**
- More complex implementation
- Still needs sensible defaults
- Configuration management overhead

**Effort:** 1 hour

**Risk:** Medium

---

### Option 3: Warn only, don't throw

**Approach:** Log warnings for suspicious values but allow them.

**Pros:**
- No breaking changes
- Provides visibility

**Cons:**
- Doesn't prevent the security issue
- Relies on monitoring to catch problems

**Effort:** 20 minutes

**Risk:** Medium (issue not fully resolved)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `lib/fetch/timeout.ts:30` - withTimeout function
- `lib/fetch/timeout.ts:60` - fetchWithTimeout function
- `lib/fetch/__tests__/timeout.test.ts` - add validation tests

**Related components:**
- All timeout wrappers use these base functions
- Auth context, API routes, polling hooks all affected

**Validation rules:**
- Minimum: 100ms (prevent accidental 0ms timeouts)
- Maximum: 60000ms (60 seconds, reasonable upper bound)
- Type: must be finite number (reject NaN, Infinity)

## Resources

- **Review finding:** Security Review Agent - Issue #1 (MEDIUM severity)
- **Related:** OWASP - Denial of Service attacks
- **Pattern:** Similar validation in `dbQueryWithTimeout` should also be added

## Acceptance Criteria

- [ ] Add timeout validation to `withTimeout()` function
- [ ] Add timeout validation to `fetchWithTimeout()` function
- [ ] Throw TypeError for non-finite numbers
- [ ] Throw RangeError for values < 100ms or > 60000ms
- [ ] Update existing tests to use valid timeouts
- [ ] Add new tests for validation edge cases:
  - [ ] Test `timeoutMs = 0` throws RangeError
  - [ ] Test `timeoutMs = -1000` throws RangeError
  - [ ] Test `timeoutMs = 99` throws RangeError
  - [ ] Test `timeoutMs = 60001` throws RangeError
  - [ ] Test `timeoutMs = NaN` throws TypeError
  - [ ] Test `timeoutMs = Infinity` throws TypeError
  - [ ] Test `timeoutMs = Number.MAX_SAFE_INTEGER` throws RangeError
- [ ] Code passes TypeScript strict checks
- [ ] All existing tests still pass

## Work Log

### 2026-01-12 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Identified missing input validation during security review
- Analyzed attack vectors and potential impact
- Reviewed codebase for similar validation patterns
- Drafted 3 solution approaches

**Learnings:**
- No other timeout functions in codebase have validation
- TypeScript typing alone doesn't prevent runtime issues
- Similar issue in `dbQueryWithTimeout` should also be addressed

## Notes

- Consider adding this validation to `dbQueryWithTimeout` as well (see issue #004)
- Breaking change: Any code passing extreme values will start throwing
- Migration: Audit all timeout usages to ensure they're within bounds
