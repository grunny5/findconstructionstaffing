---
status: pending
priority: p1
issue_id: "007"
tags: [data-integrity, database-constraints, messaging]
dependencies: []
---

# Implement database-level deduplication for conversation creation

Prevent duplicate conversations when conversation check times out by implementing database unique constraints and proper race condition handling.

## Problem Statement

When user clicks "Send Message", the app checks for existing conversation. If check times out, modal shows anyway and user can create conversation. But conversation might already exist, creating duplicate.

**Data Integrity Impact:** HIGH
- Duplicate conversations for same agency-user pair
- Confusing UX (multiple threads for same inquiry)
- Database clutter

## Findings

**File:** `components/messages/SendMessageButton.tsx:100-130`

**Problematic flow:**
```typescript
try {
  // Check for existing conversation (10s timeout)
  const response = await fetchWithTimeout('/api/messages/conversations', {
    timeout: TIMEOUT_CONFIG.CLIENT_ACTION,
  });

  if (response.ok) {
    const existing = data.data.find(conv => ...);
    if (existing) {
      router.push(`/messages/conversations/${existing.id}`);
      return;
    }
  }
} catch (error) {
  if (error instanceof TimeoutError) {
    // Graceful degradation: show modal anyway
    console.warn('Conversation check timed out, showing compose modal anyway');
  }
}

// Show modal → user creates conversation (might be duplicate!)
setIsOpen(true);
```

**Duplicate scenario:**
1. User clicks "Send Message"
2. Conversation check times out (conversation exists but check failed)
3. Modal shows, user writes message, clicks send
4. POST /api/messages/conversations creates duplicate

## Proposed Solutions

### Database-Level Deduplication (Recommended)

**Approach:** Use database unique constraints with check-then-create pattern and race condition handling. No client-side idempotency keys needed.

**Rationale:** Database constraints provide simpler, more reliable deduplication than application-level idempotency keys. The unique constraint on (context_type, context_id, created_by) ensures exactly one conversation per agency-user pair, with race conditions handled by catching PostgreSQL error code 23505.

**Required Database Constraint:**
```sql
-- Add unique constraint to prevent duplicates
ALTER TABLE conversations
ADD CONSTRAINT unique_agency_user_conversation
UNIQUE (context_type, context_id, created_by)
WHERE context_type = 'agency_inquiry';
```

**Client Implementation:**
```typescript
// No idempotency key needed - deduplication happens server-side
const handleSendMessage = async () => {
  const response = await fetch('/api/messages/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context_type: 'agency_inquiry',
      context_id: agencyId,
      initial_message: content.trim(),
    }),
  });

  // Server returns 200 with existing conversation if duplicate detected
  const result = await response.json();
  if (response.ok) {
    router.push(`/messages/conversations/${result.data.id}`);
  }
};
```

**API Implementation:**
```typescript
// POST /api/messages/conversations

// STEP 1: Check if conversation already exists
const { data: existing } = await supabase
  .from('conversations')
  .select('*')
  .eq('context_type', 'agency_inquiry')
  .eq('context_id', agencyId)
  .eq('created_by', userId)
  .maybeSingle();

if (existing) {
  // Return existing conversation (idempotent behavior)
  return res.status(200).json({ data: existing });
}

// STEP 2: Try to create new conversation
try {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      context_type: 'agency_inquiry',
      context_id: agencyId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    // STEP 3: Handle race condition (unique constraint violation)
    if (error.code === '23505') {
      // Another concurrent request created it - fetch and return
      const { data: raceConv, error: raceError } = await supabase
        .from('conversations')
        .select('*')
        .eq('context_type', 'agency_inquiry')
        .eq('context_id', agencyId)
        .eq('created_by', userId)
        .single();

      if (raceError || !raceConv) {
        console.error('Race condition recovery failed:', {
          agencyId,
          userId,
          error: raceError,
        });
        return res.status(500).json({
          error: 'Failed to retrieve conversation after concurrent creation'
        });
      }

      return res.status(200).json({ data: raceConv });
    }
    throw error;
  }

  // STEP 4: Create initial message...
  return res.status(201).json({ data: conversation });

} catch (error) {
  return res.status(500).json({ error: 'Failed to create conversation' });
}
```

**Pros:**
- Simpler implementation (no idempotency key storage or header handling)
- Database enforces constraint (can't be bypassed)
- Naturally handles race conditions
- Idempotent behavior without client coordination
- Safe to retry on any error

**Cons:**
- Requires schema migration for unique constraint
- Less flexible than header-based idempotency keys

**Effort:** 1.5 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Add unique constraint to conversations table (migration)
- [ ] Verify constraint exists with migration test
- [ ] API checks for existing conversation before insert (maybeSingle)
- [ ] API returns existing conversation if found (200 status)
- [ ] API handles race condition (error.code === '23505') by fetching created conversation
- [ ] Test timeout scenario creates single conversation
- [ ] Test double-click creates single conversation
- [ ] Test retry after error creates single conversation
- [ ] Test concurrent requests create single conversation

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Data Integrity Review Agent)
- Identified duplicate creation risk
- Researched idempotency patterns (Stripe API)
- Designed database-level deduplication approach

### 2026-01-12 - Documentation Fix
**By:** Claude Code
- Removed unused idempotency key from code examples
- Updated title and tags to reflect database-level deduplication
- Clarified check-then-create pattern with race condition handling
- Emphasized that no client-side idempotency keys are needed
- Aligned code examples with actual implementation strategy

## Notes

- **Pattern:** Database-level deduplication via unique constraints
- **Race Condition:** Handled by catching PostgreSQL error code 23505
- **Idempotency:** Achieved through check-then-create with constraint fallback
- **Alternative:** Could use HTTP Idempotency-Key header pattern (Stripe/Twilio style) but adds complexity without benefit for this use case
- **Future:** Apply pattern to other POST endpoints that need deduplication
