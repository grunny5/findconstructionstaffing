/**
 * @jest-environment node
 */
import { middleware, config } from '@/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@supabase/ssr');

const mockedCreateServerClient = jest.mocked(createServerClient);

// Helper to create mock request
function createMockRequest(pathname: string): NextRequest {
  return {
    nextUrl: {
      pathname,
    },
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
    },
    headers: new Headers(),
  } as any as NextRequest;
}

describe('Middleware - Session Management', () => {
  let mockGetUser: jest.Mock;
  let capturedCookieHandlers: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    // Mock createServerClient to capture cookie handlers
    mockedCreateServerClient.mockImplementation((url, key, opts) => {
      if (opts?.cookies) {
        capturedCookieHandlers = opts.cookies;
      }

      return {
        auth: {
          getUser: mockGetUser,
        },
      } as any;
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('Environment Variables', () => {
    it('should skip middleware when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockedCreateServerClient).not.toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should skip middleware when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockedCreateServerClient).not.toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should proceed with middleware when environment variables are set', async () => {
      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockedCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.any(Object)
      );
      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session with valid user', async () => {
      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockGetUser).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle getUser returning null user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockGetUser).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle getUser returning error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockGetUser).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should catch getUser throwing exception and continue', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetUser.mockRejectedValue(new Error('Network error'));

      const request = createMockRequest('/api/test');
      const response = await middleware(request);

      expect(mockGetUser).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error refreshing session in middleware:',
        expect.any(Error)
      );
      expect(response).toBeInstanceOf(NextResponse);

      consoleErrorSpy.mockRestore();
    });

    it('should log errors with descriptive message', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const testError = new Error('Test error');
      mockGetUser.mockRejectedValue(testError);

      const request = createMockRequest('/api/test');
      await middleware(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error refreshing session in middleware:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cookie Operations', () => {
    it('should provide cookie get handler to Supabase client', async () => {
      const request = createMockRequest('/api/test');
      await middleware(request);

      expect(capturedCookieHandlers).toBeDefined();
      expect(typeof capturedCookieHandlers.get).toBe('function');
    });

    it('should provide cookie set handler to Supabase client', async () => {
      const request = createMockRequest('/api/test');
      await middleware(request);

      expect(capturedCookieHandlers).toBeDefined();
      expect(typeof capturedCookieHandlers.set).toBe('function');
    });

    it('should provide cookie remove handler to Supabase client', async () => {
      const request = createMockRequest('/api/test');
      await middleware(request);

      expect(capturedCookieHandlers).toBeDefined();
      expect(typeof capturedCookieHandlers.remove).toBe('function');
    });

    it('should call request.cookies.set in set handler', async () => {
      const request = createMockRequest('/api/test');
      await middleware(request);

      // Simulate Supabase calling the set handler
      capturedCookieHandlers.set('test-cookie', 'test-value', {});

      expect(request.cookies.set).toHaveBeenCalledWith({
        name: 'test-cookie',
        value: 'test-value',
      });
    });

    it('should call request.cookies.set in remove handler', async () => {
      const request = createMockRequest('/api/test');
      await middleware(request);

      // Simulate Supabase calling the remove handler
      capturedCookieHandlers.remove('test-cookie', {});

      expect(request.cookies.set).toHaveBeenCalledWith({
        name: 'test-cookie',
        value: '',
      });
    });

    it('should not recreate NextResponse in set handler', async () => {
      const nextSpy = jest.spyOn(NextResponse, 'next');

      const request = createMockRequest('/api/test');
      await middleware(request);

      // Clear the spy to only count calls after initial response creation
      const initialCallCount = nextSpy.mock.calls.length;

      // Simulate multiple cookie operations
      if (capturedCookieHandlers) {
        capturedCookieHandlers.set('cookie1', 'value1', {});
        capturedCookieHandlers.set('cookie2', 'value2', {});
      }

      // Should not have created additional NextResponse instances
      expect(nextSpy.mock.calls.length).toBe(initialCallCount);

      nextSpy.mockRestore();
    });

    it('should not recreate NextResponse in remove handler', async () => {
      const nextSpy = jest.spyOn(NextResponse, 'next');

      const request = createMockRequest('/api/test');
      await middleware(request);

      // Clear the spy to only count calls after initial response creation
      const initialCallCount = nextSpy.mock.calls.length;

      // Simulate multiple cookie removals
      if (capturedCookieHandlers) {
        capturedCookieHandlers.remove('cookie1', {});
        capturedCookieHandlers.remove('cookie2', {});
      }

      // Should not have created additional NextResponse instances
      expect(nextSpy.mock.calls.length).toBe(initialCallCount);

      nextSpy.mockRestore();
    });
  });

  describe('Matcher Configuration', () => {
    it('should have matcher configuration', () => {
      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it('should have at least one matcher pattern', () => {
      expect(config.matcher.length).toBeGreaterThan(0);
    });

    it('should exclude _next/static files', () => {
      const pattern = config.matcher[0];
      // The pattern should exclude _next/static
      expect(pattern).toContain('_next/static');
    });

    it('should exclude _next/image files', () => {
      const pattern = config.matcher[0];
      // The pattern should exclude _next/image
      expect(pattern).toContain('_next/image');
    });

    it('should exclude favicon.ico', () => {
      const pattern = config.matcher[0];
      // The pattern should exclude favicon.ico
      expect(pattern).toContain('favicon.ico');
    });

    it('should exclude image files', () => {
      const pattern = config.matcher[0];
      // The pattern should exclude svg, png, jpg, etc.
      expect(pattern).toMatch(/svg|png|jpg|jpeg|gif|webp/);
    });
  });
});
