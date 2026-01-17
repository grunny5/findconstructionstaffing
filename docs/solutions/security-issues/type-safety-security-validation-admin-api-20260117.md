---
module: Admin Dashboard
date: 2026-01-17
problem_type: security_issue
component: rails_controller
symptoms:
  - "TypeScript 'any' types bypassing type safety in API routes"
  - "Missing error handling for malformed JSON in POST endpoints"
  - "PostgREST injection vulnerability in search query interpolation"
  - "Pagination parameters could produce NaN causing runtime errors"
  - "Direct sonner toast import instead of useToast hook pattern"
root_cause: missing_validation
resolution_type: code_fix
severity: high
tags: [type-safety, input-validation, postgrest-security, api-security, error-handling, typescript-strict]
---

# Type Safety, Security & Validation in Admin Labor Requests API

## Problem

After implementing the admin labor requests dashboard (PR #688), code review identified multiple security vulnerabilities and type safety issues in the API endpoints and React components that could lead to:
- Security vulnerabilities (SQL/PostgREST injection, unhandled errors)
- Runtime errors from invalid inputs
- Type safety bypasses preventing compile-time error detection
- Inconsistent patterns across the codebase

## Environment

- Module: Admin Dashboard (Labor Requests)
- Next.js Version: 14.2.35
- TypeScript: strict mode enabled
- Affected Components:
  - `app/api/admin/labor-requests/route.ts`
  - `app/api/admin/labor-requests/[id]/status/route.ts`
  - `components/admin/LaborRequestDetailModal.tsx`
  - `components/admin/LaborRequestsTable.tsx`
- Date: 2026-01-17

## Symptoms

### Security Issues
- **PostgREST Injection Risk**: Search query directly interpolated into `.or()` clause without sanitization
  ```typescript
  query.or(`project_name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`)
  ```
- **Unhandled JSON Parsing**: POST endpoint using `await request.json()` without try/catch
- **Missing Record Check**: Status update could succeed with no rows but return success response

### Type Safety Issues
- **Extensive 'any' Types**: Data transformation using `any` for requests, crafts, notifications
  ```typescript
  const transformedData = data.map((request: any) => ({
    match_count: request.crafts?.reduce((sum: number, craft: any) => ...)
  }))
  ```
- **Untyped State**: Modal component using `useState<any>(null)` for request data

### Input Validation Issues
- **NaN Pagination**: `parseInt()` results not validated, could produce NaN values
  ```typescript
  const page = parseInt(searchParams.get('page') || '1');  // Could be NaN
  ```

### UX Issues
- **Double Fetch**: `handleSearch()` calling both `setCurrentPage(1)` and `fetchRequests()`
- **Pagination Edge Cases**: Display showing "Showing 1 to 0" when no results
- **Missing Pagination Reset**: Status filter change not resetting to page 1

### Pattern Consistency
- **Direct Sonner Import**: Using `import { toast } from 'sonner'` instead of project's `useToast` hook

## What Didn't Work

**Direct solution:** Issues were identified through code review before they caused runtime problems. No debugging attempts needed - implemented all fixes proactively.

## Solution

### 1. PostgREST Injection Prevention

**File**: `app/api/admin/labor-requests/route.ts`

```typescript
// Before (vulnerable):
if (searchQuery) {
  query = query.or(`project_name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
}

// After (sanitized):
if (searchQuery) {
  // Sanitize search query to prevent PostgREST injection
  // Allow only alphanumerics, spaces, and common punctuation
  const sanitizedQuery = searchQuery.replace(/[^a-zA-Z0-9\s\-_.,'&]/g, '');
  if (sanitizedQuery) {
    // Escape special PostgREST characters (%, _)
    const escapedQuery = sanitizedQuery.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.or(`project_name.ilike.%${escapedQuery}%,company_name.ilike.%${escapedQuery}%`);
  }
}
```

### 2. JSON Parsing Error Handling

**File**: `app/api/admin/labor-requests/[id]/status/route.ts`

```typescript
// Before (unhandled):
const body = await request.json();
const { status } = body;

// After (error handled):
let body;
let status;
try {
  body = await request.json();
  status = body.status;
} catch (error) {
  return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
}
```

### 3. Record Existence Check

**File**: `app/api/admin/labor-requests/[id]/status/route.ts`

```typescript
// Before (false success):
const { data, error } = await supabase
  .from('labor_requests')
  .update({ status, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single();

if (error) {
  return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
}
return NextResponse.json({ data }, { status: 200 });

// After (checks for empty data):
const { data, error } = await supabase
  .from('labor_requests')
  .update({ status, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single();

if (error) {
  return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
}

// Check if record was found and updated
if (!data) {
  return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
}

return NextResponse.json({ data }, { status: 200 });
```

### 4. TypeScript Type Safety

**File**: `app/api/admin/labor-requests/route.ts`

```typescript
// Define proper interfaces
interface Notification {
  id: string;
  agency: { id: string; agency_name: string; slug: string };
  status: 'pending' | 'sent' | 'failed' | 'new' | 'viewed' | 'responded' | 'archived';
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  delivery_error: string | null;
}

interface Craft {
  id: string;
  trade: { id: string; name: string };
  region: { id: string; name: string; state_code: string };
  worker_count: number;
  start_date: string;
  notifications: Notification[];
}

interface LaborRequest {
  id: string;
  project_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  crafts: Craft[];
}

// Use strong types in transformation
const transformedData = (data as LaborRequest[]).map((request) => ({
  ...request,
  match_count: request.crafts?.reduce((sum: number, craft: Craft) =>
    sum + (craft.notifications?.length || 0), 0) || 0,
  notification_stats: {
    sent: request.crafts?.reduce((sum: number, craft: Craft) =>
      sum + (craft.notifications?.filter((n: Notification) =>
        n.status === 'sent' || n.status === 'new').length || 0), 0) || 0,
    // ... more typed operations
  }
}));
```

**File**: `components/admin/LaborRequestDetailModal.tsx`

```typescript
// Define detailed interface for modal state
interface LaborRequestDetail {
  id: string;
  project_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  crafts: Craft[];
}

// Replace any with proper type
const [request, setRequest] = useState<LaborRequestDetail | null>(null);
```

### 5. Pagination Validation

**File**: `app/api/admin/labor-requests/route.ts`

```typescript
// Before (could be NaN):
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '25');

// After (validated):
let page = parseInt(searchParams.get('page') || '1');
let limit = parseInt(searchParams.get('limit') || '25');

// Validate pagination values
if (!Number.isInteger(page) || page < 1) {
  page = 1;
}
if (!Number.isInteger(limit) || limit < 1) {
  limit = 25;
}

const offset = (page - 1) * limit;
```

### 6. UX Improvements

**File**: `components/admin/LaborRequestsTable.tsx`

```typescript
// Fix: Remove double fetch
const handleSearch = () => {
  setCurrentPage(1);  // This triggers useEffect which calls fetchRequests
  // Removed: fetchRequests(); - was causing double fetch
};

// Fix: Reset pagination on filter change
<Select
  value={statusFilter}
  onValueChange={(value) => {
    setStatusFilter(value);
    setCurrentPage(1);  // Reset to page 1 when filter changes
  }}
>

// Fix: Pagination display edge case
<p className="text-sm text-gray-600">
  {pagination.total === 0 ? (
    'No requests'
  ) : (
    <>
      Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} requests
    </>
  )}
</p>
```

### 7. Pattern Consistency

**File**: `components/admin/LaborRequestDetailModal.tsx`

```typescript
// Before (direct import):
import { toast } from 'sonner';
// ... later
toast.error('Failed to load request details');

// After (using project hook):
import { useToast } from '@/hooks/use-toast';
// ... in component
const { toast } = useToast();
// ... later
toast({
  title: 'Error',
  description: 'Failed to load request details',
  variant: 'destructive',
});
```

## Why This Works

### Security Layer (Defense in Depth)

1. **Input Sanitization**: Strips dangerous characters before they reach the database query
2. **Query Escaping**: Escapes PostgREST special characters (%, _) to prevent pattern injection
3. **Error Boundaries**: Malformed JSON returns 400 instead of crashing the endpoint
4. **Existence Validation**: Prevents false success responses when records don't exist

### Type Safety Benefits

1. **Compile-Time Checking**: TypeScript can now catch type errors during development
2. **IntelliSense Support**: IDE autocomplete works correctly with proper types
3. **Refactoring Safety**: Type system prevents breaking changes during refactors
4. **Documentation**: Interfaces serve as inline documentation of data structures

### Input Validation

1. **Safe Fallbacks**: Invalid pagination always falls back to safe defaults (page=1, limit=25)
2. **Integer Validation**: `Number.isInteger()` catches NaN and float values
3. **Boundary Checking**: Ensures page/limit are positive integers

### UX Improvements

1. **Single Source of Truth**: Pagination state change triggers fetch through useEffect
2. **Predictable Behavior**: Filter changes always start at page 1
3. **Edge Case Handling**: Empty states show user-friendly messages

### Pattern Consistency

1. **Centralized Toast**: Using `useToast` allows for consistent styling and behavior
2. **Future Flexibility**: Hook pattern allows swapping toast libraries without changing components

## Prevention

### Security Checklist for Admin API Endpoints

**Always implement these safeguards:**

1. **Input Validation**:
   ```typescript
   // Validate and sanitize all user inputs
   const sanitized = input.replace(/[^a-zA-Z0-9\s]/g, '');

   // Validate numeric inputs
   let page = parseInt(value);
   if (!Number.isInteger(page) || page < 1) page = 1;
   ```

2. **Error Handling**:
   ```typescript
   // Wrap JSON parsing in try/catch
   try {
     const body = await request.json();
   } catch (error) {
     return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
   }
   ```

3. **Response Validation**:
   ```typescript
   // Check for empty data after database operations
   if (!data) {
     return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
   }
   ```

### TypeScript Type Safety Checklist

**Never use `any` types - define proper interfaces:**

1. **Define Domain Interfaces**:
   ```typescript
   interface Entity {
     id: string;
     status: 'pending' | 'active' | 'fulfilled';  // Use union types for enums
     // ... all fields with proper types
   }
   ```

2. **Cast External Data**:
   ```typescript
   // Cast data from external sources
   const typedData = (data as Entity[]).map((item) => {
     // Now item is properly typed
   });
   ```

3. **Type Component State**:
   ```typescript
   // Use specific types for state
   const [entity, setEntity] = useState<Entity | null>(null);
   ```

### UX Edge Case Checklist

**Test these scenarios during implementation:**

1. **Empty States**: What happens when pagination.total === 0?
2. **Filter Changes**: Does changing filter reset to page 1?
3. **Effect Dependencies**: Are useEffect dependencies complete? Does changing them cause double fetches?

### Pattern Consistency

**Follow existing codebase patterns:**

1. **Search for Existing Patterns**:
   ```bash
   # Find how toast is used elsewhere
   grep -r "toast" components/ --include="*.tsx"

   # Find existing validation patterns
   grep -r "Number.isInteger" app/api/
   ```

2. **Use Project Hooks**: Always prefer project-specific hooks over direct library imports

## Related Issues

- See also: [minimal-verified-field-implementation.md](../implementation-patterns/minimal-verified-field-implementation.md) - Related TypeScript 'any' type issue and API validation
- See also: [pii-masking-success-page.md](./pii-masking-success-page.md) - Related input sanitization patterns

## Files Changed

- `app/api/admin/labor-requests/route.ts` - Security, validation, type safety
- `app/api/admin/labor-requests/[id]/status/route.ts` - Error handling, record check
- `components/admin/LaborRequestDetailModal.tsx` - Type safety, pattern consistency
- `components/admin/LaborRequestsTable.tsx` - UX improvements
- `plans/admin-labor-requests-dashboard.md` - Documentation update

## Pull Request

- PR #688: feat(admin): Add comprehensive labor requests dashboard
- Commit: 72f3483 - fix(admin): improve error handling and type safety
