/**
 * Centralized Timeout Utility for Fetch Operations
 *
 * Provides consistent timeout handling for all fetch operations (server and client).
 * Implements graceful degradation for non-critical features.
 */

/**
 * Timeout configuration constants for different use cases
 */
export const TIMEOUT_CONFIG = {
  /** Server-side blocking render (critical path) */
  SERVER_CRITICAL: 8000,
  /** Server-side non-blocking operations */
  SERVER_BACKGROUND: 15000,
  /** User-initiated clicks/forms (active waiting) */
  CLIENT_ACTION: 10000,
  /** Background polling (non-critical) */
  CLIENT_POLL: 5000,
  /** Auth initialization */
  CLIENT_AUTH: 8000,
  /** Single database query */
  DB_QUERY: 5000,
  /** Total timeout including all retry attempts */
  DB_RETRY_TOTAL: 15000,
} as const;

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = 'TimeoutError';

    // Maintain proper stack trace for where our error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**
 * Fetch wrapper with timeout protection
 *
 * @param input - URL or Request object
 * @param init - Fetch options with optional timeout
 * @returns Promise that resolves to Response or rejects with TimeoutError
 *
 * @example
 * const response = await fetchWithTimeout('/api/data', {
 *   timeout: TIMEOUT_CONFIG.CLIENT_ACTION,
 *   headers: { 'Content-Type': 'application/json' }
 * });
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {
  const timeout = init?.timeout ?? TIMEOUT_CONFIG.CLIENT_ACTION;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const { timeout: _, ...fetchInit } = init || {};
    const response = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
    }
    throw error;
  }
}

/**
 * Generic promise timeout wrapper
 *
 * Wraps a promise with timeout protection and properly cleans up resources
 * to prevent memory leaks. Uses setTimeout internally but guarantees cleanup
 * regardless of whether the promise resolves, rejects, or times out.
 *
 * @param promise - Promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns Promise that resolves or rejects with TimeoutError
 *
 * @example
 * const data = await withTimeout(
 *   supabase.from('profiles').select('*').single(),
 *   TIMEOUT_CONFIG.CLIENT_AUTH,
 *   'Profile fetch timeout'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new TimeoutError(errorMessage, timeoutMs)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Supabase-specific retryable errors
  const retryableCodes = [
    '57P03', // cannot_connect_now
    '53300', // too_many_connections
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
  ];

  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Network errors
  if (error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND')) {
    return true;
  }

  return false;
}

/**
 * Database query with retry + timeout cap
 *
 * @param queryFn - Function that returns a Supabase query result
 * @param options - Configuration for retries and timeout
 * @returns Promise that resolves to query result or error
 *
 * @example
 * const result = await dbQueryWithTimeout(
 *   async () => supabase.from('agencies').select('*').eq('slug', slug).single(),
 *   {
 *     retries: 3,
 *     retryDelay: 1000,
 *     totalTimeout: TIMEOUT_CONFIG.DB_RETRY_TOTAL,
 *   }
 * );
 */
export async function dbQueryWithTimeout<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    retries?: number;
    retryDelay?: number;
    totalTimeout?: number;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const {
    retries = 3,
    retryDelay = 1000,
    totalTimeout = TIMEOUT_CONFIG.DB_RETRY_TOTAL,
  } = options;

  const startTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const elapsed = Date.now() - startTime;

    // Check if we've exceeded total timeout
    if (elapsed >= totalTimeout) {
      return {
        data: null,
        error: new TimeoutError(
          `Database query exceeded total timeout of ${totalTimeout}ms`,
          totalTimeout
        ),
      };
    }

    const remainingTime = totalTimeout - elapsed;
    const attemptTimeout = Math.min(TIMEOUT_CONFIG.DB_QUERY, remainingTime);

    try {
      const result = await withTimeout(
        queryFn(),
        attemptTimeout,
        `Database query timeout on attempt ${attempt}`
      );

      // If no error, return success
      if (!result.error) {
        return result;
      }

      // If error is retryable and we have retries left, continue
      if (attempt < retries && isRetryableError(result.error)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // Non-retryable error or out of retries
      return result;
    } catch (error: any) {
      // Timeout error - retry if attempts remain
      if (error instanceof TimeoutError && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // Out of retries or non-timeout error
      return { data: null, error };
    }
  }

  // Fallback (should never reach here)
  return {
    data: null,
    error: new TimeoutError(
      `Database query failed after ${retries} retries`,
      totalTimeout
    ),
  };
}
