import { createClient } from '@supabase/supabase-js';

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

// Create and export Supabase client
// In test/build environment, use dummy values if not provided
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-anon-key'
);

// Re-export types from shared location
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Re-export createClient for testing purposes
export { createClient };
