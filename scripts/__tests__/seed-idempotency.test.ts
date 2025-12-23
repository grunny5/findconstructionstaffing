import {
  seedTrades,
  seedRegions,
  seedAgencies,
  createAgencyTradeRelationships,
  createAgencyRegionRelationships,
  extractUniqueTrades,
  extractUniqueStates,
  createStateMapping,
} from '../database/seed-database';
import { mockAgencies } from '../../lib/mock-data';

describe('Idempotency Tests', () => {
  describe('seedTrades idempotency', () => {
    it('should not create duplicates on multiple runs', async () => {
      let existingTrades: any[] = [];
      let totalInserted = 0;

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingTrades.filter((t) =>
                values.includes(t.name)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            const inserted = data.map((d) => ({ ...d, id: `id-${d.name}` }));
            existingTrades.push(...inserted);
            totalInserted += inserted.length;
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: inserted,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // First run - should insert all trades
      const result1 = await seedTrades(mockClient as any);
      const firstRunInserted = totalInserted;
      expect(result1.size).toBe(extractUniqueTrades().length);

      // Second run - should not insert any
      totalInserted = 0;
      const result2 = await seedTrades(mockClient as any);
      expect(result2.size).toBe(result1.size);
      expect(totalInserted).toBe(0);

      // Third run - still no new inserts
      totalInserted = 0;
      const result3 = await seedTrades(mockClient as any);
      expect(result3.size).toBe(result1.size);
      expect(totalInserted).toBe(0);
    });

    it('should maintain consistent state across runs', async () => {
      let existingTrades: any[] = [];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingTrades.filter((t) =>
                values.includes(t.name)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            const inserted = data.map((d) => ({ ...d, id: `id-${d.name}` }));
            existingTrades.push(...inserted);
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: inserted,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // Run multiple times
      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = await seedTrades(mockClient as any);
        results.push(result);
      }

      // All runs should return identical mappings
      expect(results[1]).toEqual(results[0]);
      expect(results[2]).toEqual(results[0]);
    });
  });

  describe('seedRegions idempotency', () => {
    it('should not create duplicates on multiple runs', async () => {
      let existingRegions: any[] = [];
      let totalInserted = 0;

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingRegions.filter((r) =>
                values.includes(r.state_code)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            const inserted = data.map((d) => ({
              ...d,
              id: `id-${d.state_code}`,
            }));
            existingRegions.push(...inserted);
            totalInserted += inserted.length;
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: inserted,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // First run
      const result1 = await seedRegions(mockClient as any);
      const firstRunInserted = totalInserted;
      expect(result1.size).toBe(extractUniqueStates().length);

      // Second run - should not insert any
      totalInserted = 0;
      const result2 = await seedRegions(mockClient as any);
      expect(result2.size).toBe(result1.size);
      expect(totalInserted).toBe(0);
    });
  });

  describe('seedAgencies idempotency', () => {
    it('should not create duplicates on multiple runs', async () => {
      let existingAgencies: any[] = [];
      let totalInserted = 0;

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingAgencies.filter((a) =>
                values.includes(a.name)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            const inserted = data.map((d) => ({ ...d, id: `id-${d.name}` }));
            existingAgencies.push(...inserted);
            totalInserted += inserted.length;
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: inserted,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // First run
      const result1 = await seedAgencies(mockClient as any);
      expect(result1.size).toBe(mockAgencies.length);
      expect(totalInserted).toBe(mockAgencies.length);

      // Second run - should not insert any
      totalInserted = 0;
      const result2 = await seedAgencies(mockClient as any);
      expect(result2.size).toBe(result1.size);
      expect(totalInserted).toBe(0);
    });
  });

  describe('relationship idempotency', () => {
    it('should not create duplicate agency-trade relationships', async () => {
      let existingRelationships: any[] = [];
      let totalInserted = 0;

      const agencyIdMap = new Map(
        mockAgencies.map((a, i) => [a.name, `agency-${i}`])
      );

      const tradeIdMap = new Map<string, string>();
      const allTrades = new Set<string>();
      mockAgencies.forEach((a) => a.trades.forEach((t) => allTrades.add(t)));
      Array.from(allTrades).forEach((trade, i) => {
        tradeIdMap.set(trade, `trade-${i}`);
      });

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingRelationships.filter((r) =>
                values.includes(r.agency_id)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            existingRelationships.push(...data);
            totalInserted += data.length;
            return Promise.resolve({ error: null });
          }),
        })),
      };

      // First run
      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );
      const firstRunInserted = totalInserted;
      expect(firstRunInserted).toBeGreaterThan(0);

      // Second run - should not insert any
      totalInserted = 0;
      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );
      expect(totalInserted).toBe(0);
    });

    it('should not create duplicate agency-region relationships', async () => {
      let existingRelationships: any[] = [];
      let totalInserted = 0;

      const agencyIdMap = new Map(
        mockAgencies.map((a, i) => [a.name, `agency-${i}`])
      );

      const stateMapping = createStateMapping();
      const regionIdMap = new Map<string, string>();
      const allStates = new Set<string>();
      mockAgencies.forEach((a) => a.regions.forEach((s) => allStates.add(s)));
      Array.from(allStates).forEach((stateName) => {
        const stateCode = stateMapping.get(stateName);
        if (stateCode) {
          regionIdMap.set(stateCode, `region-${stateCode}`);
        }
      });

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingRelationships.filter((r) =>
                values.includes(r.agency_id)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            existingRelationships.push(...data);
            totalInserted += data.length;
            return Promise.resolve({ error: null });
          }),
        })),
      };

      // First run
      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );
      const firstRunInserted = totalInserted;
      expect(firstRunInserted).toBeGreaterThan(0);

      // Second run - should not insert any
      totalInserted = 0;
      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );
      expect(totalInserted).toBe(0);
    });
  });

  describe('full seed script idempotency', () => {
    it('should track created vs skipped counts correctly', async () => {
      let existingTrades: any[] = [];
      const insertedCounts: number[] = [];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingTrades.filter((t) =>
                values.includes(t.name)
              );
              return Promise.resolve({ data: matching, error: null });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            const inserted = data.map((d) => ({ ...d, id: `id-${d.name}` }));
            existingTrades.push(...inserted);
            insertedCounts.push(data.length);
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: inserted,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // Mock console to capture logs
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      // First run
      await seedTrades(mockClient as any);

      // Check first run logs
      const firstRunLog = logSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Created: 57, Skipped: 0')
      );
      expect(firstRunLog).toBeDefined();

      // Clear log spy
      logSpy.mockClear();

      // Second run
      await seedTrades(mockClient as any);

      // Check second run logs
      const secondRunLog = logSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Created: 0, Skipped: 57')
      );
      expect(secondRunLog).toBeDefined();

      console.log = originalLog;
    });

    it('should maintain performance on repeated runs', async () => {
      let existingData: any[] = [];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => {
              // Simulate query time
              return new Promise((resolve) => {
                setTimeout(
                  () => resolve({ data: existingData, error: null }),
                  5
                );
              });
            }),
          })),
          insert: jest.fn((data: any[]) => {
            existingData = [...existingData, ...data];
            return {
              select: jest.fn(() =>
                Promise.resolve({
                  data: data,
                  error: null,
                })
              ),
            };
          }),
        })),
      };

      // First run
      const start1 = Date.now();
      await seedTrades(mockClient as any);
      const duration1 = Date.now() - start1;

      // Second run (with existing data)
      const start2 = Date.now();
      await seedTrades(mockClient as any);
      const duration2 = Date.now() - start2;

      // Second run should be similar or faster (no inserts)
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
    });
  });
});
