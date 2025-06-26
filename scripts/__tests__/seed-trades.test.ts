import { extractUniqueTrades, seedTrades, createSupabaseClient } from '../seed-database';
import { mockAgencies } from '../../lib/mock-data';
import { createSlug } from '../../lib/supabase';

// Mock Supabase client
const mockSupabaseClient = () => {
  const mockData: any[] = [];
  
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          data: mockData.filter(item => item.table === table),
          error: null
        }))
      })),
      insert: jest.fn((data: any) => ({
        select: jest.fn(() => ({
          data: Array.isArray(data) ? data.map((d: any) => ({ ...d, id: `mock-id-${d.name}` })) : [{ ...data, id: `mock-id-${data.name}` }],
          error: null
        }))
      }))
    }))
  };
};

describe('Trade Seeding Functions', () => {
  describe('extractUniqueTrades', () => {
    it('should extract all unique trades from mock data', () => {
      const trades = extractUniqueTrades();
      
      // Collect expected trades manually
      const expectedTrades = new Set<string>();
      mockAgencies.forEach(agency => {
        agency.trades.forEach(trade => expectedTrades.add(trade));
      });
      
      expect(trades.length).toBe(expectedTrades.size);
      expect(trades).toEqual(Array.from(expectedTrades).sort());
    });

    it('should return sorted trade names', () => {
      const trades = extractUniqueTrades();
      const sortedTrades = [...trades].sort();
      
      expect(trades).toEqual(sortedTrades);
    });

    it('should not contain duplicates', () => {
      const trades = extractUniqueTrades();
      const uniqueSet = new Set(trades);
      
      expect(trades.length).toBe(uniqueSet.size);
    });
  });

  describe('seedTrades', () => {
    it('should insert all trades when none exist', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `id-${d.name}` })),
              error: null
            }))
          }))
        }))
      };

      const result = await seedTrades(mockClient as any);
      const expectedTrades = extractUniqueTrades();
      
      expect(result.size).toBe(expectedTrades.length);
      expect(mockClient.from).toHaveBeenCalledWith('trades');
      
      // Verify all trades are in the map
      expectedTrades.forEach(trade => {
        expect(result.has(trade)).toBe(true);
        expect(result.get(trade)).toBe(`id-${trade}`);
      });
    });

    it('should skip existing trades', async () => {
      const existingTrades = [
        { id: 'existing-1', name: 'Electrician' },
        { id: 'existing-2', name: 'Plumber' }
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingTrades.filter(t => values.includes(t.name));
              return Promise.resolve({ data: matching, error: null });
            })
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `new-${d.name}` })),
              error: null
            }))
          }))
        }))
      };

      const result = await seedTrades(mockClient as any);
      
      // Should have existing trades with their original IDs
      expect(result.get('Electrician')).toBe('existing-1');
      expect(result.get('Plumber')).toBe('existing-2');
      
      // Other trades should have new IDs
      const otherTrades = extractUniqueTrades().filter(
        t => t !== 'Electrician' && t !== 'Plumber'
      );
      otherTrades.forEach(trade => {
        expect(result.get(trade)).toBe(`new-${trade}`);
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database connection failed' } 
            }))
          }))
        }))
      };

      await expect(seedTrades(mockClient as any)).rejects.toThrow(
        'Failed to fetch existing trades: Database connection failed'
      );
    });

    it('should batch process trades for performance', async () => {
      const selectMock = jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: selectMock,
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `id-${d.name}` })),
              error: null
            }))
          }))
        }))
      };

      await seedTrades(mockClient as any);
      
      // With batch size of 10, we should have multiple calls
      const totalTrades = extractUniqueTrades().length;
      const expectedBatches = Math.ceil(totalTrades / 10);
      
      expect(selectMock).toHaveBeenCalledTimes(expectedBatches);
    });

    it('should generate proper slugs for trades', async () => {
      const insertMock = jest.fn((data: any[]) => ({
        select: jest.fn(() => Promise.resolve({
          data: data.map(d => ({ ...d, id: `id-${d.name}` })),
          error: null
        }))
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: insertMock
        }))
      };

      await seedTrades(mockClient as any);
      
      // Get all insert calls
      const allInsertedData = insertMock.mock.calls.flatMap(call => call[0]);
      
      // Verify slugs are generated correctly
      allInsertedData.forEach((trade: any) => {
        expect(trade.slug).toBe(createSlug(trade.name));
      });
    });
  });
});