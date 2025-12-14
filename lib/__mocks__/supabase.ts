// Consolidated Supabase mock for @/lib/supabase
// This mock uses the mocked createClient from @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

// Create and export the default mock instance using the mocked createClient
export const supabase = createClient(
  'https://test.supabase.co',
  'test-anon-key'
);

// Define comprehensive Supabase method types for type safety
type SupabaseMethod =
  | 'from'
  | 'select'
  | 'eq'
  | 'neq'
  | 'or'
  | 'in'
  | 'range'
  | 'order'
  | 'limit'
  | 'single'
  | 'delete'
  | 'insert'
  | 'update'
  | 'upsert'
  | 'match'
  | 'is'
  | 'filter'
  | 'not'
  | 'gte'
  | 'gt'
  | 'lte'
  | 'lt'
  | 'like'
  | 'ilike'
  | 'contains'
  | 'containedBy'
  | 'rangeGt'
  | 'rangeGte'
  | 'rangeLt'
  | 'rangeLte'
  | 'rangeAdjacent'
  | 'overlaps'
  | 'textSearch'
  | 'count'
  | 'maybeSingle'
  | 'csv';

// Factory function to create a mock Supabase instance (kept for backwards compatibility)
// This approach provides better control for test-specific configurations
export function createMockSupabase() {
  return createClient('https://test.supabase.co', 'test-anon-key');
}

// Re-export types from shared locations
export type { Agency, Trade, Region, Lead } from '@/types/supabase';

// Re-export utility functions from shared location
export { createSlug, formatPhoneNumber } from '@/lib/utils/formatting';

// Export a reset function for tests that need to reset the mock
export function resetSupabaseMock() {
  // Reset all auth mocks
  if (supabase.auth) {
    Object.values(supabase.auth).forEach((method) => {
      if (typeof method === 'function' && jest.isMockFunction(method)) {
        method.mockClear();
      }
    });
  }
}
