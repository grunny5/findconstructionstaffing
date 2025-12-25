# Migration Test: Create Messaging Tables

**Migration:** `20251225_001_create_messaging_tables.sql`
**Feature:** Direct Messaging System (Feature #009)
**Task:** 1.1.1 - Create Database Migration for Messaging Tables

## Test Setup

```bash
# Start Supabase (if not running)
supabase start

# Apply migration
supabase db reset
```

## Verification Queries

### 1. Verify Tables Exist

```sql
-- Check conversations table
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Check conversation_participants table
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- Check messages table
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

### 2. Verify Check Constraints

```sql
-- Verify context_type check constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.conversations'::regclass
  AND conname LIKE '%check%';

-- Verify content length check constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.messages'::regclass
  AND conname LIKE '%check%';
```

### 3. Verify Foreign Keys

```sql
-- Check foreign keys on all tables
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('conversations', 'conversation_participants', 'messages');
```

### 4. Verify UNIQUE Constraint

```sql
-- Check unique constraint on conversation_participants
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.conversation_participants'::regclass
  AND contype = 'u';
```

### 5. Verify Indexes

```sql
-- List all indexes on messaging tables
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, indexname;
```

### 6. Verify Triggers

```sql
-- Check triggers on conversations table
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.conversations'::regclass;
```

## Expected Results

### Tables
- ✅ `conversations` table with 6 columns
- ✅ `conversation_participants` table with 5 columns
- ✅ `messages` table with 7 columns

### Constraints
- ✅ `conversations.context_type` CHECK constraint with values: 'agency_inquiry', 'general'
- ✅ `messages.content` CHECK constraint: length > 0 AND length <= 10000
- ✅ `conversation_participants` UNIQUE constraint on (conversation_id, user_id)

### Foreign Keys (with CASCADE)
- ✅ `conversations.context_id` → `agencies.id` (ON DELETE SET NULL)
- ✅ `conversation_participants.conversation_id` → `conversations.id` (ON DELETE CASCADE)
- ✅ `conversation_participants.user_id` → `profiles.id` (ON DELETE CASCADE)
- ✅ `messages.conversation_id` → `conversations.id` (ON DELETE CASCADE)
- ✅ `messages.sender_id` → `profiles.id` (ON DELETE CASCADE)

### Indexes (6 total)
- ✅ `idx_conversations_last_message_at` on `conversations(last_message_at DESC)`
- ✅ `idx_messages_conversation_created` on `messages(conversation_id, created_at DESC)`
- ✅ `idx_participants_user_id` on `conversation_participants(user_id)`
- ✅ `idx_participants_conversation_id` on `conversation_participants(conversation_id)`
- ✅ `idx_participants_last_read_at` on `conversation_participants(last_read_at)`
- ✅ `idx_messages_deleted_at` on `messages(deleted_at)` WHERE deleted_at IS NULL

### Triggers
- ✅ `update_conversations_updated_at` trigger using `update_updated_at_column()` function

## Functional Tests

### Test 1: Create Conversation

```sql
-- Insert test conversation
INSERT INTO public.conversations (context_type, context_id)
VALUES ('general', NULL)
RETURNING *;

-- Verify default values
-- Expected: id generated, context_type='general', timestamps set
```

### Test 2: Add Participants

```sql
-- Add participants (requires test user IDs)
-- First, create test profile if not exists
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test1@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, 'Test User 1'
FROM auth.users WHERE email = 'test1@example.com'
ON CONFLICT DO NOTHING;

-- Add participant to conversation
INSERT INTO public.conversation_participants (conversation_id, user_id)
SELECT
  (SELECT id FROM public.conversations LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'test1@example.com');

-- Expected: participant added with joined_at timestamp
```

### Test 3: Send Message

```sql
-- Insert test message
INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT
  (SELECT id FROM public.conversations LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'test1@example.com'),
  'This is a test message.';

-- Expected: message created with created_at timestamp
```

### Test 4: Verify Check Constraints

```sql
-- Test invalid context_type (should FAIL)
INSERT INTO public.conversations (context_type)
VALUES ('invalid_type');
-- Expected: ERROR: new row violates check constraint

-- Test content too long (should FAIL)
INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT
  (SELECT id FROM public.conversations LIMIT 1),
  (SELECT id FROM public.profiles LIMIT 1),
  REPEAT('a', 10001);
-- Expected: ERROR: new row violates check constraint

-- Test empty content (should FAIL)
INSERT INTO public.messages (conversation_id, sender_id, content)
SELECT
  (SELECT id FROM public.conversations LIMIT 1),
  (SELECT id FROM public.profiles LIMIT 1),
  '';
-- Expected: ERROR: new row violates check constraint
```

### Test 5: Verify UNIQUE Constraint

```sql
-- Try to add same participant twice (should FAIL)
INSERT INTO public.conversation_participants (conversation_id, user_id)
SELECT
  (SELECT id FROM public.conversations LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'test1@example.com');
-- Expected: ERROR: duplicate key value violates unique constraint
```

### Test 6: Verify CASCADE Deletes

```sql
-- Delete conversation and verify messages/participants deleted
DELETE FROM public.conversations WHERE id IN (
  SELECT id FROM public.conversations LIMIT 1
);

-- Verify orphaned messages deleted
SELECT COUNT(*) FROM public.messages;
-- Expected: 0 (or fewer than before delete)

-- Verify orphaned participants deleted
SELECT COUNT(*) FROM public.conversation_participants;
-- Expected: 0 (or fewer than before delete)
```

## Cleanup

```sql
-- Clean up test data
DELETE FROM public.messages WHERE sender_id IN (
  SELECT id FROM public.profiles WHERE email LIKE 'test%@example.com'
);
DELETE FROM public.conversation_participants WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE 'test%@example.com'
);
DELETE FROM public.conversations WHERE context_type = 'general' AND context_id IS NULL;
DELETE FROM public.profiles WHERE email LIKE 'test%@example.com';
```

## Status

- [x] Migration file created
- [x] SQL syntax validated
- [ ] Migration applied to local database (requires Docker/Supabase running)
- [ ] All verification queries run successfully
- [ ] All functional tests pass
- [ ] Rollback script tested

## Notes

- Migration follows Supabase conventions from Feature #008
- All tables use UUID primary keys with `gen_random_uuid()`
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- Foreign keys use appropriate CASCADE rules
- Indexes optimize for common query patterns (inbox sorting, message history)
- Trigger auto-updates `updated_at` on conversations
