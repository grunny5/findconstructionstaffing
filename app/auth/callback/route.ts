import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows:
 * - Relative paths starting with a single '/' (e.g., '/dashboard')
 * - Absolute URLs matching the app origin
 * Rejects:
 * - Scheme-relative URLs (e.g., '//evil.com')
 * - External URLs
 * - Invalid URLs
 *
 * @param url - The URL to validate
 * @param origin - The app origin to validate against
 * @returns The validated URL path or '/' as a safe default
 */
function validateRedirectUrl(url: string | null, origin: string): string {
  if (!url) {
    return '/';
  }

  // Reject scheme-relative URLs (e.g., '//evil.com')
  if (url.startsWith('//')) {
    return '/';
  }

  // Allow relative paths starting with a single '/'
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Additional check: ensure it doesn't contain protocol-like patterns
    if (url.includes('://') || url.includes('\\')) {
      return '/';
    }
    return url;
  }

  // Try to parse as absolute URL
  try {
    const parsedUrl = new URL(url);
    const parsedOrigin = new URL(origin);

    // Only allow if origin matches exactly
    if (parsedUrl.origin === parsedOrigin.origin) {
      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    }
  } catch {
    // Invalid URL, fall through to default
  }

  return '/';
}

/**
 * Auth Callback Route
 *
 * Handles Supabase PKCE auth redirects for:
 * - Password reset (recovery)
 * - Email verification (signup)
 * - Magic link login
 *
 * Supabase redirects here with a `code` query parameter that we exchange
 * for a session, then redirect to the appropriate page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = validateRedirectUrl(
    requestUrl.searchParams.get('next'),
    requestUrl.origin
  );

  if (!code) {
    // No code provided, redirect to home with error
    return NextResponse.redirect(
      new URL('/?error=missing_code', requestUrl.origin)
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);

      // Redirect based on type with error
      if (type === 'recovery') {
        return NextResponse.redirect(
          new URL(
            `/forgot-password?error=${encodeURIComponent('Reset link expired or invalid. Please request a new one.')}`,
            requestUrl.origin
          )
        );
      }

      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`,
          requestUrl.origin
        )
      );
    }

    // Redirect based on type
    if (type === 'recovery') {
      // Password reset - redirect to reset password page
      return NextResponse.redirect(
        new URL('/reset-password', requestUrl.origin)
      );
    }

    if (type === 'signup') {
      // Email verification - redirect to success page
      return NextResponse.redirect(
        new URL('/auth/verify-email/success', requestUrl.origin)
      );
    }

    // Default redirect (magic link, etc.)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('An unexpected error occurred')}`,
        requestUrl.origin
      )
    );
  }
}
