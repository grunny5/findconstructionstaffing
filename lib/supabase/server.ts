import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip validation in test environment or during build
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const isBuildEnvironment =
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Validate required environment variables (skip in test/build environment)
  if (!isTestEnvironment && !isBuildEnvironment) {
    if (!supabaseUrl) {
      throw new Error(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
          'Please set it in your .env.local file. ' +
          'You can find this value in your Supabase project dashboard.'
      );
    }

    if (!supabaseAnonKey) {
      throw new Error(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
          'Please set it in your .env.local file. ' +
          'You can find this value in your Supabase project dashboard under Settings > API.'
      );
    }
  }

  // Create Supabase client for server-side usage with cookie-based sessions
  return createServerClient(
    supabaseUrl || 'https://dummy.supabase.co',
    supabaseAnonKey || 'dummy-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key (bypasses RLS)
 * Use ONLY for admin operations that require elevated privileges
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  });
}
