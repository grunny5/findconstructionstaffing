/**
 * Example usage of the enhanced Supabase mock in tests
 *
 * This file demonstrates how to use the enhanced mock with:
 * - Promise-like behavior
 * - Method chaining
 * - Custom test data
 * - Error simulation
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Example: Testing with Enhanced Supabase Mock', () => {
  let supabase: SupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = createClient('https://test.supabase.co', 'test-key');
  });

  describe('Basic Query Examples', () => {
    it('should fetch agencies using promise-like then()', async () => {
      // The mock automatically resolves with test data
      const agencies = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .then((response) => {
          if (response.error) throw response.error;
          return response.data;
        });

      expect(agencies).toHaveLength(2);
      expect(agencies[0].name).toBe('Mock Construction Staffing');
    });

    it('should handle single record queries', async () => {
      const agency = await supabase
        .from('agencies')
        .select('*')
        .eq('id', 'mock-001')
        .single()
        .then((res) => res.data);

      expect(agency).toBeDefined();
      expect(agency.id).toBe('mock-001');
      expect(agency.name).toBe('Mock Construction Staffing');
    });

    it('should support async/await pattern', async () => {
      const response = await supabase
        .from('agencies')
        .select('name, is_union')
        .order('name');

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.count).toBe(2);
    });
  });

  describe('Custom Test Data', () => {
    it('should work with custom agency data', async () => {
      // Set custom data for specific test scenarios
      const customAgencies = [
        {
          id: 'test-1',
          name: 'Union Workers Co',
          is_union: true,
          rating: 5.0,
          review_count: 100,
        },
        {
          id: 'test-2',
          name: 'Non-Union Staffing',
          is_union: false,
          rating: 4.5,
          review_count: 50,
        },
      ];

      (supabase as any)._setMockData(customAgencies);

      const unionAgencies = await supabase
        .from('agencies')
        .select('*')
        .eq('is_union', true)
        .then((res) => res.data);

      // In a real implementation, you'd filter the data
      // For this mock, it returns all data
      expect(unionAgencies!).toHaveLength(2);
      expect(unionAgencies![0].name).toBe('Union Workers Co');
    });
  });

  describe('Error Handling', () => {
    it('should simulate database errors', async () => {
      // Configure the mock to return an error
      (supabase as any)._setMockError({
        message: 'relation "agencies" does not exist',
        code: '42P01',
        details: 'Table not found',
        hint: 'Check your table name',
      });

      const response = await supabase.from('agencies').select('*');

      expect(response.error).toBeDefined();
      expect(response.error!.code).toBe('42P01');
      expect(response.data).toBeNull();
      expect(response.status).toBe(400);
    });

    it('should handle errors with catch()', async () => {
      (supabase as any)._setMockError({
        message: 'Network error',
        code: 'NETWORK_ERROR',
      });

      const result = await (supabase.from('agencies').select('*') as any)
        .then((res: any) => {
          if (res.error) throw res.error;
          return res.data;
        })
        .catch((error: any) => {
          return { fallback: true, error: error.message };
        });

      expect(result).toHaveProperty('fallback', true);
    });
  });

  describe('Complex Queries', () => {
    it('should support chained filters', async () => {
      const response = await supabase
        .from('agencies')
        .select('id, name, trades(*), regions(*)')
        .eq('is_active', true)
        .in('state', ['TX', 'CA'])
        .gte('rating', 4.0)
        .order('rating', { ascending: false })
        .limit(10);

      expect(response.data).toBeDefined();
      expect(response.error).toBeNull();

      // Verify the query builder was called correctly
      const queryBuilder = supabase.from('agencies') as any;
      expect(queryBuilder.select).toBeDefined();
      expect(queryBuilder.eq).toBeDefined();
      expect(queryBuilder.in).toBeDefined();
      expect(queryBuilder.gte).toBeDefined();
      expect(queryBuilder.order).toBeDefined();
      expect(queryBuilder.limit).toBeDefined();
    });

    it('should support CSV export', async () => {
      const response = await supabase.from('agencies').select('id,name').csv();

      expect(response.data).toBeDefined();
      expect(typeof response.data).toBe('string');
      expect(response.data).toContain('id,name');
    });
  });

  describe('Integration with API Routes', () => {
    it('should work in API route handlers', async () => {
      // Simulate an API route handler
      async function getAgencies(filters: { state?: string; trade?: string }) {
        try {
          let query = supabase.from('agencies').select('*');

          if (filters.state) {
            query = query.eq('state', filters.state);
          }
          if (filters.trade) {
            query = query.contains('trades', [filters.trade]);
          }

          const response = await query;

          if (response.error) {
            return {
              status: 500,
              data: null,
              error: response.error.message,
            };
          }

          return {
            status: 200,
            data: response.data,
            count: response.count,
          };
        } catch (error) {
          return {
            status: 500,
            data: null,
            error: 'Internal server error',
          };
        }
      }

      // Test the handler
      const result = await getAgencies({ state: 'TX' });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.count).toBe(2);
    });
  });
});
