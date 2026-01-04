import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
  const next = requestUrl.searchParams.get('next') || '/';

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
