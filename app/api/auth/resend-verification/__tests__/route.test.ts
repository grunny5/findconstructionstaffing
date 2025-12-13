/**
 * @jest-environment node
 */
import { POST, __TEST__clearRateLimits } from '../route';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

describe('POST /api/auth/resend-verification', () => {
  const mockResend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear rate limit store between tests
    __TEST__clearRateLimits();

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Mock Supabase admin client
    mockedCreateClient.mockReturnValue({
      auth: {
        resend: mockResend,
      },
    } as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe('Request validation', () => {
    it('should accept valid email format', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const request = createMockRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      });
    });

    it('should return success message for invalid email format (prevent enumeration)', async () => {
      const request = createMockRequest({ email: 'invalid-email' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
      expect(mockResend).not.toHaveBeenCalled();
    });

    it('should return success message for missing email field (prevent enumeration)', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
      expect(mockResend).not.toHaveBeenCalled();
    });
  });

  describe('Rate limiting', () => {
    it('should allow first request', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const request = createMockRequest({ email: 'ratelimit@example.com' });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockResend).toHaveBeenCalledTimes(1);
    });

    it('should allow second request within window', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const email = 'ratelimit2@example.com';

      // First request
      const request1 = createMockRequest({ email });
      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // Second request
      const request2 = createMockRequest({ email });
      const response2 = await POST(request2);
      expect(response2.status).toBe(200);

      expect(mockResend).toHaveBeenCalledTimes(2);
    });

    it('should block third request within window (rate limit)', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const email = 'ratelimit3@example.com';

      // First request
      const request1 = createMockRequest({ email });
      await POST(request1);

      // Second request
      const request2 = createMockRequest({ email });
      await POST(request2);

      // Third request - should be blocked
      const request3 = createMockRequest({ email });
      const response3 = await POST(request3);
      const data3 = await response3.json();

      expect(response3.status).toBe(429);
      expect(data3.message).toBe(
        'Please wait before requesting another verification email.'
      );
      expect(data3.retryAfter).toBeGreaterThan(0);
      expect(mockResend).toHaveBeenCalledTimes(2); // Only first 2 requests
    });

    it('should include Retry-After header on rate limit', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const email = 'retryafter@example.com';

      // Make 2 successful requests
      await POST(createMockRequest({ email }));
      await POST(createMockRequest({ email }));

      // Third request should be rate limited
      const request3 = createMockRequest({ email });
      const response3 = await POST(request3);

      expect(response3.status).toBe(429);
      expect(response3.headers.get('Retry-After')).toBeTruthy();
      const retryAfter = Number(response3.headers.get('Retry-After'));
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(600); // 10 minutes in seconds
    });

    it('should track rate limits separately for different emails', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Make 2 requests for email1
      await POST(createMockRequest({ email: email1 }));
      await POST(createMockRequest({ email: email1 }));

      // Request for email2 should still succeed
      const request = createMockRequest({ email: email2 });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockResend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Supabase integration', () => {
    it('should call Supabase resend with correct parameters', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const request = createMockRequest({ email: 'verify@example.com' });

      await POST(request);

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'verify@example.com',
      });
    });

    it('should create admin client with service role key', async () => {
      mockResend.mockResolvedValue({ data: {}, error: null });

      const request = createMockRequest({ email: 'admin@example.com' });

      await POST(request);

      expect(mockedCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    });

    it('should return success message even when Supabase returns error (prevent enumeration)', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: { message: 'User not found', status: 404 },
      });

      const request = createMockRequest({ email: 'nonexistent@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
    });
  });

  describe('Error handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      mockResend.mockRejectedValue(new Error('Network error'));

      const request = createMockRequest({ email: 'error@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
    });
  });

  describe('Security', () => {
    it('should not expose whether email exists in system', async () => {
      // Test with valid email
      mockResend.mockResolvedValue({ data: {}, error: null });
      const request1 = createMockRequest({ email: 'exists@example.com' });
      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Test with non-existent email
      mockResend.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });
      const request2 = createMockRequest({ email: 'nonexistent@example.com' });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Both should return identical responses
      expect(response1.status).toBe(response2.status);
      expect(data1.message).toBe(data2.message);
    });

    it('should not expose internal errors to users', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockResend.mockRejectedValue(new Error('Internal database error'));

      const request = createMockRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).not.toContain('Internal database error');
      expect(data.message).toBe(
        'If this email exists, we sent a verification link. Please check your inbox.'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
