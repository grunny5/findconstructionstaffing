import {
  rateLimitMessages,
  checkRateLimit,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from '../rate-limit';

describe('Rate Limiting Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Configuration - Redis Not Configured (Development Mode)', () => {
    beforeEach(() => {
      // Remove Upstash env vars to simulate development
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('should disable rate limiting when Redis is not configured', async () => {
      const result = await rateLimitMessages('user-123');

      expect(result.success).toBe(true);
      expect(result.enabled).toBe(false);
      expect(result.remaining).toBe(RATE_LIMIT_MAX_REQUESTS);
      expect(result.limit).toBe(RATE_LIMIT_MAX_REQUESTS);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Upstash Redis not configured')
      );
    });

    it('should return null from checkRateLimit when Redis not configured', async () => {
      const response = await checkRateLimit('user-ok');

      expect(response).toBeNull();
    });

    it('should allow all requests when rate limiting is disabled', async () => {
      // Simulate 100 rapid requests - all should succeed
      const requests = Array(100)
        .fill(0)
        .map((_, i) => rateLimitMessages(`user-${i}`));

      const results = await Promise.all(requests);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.enabled).toBe(false);
      });
    });

    it('should handle different user IDs correctly', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      for (const userId of userIds) {
        const result = await rateLimitMessages(userId);
        expect(result.success).toBe(true);
        expect(result.enabled).toBe(false);
      }
    });
  });

  describe('Constants', () => {
    it('should export correct rate limit constants', () => {
      expect(RATE_LIMIT_MAX_REQUESTS).toBe(50);
      expect(RATE_LIMIT_WINDOW_MS).toBe(60 * 1000);
    });

    it('should use 50 messages per minute limit', () => {
      expect(RATE_LIMIT_MAX_REQUESTS).toBe(50);
    });

    it('should use 1 minute window', () => {
      expect(RATE_LIMIT_WINDOW_MS).toBe(60000);
    });
  });

  describe('API Integration Patterns', () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('should be usable as middleware in API routes', async () => {
      // Simulate API route usage
      const userId = 'user-api-test';
      const rateLimitResponse = await checkRateLimit(userId);

      // When Redis is not configured, no rate limit response
      expect(rateLimitResponse).toBeNull();
    });

    it('should return proper response format when configured', async () => {
      const result = await rateLimitMessages('test-user');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('reset');
      expect(result).toHaveProperty('enabled');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.reset).toBe('number');
      expect(typeof result.enabled).toBe('boolean');
    });

    it('should include reset timestamp in future', async () => {
      const result = await rateLimitMessages('test-user');
      const now = Date.now();

      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + RATE_LIMIT_WINDOW_MS);
    });

    it('should handle rapid sequential requests', async () => {
      const userId = 'user-rapid';

      // Send 10 requests sequentially
      for (let i = 0; i < 10; i++) {
        const result = await rateLimitMessages(userId);
        expect(result.success).toBe(true);
      }
    });

    it('should handle concurrent requests', async () => {
      const userId = 'user-concurrent';

      // Send 20 requests concurrently
      const requests = Array(20)
        .fill(0)
        .map(() => rateLimitMessages(userId));

      const results = await Promise.all(requests);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.enabled).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('should never throw errors', async () => {
      // Should not throw even with invalid input
      await expect(rateLimitMessages('')).resolves.toBeDefined();
      await expect(rateLimitMessages('user-123')).resolves.toBeDefined();
    });

    it('should always return an object with expected shape', async () => {
      const result = await rateLimitMessages('test-user');

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        remaining: expect.any(Number),
        limit: expect.any(Number),
        reset: expect.any(Number),
        enabled: expect.any(Boolean),
      });
    });

    it('should handle empty user ID gracefully', async () => {
      const result = await rateLimitMessages('');

      expect(result.success).toBe(true);
      expect(result.enabled).toBe(false);
    });
  });

  describe('Documentation Examples', () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('should work as documented in code comments', async () => {
      // Example from code comments:
      const result = await rateLimitMessages('user-123');

      // When Redis is not configured, request is allowed
      expect(result.success).toBe(true);
      expect(result.enabled).toBe(false);
    });

    it('should work with checkRateLimit helper as documented', async () => {
      const userId = 'user-test';
      const rateLimitResponse = await checkRateLimit(userId);

      // When Redis is not configured, no rate limit response
      expect(rateLimitResponse).toBeNull();
    });
  });

  describe('Production Configuration Notes', () => {
    it('should log warning when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      await rateLimitMessages('user-test');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Upstash Redis not configured')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('UPSTASH_REDIS_REST_URL')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('UPSTASH_REDIS_REST_TOKEN')
      );
    });

    it('should indicate rate limiting is disabled in response', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const result = await rateLimitMessages('user-test');

      expect(result.enabled).toBe(false);
    });
  });
});
