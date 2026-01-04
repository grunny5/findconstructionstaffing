// Mock for @/lib/supabase/client
// Re-uses the mock from @supabase/supabase-js for consistency

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Export createClient that returns a mocked Supabase instance
export const createClient = jest.fn(() => {
  return createSupabaseClient(
    'https://test.supabase.co',
    'test-anon-key'
  );
});
