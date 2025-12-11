# CI/CD Database Connection Error Fix

## Problem

The CI/CD pipeline fails with database connection errors in the API routes:

```
[API ERROR] Database connection failed: ... code: 'DATABASE_ERROR', message: 'Connection failed'
```

## Root Cause

The API routes are attempting to connect to invalid test URLs (`https://test.supabase.co`) during test runs because:

1. The Supabase client is being initialized with dummy values in test environment
2. The API route code checks for environment variables and tries to make real connections
3. The mocks aren't preventing actual network calls in all cases

## Solution Implemented

### 1. Enhanced Test Detection in API Routes

Added checks to detect when Supabase is mocked by looking for mock-specific properties:

```typescript
const isMockedSupabase =
  supabase && typeof (supabase as any)._error !== 'undefined';
```

This prevents environment variable validation when running with mocked Supabase.

### 2. Updated CI Workflow

Added environment variables to ensure tests run in proper mock mode:

- `FORCE_TEST_MOCKS=true`
- `CI=true`

### 3. Improved Logging

Added development-only logging to reduce noise in production while maintaining error visibility.

## How It Works

1. **In Test Environment**:
   - Supabase client is created with dummy values
   - API routes detect mocked client and skip validation
   - Tests use mock implementations from `__tests__/utils/supabase-mock.ts`

2. **In Production**:
   - Real environment variables are required
   - Full validation occurs
   - Actual Supabase connections are made

## Required GitHub Secrets

For production/staging deployments, you still need to set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

See `docs/CI_CD_ENV_SETUP.md` for detailed setup instructions.

## Verification

To verify the fix:

1. Tests should pass without connection errors
2. The CI logs should not show "Database connection failed" errors
3. Mock detection should prevent validation in test environment

## Files Modified

1. `app/api/agencies/route.ts` - Added mock detection
2. `app/api/agencies/[slug]/route.ts` - Added mock detection and reduced logging
3. `.github/workflows/ci.yml` - Added test environment flags
4. `app/__tests__/filters.integration.test.tsx` - Added pagination validation

The solution ensures tests run with proper mocks while maintaining strict validation for production environments.
