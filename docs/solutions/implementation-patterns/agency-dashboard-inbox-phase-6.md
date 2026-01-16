---
title: Agency Dashboard Inbox - Authentication, Authorization, and UI Patterns (Phase 6)
category: implementation-patterns
severity: high
component: api-routes, dashboard-pages, authentication
tags: [authentication, authorization, pii-masking, accessibility, react, nextjs, security]
related_prs: [684]
date: 2026-01-16
---

# Agency Dashboard Inbox - Authentication, Authorization, and UI Patterns (Phase 6)

## Problem Summary

Phase 6 implemented a complete agency dashboard inbox system for viewing and responding to labor request notifications. During implementation and code review, multiple critical patterns emerged around authentication, authorization, PII protection, accessibility, and React state management.

**Key Challenges Addressed**:
1. **Authentication Pattern**: Fail-closed mock auth for development without production security bypass
2. **Authorization Flow**: Proper slug-to-ID resolution before access control checks
3. **PII Masking**: Protecting contact information in API responses
4. **Route Naming**: Next.js dynamic route parameter consistency
5. **Status State Machine**: Preventing status regression in notification lifecycle
6. **React Race Conditions**: Sequencing async operations in useEffect
7. **Nullish Coalescing**: Handling zero values correctly in pay rate displays
8. **Keyboard Accessibility**: Making clickable cards keyboard-navigable
9. **Timezone-Safe Dates**: Parsing YYYY-MM-DD strings without timezone shifts
10. **Secure Logging**: Redacting sensitive data from logs

## Implementation Overview

**Files Created** (1,864 lines across 9 files):

### API Endpoints
- `app/api/agencies/[slug]/labor-requests/route.ts` (203 lines) - List notifications with filters
- `app/api/labor-requests/notifications/[notificationId]/view/route.ts` (103 lines) - Mark as viewed
- `app/api/labor-requests/notifications/[notificationId]/respond/route.ts` (139 lines) - Submit response

### Dashboard Pages
- `app/dashboard/labor-requests/page.tsx` (311 lines) - Inbox list view
- `app/dashboard/labor-requests/[requestId]/page.tsx` (445 lines) - Detail view with response form

### Utilities
- `lib/auth/session.ts` (69 lines) - Authentication & authorization
- `lib/utils/masking.ts` (39 lines) - PII masking functions

### Types
- `types/labor-request.ts` - Updated InboxNotification interface

## Symptoms and Issues Encountered

### 1. Authentication Bypass in Production

**Initial Implementation**:
```typescript
// BEFORE (INSECURE)
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // Always returns mock user in all environments
  const mockAgencyId = request.headers.get('x-mock-agency-id') || 'agency-1';
  return {
    id: 'user-1',
    agencyId: mockAgencyId,
    email: 'mock@agency.com',
  };
}
```

**Problem**: Bypasses authentication in production, allowing anyone to access any agency's data.

**Code Review Comment**: "Currently always returns a mock user...which bypasses auth; change it to fail closed"

### 2. PII Exposure in API Responses

**Initial Implementation**:
```typescript
// BEFORE (EXPOSES PII)
return NextResponse.json({
  notifications: data.map(n => ({
    labor_request: {
      contact_email: n.labor_request.contact_email,  // john@example.com
      contact_phone: n.labor_request.contact_phone,  // (555) 123-4567
    }
  }))
});
```

**Problem**: Full email and phone numbers exposed to client.

**Code Review Comment**: "The response is exposing PII by returning labor_request.contact_email and labor_request.contact_phone unmasked"

### 3. Route Parameter Naming Conflict

**Build Error**:
```
Error: You cannot use different slug names for the same dynamic path
('agencyId' !== 'slug').
```

**Initial Structure**:
```
app/api/agencies/
  [slug]/
    route.ts        ← Uses [slug]
  [agencyId]/       ← ERROR: Different parameter name
    labor-requests/
      route.ts
```

**Problem**: Next.js requires consistent parameter names across sibling dynamic routes.

### 4. Status Regression Bug

**Initial Implementation**:
```typescript
// BEFORE (CAUSES REGRESSION)
export async function POST(request: NextRequest, { params }) {
  await supabaseAdmin
    .from('labor_request_notifications')
    .update({ status: 'viewed', viewed_at: new Date().toISOString() })
    .eq('id', notificationId);
}
```

**Problem**: Notification with status 'responded' gets regressed to 'viewed' on subsequent views.

**Code Review Comment**: "Unconditionally updates labor_request_notifications to status 'viewed'...which can regress statuses like 'responded' or 'archived'"

### 5. Race Condition in useEffect

**Initial Implementation**:
```typescript
// BEFORE (RACE CONDITION)
useEffect(() => {
  if (!notificationId) return;

  markAsViewed();              // Starts marking as viewed
  fetchNotificationDetails();  // Immediately fetches (could get old status)
}, [notificationId]);
```

**Problem**: Fetch could complete before status update, showing stale 'new' status.

**Code Review Comment**: "fetchNotificationDetails and markAsViewed calls run concurrently...causing a race"

### 6. Truthy Checks Treating Zero as Falsy

**Initial Implementation**:
```typescript
// BEFORE (TREATS 0 AS MISSING)
const getPayRateDisplay = (notification: InboxNotification) => {
  const { pay_rate_min, pay_rate_max } = notification.craft;
  if (pay_rate_min && pay_rate_max) {
    return `$${pay_rate_min}-$${pay_rate_max}/hr`;
  }
  return 'Rate negotiable';
};
```

**Problem**: Pay rate of $0-$10/hr shows as "Rate negotiable" because `0` is falsy.

**Code Review Comment**: "Current truthy checks...treat 0 as missing"

### 7. Missing Keyboard Accessibility

**Initial Implementation**:
```typescript
// BEFORE (NOT KEYBOARD ACCESSIBLE)
<Card
  onClick={handleNavigate}
  className="cursor-pointer"
>
  {/* Card content */}
</Card>
```

**Problem**: Keyboard users can't navigate or activate cards (no tabIndex, no Enter/Space handlers).

**Code Review Comment**: "Card is clickable but not keyboard-accessible; add tabIndex, role, and onKeyDown"

### 8. Timezone Shifts in Date Parsing

**Initial Implementation**:
```typescript
// BEFORE (TIMEZONE ISSUES)
const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Input: "2026-03-15" (date-only string)
// Output: "March 14, 2026" (shifted by timezone)
```

**Problem**: Date-only strings get interpreted in local timezone, causing date shifts.

### 9. Authorization Using Slug Instead of ID

**Initial Approach**:
```typescript
// PROBLEMATIC (COMPARING SLUG TO ID)
const { slug } = params;

// Authorize
if (!verifyAgencyAccess(user, slug)) {  // ❌ slug is string, user.agencyId is UUID
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

**Problem**: Comparing slug string to agency UUID will always fail.

**Code Review Comment**: "The authorization currently compares user.agencyId to the URL slug; change the flow so you resolve the slug to the real agency ID before calling verifyAgencyAccess"

## Root Cause Analysis

### Authentication Bypass
- No environment check to limit mock auth to development
- No fail-closed behavior for production
- Missing `NODE_ENV` and feature flag checks

### PII Exposure
- Direct passthrough of database fields to API response
- No consideration of privacy requirements
- Missing masking utilities

### Route Naming Conflict
- Inconsistent naming conventions across routes
- Created `[agencyId]` when sibling routes use `[slug]`
- Next.js enforces consistency for a good reason (type safety, URL clarity)

### Status Regression
- Unconditional status update without checking current state
- No state machine logic to prevent backwards transitions
- Treating status as simple field instead of lifecycle state

### Race Condition
- Independent `useEffect` calls running concurrently
- No sequencing of dependent operations
- Assuming instant completion of async operations

### Truthy Checks on Numbers
- JavaScript's falsy values include `0`, `''`, `null`, `undefined`
- Truthy check `if (value)` treats `0` as missing
- Need explicit nullish checks: `value != null`

### Missing Accessibility
- Assuming mouse/touch is only input method
- No ARIA attributes or keyboard handlers
- Not following WCAG 2.1 guidelines for interactive elements

### Timezone Date Parsing
- `new Date("2026-03-15")` interprets as UTC midnight
- Converting to local time can shift to previous day
- Date-only strings need special handling

### Authorization Flow
- Skipped slug resolution step
- Attempted to compare incompatible types (string vs UUID)
- Missing database lookup to map slug to ID

## Solutions and Implementations

### 1. Fail-Closed Authentication Pattern

**File**: `lib/auth/session.ts`

```typescript
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // SECURITY: Fail closed - only allow mock auth in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowMockAuth = isDevelopment && process.env.ALLOW_MOCK_AUTH !== 'false';

  if (allowMockAuth) {
    // Mock implementation for development only
    const mockAgencyId = request.headers.get('x-mock-agency-id') || 'agency-1';

    return {
      id: 'user-1',
      agencyId: mockAgencyId,
      email: 'mock@agency.com',
    };
  }

  // In production or when mock auth is disabled, fail closed
  // Return null to require proper authentication
  return null;
}

export function verifyAgencyAccess(
  user: AuthenticatedUser,
  agencyId: string
): boolean {
  // TODO: Implement proper role-based access control
  // Check if user is member of agency, admin, etc.
  return user.agencyId === agencyId;
}
```

**Key Principles**:
- ✅ Fail closed by default (returns `null` in production)
- ✅ Requires explicit opt-in for mock auth (`NODE_ENV === 'development'`)
- ✅ Allows disabling mock auth even in dev (`ALLOW_MOCK_AUTH=false`)
- ✅ Clear TODO for production auth implementation
- ✅ Separate concerns: authentication vs authorization

### 2. PII Masking Utilities

**File**: `lib/utils/masking.ts`

```typescript
/**
 * Mask email address (show first character + domain)
 *
 * @example
 * maskEmail("john@example.com") // "j***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***@***.com';
  const [local, domain] = email.split('@');
  // Don't leak PII - return masked format even for invalid emails
  if (!local || !domain) {
    return `${local?.[0] ?? '*'}***@***`;
  }
  return `${local[0]}***@${domain}`;
}

/**
 * Mask phone number (show only last 4 digits)
 *
 * @example
 * maskPhone("(555) 123-4567") // "***-***-4567"
 * maskPhone("5551234567")     // "***-***-4567"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***-***-****';
  // Extract only digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  // Show last 4 digits only
  const lastFour = digits.slice(-4);
  return `***-***-${lastFour}`;
}
```

**Usage in API**:
```typescript
return NextResponse.json({
  notifications: data.map(n => ({
    labor_request: {
      contact_email: maskEmail(n.labor_request.contact_email),  // "j***@example.com"
      contact_phone: maskPhone(n.labor_request.contact_phone),  // "***-***-4567"
    }
  }))
});
```

**Key Principles**:
- ✅ Always mask, never expose
- ✅ Handle null/undefined gracefully
- ✅ Handle invalid formats without leaking data
- ✅ Consistent format for user experience

### 3. Route Parameter Consistency

**Fixed Structure**:
```
app/api/agencies/
  [slug]/
    route.ts              ← Uses [slug]
    labor-requests/
      route.ts            ← Also uses [slug] ✓
```

**Implementation**:
```typescript
// File: app/api/agencies/[slug]/labor-requests/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }  // ✓ Consistent with sibling routes
) {
  const { slug } = params;
  // ... use slug to look up agency
}
```

**Key Principles**:
- ✅ Consistent parameter names across sibling routes
- ✅ Clear semantic meaning (`slug` for URL-friendly strings)
- ✅ Type safety from Next.js route inference

### 4. Status State Machine

**File**: `app/api/labor-requests/notifications/[notificationId]/view/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  // Fetch notification to verify ownership and get current status
  const { data: notification, error: fetchError } = await supabaseAdmin
    .from('labor_request_notifications')
    .select('agency_id, status, viewed_at')
    .eq('id', notificationId)
    .single();

  if (fetchError || !notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  // Verify agency ownership
  if (notification.agency_id !== user.agencyId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Only update status to 'viewed' if currently 'new'
  // Don't regress status from 'responded' or 'archived' back to 'viewed'
  const updateData: { status?: string; viewed_at: string } = {
    viewed_at: new Date().toISOString(),
  };

  if (notification.status === 'new') {
    updateData.status = 'viewed';
  }

  // Update notification
  const { data: updatedNotification, error: updateError } = await supabaseAdmin
    .from('labor_request_notifications')
    .update(updateData)
    .eq('id', notificationId)
    .select()
    .single();

  return NextResponse.json({
    success: true,
    notification: {
      id: updatedNotification.id,
      status: updatedNotification.status,
      viewed_at: updatedNotification.viewed_at,
    },
  });
}
```

**State Transition Rules**:
```
new → viewed → responded → archived
  ↑      ↑         ↑          ↑
  |      |         |          |
  +------+---------+----------+
        (only forward transitions)
```

**Key Principles**:
- ✅ Fetch current status before update
- ✅ Conditional status update based on current state
- ✅ Always update timestamp (viewed_at) regardless of status
- ✅ Prevent backwards transitions
- ✅ Document state machine logic in comments

### 5. Sequenced Async Operations in useEffect

**File**: `app/dashboard/labor-requests/[requestId]/page.tsx`

```typescript
useEffect(() => {
  if (!notificationId) {
    setLoading(false);
    return;
  }

  // Sequence the calls to avoid race condition
  // markAsViewed first, then fetch to get updated status
  const loadData = async () => {
    setLoading(true);
    try {
      await markAsViewed();            // ✓ Wait for status update
      await fetchNotificationDetails(); // ✓ Then fetch with new status
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [notificationId]);

const markAsViewed = async () => {
  if (!notificationId) return;

  try {
    await fetch(
      `/api/labor-requests/notifications/${notificationId}/view`,
      { method: 'POST' }
    );
  } catch (error) {
    console.error('Error marking as viewed:', error);
  }
};

const fetchNotificationDetails = async () => {
  try {
    const response = await fetch(
      `/api/agencies/${agencySlug}/labor-requests`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch labor requests');
    }

    const data = await response.json();
    const foundNotification = data.notifications.find(
      (n: InboxNotification) => n.id === notificationId
    );

    if (foundNotification) {
      setNotification(foundNotification);
    }
  } catch (error) {
    console.error('Error fetching notification details:', error);
  }
};
```

**Key Principles**:
- ✅ Create wrapper async function inside useEffect
- ✅ Use `await` to sequence dependent operations
- ✅ Use try/finally to ensure loading state clears
- ✅ Handle errors independently for each operation
- ✅ Document the sequencing requirement in comments

### 6. Nullish Coalescing for Numbers

**File**: `app/dashboard/labor-requests/page.tsx`

```typescript
const getPayRateDisplay = (notification: InboxNotification) => {
  const { pay_rate_min, pay_rate_max } = notification.craft;

  // Use nullish checks to handle 0 values correctly
  if (pay_rate_min != null && pay_rate_max != null) {
    return `$${pay_rate_min}-$${pay_rate_max}/hr`;  // "$0-$10/hr" works
  }
  if (pay_rate_min != null) {
    return `$${pay_rate_min}+/hr`;  // "$0+/hr" works
  }
  return 'Rate negotiable';
};
```

**Comparison**:
```typescript
// Truthy check (WRONG for numbers)
if (pay_rate_min && pay_rate_max)
//   0 is falsy    0 is falsy
// Result: $0-$10/hr shows as "Rate negotiable" ❌

// Nullish check (CORRECT)
if (pay_rate_min != null && pay_rate_max != null)
//   0 is not null      0 is not null
// Result: $0-$10/hr displays correctly ✓
```

**Key Principles**:
- ✅ Use `!= null` instead of truthy checks for numbers
- ✅ `!= null` catches both `null` and `undefined`
- ✅ Allows legitimate `0` values to pass through
- ✅ More explicit about intent (checking existence, not truthiness)

### 7. Keyboard Accessibility

**File**: `app/dashboard/labor-requests/page.tsx`

```typescript
const handleNavigate = () => {
  router.push(`/dashboard/labor-requests/${notification.labor_request.id}?notificationId=${notification.id}`);
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();  // Prevent spacebar scrolling
    handleNavigate();
  }
};

return (
  <Card
    key={notification.id}
    className="hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    onClick={handleNavigate}
    onKeyDown={handleKeyDown}
    tabIndex={0}
    role="button"
    aria-label={`View labor request for ${notification.labor_request.project_name} from ${notification.labor_request.company_name}`}
  >
    {/* Card content */}
  </Card>
);
```

**Key Principles**:
- ✅ `tabIndex={0}` - Makes element keyboard focusable
- ✅ `role="button"` - Announces as interactive to screen readers
- ✅ `aria-label` - Descriptive label for screen reader users
- ✅ `onKeyDown` - Handles both Enter and Space keys
- ✅ `e.preventDefault()` - Prevents spacebar from scrolling page
- ✅ `focus:ring` - Visual focus indicator for keyboard users

**WCAG 2.1 Compliance**:
- ✅ 2.1.1 Keyboard (Level A) - All functionality via keyboard
- ✅ 2.4.7 Focus Visible (Level AA) - Clear focus indicator
- ✅ 4.1.2 Name, Role, Value (Level A) - Proper ARIA attributes

### 8. Timezone-Safe Date Parsing

**File**: `app/dashboard/labor-requests/page.tsx`

```typescript
const formatDate = (isoDate: string) => {
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);  // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Handle full ISO timestamps
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

**Why This Matters**:
```typescript
// Without special handling
new Date("2026-03-15")
// Browser interprets as: 2026-03-15T00:00:00.000Z (UTC midnight)
// In PST (UTC-8): March 14, 2026 at 4:00 PM
// toLocaleDateString() shows: "March 14, 2026" ❌ (off by one day)

// With special handling
const [year, month, day] = "2026-03-15".split('-').map(Number);
new Date(year, month - 1, day)
// Creates: 2026-03-15T00:00:00.000 (LOCAL midnight, no timezone)
// toLocaleDateString() shows: "March 15, 2026" ✓ (correct)
```

**Key Principles**:
- ✅ Detect date-only strings with regex
- ✅ Parse components and use `new Date(year, month, day)` constructor
- ✅ No timezone conversion for date-only values
- ✅ Still handle full ISO timestamps normally
- ✅ Consistent display format across date types

### 9. Proper Authorization Flow

**File**: `app/api/agencies/[slug]/labor-requests/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Step 1: Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Step 2: Resolve slug to agency ID
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Step 3: Authorize agency access using resolved ID
    if (!verifyAgencyAccess(user, agency.id)) {
      return NextResponse.json(
        { error: 'Access denied', details: 'You do not have permission to access this agency' },
        { status: 403 }
      );
    }

    // Step 4: Fetch notifications for authorized agency
    let query = supabaseAdmin
      .from('labor_request_notifications')
      .select(`
        id,
        status,
        created_at,
        viewed_at,
        responded_at,
        craft:labor_request_crafts (
          worker_count,
          experience_level,
          start_date,
          duration_days,
          hours_per_week,
          pay_rate_min,
          pay_rate_max,
          per_diem_rate,
          notes,
          trade:trades (
            id,
            name
          ),
          region:regions (
            id,
            name,
            state_code
          )
        ),
        labor_request:labor_requests (
          id,
          project_name,
          company_name,
          contact_email,
          contact_phone,
          additional_details
        )
      `)
      .eq('agency_id', agency.id)  // ✓ Use resolved agency.id (UUID)
      .order('created_at', { ascending: false });

    // Apply filters...

    // Step 5: Mask PII in response
    return NextResponse.json({
      notifications: data.map(n => ({
        ...n,
        labor_request: {
          ...n.labor_request,
          contact_email: maskEmail(n.labor_request.contact_email),
          contact_phone: maskPhone(n.labor_request.contact_phone),
        }
      }))
    });
  } catch (error) {
    console.error('Error in labor requests endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Authorization Flow**:
```
1. Authenticate   → getAuthenticatedUser(request)
   ↓ Returns user with user.agencyId (UUID)

2. Resolve Slug   → Query agencies WHERE slug = params.slug
   ↓ Returns agency.id (UUID)

3. Authorize      → verifyAgencyAccess(user, agency.id)
   ↓ Compares user.agencyId === agency.id

4. Query Data     → WHERE agency_id = agency.id
   ↓ Uses UUID, not slug

5. Mask PII       → maskEmail() / maskPhone()
   ↓ Protected response
```

**Key Principles**:
- ✅ Always authenticate first (401 before 403/404)
- ✅ Resolve slug to ID before authorization
- ✅ Use resolved UUID for database queries
- ✅ Clear error messages for each failure mode
- ✅ Apply PII masking before returning response

### 10. Secure Logging

**File**: `app/api/labor-requests/notifications/[notificationId]/respond/route.ts`

```typescript
import { secureLog } from '@/lib/utils/secure-logging';

export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  // ... authentication, validation, update logic ...

  const { interested, message } = validationResult.data;

  // Secure logging (redacts message content)
  secureLog.info(
    `Agency responded to notification ${notificationId}: interested=${interested}`
    // ❌ Does NOT log message content (could contain PII/sensitive info)
  );

  return NextResponse.json({
    success: true,
    notification: {
      id: updatedNotification.id,
      status: updatedNotification.status,
      responded_at: updatedNotification.responded_at,
    },
    message: 'Response recorded successfully',
  });
}
```

**Key Principles**:
- ✅ Never log user-provided message content
- ✅ Log actions and outcomes, not sensitive data
- ✅ Use secure logging utilities with redaction
- ✅ Include context (notification ID, boolean flags)
- ✅ Assume logs are visible to operators

## Prevention and Best Practices

### Authentication Pattern Checklist

When implementing authentication:

- [ ] Check `NODE_ENV` to restrict mock auth to development
- [ ] Add feature flag (`ALLOW_MOCK_AUTH`) for emergency bypass
- [ ] Return `null` in production (fail closed)
- [ ] Document placeholder nature with TODO comments
- [ ] Plan for real auth provider integration (Supabase Auth, NextAuth, etc.)
- [ ] Test that production builds reject unauthenticated requests

### Authorization Pattern Checklist

When implementing authorization:

- [ ] Always authenticate first (401 before 403/404)
- [ ] Resolve slugs/identifiers to internal IDs before authorization
- [ ] Use consistent parameter names across routes
- [ ] Verify ownership at resource level (not just URL level)
- [ ] Return 403 with clear error message (no details about existence)
- [ ] Log authorization failures for security monitoring

### PII Protection Checklist

When handling PII:

- [ ] Identify all PII fields (email, phone, address, SSN, etc.)
- [ ] Create masking utilities for each type
- [ ] Apply masking in API response transformation
- [ ] Handle null/undefined/invalid formats gracefully
- [ ] Never log PII in application logs
- [ ] Document what's considered PII in your domain

### State Machine Checklist

When implementing status workflows:

- [ ] Document valid states and transitions
- [ ] Fetch current state before update
- [ ] Implement conditional updates based on current state
- [ ] Prevent backwards transitions (if applicable)
- [ ] Always update timestamps regardless of status
- [ ] Add comments explaining transition logic

### React Hook Checklist

When using useEffect with async operations:

- [ ] Create wrapper async function inside useEffect
- [ ] Sequence dependent operations with `await`
- [ ] Use try/finally for cleanup (loading states)
- [ ] Reset stale state on dependency changes
- [ ] Include all dependencies in dependency array
- [ ] Consider cleanup function for cancellation

### Accessibility Checklist

When making interactive components:

- [ ] Add `tabIndex={0}` for keyboard focus
- [ ] Add `role="button"` for semantic meaning
- [ ] Add descriptive `aria-label`
- [ ] Handle both Enter and Space keys
- [ ] Prevent default on Space (avoid scrolling)
- [ ] Add visible focus indicator (`:focus-visible`)
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)

### Number Comparison Checklist

When checking if numbers exist:

- [ ] Use `!= null` instead of truthy checks
- [ ] Catches both `null` and `undefined`
- [ ] Allows `0` to be a valid value
- [ ] Use `=== null` or `=== undefined` for specific checks
- [ ] Document expected value range in comments
- [ ] Consider using TypeScript strict null checks

### Date Handling Checklist

When parsing and displaying dates:

- [ ] Detect date-only strings (YYYY-MM-DD) with regex
- [ ] Use `new Date(year, month-1, day)` for date-only values
- [ ] Use `new Date(isoString)` for full timestamps
- [ ] Use `toLocaleDateString()` for dates without time
- [ ] Use `toLocaleString()` for dates with time
- [ ] Test across multiple timezones
- [ ] Document expected format in API documentation

## Testing Recommendations

### Unit Tests

```typescript
describe('maskEmail', () => {
  it('masks valid email', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('handles null', () => {
    expect(maskEmail(null)).toBe('***@***.com');
  });

  it('handles invalid format', () => {
    expect(maskEmail('notanemail')).toBe('n***@***');
  });
});

describe('verifyAgencyAccess', () => {
  it('grants access when agencyId matches', () => {
    const user = { id: 'u1', agencyId: 'a1', email: 'test@example.com' };
    expect(verifyAgencyAccess(user, 'a1')).toBe(true);
  });

  it('denies access when agencyId differs', () => {
    const user = { id: 'u1', agencyId: 'a1', email: 'test@example.com' };
    expect(verifyAgencyAccess(user, 'a2')).toBe(false);
  });
});

describe('formatDate', () => {
  it('handles date-only string without timezone shift', () => {
    expect(formatDate('2026-03-15')).toBe('Mar 15, 2026');
  });

  it('handles full ISO timestamp', () => {
    expect(formatDate('2026-03-15T14:30:00.000Z')).toContain('Mar 15');
  });
});
```

### Integration Tests

```typescript
describe('GET /api/agencies/[slug]/labor-requests', () => {
  it('returns 401 when not authenticated', async () => {
    const response = await fetch('/api/agencies/test-agency/labor-requests');
    expect(response.status).toBe(401);
  });

  it('returns 404 when agency not found', async () => {
    const response = await fetch('/api/agencies/nonexistent/labor-requests', {
      headers: { 'x-mock-agency-id': 'agency-1' }
    });
    expect(response.status).toBe(404);
  });

  it('returns 403 when accessing different agency', async () => {
    const response = await fetch('/api/agencies/other-agency/labor-requests', {
      headers: { 'x-mock-agency-id': 'agency-1' }
    });
    expect(response.status).toBe(403);
  });

  it('masks email and phone in response', async () => {
    const response = await fetch('/api/agencies/my-agency/labor-requests', {
      headers: { 'x-mock-agency-id': 'agency-1' }
    });
    const data = await response.json();
    expect(data.notifications[0].labor_request.contact_email).toMatch(/^\w\*\*\*@/);
    expect(data.notifications[0].labor_request.contact_phone).toMatch(/^\*\*\*-\*\*\*-\d{4}$/);
  });
});

describe('POST /api/labor-requests/notifications/[id]/view', () => {
  it('updates status from new to viewed', async () => {
    // Create notification with status 'new'
    const { data: notification } = await createNotification({ status: 'new' });

    // Mark as viewed
    await fetch(`/api/labor-requests/notifications/${notification.id}/view`, {
      method: 'POST',
      headers: { 'x-mock-agency-id': notification.agency_id }
    });

    // Verify status updated
    const updated = await getNotification(notification.id);
    expect(updated.status).toBe('viewed');
    expect(updated.viewed_at).toBeTruthy();
  });

  it('does not regress status from responded to viewed', async () => {
    // Create notification with status 'responded'
    const { data: notification } = await createNotification({ status: 'responded' });

    // Mark as viewed (should be no-op for status)
    await fetch(`/api/labor-requests/notifications/${notification.id}/view`, {
      method: 'POST',
      headers: { 'x-mock-agency-id': notification.agency_id }
    });

    // Verify status NOT changed
    const updated = await getNotification(notification.id);
    expect(updated.status).toBe('responded');  // ✓ Unchanged
    expect(updated.viewed_at).toBeTruthy();     // ✓ Timestamp updated
  });
});
```

### E2E Tests (Playwright)

```typescript
test('keyboard navigation through labor requests', async ({ page }) => {
  await page.goto('/dashboard/labor-requests');

  // Tab to first card
  await page.keyboard.press('Tab');

  // Verify focus visible
  await expect(page.locator('[role="button"]:focus')).toBeVisible();

  // Activate with Enter
  await page.keyboard.press('Enter');

  // Verify navigation
  await expect(page).toHaveURL(/\/dashboard\/labor-requests\/\w+/);
});

test('displays masked contact information', async ({ page }) => {
  await page.goto('/dashboard/labor-requests/test-request-id');

  // Check email is masked
  const email = page.locator('text=/\\w\\*\\*\\*@[\\w.]+/');
  await expect(email).toBeVisible();

  // Check phone is masked
  const phone = page.locator('text=/\\*\\*\\*-\\*\\*\\*-\\d{4}/');
  await expect(phone).toBeVisible();
});
```

## Related Documentation

- [Phase 5: PII Masking and Validation Best Practices](./pii-masking-success-page.md)
- [Secure Logging in Production](../security-issues/secure-logging-in-production.md)
- [Multi-Tier RLS Policies](../security-issues/multi-tier-rls-policies-public-owner-admin.md)
- [Supabase RLS Service Role Authentication](../database-issues/supabase-rls-service-role-authentication.md)

## Key Takeaways

### Security
1. **Fail closed** - Always default to denying access when auth is uncertain
2. **Mask PII** - Never expose sensitive data in API responses or logs
3. **Authenticate then authorize** - Check who you are, then what you can access
4. **Resolve indirection** - Map slugs to IDs before authorization checks

### React Patterns
1. **Sequence dependencies** - Use `await` to order async operations in useEffect
2. **Reset state** - Clear stale data when dependencies change
3. **Nullish checks** - Use `!= null` for numbers to handle `0` correctly
4. **Wrapper functions** - Create async function inside useEffect, not useEffect async

### Accessibility
1. **Keyboard first** - Always implement keyboard navigation for interactive elements
2. **Semantic HTML** - Use proper roles and ARIA attributes
3. **Focus visible** - Provide clear visual indicators for keyboard users
4. **Test with tools** - Use screen readers and keyboard-only testing

### Next.js
1. **Route consistency** - Use same parameter names across sibling dynamic routes
2. **Server components** - Leverage for data fetching and authentication
3. **Type safety** - Use TypeScript to catch parameter mismatches

### Date Handling
1. **Detect format** - Check if date-only vs full timestamp
2. **Parse carefully** - Use appropriate constructor for each format
3. **Test timezones** - Verify behavior in UTC, PST, EST, etc.

### Status Management
1. **State machines** - Define valid transitions explicitly
2. **Check before update** - Fetch current state first
3. **Prevent regression** - Don't allow backwards transitions
4. **Update timestamps** - Track lifecycle regardless of status changes

---

**Contributors**: Phase 6 team, code reviewers
**Last Updated**: 2026-01-16
**Status**: Implemented and merged (PR #684)
