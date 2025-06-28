// Test file for the multi-table query mock helper
import { configureSupabaseMock, configureMockForFilters, resetSupabaseMock } from './supabase-mock';
import { supabase } from '@/lib/supabase';

describe('configureMockForFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);
  });

  describe('Trade Filter Mocking', () => {
    it('should mock trades table query correctly', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Test Agency' }],
        defaultCount: 1
      });

      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians', 'plumbers'],
          ids: ['trade-1', 'trade-2'],
          agencyIds: ['agency-1', 'agency-2']
        }
      });

      // Simulate trade filter query
      const tradesResult = await supabase
        .from('trades')
        .select('id')
        .in('slug', ['electricians', 'plumbers']);

      expect(tradesResult.data).toEqual([
        { id: 'trade-1' },
        { id: 'trade-2' }
      ]);
      expect(tradesResult.error).toBeNull();
    });

    it('should mock agency_trades table query correctly', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Test Agency' }],
        defaultCount: 1
      });

      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1', 'agency-2', 'agency-3']
        }
      });

      // Simulate agency_trades filter query
      const agencyTradesResult = await supabase
        .from('agency_trades')
        .select('agency_id')
        .in('trade_id', ['trade-1']);

      expect(agencyTradesResult.data).toEqual([
        { agency_id: 'agency-1' },
        { agency_id: 'agency-2' },
        { agency_id: 'agency-3' }
      ]);
      expect(agencyTradesResult.error).toBeNull();
    });
  });

  describe('State Filter Mocking', () => {
    it('should mock regions table query correctly', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Test Agency' }],
        defaultCount: 1
      });

      configureMockForFilters(supabase, {
        states: {
          codes: ['TX', 'CA'],
          regionIds: ['region-tx', 'region-ca'],
          agencyIds: ['agency-1', 'agency-2']
        }
      });

      // Simulate regions filter query
      const regionsResult = await supabase
        .from('regions')
        .select('id')
        .in('state_code', ['TX', 'CA']);

      expect(regionsResult.data).toEqual([
        { id: 'region-tx' },
        { id: 'region-ca' }
      ]);
      expect(regionsResult.error).toBeNull();
    });

    it('should mock agency_regions table query correctly', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Test Agency' }],
        defaultCount: 1
      });

      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['agency-1', 'agency-2']
        }
      });

      // Simulate agency_regions filter query
      const agencyRegionsResult = await supabase
        .from('agency_regions')
        .select('agency_id')
        .in('region_id', ['region-tx']);

      expect(agencyRegionsResult.data).toEqual([
        { agency_id: 'agency-1' },
        { agency_id: 'agency-2' }
      ]);
      expect(agencyRegionsResult.error).toBeNull();
    });
  });

  describe('Combined Filters', () => {
    it('should handle both trade and state filters together', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1', name: 'Test Agency' }],
        defaultCount: 1
      });

      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1', 'agency-2']
        },
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['agency-1', 'agency-3']
        }
      });

      // Both filter queries should work
      const tradesResult = await supabase
        .from('trades')
        .select('id')
        .in('slug', ['electricians']);

      const regionsResult = await supabase
        .from('regions')
        .select('id')
        .in('state_code', ['TX']);

      expect(tradesResult.data).toHaveLength(1);
      expect(regionsResult.data).toHaveLength(1);
    });
  });

  describe('Main Query Handling', () => {
    it('should preserve main query mock configuration', async () => {
      const mockAgencies = [
        { id: '1', name: 'Test Agency 1' },
        { id: '2', name: 'Test Agency 2' }
      ];

      configureSupabaseMock(supabase, {
        defaultData: mockAgencies,
        defaultCount: 2
      });

      configureMockForFilters(supabase, {
        states: {
          codes: ['TX'],
          regionIds: ['region-tx'],
          agencyIds: ['1', '2']
        }
      });

      // Main agencies query should still work with configured data
      const result = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true);

      expect(result.data).toEqual(mockAgencies);
      expect(result.error).toBeNull();
    });

    it('should track method calls on the main mock object', async () => {
      configureSupabaseMock(supabase, {
        defaultData: [],
        defaultCount: 0
      });

      configureMockForFilters(supabase, {
        trades: {
          slugs: ['electricians'],
          ids: ['trade-1'],
          agencyIds: ['agency-1']
        }
      });

      // Execute a main query
      await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .in('id', ['agency-1']);

      // Verify methods were called on the main mock
      expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(supabase.in).toHaveBeenCalledWith('id', ['agency-1']);
    });
  });
});