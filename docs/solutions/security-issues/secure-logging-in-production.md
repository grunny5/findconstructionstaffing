---
title: "Secure Logging in Production: Preventing PII Exposure"
component: "Logging/Security"
problem_type: "security_issue"
severity: "high"
status: "resolved"
tags: ["security", "logging", "pii", "production", "data-protection", "environment-aware"]
related_files:
  - "lib/utils/secure-logging.ts"
  - "app/api/admin/agencies/[id]/compliance/verify/route.ts"
  - "app/(app)/admin/agencies/[id]/page.tsx"
date_discovered: "2026-01-11"
date_resolved: "2026-01-11"
---

# Problem

Console logs in production environments expose sensitive data including Personally Identifiable Information (PII), authentication tokens, and internal IDs.

## Symptoms

**Production logs contain sensitive data:**
```javascript
console.log('User authenticated:', {
  userId: '123e4567-e89b-12d3-a456-426614174000',  // ← Full UUID exposed
  email: 'user@example.com',                       // ← Email exposed
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',        // ← JWT exposed
  apiKey: 'sk_live_51234567890abcdef'              // ← API key exposed
});

// Production output:
// User authenticated: { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com', ... }
```

**Security Risks:**
- **Data breach**: PII visible in log aggregation services
- **Compliance violation**: GDPR, CCPA, HIPAA violations
- **Token exposure**: JWTs and API keys leaked
- **Audit trail**: Sensitive data in persistent logs

**Why This Happens:**
- Developers use `console.log` for debugging
- Same logging code runs in development and production
- No automatic sanitization of sensitive data
- Log aggregation services store logs indefinitely

## Root Cause

Standard JavaScript logging (`console.log`, `console.error`, `console.warn`) outputs data verbatim without sanitization. When the same code runs in production:

1. **Development**: Full data visibility needed for debugging
2. **Production**: Same logs expose sensitive data to log aggregators
3. **No environment awareness**: Code doesn't distinguish between environments
4. **No automatic redaction**: JavaScript has no built-in PII protection

**Example from production logs:**
```
Error fetching user profile: { error: { message: 'Not found', userId: '123e4567-...' } }
```

The user ID should be sanitized in production but visible in development.

## Solution

### Implementation: Environment-Aware Secure Logging Utility

Create a custom logging utility that automatically sanitizes sensitive data in production while preserving full visibility in development.

#### File: `lib/utils/secure-logging.ts`

```typescript
/**
 * Secure Logging Utility
 *
 * Sanitizes sensitive data in logs for production environments.
 * Prevents exposure of:
 * - User IDs (UUIDs)
 * - Agency IDs
 * - JWT tokens
 * - Email addresses
 * - API keys
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Sanitize a single value for logging
 * - UUIDs: Show first 8 chars only (user/agency IDs)
 * - JWTs: Show "JWT:..." prefix only
 * - Emails: Show domain only
 * - API keys: Show prefix only (first 7 chars)
 * - Other strings: Unchanged
 */
export function sanitizeForLog(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  const str = String(value);

  // Skip sanitization in development
  if (!IS_PRODUCTION) {
    return str;
  }

  // UUID pattern (8-4-4-4-12)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return `${str.substring(0, 8)}...`;
  }

  // JWT pattern (header.payload.signature)
  if (/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(str)) {
    return 'JWT:...';
  }

  // Email pattern
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    const domain = str.split('@')[1];
    return `***@${domain}`;
  }

  // API key patterns (starts with common prefixes)
  if (/^(sk-|pk-|key-|api-|token-)/i.test(str)) {
    return `${str.substring(0, 7)}...`;
  }

  return str;
}

/**
 * Sanitize an object by recursively sanitizing all values
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (!IS_PRODUCTION) {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'object' && v !== null
          ? sanitizeObject(v as Record<string, unknown>)
          : sanitizeForLog(v)
      );
    } else {
      sanitized[key] = sanitizeForLog(value);
    }
  }

  return sanitized;
}

/**
 * Secure logging functions that automatically sanitize sensitive data
 */
export const secureLog = {
  /**
   * Log informational message with sanitized data
   */
  info(message: string, data?: Record<string, unknown>) {
    if (data) {
      console.log(message, sanitizeObject(data));
    } else {
      console.log(message);
    }
  },

  /**
   * Log warning with sanitized data
   */
  warn(message: string, data?: Record<string, unknown>) {
    if (data) {
      console.warn(message, sanitizeObject(data));
    } else {
      console.warn(message);
    }
  },

  /**
   * Log error with sanitized data
   */
  error(message: string, data?: Record<string, unknown>) {
    if (data) {
      console.error(message, sanitizeObject(data));
    } else {
      console.error(message);
    }
  },
};
```

### Usage Examples

#### Before (Unsafe):
```typescript
// API route handler
console.error('Error fetching user profile', {
  userId: user.id,                    // Full UUID exposed
  email: user.email,                  // Email exposed
  error: profileError
});

// Development output: Error fetching user profile { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com', ... }
// Production output: Error fetching user profile { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com', ... }
// ⚠️ PROBLEM: Sensitive data visible in production!
```

#### After (Safe):
```typescript
import { secureLog } from '@/lib/utils/secure-logging';

// API route handler
secureLog.error('Error fetching user profile', {
  userId: user.id,
  email: user.email,
  error: profileError
});

// Development output: Error fetching user profile { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com', ... }
// Production output: Error fetching user profile { userId: '123e4567...', email: '***@example.com', ... }
// ✅ SAFE: Sensitive data sanitized in production!
```

### Real-World Implementation

**File**: `app/api/admin/agencies/[id]/compliance/verify/route.ts`

```typescript
import { secureLog } from '@/lib/utils/secure-logging';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ... authentication logic ...

    if (profileError) {
      secureLog.error('Error fetching user profile', { error: profileError });
      // Production: { error: { message: '...', code: '...' } } - no user IDs
      return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR } });
    }

    // ... more logic ...

    if (updateError) {
      secureLog.error('Failed to verify compliance document', {
        error: updateError,
        agencyId,            // Sanitized in production (first 8 chars)
        complianceType,
      });
      return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR } });
    }

    secureLog.info('Compliance document verified successfully', {
      agencyId,              // Sanitized in production
      complianceType,
      verifiedBy: user.id,   // Sanitized in production
    });

    return NextResponse.json({ data: updatedCompliance });
  } catch (error) {
    secureLog.error('Unexpected error in compliance verification', { error });
    return NextResponse.json({ error: { code: ERROR_CODES.INTERNAL_ERROR } });
  }
}
```

### Sanitization Rules

| Data Type | Development | Production | Example |
|-----------|------------|------------|---------|
| **UUID** | Full value | First 8 chars + `...` | `123e4567...` |
| **JWT Token** | Full token | `JWT:...` | `JWT:...` |
| **Email** | Full email | `***@domain` | `***@example.com` |
| **API Key** (sk-, pk-, key-, api-, token-) | Full key | First 7 chars + `...` | `sk_live...` |
| **Other strings** | Unchanged | Unchanged | `"error message"` |
| **Numbers** | Unchanged | Unchanged | `42` |
| **Objects** | Full object | Recursively sanitized | `{ id: '123e4567...' }` |
| **Arrays** | Full array | Each element sanitized | `['123e4567...', '234f5678...']` |

### Testing

#### Unit Test
```typescript
import { sanitizeForLog, sanitizeObject } from '@/lib/utils/secure-logging';

describe('Secure Logging', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  it('sanitizes UUIDs in production', () => {
    expect(sanitizeForLog('123e4567-e89b-12d3-a456-426614174000'))
      .toBe('123e4567...');
  });

  it('sanitizes JWTs in production', () => {
    expect(sanitizeForLog('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'))
      .toBe('JWT:...');
  });

  it('sanitizes emails in production', () => {
    expect(sanitizeForLog('user@example.com'))
      .toBe('***@example.com');
  });

  it('sanitizes API keys in production', () => {
    expect(sanitizeForLog('sk_live_51234567890abcdef'))
      .toBe('sk_live...');
  });

  it('sanitizes nested objects', () => {
    const input = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      metadata: {
        agencyId: '234f5678-f89c-23e4-b567-537725285111',
      },
    };

    const result = sanitizeObject(input);

    expect(result).toEqual({
      userId: '123e4567...',
      email: '***@example.com',
      metadata: {
        agencyId: '234f5678...',
      },
    });
  });

  it('preserves full data in development', () => {
    process.env.NODE_ENV = 'development';

    expect(sanitizeForLog('123e4567-e89b-12d3-a456-426614174000'))
      .toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
```

#### Manual Testing
```bash
# Development (full visibility)
NODE_ENV=development node -e "
const { secureLog } = require('./lib/utils/secure-logging');
secureLog.info('Test log', {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com'
});
"
# Output: Test log { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com' }

# Production (sanitized)
NODE_ENV=production node -e "
const { secureLog } = require('./lib/utils/secure-logging');
secureLog.info('Test log', {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com'
});
"
# Output: Test log { userId: '123e4567...', email: '***@example.com' }
```

## Prevention Strategies

### 1. Code Review Checklist

**Before merging code, check:**
- [ ] All `console.log` calls replaced with `secureLog` in sensitive areas
- [ ] No direct logging of user IDs, emails, tokens, or API keys
- [ ] Object logging uses `secureLog.info/warn/error`
- [ ] Test logs in production mode (`NODE_ENV=production`)

### 2. ESLint Rule (Recommended)

Add custom ESLint rule to catch unsafe logging:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Disallow all console.* calls
    // Use secureLog from '@/lib/utils/secure-logging' instead
    'no-console': ['error', { allow: [] }],
  },
};
```

**Note**: The `no-console` rule will flag all direct `console.log`, `console.error`, and `console.warn` calls. Developers should use `secureLog.info()`, `secureLog.error()`, and `secureLog.warn()` from `@/lib/utils/secure-logging` instead.

### 3. Development vs Production Testing

Always test logging in both environments:

```typescript
// In CI/CD pipeline
npm run test                          # Development mode
NODE_ENV=production npm run test      # Production mode

// Manual verification
npm run dev                           # Check logs in development
npm run build && npm start            # Check logs in production build
```

### 4. Log Aggregation Configuration

Configure your log aggregation service (e.g., Datadog, Loggly, Splunk) to:
- **Scrub additional patterns**: Credit cards, SSNs, phone numbers
- **Set retention policies**: Automatically delete logs after 30-90 days
- **Access controls**: Limit who can view production logs
- **Audit trail**: Track who accessed sensitive log data

### 5. Gradual Adoption Strategy

Migrate existing code incrementally:

```typescript
// Phase 1: High-risk areas first (authentication, payments)
import { secureLog } from '@/lib/utils/secure-logging';

// Phase 2: User-facing APIs
secureLog.error('API error', { userId, error });

// Phase 3: Internal services
secureLog.info('Background job completed', { jobId, results });

// Phase 4: Create ESLint rule to enforce
'no-console': ['error', { allow: [] }]
```

## Related Issues

- PR #659: Security improvements for compliance features
- Commit `b7832e9`: Added secure logging utility
- Security review finding: "Sensitive data logged in production"
- Test documentation: `api-tests-fail-after-adding-security-features.md`

## Best Practices

### DO:
✅ Use `secureLog` for all logging in sensitive areas
✅ Test logging in production mode before deploying
✅ Add ESLint rule to prevent direct console usage
✅ Review logs regularly for accidentally exposed data
✅ Configure log aggregation with scrubbing rules

### DON'T:
❌ Use `console.log` directly in API routes or authentication code
❌ Log entire objects without sanitization
❌ Assume development logging is safe for production
❌ Store sensitive data in logs indefinitely
❌ Grant broad access to production logs

## References

- **OWASP Logging Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **GDPR Article 32**: Security of processing (data minimization in logs)
- **NIST SP 800-92**: Guide to Computer Security Log Management
- **Implementation**: `lib/utils/secure-logging.ts`
- **Usage examples**: `app/api/admin/agencies/[id]/compliance/verify/route.ts`
- **Test coverage**: `lib/utils/__tests__/secure-logging.test.ts`
