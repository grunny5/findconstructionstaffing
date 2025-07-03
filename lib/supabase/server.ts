import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
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

  // Create Supabase client for server-side usage
  // In production, this would include auth headers from cookies
  const supabase = createSupabaseClient(
    supabaseUrl || 'https://dummy.supabase.co',
    supabaseAnonKey || 'dummy-anon-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  return supabase;
}
