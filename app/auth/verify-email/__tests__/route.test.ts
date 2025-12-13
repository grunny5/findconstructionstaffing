import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server');

// Mock NextResponse.redirect
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: jest.fn((url: URL) => {
        const headers = new Headers();
        headers.set('location', url.toString());
        return {
          status: 307,
          headers,
        };
      }),
    },
  };
});

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

function createMockRequest(url: string): NextRequest {
  const nextUrl = new URL(url);
  return {
    url,
    nextUrl,
  } as NextRequest;
}

describe('GET /auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to error page when code is missing', async () => {
    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email'
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/error'
    );
    expect(response.headers.get('location')).toContain(
      'Missing%20verification%20code'
    );
  });

  it('should exchange code for session and redirect to success page', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: '123' } } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email?code=valid-code-123'
    );

    const response = await GET(request);

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'valid-code-123'
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/success?verified=true'
    );
  });

  it('should redirect to error page when token is expired', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Token has expired' },
        }),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email?code=expired-code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/error'
    );
    expect(response.headers.get('location')).toContain(
      'Verification%20link%20has%20expired'
    );
  });

  it('should redirect to error page when token is invalid', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid token provided' },
        }),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email?code=invalid-code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/error'
    );
    expect(response.headers.get('location')).toContain(
      'Invalid%20verification%20link'
    );
  });

  it('should redirect to error page when email is already verified', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Email already verified' },
        }),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email?code=already-verified-code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/error'
    );
    expect(response.headers.get('location')).toContain(
      'Email%20already%20verified'
    );
  });

  it('should handle unexpected errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: jest
          .fn()
          .mockRejectedValue(new Error('Network error')),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    const request = createMockRequest(
      'http://localhost:3000/auth/verify-email?code=test-code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain(
      '/auth/verify-email/error'
    );
    expect(response.headers.get('location')).toContain(
      'An%20unexpected%20error%20occurred'
    );
  });
});
