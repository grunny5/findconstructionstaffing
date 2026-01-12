---
status: pending
priority: p1
issue_id: "007"
tags: [data-integrity, idempotency, messaging]
dependencies: []
---

# Add idempotency keys to prevent duplicate conversation creation

Prevent duplicate conversations when conversation check times out by implementing idempotency keys.

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

### Option 1: Idempotency key in POST request (Recommended)

**Approach:** Generate unique key on button click, API deduplicates based on key.

**Client side:**
```typescript
// Option 1: Stable identity-based key (recommended)
const idempotencyKey = useMemo(
  () => `conversation:${agencyId}:${user.id}`,
  [agencyId, user.id]
);

// Option 2: Session storage (if retry persistence across remounts needed)
const [idempotencyKey] = useState(() => {
  const storageKey = `idempotency:${agencyId}:${user.id}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const newKey = `${agencyId}-${user.id}-${Date.now()}`;
  sessionStorage.setItem(storageKey, newKey);
  return newKey;
});

const handleSendMessage = async () => {
  const response = await fetch('/api/messages/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      context_type: 'agency_inquiry',
      context_id: agencyId,
      initial_message: content.trim(),
    }),
  });
};
```

**API side:**
```typescript
// POST /api/messages/conversations
const idempotencyKey = req.headers['idempotency-key'];

// FIRST: Check if conversation already exists (using existing maybeSingle)
const { data: existing } = await supabase
  .from('conversations')
  .select('*')
  .eq('context_type', 'agency_inquiry')
  .eq('context_id', agencyId)
  .eq('created_by', userId)
  .maybeSingle();

if (existing) {
  // Idempotent: Return existing conversation
  return res.status(200).json({ data: existing });
}

// SECOND: Try to create new conversation
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
    // Check for unique constraint violation (race condition)
    if (error.code === '23505') {
      // Another request created it - fetch and return
      const { data: raceConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('context_type', 'agency_inquiry')
        .eq('context_id', agencyId)
        .eq('created_by', userId)
        .single();

      return res.status(200).json({ data: raceConv });
    }
    throw error;
  }

  // Create initial message...
  return res.status(201).json({ data: conversation });

} catch (error) {
  return res.status(500).json({ error: 'Failed to create conversation' });
}
```

**Pros:**
- Standard HTTP pattern (Stripe, Twilio use this)
- Prevents duplicates even on retry
- No schema changes needed

**Cons:**
- Requires API changes
- Need to store/check idempotency keys (could use Redis)

**Effort:** 2 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Generate idempotency key on component mount
- [ ] Include key in POST request header
- [ ] API checks for existing conversation by context
- [ ] API returns existing conversation if found (200, not 409)
- [ ] Test timeout scenario creates single conversation
- [ ] Test double-click creates single conversation
- [ ] Test retry after error creates single conversation

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Data Integrity Review Agent)
- Identified duplicate creation risk
- Researched idempotency patterns (Stripe API)
- Designed idempotency key approach

## Notes

- **Pattern:** Stripe and Twilio APIs use this pattern
- **Alternative:** Use unique constraint on (context_type, context_id, created_by)
- **Future:** Apply to other POST endpoints (admin actions, etc.)
