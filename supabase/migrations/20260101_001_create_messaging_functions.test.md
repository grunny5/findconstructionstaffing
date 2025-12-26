# Migration Test: Create Messaging Functions and Triggers

**Migration:** `20260101_001_create_messaging_functions.sql`
**Feature:** Direct Messaging System (Feature #009)
**Task:** 1.1.3 - Create Database Functions and Triggers

## Test Setup

```bash
# Ensure migration is applied
supabase db push
```

## Verification Queries

### 1. Verify Functions Exist

```sql
-- Check create_conversation_with_participants function
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_conversation_with_participants';

-- Expected:
-- function_name: create_conversation_with_participants
-- arguments: p_context_type text, p_context_id uuid DEFAULT NULL::uuid, p_participant_ids uuid[] DEFAULT ARRAY[]::uuid[]
-- return_type: uuid
-- is_security_definer: true

-- Check trigger_update_conversation_last_message function
SELECT
  p.proname AS function_name,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_update_conversation_last_message';

-- Expected:
-- function_name: trigger_update_conversation_last_message
-- return_type: trigger
```

### 2. Verify Trigger Exists

```sql
-- Check trigger on messages table
SELECT
  tgname AS trigger_name,
  tgtype,
  tgenabled,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.messages'::regclass
  AND tgname = 'update_conversation_last_message_trigger';

-- Expected:
-- trigger_name: update_conversation_last_message_trigger
-- tgenabled: O (enabled)
-- function_name: trigger_update_conversation_last_message
```

## Functional Tests

### Test 1: Create Conversation with Valid Participants (SUCCESS)

```sql
-- Setup: Create test users (if not exists)
-- User 1: alice@example.com
-- User 2: bob@example.com

-- Assume alice_id and bob_id exist in profiles table

-- Test: Alice creates conversation with Bob
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', 'bob_id']::UUID[]
) AS conversation_id;

-- Expected: Returns UUID of new conversation

-- Verify conversation created
SELECT id, context_type, context_id, created_at
FROM public.conversations
WHERE id = '<returned_conversation_id>';

-- Expected: 1 row returned with context_type = 'general'

-- Verify participants added
SELECT conversation_id, user_id, joined_at
FROM public.conversation_participants
WHERE conversation_id = '<returned_conversation_id>'
ORDER BY user_id;

-- Expected: 2 rows (alice_id and bob_id)
```

### Test 2: Create Agency Inquiry Conversation (SUCCESS)

```sql
-- Test: Create conversation with agency context
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'agency_inquiry',
  '<valid_agency_id>',
  ARRAY['alice_id', 'bob_id']::UUID[]
) AS conversation_id;

-- Expected: Returns UUID of new conversation

-- Verify context
SELECT id, context_type, context_id
FROM public.conversations
WHERE id = '<returned_conversation_id>';

-- Expected: context_type = 'agency_inquiry', context_id = '<valid_agency_id>'
```

### Test 3: Caller Not Authenticated (FAIL)

```sql
-- Test: Unauthenticated user tries to create conversation
RESET role;

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', 'bob_id']::UUID[]
);

-- Expected: ERROR - Authentication required to create conversation
```

### Test 4: Less Than 2 Participants (FAIL)

```sql
-- Test: Create conversation with only 1 participant
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id']::UUID[]
);

-- Expected: ERROR - At least 2 participants required for conversation
```

### Test 5: Caller Not in Participant List (FAIL)

```sql
-- Test: Alice tries to create conversation without including herself
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['bob_id', 'carol_id']::UUID[]
);

-- Expected: ERROR - Caller must be included in participant list
```

### Test 6: Invalid Participant ID (FAIL)

```sql
-- Test: Create conversation with non-existent user ID
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', '00000000-0000-0000-0000-000000000000']::UUID[]
);

-- Expected: ERROR - One or more participant IDs do not exist in profiles table
```

### Test 7: Agency Inquiry Without context_id (FAIL)

```sql
-- Test: Create agency_inquiry conversation without context_id
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'agency_inquiry',
  NULL,
  ARRAY['alice_id', 'bob_id']::UUID[]
);

-- Expected: ERROR - context_id required when context_type is agency_inquiry
```

### Test 8: Invalid Agency ID (FAIL)

```sql
-- Test: Create conversation with non-existent agency ID
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'agency_inquiry',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['alice_id', 'bob_id']::UUID[]
);

-- Expected: ERROR - Agency with id 00000000-0000-0000-0000-000000000000 does not exist
```

## Trigger Tests

### Test 9: Trigger Updates last_message_at on INSERT (SUCCESS)

```sql
-- Setup: Create conversation using function
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', 'bob_id']::UUID[]
) AS conversation_id;

-- Check initial last_message_at (should be NOW())
SELECT id, last_message_at, updated_at
FROM public.conversations
WHERE id = '<returned_conversation_id>';

-- Note initial timestamps

-- Insert a message
INSERT INTO public.messages (conversation_id, sender_id, content)
VALUES ('<returned_conversation_id>', 'alice_id', 'Hello Bob!');

-- Check updated last_message_at
SELECT id, last_message_at, updated_at
FROM public.conversations
WHERE id = '<returned_conversation_id>';

-- Expected: last_message_at = message created_at, updated_at = NOW() (updated)
```

### Test 10: Trigger Fires for Each Message (SUCCESS)

```sql
-- Test: Insert multiple messages and verify timestamp updates
-- (Assumes conversation from Test 9 exists)

-- Wait 1 second
SELECT pg_sleep(1);

-- Insert second message
INSERT INTO public.messages (conversation_id, sender_id, content)
VALUES ('<returned_conversation_id>', 'bob_id', 'Hi Alice!');

-- Check last_message_at again
SELECT id, last_message_at, updated_at
FROM public.conversations
WHERE id = '<returned_conversation_id>';

-- Expected: last_message_at = second message created_at (newer timestamp)
```

## Edge Case Tests

### Test 11: Create Conversation with Many Participants (SUCCESS)

```sql
-- Test: Create conversation with 5 participants
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', 'bob_id', 'carol_id', 'dave_id', 'eve_id']::UUID[]
) AS conversation_id;

-- Expected: SUCCESS (no max participant limit)

-- Verify all 5 participants added
SELECT COUNT(*) AS participant_count
FROM public.conversation_participants
WHERE conversation_id = '<returned_conversation_id>';

-- Expected: participant_count = 5
```

### Test 12: Duplicate Participant IDs (SUCCESS with UNIQUE constraint)

```sql
-- Test: Pass duplicate participant IDs
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "alice_id"}';

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', 'bob_id', 'alice_id']::UUID[]
);

-- Expected: ERROR - duplicate key value violates unique constraint
-- (UNIQUE constraint on conversation_id, user_id prevents duplicates)
```

## Performance Tests

### Test 13: Function Performance with Large Participant List

```sql
-- Test: Create conversation with 50 participants
-- Measure execution time with EXPLAIN ANALYZE

EXPLAIN ANALYZE
SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY[/* 50 valid user IDs */]::UUID[]
);

-- Expected: Execution time < 100ms for 50 participants
```

## Atomicity Tests

### Test 14: Verify Transaction Rollback on Error

```sql
-- Test: Start transaction with invalid participant to test rollback
BEGIN;

SELECT create_conversation_with_participants(
  'general',
  NULL,
  ARRAY['alice_id', '00000000-0000-0000-0000-000000000000']::UUID[]
);

-- Expected: ERROR (function raises exception)

ROLLBACK;

-- Verify no orphaned conversation created
SELECT COUNT(*) FROM public.conversations
WHERE created_at > NOW() - INTERVAL '1 minute';

-- Expected: 0 (function is atomic, rollback prevented partial state)
```

## Cleanup

```sql
-- Clean up test data
DELETE FROM public.messages WHERE conversation_id IN (
  SELECT id FROM public.conversations WHERE created_at > NOW() - INTERVAL '1 hour'
);

DELETE FROM public.conversation_participants WHERE conversation_id IN (
  SELECT id FROM public.conversations WHERE created_at > NOW() - INTERVAL '1 hour'
);

DELETE FROM public.conversations WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Status

- [x] Migration file created
- [x] Migration applied to remote database
- [ ] All verification queries run successfully (requires Supabase local instance or test users)
- [ ] All functional tests pass
- [ ] All edge case tests pass
- [ ] Trigger tests verified
- [ ] Atomicity tests verified

## Notes

- Function uses `SECURITY DEFINER` to allow participant insertion (RLS enforced)
- Function is atomic - either all operations succeed or all fail (no partial state)
- Trigger fires AFTER INSERT to ensure message is committed before updating conversation
- Comprehensive validation prevents invalid conversation states
- All error messages are descriptive for debugging
- Function follows PostgreSQL best practices from Feature #008 patterns
