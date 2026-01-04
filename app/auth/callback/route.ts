import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/** Maximum allowed length for redirect paths */
const MAX_REDIRECT_PATH_LENGTH = 2048;

/**
 * Validates a redirect URL to prevent open redirect attacks.
 *
 * Only allows relative paths that:
 * - Start with a single '/' (not '//')
 * - Do not contain ':' before the first '/' in the path (prevents protocol injection)
 * - Do not contain backslashes (prevents path manipulation)
 * - Are within a reasonable length limit
 *
 * @param url - The URL to validate
 * @returns The validated relative path or '/' as a safe default
 */
function validateRedirectUrl(url: string | null): string {
  // Default to home for empty/null values
  if (!url || typeof url !== 'string') {
    return '/';
  }

  // Truncate excessively long values
  const truncated = url.slice(0, MAX_REDIRECT_PATH_LENGTH);

  // Must start with exactly one '/'
  if (!truncated.startsWith('/') || truncated.startsWith('//')) {
    return '/';
  }

  // Reject backslashes (can be used for path manipulation)
  if (truncated.includes('\\')) {
    return '/';
  }

  // Extract just the path portion (before query string or hash)
  const queryIndex = truncated.indexOf('?');
  const hashIndex = truncated.indexOf('#');
  let pathEndIndex = truncated.length;
  if (queryIndex !== -1) pathEndIndex = Math.min(pathEndIndex, queryIndex);
  if (hashIndex !== -1) pathEndIndex = Math.min(pathEndIndex, hashIndex);
  const pathOnly = truncated.slice(0, pathEndIndex);

  // Check for ':' appearing before any '/' in the path (after the leading slash)
  // This prevents 'javascript:', 'data:', or other protocol-like patterns
  const pathAfterSlash = pathOnly.slice(1);
  const colonIndex = pathAfterSlash.indexOf(':');
  const slashIndex = pathAfterSlash.indexOf('/');

  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) {
    return '/';
  }

  return truncated;
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
  const next = validateRedirectUrl(requestUrl.searchParams.get('next'));

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
