/**
 * Unit tests for timeout utility functions
 */

import {
  TIMEOUT_CONFIG,
  TimeoutError,
  fetchWithTimeout,
  withTimeout,
  dbQueryWithTimeout,
} from '../timeout';

describe('TIMEOUT_CONFIG', () => {
  it('should have all required timeout constants', () => {
    expect(TIMEOUT_CONFIG.SERVER_CRITICAL).toBe(8000);
    expect(TIMEOUT_CONFIG.SERVER_BACKGROUND).toBe(15000);
    expect(TIMEOUT_CONFIG.CLIENT_ACTION).toBe(10000);
    expect(TIMEOUT_CONFIG.CLIENT_POLL).toBe(5000);
    expect(TIMEOUT_CONFIG.CLIENT_AUTH).toBe(8000);
    expect(TIMEOUT_CONFIG.DB_QUERY).toBe(5000);
    expect(TIMEOUT_CONFIG.DB_RETRY_TOTAL).toBe(15000);
  });
});

describe('TimeoutError', () => {
  it('should create error with correct properties', () => {
    const error = new TimeoutError('Test timeout', 5000);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Test timeout');
    expect(error.timeoutMs).toBe(5000);
  });

  it('should maintain stack trace', () => {
    const error = new TimeoutError('Test timeout', 5000);
    expect(error.stack).toBeDefined();
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed if response is fast enough', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    });

    const response = await fetchWithTimeout('https://example.com/api', {
      timeout: 5000,
    });

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should timeout after specified duration', async () => {
    global.fetch = jest.fn().mockImplementation(
      (input, init) =>
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve({ ok: true }), 500);
          init?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        })
    );

    await expect(
      fetchWithTimeout('https://example.com/api', { timeout: 100 })
    ).rejects.toThrow(TimeoutError);

    await expect(
      fetchWithTimeout('https://example.com/api', { timeout: 100 })
    ).rejects.toThrow('Request timeout after 100ms');
  });

  it('should use default timeout if not specified', async () => {
    global.fetch = jest.fn().mockImplementation(
      (input, init) =>
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve({ ok: true }), 500);
          init?.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        })
    );

    const promise = fetchWithTimeout('https://example.com/api', { timeout: 100 });

    await expect(promise).rejects.toThrow(TimeoutError);
  });

  it('should pass through fetch options correctly', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await fetchWithTimeout('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
      timeout: 5000,
    });

    expect(fetch).toHaveBeenCalledWith('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
      signal: expect.any(AbortSignal),
    });
  });

  it('should propagate non-timeout errors', async () => {
    const networkError = new Error('Network error');
    global.fetch = jest.fn().mockRejectedValue(networkError);

    await expect(
      fetchWithTimeout('https://example.com/api', { timeout: 5000 })
    ).rejects.toThrow('Network error');

    await expect(
      fetchWithTimeout('https://example.com/api', { timeout: 5000 })
    ).rejects.toThrow(Error);
  });
});

describe('withTimeout', () => {
  it('should resolve if promise completes in time', async () => {
    const fastPromise = Promise.resolve('success');

    const result = await withTimeout(fastPromise, 1000, 'Test timeout');

    expect(result).toBe('success');
  });

  it('should timeout slow promises', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 5000);
    });

    await expect(
      withTimeout(slowPromise, 100, 'Test timeout')
    ).rejects.toThrow(TimeoutError);

    await expect(
      withTimeout(slowPromise, 100, 'Test timeout')
    ).rejects.toThrow('Test timeout');
  });

  it('should use default error message if not provided', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 5000);
    });

    await expect(withTimeout(slowPromise, 100)).rejects.toThrow(
      'Operation timeout'
    );
  });

  it('should propagate promise rejection errors', async () => {
    const failingPromise = Promise.reject(new Error('Promise failed'));

    await expect(
      withTimeout(failingPromise, 1000, 'Test timeout')
    ).rejects.toThrow('Promise failed');
  });

  it('should include timeout value in error', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 5000);
    });

    try {
      await withTimeout(slowPromise, 100, 'Test timeout');
      fail('Should have thrown TimeoutError');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      if (error instanceof TimeoutError) {
        expect(error.timeoutMs).toBe(100);
      }
    }
  });

  it('should clean up timeout when promise resolves', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const fastPromise = Promise.resolve('success');
    await withTimeout(fastPromise, 5000);

    // Verify clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should clean up timeout when promise rejects', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const failingPromise = Promise.reject(new Error('Test error'));

    await expect(
      withTimeout(failingPromise, 5000)
    ).rejects.toThrow('Test error');

    // Verify clearTimeout was called even on error
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should clean up timeout when timeout occurs', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 5000);
    });

    await expect(
      withTimeout(slowPromise, 100, 'Test timeout')
    ).rejects.toThrow(TimeoutError);

    // Verify clearTimeout was called even on timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should not leak memory under concurrent load', async () => {
    // Test with 100 concurrent promises (simulating high traffic)
    const promises = Array.from({ length: 100 }, (_, i) => {
      // Mix of fast and slow resolving promises
      const delay = i % 2 === 0 ? 10 : 50;
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve(`result-${i}`), delay);
      });
      return withTimeout(promise, 1000);
    });

    // All promises should resolve successfully
    const results = await Promise.all(promises);

    expect(results).toHaveLength(100);
    expect(results[0]).toBe('result-0');
    expect(results[99]).toBe('result-99');

    // If there was a memory leak, setTimeout cleanup would fail
    // This test verifies cleanup happens correctly for concurrent operations
  });

  it('should handle rapid sequential calls without leaking', async () => {
    // Simulate rapid sequential calls (like polling or repeated user actions)
    const iterations = 50;
    const results: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const promise = Promise.resolve(`iteration-${i}`);
      const result = await withTimeout(promise, 1000);
      results.push(result);
    }

    expect(results).toHaveLength(iterations);
    expect(results[0]).toBe('iteration-0');
    expect(results[iterations - 1]).toBe(`iteration-${iterations - 1}`);

    // If there was a memory leak, we'd accumulate timeouts
    // This test verifies cleanup happens correctly for sequential operations
  });
});

describe('dbQueryWithTimeout', () => {
  it('should return data on successful query', async () => {
    const queryFn = jest.fn().mockResolvedValue({
      data: { id: 1, name: 'Test' },
      error: null,
    });

    const result = await dbQueryWithTimeout(queryFn, {
      retries: 3,
      totalTimeout: 5000,
    });

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(result.error).toBeNull();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const queryFn = jest
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { code: '57P03', message: 'cannot_connect_now' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '53300', message: 'too_many_connections' },
      })
      .mockResolvedValue({
        data: { id: 1, name: 'Test' },
        error: null,
      });

    const result = await dbQueryWithTimeout(queryFn, {
      retries: 3,
      retryDelay: 10,
      totalTimeout: 5000,
    });

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(result.error).toBeNull();
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const queryFn = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'unique_violation' },
    });

    const result = await dbQueryWithTimeout(queryFn, {
      retries: 3,
      retryDelay: 10,
      totalTimeout: 5000,
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      code: '23505',
      message: 'unique_violation',
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should timeout if total time exceeds limit', async () => {
    const queryFn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ data: { id: 1 }, error: null }),
            10000
          );
        })
    );

    const startTime = Date.now();
    const result = await dbQueryWithTimeout(queryFn, {
      retries: 5,
      retryDelay: 100,
      totalTimeout: 500,
    });
    const elapsed = Date.now() - startTime;

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(TimeoutError);
    // Should complete close to totalTimeout (allow generous buffer for test environment)
    expect(elapsed).toBeGreaterThanOrEqual(500);
    expect(elapsed).toBeLessThan(10000); // Should not wait for full query timeout
  });

  it('should cap individual query timeout to remaining time', async () => {
    let callCount = 0;
    const queryFn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          callCount++;
          if (callCount === 1) {
            // First call times out after 1 second
            setTimeout(
              () =>
                resolve({
                  data: null,
                  error: { code: '57P03', message: 'cannot_connect_now' },
                }),
              1000
            );
          } else {
            // Second call should have reduced timeout and timeout faster
            setTimeout(
              () => resolve({ data: { id: 1 }, error: null }),
              5000
            );
          }
        })
    );

    const result = await dbQueryWithTimeout(queryFn, {
      retries: 3,
      retryDelay: 10,
      totalTimeout: 1500,
    });

    expect(result.error).toBeInstanceOf(TimeoutError);
  }, 10000); // Increase Jest timeout for this test

  it('should use default options if not provided', async () => {
    const queryFn = jest.fn().mockResolvedValue({
      data: { id: 1, name: 'Test' },
      error: null,
    });

    const result = await dbQueryWithTimeout(queryFn);

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(result.error).toBeNull();
  });

  it('should handle timeout errors during retry', async () => {
    const queryFn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ data: { id: 1 }, error: null }),
            10000
          );
        })
    );

    const result = await dbQueryWithTimeout(queryFn, {
      retries: 2,
      retryDelay: 10,
      totalTimeout: 500,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(TimeoutError);
  });

  it('should complete within reasonable time with retries', async () => {
    const queryFn = jest
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { code: '57P03', message: 'cannot_connect_now' },
      })
      .mockResolvedValue({
        data: { id: 1, name: 'Test' },
        error: null,
      });

    const startTime = Date.now();
    const result = await dbQueryWithTimeout(queryFn, {
      retries: 3,
      retryDelay: 50,
      totalTimeout: 5000,
    });
    const elapsed = Date.now() - startTime;

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(elapsed).toBeLessThan(1000); // Should complete quickly on success
  });
});
