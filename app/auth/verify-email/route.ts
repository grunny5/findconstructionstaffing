import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  trackEmailVerificationCompleted,
  trackEmailVerificationFailed,
} from '@/lib/monitoring/auth-metrics';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/auth/verify-email/error?message=Missing verification code',
        request.url
      )
    );
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Email verification error:', error);

      let errorMessage = 'Verification failed';

      // Use error.code for structured error handling (more reliable than message matching)
      const code = error.code?.toLowerCase() ?? '';
      const message = error.message?.toLowerCase() ?? '';

      if (code.includes('expired') || message.includes('expired')) {
        errorMessage = 'Verification link has expired';
      } else if (
        code.includes('invalid') ||
        code === 'bad_jwt' ||
        message.includes('invalid')
      ) {
        errorMessage = 'Invalid verification link';
      } else if (code.includes('exists') || message.includes('already')) {
        errorMessage = 'Email already verified';
      }

      // Track verification failure
      trackEmailVerificationFailed(errorMessage);

      return NextResponse.redirect(
        new URL(
          `/auth/verify-email/error?message=${encodeURIComponent(errorMessage)}`,
          request.url
        )
      );
    }

    // Track successful verification
    trackEmailVerificationCompleted();

    return NextResponse.redirect(
      new URL('/auth/verify-email/success?verified=true', request.url)
    );
  } catch (error) {
    console.error('Unexpected error during email verification:', error);

    // Track unexpected verification failure
    trackEmailVerificationFailed('Unexpected error occurred');

    return NextResponse.redirect(
      new URL(
        '/auth/verify-email/error?message=An unexpected error occurred',
        request.url
      )
    );
  }
}
