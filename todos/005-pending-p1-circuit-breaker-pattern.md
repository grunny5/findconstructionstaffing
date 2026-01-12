---
status: pending
priority: p1
issue_id: "005"
tags: [performance, resilience, circuit-breaker]
dependencies: []
---

# Implement circuit breaker pattern for timeout failures

Prevent cascading failures during API outages by implementing circuit breaker that fast-fails when failure rate is high.

## Problem Statement

When API is overloaded or database is down, every request still attempts full timeout cycle (3 retries × 5s = 15s per request). With 100 concurrent users, this creates 100 × 15s = 1500s of wasted waiting. Circuit breaker would detect failure pattern and fast-fail immediately, preventing stampede.

**Performance Impact:** CRITICAL
- No protection against cascade failures
- Users wait full timeout even when service is definitely down
- Amplifies load on failing service (retry storm)
- No recovery mechanism

## Findings

**Pattern needed:** Circuit breaker with 3 states:
1. **CLOSED** (normal): Requests pass through
2. **OPEN** (failing): Fast-fail all requests for cooldown period
3. **HALF_OPEN** (testing): Allow single request to test recovery

**Trigger conditions:**
- Open circuit after 50% failure rate in 10s window
- Keep open for 30s cooldown
- Transition to HALF_OPEN for recovery test
- Close circuit if test succeeds

## Proposed Solutions

### Option 1: Implement CircuitBreaker class (Recommended)

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureTimestamps: number[] = [];
  private successTimestamps: number[] = [];
  private lastFailureTime: number = 0;
  private halfOpenTestInProgress: boolean = false;

  private readonly WINDOW_MS = 10000;      // 10 second window
  private readonly COOLDOWN_MS = 30000;    // 30 second cooldown

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.cleanOldTimestamps();

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.COOLDOWN_MS) {
        throw new Error('Circuit breaker OPEN');
      }
      // Transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      this.halfOpenTestInProgress = false;
    }

    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenTestInProgress) {
        throw new Error('Circuit breaker HALF_OPEN - test in progress');
      }
      this.halfOpenTestInProgress = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.successTimestamps.push(Date.now());
    this.cleanOldTimestamps();

    if (this.state === 'HALF_OPEN') {
      // Successful test - reset and close circuit
      this.state = 'CLOSED';
      this.failureTimestamps = [];
      this.successTimestamps = [];
      this.halfOpenTestInProgress = false;
    }
  }

  private onFailure() {
    this.failureTimestamps.push(Date.now());
    this.lastFailureTime = Date.now();
    this.cleanOldTimestamps();

    if (this.state === 'HALF_OPEN') {
      // Test failed - reopen circuit
      this.state = 'OPEN';
      this.halfOpenTestInProgress = false;
      return;
    }

    // Check if we should trip the circuit
    const total = this.failureTimestamps.length + this.successTimestamps.length;
    const failureRatio = this.failureTimestamps.length / total;

    if (total >= 10 && failureRatio > 0.5) {
      this.state = 'OPEN';
    }
  }

  private cleanOldTimestamps() {
    const cutoff = Date.now() - this.WINDOW_MS;
    this.failureTimestamps = this.failureTimestamps.filter(t => t > cutoff);
    this.successTimestamps = this.successTimestamps.filter(t => t > cutoff);
  }
}
```

**Pros:**
- Prevents stampede during outages
- Fast-fails for better UX
- Automatic recovery testing

**Cons:**
- Adds complexity
- Needs per-endpoint instances

**Effort:** 3 hours
**Risk:** Medium

## Acceptance Criteria

- [ ] Implement CircuitBreaker class with CLOSED/OPEN/HALF_OPEN states
- [ ] Integrate with fetchWithTimeout
- [ ] Test failure rate calculation (50% threshold)
- [ ] Test state transitions
- [ ] Test cooldown period (30s)
- [ ] Add metrics/logging for circuit breaker events

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Performance Analysis Agent)
- Identified lack of cascade failure protection
- Researched circuit breaker patterns (Netflix Hystrix, resilience4j)
- Designed 3-state circuit breaker

## Notes

- **Pattern:** Based on Netflix Hystrix and Martin Fowler's circuit breaker pattern
- **Monitoring:** Essential to track circuit breaker state changes
- **Future:** Consider using existing library (opossum)
