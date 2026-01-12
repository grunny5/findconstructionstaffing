---
title: "API Tests Fail After Adding Security Features to Endpoint"
component: "API/Security/Testing"
problem_type: "test_failure"
severity: "high"
status: "resolved"
tags: ["testing", "security", "csrf", "validation", "test-maintenance", "api"]
related_files:
  - "app/api/admin/agencies/[id]/compliance/verify/__tests__/route.test.ts"
  - "app/api/admin/agencies/[id]/compliance/verify/route.ts"
  - "lib/utils/secure-logging.ts"
date_discovered: "2026-01-11"
date_resolved: "2026-01-11"
---

# Problem

CI test suite failing after adding security features to admin compliance verification endpoint. All 23 tests in the endpoint test file were failing due to missing security-related mocks and headers.

## Symptoms

- CI "API Tests" check failing
- All tests in `app/api/admin/agencies/[id]/compliance/verify/__tests__/route.test.ts` failing
- Tests written before security improvements were added to the endpoint
- Error patterns:
  - 403 Forbidden (CSRF protection rejecting requests without origin/referer)
  - 400 Bad Request (document URL validation failing)
  - 500 Internal Server Error (secureLog not mocked)
  - Type errors (NEXT_PUBLIC_SUPABASE_URL not set)

## Root Cause

**When adding security features to an API endpoint, tests must be updated to:**

1. **Mock new dependencies** (e.g., secure logging utilities)
2. **Provide required headers** (e.g., origin for CSRF validation)
3. **Set environment variables** (e.g., NEXT_PUBLIC_SUPABASE_URL for URL validation)
4. **Update test data** (e.g., URLs must point to expected domains)
5. **Add test coverage** for new security validations

**Security features added** (commit `b7832e9`):
- CSRF protection via origin/referer validation
- Document URL domain validation (must be Supabase storage)
- Notes length validation (2000 char limit)
- Secure logging to sanitize sensitive data

**Tests were outdated** because they:
- Had no origin/referer headers → CSRF blocked requests
- Used arbitrary URLs (`https://example.com`) → URL validation failed
- Didn't mock `secureLog` → Import errors
- Didn't set `NEXT_PUBLIC_SUPABASE_URL` → Validation couldn't check domain

## Investigation Steps

1. ✅ Identified failing endpoint tests in CI logs
2. ✅ Read recent commit (`b7832e9`) to understand security changes
3. ✅ Read route handler to see new validation logic (CSRF, URL, notes)
4. ✅ Read test file to identify missing mocks and headers
5. ✅ Created comprehensive fix addressing all security features

## Solution

Update tests to account for new security features:

### 1. Mock Secure Logging Utility

```typescript
// Add at top of test file with other mocks
jest.mock('@/lib/utils/secure-logging', () => ({
  secureLog: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  sanitizeForLog: jest.fn((value) => String(value)),
  sanitizeObject: jest.fn((obj) => obj),
}));
```

**Why**: Route handler imports `secureLog` to sanitize sensitive data in production logs. Tests need mock to avoid import errors.

### 2. Set Environment Variable for URL Validation

```typescript
beforeEach(() => {
  // ... existing setup
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
});

afterEach(() => {
  // ... existing cleanup
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});
```

**Why**: Document URL validation checks if URLs point to Supabase storage by comparing hostname. Without this env var, validation can't verify domain.

### 3. Add CSRF Headers to All Test Requests

```typescript
const request = new NextRequest(url, {
  method: 'POST',
  headers: {
    origin: 'http://localhost:3000',  // ← Add this to every request
  },
  body: JSON.stringify({ /* ... */ }),
});
```

**Apply to**: All POST request creations in test file (20+ instances)

**Why**: Endpoint validates `origin` or `referer` header matches `NEXT_PUBLIC_SITE_URL` to prevent CSRF attacks. Without header, requests are rejected with 403 Forbidden.

### 4. Update Document URLs to Supabase Domain

```typescript
// BEFORE
document_url: 'https://example.com/doc.pdf',

// AFTER
document_url: 'https://test.supabase.co/storage/v1/object/public/compliance-documents/doc.pdf',
```

**Why**: Endpoint validates document URLs point to Supabase storage, not external domains. Using Supabase domain in test data ensures validation passes.

### 5. Add Test Coverage for New Security Features

**CSRF Protection Tests** (3 tests):
```typescript
describe('CSRF Protection', () => {
  it('should return 403 if origin header does not match expected origin', async () => {
    const request = new NextRequest(url, {
      method: 'POST',
      headers: { origin: 'https://malicious-site.com' },  // Invalid
      body: JSON.stringify({ /* ... */ }),
    });
    const response = await POST(request, { params });
    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
  });

  it('should return 403 if referer header does not match expected origin', async () => {
    // Similar test with invalid referer
  });

  it('should accept request with valid referer header', async () => {
    const request = new NextRequest(url, {
      headers: { referer: 'http://localhost:3000/admin' },  // Valid
      // ...
    });
    // Should not fail due to CSRF
  });
});
```

**Document URL Validation Tests** (3 tests):
```typescript
describe('Document URL Validation', () => {
  it('should return 400 if trying to verify without a document URL', async () => {
    // Mock compliance with document_url: null
    // Expect validation error
  });

  it('should return 400 if document URL points to external domain', async () => {
    // Mock compliance with document_url: 'https://malicious-site.com/doc.pdf'
    // Expect "Document URL must point to Supabase storage"
  });

  it('should accept plain storage paths as valid document URLs', async () => {
    // Mock compliance with document_url: 'agency-123/osha-cert.pdf'
    // Should succeed - plain paths are valid
  });
});
```

**Notes Validation Tests** (2 tests):
```typescript
describe('Validation', () => {
  it('should return 400 if notes exceed 2000 characters', async () => {
    const longNotes = 'a'.repeat(2001);
    // Expect error with character count
  });

  it('should return 400 if notes is not a string', async () => {
    // Send notes: 12345 (number)
    // Expect "Notes must be a string if provided"
  });
});
```

## Complete Test Results

**Before Fix**: 0/23 tests passing
**After Fix**: 23/23 tests passing

```bash
npm test -- "compliance/verify"

# Output:
PASS node app/api/admin/agencies/[id]/compliance/verify/__tests__/route.test.ts
  POST /api/admin/agencies/[id]/compliance/verify
    Authentication
      ✓ should return 401 if user is not authenticated
      ✓ should return 403 if user is not an admin
    Validation
      ✓ should return 400 if request body is invalid JSON
      ✓ should return 400 if complianceType is missing
      ✓ should return 400 if complianceType is invalid
      ✓ should return 400 if action is missing
      ✓ should return 400 if action is invalid
      ✓ should return 400 if reject action is missing reason
      ✓ should return 400 if reject reason is too short
      ✓ should return 400 if notes exceed 2000 characters
      ✓ should return 400 if notes is not a string
    CSRF Protection
      ✓ should return 403 if origin header does not match expected origin
      ✓ should return 403 if referer header does not match expected origin
      ✓ should accept request with valid referer header
    Document URL Validation
      ✓ should return 400 if trying to verify without a document URL
      ✓ should return 400 if document URL points to external domain
      ✓ should accept plain storage paths as valid document URLs
    Not Found
      ✓ should return 404 if agency not found
      ✓ should return 404 if compliance record not found
    Verify Action
      ✓ should successfully verify compliance document
      ✓ should preserve existing notes if no new notes provided
    Reject Action
      ✓ should successfully reject compliance document
      ✓ should handle email sending failure gracefully

Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
```

## Prevention Checklist

**When adding security features to an API endpoint:**

### Step 1: Implement Security Features
- [ ] Add validation logic to route handler
- [ ] Document security requirements in code comments
- [ ] Test manually with Postman/curl to verify behavior

### Step 2: Update Tests Immediately
- [ ] **Mock new dependencies** (utilities, logging, etc.)
- [ ] **Set required env vars** in test setup (beforeEach)
- [ ] **Add required headers** to all test requests (origin, auth, etc.)
- [ ] **Update test data** to pass validation (URLs, formats, lengths)
- [ ] **Add new test cases** for each security feature

### Step 3: Verify
- [ ] Run specific test: `npm test -- "[endpoint-name]"`
- [ ] Run full API test suite: `npm test`
- [ ] Check CI passes after pushing

### Common Security Features Requiring Test Updates

| Security Feature | Test Requirements |
|------------------|-------------------|
| **CSRF Protection** | Add `origin` or `referer` headers to requests |
| **Auth Tokens** | Mock authentication, provide valid tokens |
| **Input Validation** | Test validation rules (length, type, format) |
| **URL Validation** | Use correct domains in test data |
| **Rate Limiting** | Mock rate limit checks or skip in tests |
| **Logging** | Mock logging utilities to avoid side effects |
| **Environment Variables** | Set required vars in beforeEach |

## Testing

```bash
# Run specific endpoint tests
npm test -- "compliance/verify"

# Run all API tests
npm test

# Check CI status
gh pr checks [PR_NUMBER]
```

## Related Issues

- Security improvements: Commit `b7832e9`
- Test fixes: Commit `d84e136`
- PR #659: Performance improvements and compliance features
- Security features added:
  - CSRF protection (origin/referer validation)
  - Document URL validation (Supabase domain check)
  - Notes length validation (2000 char limit)
  - Secure logging (sanitizes UUIDs, JWTs, emails)

## Best Practices

**Test-Driven Security** (TDD for Security Features):

1. Write security test cases FIRST
2. Implement security feature
3. Update existing tests to pass validation
4. Verify all tests pass locally
5. Push and verify CI passes

**Benefits**:
- Ensures security features work as expected
- Prevents breaking existing tests
- Documents security requirements
- Catches edge cases early

**Example TDD Flow**:
```typescript
// 1. Write test for CSRF protection
it('should reject requests without origin header', async () => {
  const response = await POST(requestWithoutOrigin, params);
  expect(response.status).toBe(403);
});

// 2. Implement CSRF validation in route handler
if (!origin && !referer) {
  return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
}

// 3. Update all existing tests to include origin header
headers: { origin: 'http://localhost:3000' }

// 4. Run tests - all pass
```

## References

- **CSRF Protection**: https://owasp.org/www-community/attacks/csrf
- **Jest Mocking**: https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options
- **Next.js API Testing**: https://nextjs.org/docs/app/building-your-application/testing
- **Secure Logging**: `lib/utils/secure-logging.ts`
- **Test File**: `app/api/admin/agencies/[id]/compliance/verify/__tests__/route.test.ts`
