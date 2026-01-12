---
status: pending
priority: p1
issue_id: "008"
tags: [data-integrity, transactions, database]
dependencies: []
---

# Add transaction boundaries to conversation creation

Wrap conversation + message creation in database transaction to prevent orphaned conversations.

## Problem Statement

POST /api/messages/conversations creates conversation first, then creates initial message. If message insert fails, orphaned conversation exists with no messages.

**Data Integrity Impact:** HIGH
- Orphaned conversations clutter database
- Broken user experience (empty thread)
- No atomicity guarantee

## Findings

**File:** `app/api/messages/conversations/route.ts`

**Current problematic flow:**
```typescript
// Step 1: Create conversation
const { data: conversation, error } = await supabase
  .from('conversations')
  .insert({ context_type, context_id, created_by })
  .select()
  .single();

if (error) throw error;

// Step 2: Create initial message (might fail!)
const { error: messageError } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversation.id,
    content: initial_message,
    sender_id: userId,
  });

// ← If messageError occurs, conversation is orphaned!
```

**Failure scenario:**
1. Conversation insert succeeds
2. Message insert fails (timeout, constraint violation, etc.)
3. Conversation exists but has no messages
4. User navigates to /messages/conversations/{id} → empty thread

## Proposed Solutions

### Option 1: Supabase RPC with transaction (Recommended)

**Approach:** Create database function that wraps both operations in transaction.

**Database function:**
```sql
CREATE OR REPLACE FUNCTION create_conversation_with_message(
  p_context_type TEXT,
  p_context_id UUID,
  p_created_by UUID,
  p_initial_message TEXT
) RETURNS JSONB AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  -- Insert conversation
  INSERT INTO conversations (context_type, context_id, created_by)
  VALUES (p_context_type, p_context_id, p_created_by)
  RETURNING id INTO v_conversation_id;

  -- Insert message
  INSERT INTO messages (conversation_id, content, sender_id)
  VALUES (v_conversation_id, p_initial_message, p_created_by)
  RETURNING id INTO v_message_id;

  -- Return conversation with message ID
  RETURN jsonb_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id
  );
END;
$$ LANGUAGE plpgsql;
```

**API usage:**
```typescript
const { data, error } = await supabase.rpc('create_conversation_with_message', {
  p_context_type: 'agency_inquiry',
  p_context_id: agencyId,
  p_created_by: userId,
  p_initial_message: initial_message,
});
```

**Pros:**
- Atomic operation (both succeed or both fail)
- Single database round trip
- Standard PostgreSQL transaction handling

**Cons:**
- Requires database migration
- More complex than app-level logic

**Effort:** 2 hours
**Risk:** Low

## Acceptance Criteria

- [ ] Create database function with transaction
- [ ] Update API to use RPC instead of sequential inserts
- [ ] Test message insert failure → no orphaned conversation
- [ ] Test timeout scenario → rollback both operations
- [ ] Verify all existing conversation creation flows work
- [ ] Add migration for database function

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Data Integrity Review Agent)
- Identified non-atomic conversation creation
- Researched Supabase transaction patterns (RPC)
- Designed database function approach

## Notes

- **PostgreSQL:** Functions provide ACID guarantees by default
- **Alternative:** Use Supabase transactions API (if available)
- **Future:** Apply to other multi-step operations (admin actions, etc.)
