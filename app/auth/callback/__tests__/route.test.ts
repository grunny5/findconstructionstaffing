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

describe('GET /auth/callback', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        exchangeCodeForSession: jest.fn(),
      },
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient);
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
});
