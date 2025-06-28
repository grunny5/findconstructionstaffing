import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
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

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export types from shared location
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';