/**
 * Tests for Auth Callback Route
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase server client
jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

/**
 * Type for the mocked Supabase client auth methods used in tests
 */
interface MockSupabaseAuth {
  exchangeCodeForSession: jest.Mock<
    Promise<{
      data: { session: { user: { id: string } } } | null;
      error: Error | null;
    }>
  >;
}

interface MockSupabaseClient {
  auth: MockSupabaseAuth;
}

describe('GET /auth/callback', () => {
  let mockSupabaseClient: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        exchangeCodeForSession: jest.fn(),
      },
    };

    mockedCreateClient.mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<ReturnType<typeof createClient>>
    );
  });

  describe('Missing code parameter', () => {
    it('should redirect to home with error when code is missing', async () => {
      const request = new NextRequest('http://localhost/auth/callback');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/?error=missing_code'
      );
    });

    it('should redirect to home with error when code is empty', async () => {
      const request = new NextRequest('http://localhost/auth/callback?code=');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/?error=missing_code'
      );
    });
  });

  describe('Password reset (recovery) flow', () => {
    it('should redirect to reset-password on successful code exchange', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&type=recovery'
      );
      const response = await GET(request);

      expect(
        mockSupabaseClient.auth.exchangeCodeForSession
      ).toHaveBeenCalledWith('valid-code');
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/reset-password'
      );
    });

    it('should redirect to forgot-password with error on failed code exchange', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: new Error('Invalid or expired code'),
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=invalid-code&type=recovery'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/forgot-password?error=');
      expect(location).toContain('expired');
    });
  });

  describe('Email verification (signup) flow', () => {
    it('should redirect to verify-email/success on successful signup verification', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&type=signup'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/auth/verify-email/success'
      );
    });
  });

  describe('Default flow (magic link, etc.)', () => {
    it('should redirect to home by default', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should redirect to custom next URL when provided', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=/dashboard'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/dashboard'
      );
    });
  });

  describe('Error handling', () => {
    it('should redirect to login with error on general auth failure', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: new Error('Auth failed'),
      });

      const request = new NextRequest(
        'http://localhost/auth/callback?code=bad-code'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login?error=');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login?error=');
      expect(location).toContain('unexpected');
    });
  });

  describe('Open redirect protection', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
    });

    it('should reject scheme-relative URLs (//evil.com)', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=//evil.com/malicious'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should reject absolute URLs (even same-origin)', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=http://localhost/profile'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should reject external URLs', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=https://evil.com/malicious'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should reject paths with colon before slash (protocol injection)', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=/javascript:alert(1)//'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should reject URLs with backslashes', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=/evil\\path'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should allow valid relative paths', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=/dashboard/settings'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/dashboard/settings'
      );
    });

    it('should allow relative paths with query strings containing colons', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=/search?time=10:30'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost/search?time=10:30'
      );
    });

    it('should default to / for non-path URLs', async () => {
      const request = new NextRequest(
        'http://localhost/auth/callback?code=valid-code&next=not-a-valid-url'
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/');
    });

    it('should truncate excessively long paths', async () => {
      const longPath = '/dashboard' + '/a'.repeat(3000);
      const request = new NextRequest(
        `http://localhost/auth/callback?code=valid-code&next=${encodeURIComponent(longPath)}`
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      // Should be truncated to 2048 chars max
      expect(location).toBe('http://localhost' + longPath.slice(0, 2048));
    });
  });
});
