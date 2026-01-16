import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// Create and export Supabase client
// In test/build environment, use dummy values if not provided
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-anon-key'
);

// Create and export Supabase service role client (server-side only)
// This client bypasses RLS and should only be used in API routes
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseServiceKey || 'dummy-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Re-export types from shared location
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Re-export createClient for testing purposes
export { createClient };
