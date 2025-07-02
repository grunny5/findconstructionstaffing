import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client for build time if env vars are missing
// This allows Next.js to build without actual credentials
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy URL and key for build time
    // These will never actually connect to anything
    return createClient(
      'https://dummy.supabase.co',
      'dummy-anon-key'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Create and export Supabase client
export const supabase = createSupabaseClient();

// Re-export types from shared location
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Re-export createClient for testing purposes
export { createClient };
