---
status: pending
priority: p1
issue_id: "002"
tags: [performance, memory-leak, timeout]
dependencies: []
---

# Fix Promise.race memory leak in withTimeout

Eliminate memory leak caused by unresolved timeout promises continuing to run after the original promise resolves.

## Problem Statement

The `withTimeout()` function uses `Promise.race()` which leaves the timeout promise running even after the original promise resolves. With high request volumes (1000 requests/min), this leaks approximately ~100 bytes per timeout, accumulating to ~100KB/min or ~6MB/hour of leaked memory.

**Performance Impact:** CRITICAL
- Memory accumulates indefinitely until process restart
- Garbage collector cannot reclaim leaked timers
- High-traffic pages (agency list, detail pages) most affected
- Could cause Node.js process to run out of memory

## Findings

**File:** `lib/fetch/timeout.ts:30-45`

**Current implementation:**
```typescript
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(errorMessage, timeoutMs)),
        timeoutMs
      )
    ),
  ]);
}
```

**Problem:** When `promise` resolves first, the `setTimeout` continues running until `timeoutMs` expires.

**Memory leak calculation:**
- 1000 requests/min with average 5s timeout
- Each unresolved timer: ~100 bytes (callback + closure)
- Leak rate: 1000 × 100 bytes / min = ~100KB/min
- Accumulation: ~6MB/hour, ~144MB/day

**Affected paths:**
- `app/recruiters/[slug]/page.tsx` - Agency detail page (8s timeout)
- `lib/auth/auth-context.tsx` - Auth initialization (8s timeout × 2 queries)
- `hooks/useUnreadCount.ts` - Background polling (5s timeout every 30s)
- `components/messages/SendMessageButton.tsx` - Conversation check (10s timeout)

## Proposed Solutions

### Option 1: Use AbortController to cancel timeout (Recommended)

**Approach:** Create AbortController to cancel the timeout timer when the promise resolves.

```typescript
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  const abortController = new AbortController();
  const { signal } = abortController;

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(
      () => reject(new TimeoutError(errorMessage, timeoutMs)),
      timeoutMs
    );

    // Cancel timeout if signal is aborted
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    abortController.abort(); // Cancel timeout on success
    return result;
  } catch (error) {
    abortController.abort(); // Cancel timeout on error
    throw error;
  }
}
```

**Pros:**
- Completely eliminates memory leak
- Standard pattern (AbortController is Web API)
- Explicit resource cleanup
- No breaking changes to API

**Cons:**
- Slightly more complex implementation
- Minor performance overhead for abort handling

**Effort:** 1 hour (implementation + tests)

**Risk:** Low

---

### Option 2: Store and clear timeout manually

**Approach:** Store timeout ID and clear it when promise resolves.

```typescript
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new TimeoutError(errorMessage, timeoutMs)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}
```

**Pros:**
- Simple, direct solution
- No additional dependencies
- Explicit timeout ID tracking

**Cons:**
- Manual state management (timeout ID)
- More error-prone than AbortController
- Less idiomatic than Web API

**Effort:** 45 minutes

**Risk:** Low

---

### Option 3: Custom promise wrapper with cleanup callback

**Approach:** Create reusable promise wrapper that guarantees cleanup.

**Pros:**
- Reusable pattern for other scenarios
- Explicit cleanup contract

**Cons:**
- Over-engineering for this specific issue
- More complex API surface

**Effort:** 2 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `lib/fetch/timeout.ts:30-45` - withTimeout implementation
- `lib/fetch/__tests__/timeout.test.ts` - add resource cleanup tests

**Memory leak verification test:**
```typescript
test('withTimeout cleans up timeout when promise resolves', async () => {
  const spy = jest.spyOn(global, 'clearTimeout');

  await withTimeout(
    Promise.resolve('success'),
    5000
  );

  expect(spy).toHaveBeenCalled(); // Verify clearTimeout was called
  spy.mockRestore();
});
```

**Load test to verify fix:**
```typescript
test('withTimeout does not leak memory under load', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Simulate 1000 requests
  await Promise.all(
    Array.from({ length: 1000 }, () =>
      withTimeout(Promise.resolve('ok'), 5000)
    )
  );

  global.gc(); // Force garbage collection (requires --expose-gc flag)

  const finalMemory = process.memoryUsage().heapUsed;
  const leakMB = (finalMemory - initialMemory) / 1024 / 1024;

  expect(leakMB).toBeLessThan(1); // Less than 1MB leaked
});
```

## Resources

- **Review finding:** Performance Analysis Agent - Issue #1 (CRITICAL severity)
- **Related:** MDN - AbortController API
- **Pattern:** Similar cleanup needed in `dbQueryWithTimeout`

## Acceptance Criteria

- [ ] Implement timeout cancellation in `withTimeout()`
- [ ] Add resource cleanup test verifying clearTimeout is called
- [ ] Add load test verifying no memory accumulation (1000 iterations)
- [ ] Run memory profiler before/after fix to measure improvement
- [ ] Verify all existing tests still pass
- [ ] Update documentation with cleanup behavior
- [ ] Consider applying same fix to `dbQueryWithTimeout` if applicable

## Work Log

### 2026-01-12 - Initial Discovery

**By:** Claude Code (Performance Analysis Agent)

**Actions:**
- Identified Promise.race memory leak pattern
- Calculated leak rate under typical load (100KB/min)
- Analyzed all usages of withTimeout in codebase
- Drafted 3 solution approaches
- Researched AbortController pattern for cleanup

**Learnings:**
- Promise.race doesn't auto-cancel losing promises
- High-traffic endpoints most affected (agency pages, polling)
- Similar issue may exist in other timeout implementations
- AbortController is standard Web API for cancellation

## Notes

- **Urgent:** This affects production performance under normal load
- **Testing:** Requires --expose-gc flag to force GC in tests
- **Monitoring:** Add memory usage metrics after deployment
- **Related:** Check if `dbQueryWithTimeout` has similar issue
