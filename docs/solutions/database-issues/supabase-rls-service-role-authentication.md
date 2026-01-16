---
title: "Supabase RLS Policy Violations with Anonymous API Routes"
date: 2026-01-16
category: database-issues
severity: high
status: solved
components:
  - Supabase
  - Row-Level Security (RLS)
  - Next.js API Routes
  - Service Role Authentication
related_prs:
  - "#680"
  - "#681"
tags:
  - supabase
  - rls
  - authentication
  - api-routes
  - service-role
  - postgresql
errors:
  - "42501: new row violates row-level security policy"
  - "PGRST202: Could not find the function"
files_modified:
  - lib/supabase.ts
  - app/api/labor-requests/route.ts
  - app/request-labor/page.tsx
  - scripts/apply-rls-policies.sql
  - supabase/MANUAL_MIGRATIONS.md
---

# Supabase RLS Policy Violations with Anonymous API Routes

## Problem Summary

When implementing a public labor request submission API endpoint, anonymous inserts into `labor_requests` table failed with RLS policy violation error (42501), despite correct RLS policies existing in migration files. Additionally, the matching function had an outdated signature causing PGRST202 errors.

## Symptoms

### 1. RLS Policy Violation (42501)
```text
POST http://localhost:3000/api/labor-requests 500 (Internal Server Error)

Error creating labor request: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "labor_requests"'
}
```

**Observable Behavior:**
- Form submission returns 500 error
- Console shows RLS policy violation
- Migration file contains correct policy: `CREATE POLICY "Anyone can submit labor requests" ON labor_requests FOR INSERT TO anon WITH CHECK (true);`
- Policy exists in database but still blocks anonymous inserts

### 2. Function Signature Mismatch (PGRST202)
```text
Error matching agencies for craft: {
  code: 'PGRST202',
  details: 'Searched for the function public.match_agencies_to_craft with parameters p_region_id, p_trade_id...',
  hint: 'Perhaps you meant to call the function public.match_agencies_to_craft(p_region_id, p_trade_id, p_worker_count)',
  message: 'Could not find the function public.match_agencies_to_craft(p_region_id, p_trade_id) in the schema cache'
}
```

**Observable Behavior:**
- Labor request created successfully (201 status)
- `totalMatches: 0` returned
- Agency matching silently fails
- Database has old 3-parameter function, code calls 2-parameter version

### 3. Silent Failures
- Match failures only logged to console, not surfaced to clients
- Notification insert errors not included in API response
- UI shows optimistic "They will be notified" message even when notifications fail

### 4. Migration Tracking Issues
- Migration files exist locally but weren't applied to production database
- No system to track which migrations were manually applied
- Confusion about database state vs. migration file state

## Investigation Steps

### Step 1: Verify RLS Policies Exist
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('labor_requests', 'labor_request_crafts', 'labor_request_notifications');

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('labor_requests', 'labor_request_crafts', 'labor_request_notifications')
ORDER BY tablename, policyname;
```

**Result:** Policies exist in database, so the issue wasn't missing policies.

### Step 2: Understand Supabase Client Types
- **Anon Client** (`supabase`): Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, subject to RLS
- **Service Role Client** (`supabaseAdmin`): Uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS entirely

**Key Insight:** Even with correct RLS policies, using anon client in server-side API routes can be problematic. The service role client is designed for server-side operations.

### Step 3: Check Function Signature
```sql
-- List all versions of the function
SELECT
  proname,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'match_agencies_to_craft';
```

**Result:** Database had old 3-parameter version from earlier commit, migration file had updated 2-parameter version.

## Root Cause

### RLS Policy Violation
The `labor_request_notifications` table RLS policy required authenticated admin role for inserts:
```sql
CREATE POLICY "System can insert notifications"
ON labor_request_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'role' = 'admin');
```

When API route used anon client, it couldn't insert notifications. Even though `labor_requests` and `labor_request_crafts` had permissive policies, the notification inserts failed.

**Broader Issue:** In Next.js API routes (server-side), using anon client is unnecessary. Service role client is the appropriate choice for:
- Server-side operations
- API routes (not exposed to client)
- Operations requiring full database access
- Bypassing RLS when you have input validation

### Function Signature Mismatch
Migration file updated function to 2 parameters (removed `p_worker_count`), but:
1. Migration wasn't applied to production database
2. Database retained old 3-parameter version
3. API code called new 2-parameter version
4. PostgREST couldn't find matching function signature

## Working Solution

### 1. Create Service Role Client

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular anon client (for client-side operations)
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-anon-key'
);

// Service role client (for server-side operations)
// This client bypasses RLS and should only be used in API routes
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseServiceKey || 'dummy-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**Environment Variable:**
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Find in: Supabase Dashboard → Settings → API → service_role (secret)

### 2. Use Service Role Client in API Route

**File:** `app/api/labor-requests/route.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // ... validation ...

    // Use supabaseAdmin for all database operations
    const { data: laborRequest, error: requestError } = await supabaseAdmin
      .from('labor_requests')
      .insert({ /* ... */ })
      .select()
      .single();

    // Use supabaseAdmin for craft inserts
    const { data: crafts, error: craftsError } = await supabaseAdmin
      .from('labor_request_crafts')
      .insert(craftInserts)
      .select();

    // Use supabaseAdmin for RPC calls
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      'match_agencies_to_craft',
      { p_trade_id, p_region_id }
    );

    // Use supabaseAdmin for notification inserts
    const { error: notificationError } = await supabaseAdmin
      .from('labor_request_notifications')
      .insert(notifications);

    return NextResponse.json({ success: true, /* ... */ }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Why This Works:**
- Service role client bypasses all RLS policies
- Safe in API routes because they're server-side only
- Input validation (Zod schemas) ensures data integrity
- No client-side exposure of service role key

### 3. Update Matching Function

**Apply via Supabase SQL Editor:**

```sql
-- Drop old version with 3 parameters
DROP FUNCTION IF EXISTS match_agencies_to_craft(UUID, UUID, INTEGER);

-- Create new version with 2 parameters
CREATE OR REPLACE FUNCTION match_agencies_to_craft(
  p_trade_id UUID,
  p_region_id UUID
) RETURNS TABLE(
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    100::INTEGER AS match_score
  FROM agencies a
  WHERE
    a.is_active = TRUE
    AND a.verified = TRUE
    AND EXISTS (
      SELECT 1 FROM agency_trades at
      WHERE at.agency_id = a.id AND at.trade_id = p_trade_id
    )
    AND EXISTS (
      SELECT 1 FROM agency_regions ar
      WHERE ar.agency_id = a.id AND ar.region_id = p_region_id
    )
  ORDER BY a.name ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

### 4. Track Match and Notification Failures

**File:** `app/api/labor-requests/route.ts`

```typescript
// Track failures
const matchFailures: Array<{ craftId: string; error: string }> = [];
const notificationFailures: Array<{ craftId: string; error: string }> = [];

for (const craft of crafts) {
  const { data: matches, error: matchError } = await supabaseAdmin.rpc(
    'match_agencies_to_craft',
    { p_trade_id: craft.trade_id, p_region_id: craft.region_id }
  );

  if (matchError) {
    console.error('Error matching agencies for craft:', matchError);
    matchFailures.push({
      craftId: craft.id,
      error: matchError.message || 'Failed to match agencies',
    });
    continue;
  }

  // Create notifications...
  const { error: notificationError } = await supabaseAdmin
    .from('labor_request_notifications')
    .insert(notifications);

  if (notificationError) {
    console.error('Error creating notifications:', notificationError);
    notificationFailures.push({
      craftId: craft.id,
      error: notificationError.message || 'Unknown error',
    });
  }
}

// Include failures in response
const response: any = {
  success: true,
  requestId: laborRequest.id,
  confirmationToken,
  totalMatches,
  matchesByCraft,
  message: /* ... */,
};

if (matchFailures.length > 0) {
  response.matchWarning = 'Some craft requirements could not be matched. Please contact support.';
  response.matchErrors = matchFailures;
}

if (notificationFailures.length > 0) {
  response.notificationWarning = 'Some agencies could not be notified. Please contact support.';
  response.notificationErrors = notificationFailures;
}

return NextResponse.json(response, { status: 201 });
```

### 5. Display Warnings in UI

**File:** `app/request-labor/page.tsx`

```typescript
const onSubmit = async (data: LaborRequestFormData) => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/labor-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit request');
    }

    setIsSubmitted(true);

    // Build success message based on warnings
    const hasWarnings = result.matchWarning || result.notificationWarning;

    let matchMessage;
    if (result.totalMatches > 0) {
      if (hasWarnings) {
        matchMessage = `Successfully matched with ${result.totalMatches} agencies, but some issues occurred. Please check your email for details.`;
      } else {
        matchMessage = `Successfully matched with ${result.totalMatches} agencies! They will be notified within 24 hours.`;
      }
    } else {
      matchMessage = 'Request submitted successfully. We\'ll notify you when agencies are matched.';
    }

    toast.success(matchMessage);

    // Show specific warnings
    if (result.matchWarning) {
      toast.error(result.matchWarning);
    }
    if (result.notificationWarning) {
      toast.error(result.notificationWarning);
    }
  } catch (error) {
    console.error('Submission error:', error);
    toast.error(
      error instanceof Error
        ? error.message
        : 'Failed to submit request. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

### 6. Document Manual Migrations

**File:** `supabase/MANUAL_MIGRATIONS.md`

```markdown
# Manual Migration Tracking

## Manually Applied Migrations

### 2026-01-14: Update match_agencies_to_craft Function Signature
**File:** `supabase/migrations/20260114225504_create_matching_function.sql`
**Applied:** 2026-01-14
**Reason:** Function signature changed (removed `p_worker_count` parameter) but database had old version.

**SQL Applied:**
[See full SQL above]

**Status:** ✅ Applied successfully (tested with `totalMatches: 1`)

**Error Before Fix:**
```text
PGRST202: Could not find the function public.match_agencies_to_craft(p_region_id, p_trade_id) in the schema cache
```
```

## Testing & Verification

### Verify Service Role Setup

1. **Check environment variable:**
```bash
# .env.local should contain:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

2. **Test API endpoint:**
```bash
curl -X POST http://localhost:3000/api/labor-requests \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "companyName": "Test Company",
    "contactEmail": "test@example.com",
    "contactPhone": "555-0100",
    "crafts": [
      {
        "tradeId": "uuid",
        "regionId": "uuid",
        "experienceLevel": "Journeyman",
        "workerCount": 5,
        "startDate": "2026-02-01",
        "durationDays": 30,
        "hoursPerWeek": 40
      }
    ]
  }'
```

3. **Verify in database:**
```sql
-- Check labor request was created
SELECT * FROM labor_requests ORDER BY created_at DESC LIMIT 1;

-- Check crafts were created
SELECT * FROM labor_request_crafts
WHERE labor_request_id = 'YOUR_REQUEST_ID';

-- Check notifications were created
SELECT * FROM labor_request_notifications
WHERE labor_request_id = 'YOUR_REQUEST_ID';
```

### Expected Response

**Success (no failures):**
```json
{
  "success": true,
  "requestId": "c0b15e3b-7734-430d-931a-f3a4fe7aa743",
  "confirmationToken": "359a3bc984143dc12db30723cf97cd2ee5a3fe384d578c2ccfa59dc2090bea91",
  "totalMatches": 1,
  "matchesByCraft": [
    {"craftId": "uuid", "matches": 1}
  ],
  "message": "Successfully matched 1 agencies across 1 craft requirements"
}
```

**Success (with warnings):**
```json
{
  "success": true,
  "requestId": "uuid",
  "confirmationToken": "hex",
  "totalMatches": 1,
  "matchesByCraft": [{"craftId": "uuid", "matches": 1}],
  "message": "Successfully matched 1 agencies... However, 1 issue(s) occurred.",
  "notificationWarning": "Some agencies could not be notified. Please contact support.",
  "notificationErrors": [
    {"craftId": "uuid", "error": "Insert failed"}
  ]
}
```

## Prevention Strategies

### 1. Always Use Service Role for API Routes

**Rule:** In Next.js API routes, always use `supabaseAdmin` (service role client) instead of `supabase` (anon client).

**Why:**
- API routes are server-side only
- Service role bypasses RLS (appropriate with validation)
- Prevents RLS policy conflicts
- Simpler architecture

**When to use anon client:**
- Client-side operations (browser JavaScript)
- Server components that need RLS enforcement
- Operations that should respect user permissions

### 2. Implement Manual Migration Tracking

Create `supabase/MANUAL_MIGRATIONS.md` to track:
- Which migrations were manually applied
- Why they were manual (vs. automated)
- Date applied
- Verification method
- SQL content or reference to migration file

### 3. Add Index for RLS Policy Performance

When RLS policies use `EXISTS` subqueries, ensure indexed columns:

```sql
-- Add index for notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_craft
ON labor_request_notifications(labor_request_craft_id);
```

### 4. Track Partial Failures

Always track and surface failures in batch operations:

```typescript
// Track failures
const failures: Array<{ id: string; error: string }> = [];

for (const item of items) {
  const { error } = await operation(item);
  if (error) {
    console.error('Operation failed:', error);
    failures.push({ id: item.id, error: error.message });
    continue; // Process other items
  }
}

// Include in response
if (failures.length > 0) {
  response.warning = 'Some operations failed';
  response.failures = failures;
}
```

### 5. Security Best Practices

**Never log sensitive data:**
```typescript
// ❌ BAD: Exposes confirmation token
console.log('Labor request submitted:', result);

// ✅ GOOD: Remove sensitive logging
// Users get feedback via toast messages
```

**Use secure logging utility:**
```typescript
import { secureLog } from '@/lib/utils/secure-logging';

// Automatically masks UUIDs, tokens, emails
secureLog.info('Request submitted', { requestId, totalMatches });
```

### 6. JSON Parsing Error Handling

Wrap `request.json()` to return 400 instead of 500 for malformed JSON:

```typescript
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Continue with validation...
  } catch (error) {
    // Unexpected errors return 500
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Related Documentation

- [Supabase Service Role Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- `supabase/MANUAL_MIGRATIONS.md` - Internal migration tracking

## Related Issues

- PR #680: Multi-craft labor request form UI and database schema
- PR #681: API endpoint implementation and RLS fixes

## Summary

When implementing public API endpoints with Supabase:

1. **Use service role client** in API routes (server-side)
2. **Track manual migrations** in documentation
3. **Surface partial failures** to clients
4. **Add indexes** for RLS policy performance
5. **Never log sensitive data** (tokens, emails, etc.)
6. **Handle JSON parsing errors** separately from validation errors

The service role client is the correct choice for Next.js API routes because they're server-side only with input validation. This bypasses RLS cleanly and prevents authentication issues.
