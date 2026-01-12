/**
 * Secure Logging Utility
 *
 * Sanitizes sensitive data in logs for production environments.
 * Prevents exposure of:
 * - User IDs
 * - Agency IDs
 * - JWT tokens
 * - Email addresses
 * - API keys
 *
 * Usage:
 * ```typescript
 * import { sanitizeForLog, secureLog } from '@/lib/utils/secure-logging';
 *
 * // Sanitize individual values
 * console.log('User ID:', sanitizeForLog(userId));
 *
 * // Or use secure logging functions
 * secureLog.error('Error fetching profile', { userId, error });
 * ```
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Sanitize a single value for logging
 * - UUIDs: Show first 8 chars only (user/agency IDs)
 * - JWTs: Show "JWT:..." prefix only
 * - Emails: Show domain only
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
