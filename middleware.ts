import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for Supabase Auth Session Management
 *
 * This middleware runs on every request and:
 * 1. Reads the session from cookies
 * 2. Refreshes the session if it's about to expire
 * 3. Writes the refreshed session back to cookies
 * 4. Handles errors gracefully to prevent site-wide outages
 *
 * This is required for server-side auth to work properly with Supabase SSR.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Skip middleware if Supabase isn't configured
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Set the cookie on the request for downstream use
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Mutate the existing response to persist the cookie
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // Remove from request
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        // Mutate the existing response to remove the cookie
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh the session - this is the key step that keeps auth working
  // The getUser() call will refresh the session if needed
  try {
    await supabase.auth.getUser();
  } catch (error) {
    // Log but don't block - let request continue even if session refresh fails
    // This prevents middleware errors from causing site-wide outages
    console.error('Error refreshing session in middleware:', error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
