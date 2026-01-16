---
title: PII Masking and Validation Best Practices for Success Pages
category: security-issues
severity: high
component: api-routes, success-page
tags: [pii, privacy, validation, react, typescript]
related_prs: [683]
date: 2026-01-16
---

# PII Masking and Validation Best Practices for Success Pages

## Problem Summary

During code review of Phase 5 (PR #683), multiple security and data quality issues were discovered in the success page implementation:

1. **PII Exposure**: Full phone numbers returned in API responses
2. **Null Safety**: Token expiration validation didn't guard against null/invalid dates
3. **State Management**: React component didn't reset state properly on token changes
4. **Date Formatting**: Time portion not displayed due to wrong method
5. **Type Organization**: Interface duplication instead of shared types

## Symptoms

### 1. Phone Number PII Exposure
```typescript
// BEFORE (INSECURE)
contactPhone: laborRequest.contact_phone  // Returns "555-123-4567"
```

**Impact**: Full phone numbers exposed to client, violating privacy best practices.

### 2. Invalid Date Handling
```typescript
// BEFORE (UNSAFE)
const expiresAt = new Date(laborRequest.confirmation_token_expires);
if (now > expiresAt) { ... }
```

**Impact**: Could crash with `NaN` dates or return unexpected results when `confirmation_token_expires` is null.

### 3. Stale React State
```typescript
// BEFORE
useEffect(() => {
  if (!token) {
    setError('No token');
    setLoading(false);
    return;
  }
  fetchRequestDetails();  // ❌ Doesn't clear previous state
}, [token]);
```

**Impact**: When token changes, component could show stale error messages or data from previous token.

### 4. Date Display Without Time
```typescript
// BEFORE
const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',      // ❌ Ignored by toLocaleDateString
    minute: '2-digit',    // ❌ Ignored
  });
};
```

**Output**: "January 16, 2026" (missing time)

### 5. Duplicate Type Definitions
```typescript
// Component file
interface LaborRequestSuccess { ... }

// API response uses same structure but no shared type
```

**Impact**: Type drift, maintenance burden, no single source of truth.

## Root Cause Analysis

### Phone Number Exposure
- API route directly returned `laborRequest.contact_phone` without masking
- No consideration for PII in API design
- Email was masked but phone was overlooked

### Date Validation Issues
- Assumed `confirmation_token_expires` always valid
- `new Date(null)` returns "Invalid Date" which can pass comparison checks
- `new Date(undefined)` also creates invalid date
- No validation that parsed date is actually valid

### React State Management
- `useEffect` dependency on `token` triggers on change
- But doesn't reset error/data from previous render
- Loading state set initially but not on subsequent token changes
- Classic "stale state" pattern in React

### Date Formatting
- `toLocaleDateString` only formats date portion, ignores time options
- `toLocaleString` formats both date and time
- Easy to miss since method names are similar

### Type Organization
- Interface defined inline in component for convenience
- Didn't follow existing pattern of shared types in `types/` directory
- Duplicates effort and can cause inconsistencies

## Solutions Implemented

### 1. Phone Number Masking

**File**: `app/api/labor-requests/success/route.ts`

```typescript
// Mask phone (show only last 4 digits)
const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '***-***-****';
  // Extract only digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  // Show last 4 digits only
  const lastFour = digits.slice(-4);
  return `***-***-${lastFour}`;
};

// Use in response
return NextResponse.json({
  success: true,
  request: {
    id: laborRequest.id,
    projectName: laborRequest.project_name,
    companyName: laborRequest.company_name,
    contactEmail: maskEmail(laborRequest.contact_email),
    contactPhone: maskPhone(laborRequest.contact_phone),  // ✅ Masked
    submittedAt: laborRequest.created_at,
    craftCount: craftCount || 0,
  },
  // ...
});
```

**Key Features**:
- Handles `null`, `undefined`, empty strings gracefully
- Strips all non-digit characters before processing
- Returns consistent format: `***-***-1234`
- Safe to use without null checks

**Example Output**:
- Input: `"(555) 123-4567"` → Output: `"***-***-4567"`
- Input: `"5551234567"` → Output: `"***-***-4567"`
- Input: `null` → Output: `"***-***-****"`
- Input: `"123"` → Output: `"***-***-****"` (too short)

### 2. Robust Date Validation

**File**: `app/api/labor-requests/success/route.ts`

```typescript
// Check token expiration
// Guard against null or invalid expiration date
if (!laborRequest.confirmation_token_expires) {
  return NextResponse.json(
    { error: 'Token has expired' },
    { status: 410 } // 410 Gone
  );
}

const now = new Date();
const expiresAt = new Date(laborRequest.confirmation_token_expires);

// Verify the date is valid (not NaN)
if (isNaN(expiresAt.getTime())) {
  return NextResponse.json(
    { error: 'Token has expired' },
    { status: 410 } // 410 Gone
  );
}

// Now safe to compare
if (now > expiresAt) {
  return NextResponse.json(
    { error: 'Token has expired' },
    { status: 410 } // 410 Gone
  );
}
```

**Validation Steps**:
1. Check if field exists (not null/undefined)
2. Parse the date string
3. Validate parsed date is valid (use `getTime()` + `isNaN()`)
4. Only then perform comparison

**Why `getTime()` + `isNaN()`?**
- `new Date(null)` creates "Invalid Date" object
- Invalid Date returns `NaN` from `getTime()`
- `isNaN(NaN)` returns `true`
- Safe way to detect invalid dates

### 3. Proper React State Resets

**File**: `app/request-labor/success/page.tsx`

```typescript
useEffect(() => {
  if (!token) {
    setError('No confirmation token provided');
    setLoading(false);
    return;
  }

  // Reset state before fetching
  setError(null);      // ✅ Clear previous errors
  setData(null);       // ✅ Clear stale data
  setLoading(true);    // ✅ Show loading indicator

  fetchRequestDetails();
}, [token]);
```

**Why This Matters**:
- User navigates from token A → token B
- Without resets: old error/data briefly visible
- With resets: clean loading state → new data
- Prevents UI confusion and stale data display

**React Pattern**:
```
Token Changes → Reset State → Fetch New Data → Update State
```

### 4. Correct Date Formatting

**File**: `app/request-labor/success/page.tsx`

```typescript
const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**Output**: "January 16, 2026, 10:30 AM" ✅

**Method Comparison**:
- `toLocaleDateString()`: Date only (ignores time options)
- `toLocaleString()`: Full date + time
- `toLocaleTimeString()`: Time only (ignores date options)

### 5. Shared TypeScript Types

**File**: `types/labor-request.ts`

```typescript
// =============================================================================
// SUCCESS PAGE TYPES
// =============================================================================

export interface LaborRequestSuccess {
  success: boolean;
  request: {
    id: string;
    projectName: string;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    submittedAt: string;
    craftCount: number;
  };
  matches: {
    total: number;
    byCraft: Array<{
      craftName: string;
      matches: number;
    }>;
  };
  expiresAt: string;
}
```

**File**: `app/request-labor/success/page.tsx`

```typescript
import type { LaborRequestSuccess } from '@/types/labor-request';

// Remove inline interface definition
// Use imported type instead
const [data, setData] = useState<LaborRequestSuccess | null>(null);
```

**Benefits**:
- Single source of truth
- Changes propagate automatically
- Type-safe across API and UI
- Follows project conventions

## Prevention Strategies

### 1. PII Masking Checklist

Before shipping any API endpoint that returns user data:

- [ ] Identify all PII fields (email, phone, address, SSN, etc.)
- [ ] Create masking utilities for each type
- [ ] Apply masking in API response, not just UI
- [ ] Test with real-looking data (not just "test@test.com")
- [ ] Verify in browser DevTools network tab

**PII Fields to Always Mask**:
- Email: Show first char + domain (`t***@example.com`)
- Phone: Show last 4 digits (`***-***-1234`)
- Address: Show city/state only
- SSN: Never return, even masked
- Credit cards: Last 4 only
- Full names: Consider masking in some contexts

### 2. Date Validation Pattern

**Template for all date handling**:

```typescript
const parseAndValidateDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  const parsed = new Date(dateString);

  if (isNaN(parsed.getTime())) return null;

  return parsed;
};

// Usage
const expiresAt = parseAndValidateDate(laborRequest.confirmation_token_expires);

if (!expiresAt) {
  // Handle missing/invalid date
  return error response;
}

// Safe to use expiresAt
if (now > expiresAt) { ... }
```

### 3. React State Management Pattern

**Template for useEffect with external data**:

```typescript
useEffect(() => {
  // Early return for invalid states
  if (!requiredParam) {
    setError('Error message');
    setLoading(false);
    return;
  }

  // Reset ALL relevant state
  setError(null);
  setData(null);
  setLoading(true);

  // Fetch new data
  fetchData();
}, [requiredParam]);
```

**Key Points**:
- Reset error state
- Reset data state
- Set loading state
- Do this BEFORE fetching

### 4. Date Formatting Decision Tree

```
Need to display a timestamp?
├─ Date only? → toLocaleDateString()
├─ Time only? → toLocaleTimeString()
└─ Date + Time? → toLocaleString()
```

**Always specify locale and options**:
```typescript
// ✅ Good - explicit
new Date(value).toLocaleString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// ❌ Bad - uses browser default
new Date(value).toLocaleString();
```

### 5. Type Organization Guidelines

**Where to put types**:

```
API Response Types → types/labor-request.ts
Form Data Types → lib/validations/labor-request.ts (Zod schemas)
Component Props → Inline or component.types.ts if complex
Utility Types → lib/utils/types.ts
Database Types → lib/supabase.ts (generated)
```

**Rule of Thumb**:
- Shared across files → `types/` directory
- Used once → Inline
- API contract → Dedicated types file
- Form data → Co-locate with validation

## Testing Recommendations

### Unit Tests for Masking Functions

```typescript
describe('maskPhone', () => {
  it('should mask phone with last 4 digits', () => {
    expect(maskPhone('5551234567')).toBe('***-***-4567');
    expect(maskPhone('(555) 123-4567')).toBe('***-***-4567');
  });

  it('should handle null/undefined', () => {
    expect(maskPhone(null)).toBe('***-***-****');
    expect(maskPhone(undefined)).toBe('***-***-****');
  });

  it('should handle short numbers', () => {
    expect(maskPhone('123')).toBe('***-***-****');
  });
});
```

### Integration Tests for API

```typescript
describe('GET /api/labor-requests/success', () => {
  it('should mask phone numbers in response', async () => {
    const response = await fetch(`/api/labor-requests/success?token=${validToken}`);
    const data = await response.json();

    expect(data.request.contactPhone).toMatch(/\*\*\*-\*\*\*-\d{4}/);
    expect(data.request.contactPhone).not.toContain('555-123-4567');
  });

  it('should return 410 for null expiration date', async () => {
    // Test with token that has null confirmation_token_expires
    const response = await fetch(`/api/labor-requests/success?token=${nullExpiryToken}`);

    expect(response.status).toBe(410);
  });

  it('should return 410 for invalid date string', async () => {
    // Test with token that has invalid date like "not-a-date"
    const response = await fetch(`/api/labor-requests/success?token=${invalidDateToken}`);

    expect(response.status).toBe(410);
  });
});
```

### Component Tests for State Management

```typescript
describe('LaborRequestSuccessPage', () => {
  it('should reset state when token changes', async () => {
    const { rerender } = render(<LaborRequestSuccessPage />);

    // Wait for initial load with token1
    await waitFor(() => expect(screen.getByText('Project A')).toBeInTheDocument());

    // Change token
    rerender(<LaborRequestSuccessPage token="new-token" />);

    // Should show loading state (not previous data)
    expect(screen.queryByText('Project A')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

## Related Issues

- **PR #680**: Initial form implementation (didn't include masking)
- **PR #681**: API endpoint (exposed phone numbers initially)
- **PR #682**: Email notifications (did mask email but not phone)
- **PR #683**: Success page (fixed all these issues)

## Cross-References

- See `docs/solutions/database-issues/supabase-rls-service-role-authentication.md` for related security patterns
- See `types/labor-request.ts` for complete type definitions
- See `lib/emails/send-labor-request-notification.ts` for email masking example

## Key Takeaways

1. **Always mask PII** - Don't return sensitive data unmasked, even to authenticated users
2. **Validate dates properly** - Check for null AND invalid dates, not just expired
3. **Reset React state** - Clear previous state before fetching new data
4. **Use correct Date methods** - `toLocaleString()` for date+time, not `toLocaleDateString()`
5. **Share types** - Put shared interfaces in `types/` directory, not inline in components

## Quick Reference

### Phone Masking Pattern
```typescript
const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '***-***-****';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  return `***-***-${digits.slice(-4)}`;
};
```

### Date Validation Pattern
```typescript
if (!dateString) return error;
const date = new Date(dateString);
if (isNaN(date.getTime())) return error;
// Now safe to use date
```

### React State Reset Pattern
```typescript
useEffect(() => {
  if (!param) return;
  setError(null);
  setData(null);
  setLoading(true);
  fetchData();
}, [param]);
```

---

**Last Updated**: 2026-01-16
**Verified Working**: Phase 5 (PR #683) merged and deployed
**Complexity**: Medium
**Impact**: High (security + data quality)
