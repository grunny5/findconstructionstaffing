---
status: pending
priority: p1
issue_id: "010"
tags: [testing, integration-tests, timeout]
dependencies: []
---

# Add integration tests for timeout behavior

Create comprehensive integration test suite verifying real-world timeout scenarios across all critical paths.

## Problem Statement

Only unit tests exist (21 tests, all passing). No integration tests verify how timeout protection works in real application scenarios. Critical gaps: auth context timeout, conversation check timeout, agency detail page timeout, polling timeout.

**Test Coverage Impact:** CRITICAL
- Integration tests: 0% (none exist)
- Real-world scenarios untested
- No verification of graceful degradation
- High risk of production issues

## Findings

**File:** `lib/fetch/__tests__/timeout.test.ts`

**Current coverage:**
- ✅ Unit tests: 21 tests, 85% code coverage
- ❌ Integration tests: 0 tests, 0% coverage
- ❌ Performance tests: 0 tests

**Missing scenarios:**
1. Auth context timeout → Header renders in logged-out state
2. Conversation check timeout → Modal shows anyway
3. Agency detail page timeout → Error boundary triggers
4. Polling timeout → Keeps previous count, continues polling
5. Multiple simultaneous timeouts → No memory leak

## Proposed Solutions

### Option 1: MSW-based integration tests (Recommended)

**Approach:** Use Mock Service Worker to simulate slow/failing APIs.

**Test structure:**
```typescript
// __tests__/integration/timeout-scenarios.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

describe('Timeout Integration Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('auth context timeout renders Header in logged-out state', async () => {
    server.use(
      rest.get('/api/auth/profile', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Timeout
        return res(ctx.json({ data: null }));
      })
    );

    const { getByRole } = render(<App />);

    await waitFor(() => {
      expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
    }, { timeout: 9000 });
  });

  test('conversation check timeout shows modal anyway', async () => {
    server.use(
      rest.get('/api/messages/conversations', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 15000));
        return res(ctx.json({ data: [] }));
      })
    );

    const { getByText, getByRole } = render(<SendMessageButton {...props} />);

    fireEvent.click(getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(getByText(/compose your inquiry/i)).toBeInTheDocument();
    }, { timeout: 11000 });
  });

  test('agency detail page timeout triggers error boundary', async () => {
    server.use(
      rest.get('/api/agencies/:slug', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return res(ctx.status(504));
      })
    );

    const { getByText } = render(<AgencyDetailPage params={{ slug: 'test' }} />);

    await waitFor(() => {
      expect(getByText(/taking longer than expected/i)).toBeInTheDocument();
    }, { timeout: 9000 });
  });

  test('polling timeout keeps previous count', async () => {
    let callCount = 0;
    server.use(
      rest.get('/api/messages/unread-count', async (req, res, ctx) => {
        callCount++;
        if (callCount === 2) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Timeout
        }
        return res(ctx.json({ data: { total_unread: 5 } }));
      })
    );

    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
    });

    // Wait for second poll (should timeout)
    await new Promise(resolve => setTimeout(resolve, 31000));

    // Count should still be 5 (previous value)
    expect(result.current.unreadCount).toBe(5);
  });
});
```

**Pros:**
- Tests real application behavior
- Simulates network conditions accurately
- Catches integration bugs
- MSW is industry standard

**Cons:**
- Tests run slower (simulated delays)
- More setup required

**Effort:** 4-6 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Create integration test suite in __tests__/integration/
- [ ] Setup MSW for API mocking
- [ ] Test auth context timeout scenario
- [ ] Test conversation check timeout scenario
- [ ] Test agency detail page timeout scenario
- [ ] Test polling timeout scenario
- [ ] Test multiple simultaneous timeouts (no memory leak)
- [ ] Test graceful degradation for all critical paths
- [ ] Achieve >80% integration coverage for timeout paths
- [ ] All tests pass in CI/CD pipeline

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Test Coverage Review Agent)
- Identified 0% integration test coverage
- Researched MSW for API mocking
- Designed test scenarios for all critical paths
- Drafted test structure and assertions

## Notes

- **MSW:** Industry standard for API mocking (used by React, Next.js teams)
- **CI/CD:** Tests will add ~30-60s to pipeline (worth it for coverage)
- **Future:** Add performance tests to measure actual timeout accuracy
