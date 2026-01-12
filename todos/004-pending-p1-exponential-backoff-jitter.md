---
status: pending
priority: p1
issue_id: "004"
tags: [performance, database, retry-logic]
dependencies: []
---

# Add jitter to exponential backoff in dbQueryWithTimeout

Prevent thundering herd problem when multiple requests fail simultaneously by adding randomization to retry delays.

## Problem Statement

`dbQueryWithTimeout()` uses exponential backoff without jitter. When multiple requests fail at the same time (e.g., database hiccup), all retry at synchronized intervals causing a "thundering herd" that amplifies load spikes.

**Performance Impact:** CRITICAL
- Synchronized retries create 3x load spikes
- Can overwhelm recovering database
- Extends outage duration
- Affects high-traffic endpoints (agency list, detail pages)

## Findings

**File:** `lib/fetch/timeout.ts:90-120`

**Current implementation:**
```typescript
const delay = options.retryDelay * Math.pow(2, attempt - 1);
await new Promise(resolve => setTimeout(resolve, delay));
```

**Problem:** All requests use same delay calculation:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms

**Thundering herd scenario:**
1. Database slow → 100 requests timeout simultaneously
2. All retry at t+1s (100 × 3 retries = 300 req at t+1s)
3. All retry at t+2s (300 req at t+2s)
4. All retry at t+4s (300 req at t+4s)
5. Database never recovers from load spikes

## Proposed Solutions

### Option 1: Add ±25% jitter to retry delays (Recommended)

```typescript
const baseDelay = options.retryDelay * Math.pow(2, attempt - 1);
const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1); // ±25%
const delay = Math.max(100, baseDelay + jitter);
await new Promise(resolve => setTimeout(resolve, delay));
```

**Pros:**
- Spreads retries over time window
- Simple implementation
- Industry standard (AWS, Google use this)

**Cons:**
- Adds randomness (harder to predict exact timing)

**Effort:** 20 minutes
**Risk:** Low

## Acceptance Criteria

- [ ] Add jitter calculation to retry delay
- [ ] Test concurrent failures spread retries
- [ ] Verify jitter stays within ±25% bounds
- [ ] All existing tests pass

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Performance Analysis Agent)
- Identified synchronized retry pattern
- Researched jitter best practices (AWS, Google)
- Calculated thundering herd impact

## Notes

- **Pattern:** AWS uses "decorrelated jitter" for even better distribution
- **Testing:** Simulate 100 concurrent timeouts to verify spread
