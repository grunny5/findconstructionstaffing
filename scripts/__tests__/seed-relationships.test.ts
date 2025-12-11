import {
  createAgencyTradeRelationships,
  createAgencyRegionRelationships,
  createStateMapping,
} from '../seed-database';
import { mockAgencies } from '../../lib/mock-data';

describe('Agency-Trade Relationship Functions', () => {
  describe('createAgencyTradeRelationships', () => {
    it('should create all relationships when none exist', async () => {
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
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );

      // Should have called insert with relationships
      const insertCalls = (mockClient.from as jest.Mock).mock.results
        .filter((r) => r.value.insert)
        .map((r) => (r.value.insert as jest.Mock).mock.calls)
        .flat();

      expect(insertCalls.length).toBeGreaterThan(0);

      // Count total relationships
      const totalRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.trades.length,
        0
      );

      const insertedRelationships = insertCalls.flatMap((call) => call[0]);
      expect(insertedRelationships.length).toBe(totalRelationships);
    });

    it('should skip existing relationships', async () => {
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
        ['TradePower Recruiting', 'agency-2'],
      ]);

      const tradeIdMap = new Map([
        ['Electrician', 'trade-1'],
        ['Plumber', 'trade-2'],
      ]);

      // Simulate existing relationship
      const existingRelations = [
        { agency_id: 'agency-1', trade_id: 'trade-1' },
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() =>
              Promise.resolve({
                data: existingRelations,
                error: null,
              })
            ),
          })),
          insert: jest.fn((data: any[]) => {
            // Should not insert the existing relationship
            const hasExisting = data.some(
              (r) => r.agency_id === 'agency-1' && r.trade_id === 'trade-1'
            );
            expect(hasExisting).toBe(false);
            return Promise.resolve({ error: null });
          }),
        })),
      };

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );
    });

    it('should handle missing agency IDs gracefully', async () => {
      // Agency map missing some agencies
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
      ]);

      const tradeIdMap = new Map([['Electrician', 'trade-1']]);

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      // Mock console.log to capture warnings
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );

      // Should have logged warnings for missing agencies
      const warningCalls = logSpy.mock.calls.filter((call) =>
        call[0].includes('Agency ID not found')
      );
      expect(warningCalls.length).toBeGreaterThan(0);

      console.log = originalLog;
    });

    it('should handle missing trade IDs gracefully', async () => {
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
      ]);

      // Trade map missing some trades
      const tradeIdMap = new Map([
        ['Electrician', 'trade-1'],
        // Missing other trades
      ]);

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      // Mock console.log to capture warnings
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );

      // Should have logged warnings for missing trades
      const warningCalls = logSpy.mock.calls.filter((call) =>
        call[0].includes('Trade ID not found')
      );
      expect(warningCalls.length).toBeGreaterThan(0);

      console.log = originalLog;
    });

    it('should batch process relationships for performance', async () => {
      const agencyIdMap = new Map(
        mockAgencies.map((a, i) => [a.name, `agency-${i}`])
      );

      const tradeIdMap = new Map<string, string>();
      const allTrades = new Set<string>();
      mockAgencies.forEach((a) => a.trades.forEach((t) => allTrades.add(t)));
      Array.from(allTrades).forEach((trade, i) => {
        tradeIdMap.set(trade, `trade-${i}`);
      });

      const selectMock = jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: selectMock,
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );

      // With batch size of 50 and ~60 relationships, should have 2 batches
      const totalRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.trades.length,
        0
      );
      const expectedBatches = Math.ceil(totalRelationships / 50);

      expect(selectMock).toHaveBeenCalledTimes(expectedBatches);
    });

    it('should handle database errors gracefully', async () => {
      // Use real agencies to ensure we have relationships to create
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
      ]);
      const tradeIdMap = new Map([['Electrician', 'trade-1']]);

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Database connection failed' },
              })
            ),
          })),
        })),
      };

      await expect(
        createAgencyTradeRelationships(
          mockClient as any,
          agencyIdMap,
          tradeIdMap
        )
      ).rejects.toThrow(
        'Failed to fetch existing relationships: Database connection failed'
      );
    });

    it('should complete within performance target', async () => {
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
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      const startTime = Date.now();
      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );
      const duration = Date.now() - startTime;

      // Should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should create correct number of relationships', async () => {
      const agencyIdMap = new Map(
        mockAgencies.map((a, i) => [a.name, `agency-${i}`])
      );

      const tradeIdMap = new Map<string, string>();
      const allTrades = new Set<string>();
      mockAgencies.forEach((a) => a.trades.forEach((t) => allTrades.add(t)));
      Array.from(allTrades).forEach((trade, i) => {
        tradeIdMap.set(trade, `trade-${i}`);
      });

      let insertedCount = 0;
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn((data: any[]) => {
            insertedCount += data.length;
            return Promise.resolve({ error: null });
          }),
        })),
      };

      await createAgencyTradeRelationships(
        mockClient as any,
        agencyIdMap,
        tradeIdMap
      );

      // Calculate expected relationships
      const expectedRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.trades.length,
        0
      );

      expect(insertedCount).toBe(expectedRelationships);
    });
  });

  describe('createAgencyRegionRelationships', () => {
    it('should create all relationships when none exist', async () => {
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
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );

      // Should have called insert with relationships
      const insertCalls = (mockClient.from as jest.Mock).mock.results
        .filter((r) => r.value.insert)
        .map((r) => (r.value.insert as jest.Mock).mock.calls)
        .flat();

      expect(insertCalls.length).toBeGreaterThan(0);

      // Count total relationships
      const totalRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.regions.length,
        0
      );

      const insertedRelationships = insertCalls.flatMap((call) => call[0]);
      expect(insertedRelationships.length).toBe(totalRelationships);
    });

    it('should handle state name to code mapping correctly', async () => {
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
      ]);

      const regionIdMap = new Map([
        ['TX', 'region-TX'],
        ['LA', 'region-LA'],
      ]);

      let insertedRelationships: any[] = [];
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn((data: any[]) => {
            insertedRelationships = data;
            return Promise.resolve({ error: null });
          }),
        })),
      };

      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );

      // Should map Texas -> TX and Louisiana -> LA
      const agency = mockAgencies.find(
        (a) => a.name === 'Industrial Staffing Solutions'
      );
      expect(agency?.regions).toContain('Texas');
      expect(agency?.regions).toContain('Louisiana');

      // Check that the correct region IDs were used
      const hasTexas = insertedRelationships.some(
        (r) => r.region_id === 'region-TX'
      );
      const hasLouisiana = insertedRelationships.some(
        (r) => r.region_id === 'region-LA'
      );

      expect(hasTexas).toBe(true);
      expect(hasLouisiana).toBe(true);
    });

    it('should skip existing relationships', async () => {
      const agencyIdMap = new Map([
        ['Industrial Staffing Solutions', 'agency-1'],
      ]);

      const regionIdMap = new Map([['TX', 'region-TX']]);

      // Simulate existing relationship
      const existingRelations = [
        { agency_id: 'agency-1', region_id: 'region-TX' },
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() =>
              Promise.resolve({
                data: existingRelations,
                error: null,
              })
            ),
          })),
          insert: jest.fn((data: any[]) => {
            // Should not insert the existing relationship
            const hasExisting = data.some(
              (r) => r.agency_id === 'agency-1' && r.region_id === 'region-TX'
            );
            expect(hasExisting).toBe(false);
            return Promise.resolve({ error: null });
          }),
        })),
      };

      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );
    });

    it('should handle missing state codes gracefully', async () => {
      // Store original allStates before resetting modules
      const { allStates } = require('../../lib/mock-data');

      // Reset modules to allow mocking
      jest.resetModules();

      // Create test data with invalid state
      const testAgencies = [
        ...mockAgencies,
        {
          name: 'Test Agency',
          regions: ['InvalidState'],
          trades: [],
          description: 'Test',
          logo_url: 'test.png',
          website: 'https://test.com',
          offers_per_diem: false,
          is_union: false,
          founded_year: 2020,
          employee_count: '1-10',
          headquarters: 'Test City, TX',
        },
      ];

      // Mock the mock-data module before importing createAgencyRegionRelationships
      jest.doMock('../../lib/mock-data', () => ({
        mockAgencies: testAgencies,
        allStates: allStates,
      }));

      // Re-import the function with mocked data
      const {
        createAgencyRegionRelationships: mockedCreateRelationships,
      } = require('../seed-database');

      const agencyIdMap = new Map([['Test Agency', 'agency-1']]);

      const regionIdMap = new Map([['TX', 'region-TX']]);

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      // Mock console.log to capture warnings
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await mockedCreateRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );

      // Should have logged warning for invalid state
      const warningCalls = logSpy.mock.calls.filter(
        (call) =>
          call[0] && call[0].includes('State code not found for: InvalidState')
      );
      expect(warningCalls.length).toBe(1);

      // Restore
      console.log = originalLog;
      jest.resetModules();
      jest.unmock('../../lib/mock-data');
    });

    it('should complete within performance target', async () => {
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
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      const startTime = Date.now();
      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );
      const duration = Date.now() - startTime;

      // Should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should create correct number of relationships', async () => {
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

      let insertedCount = 0;
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn((data: any[]) => {
            insertedCount += data.length;
            return Promise.resolve({ error: null });
          }),
        })),
      };

      await createAgencyRegionRelationships(
        mockClient as any,
        agencyIdMap,
        regionIdMap
      );

      // Calculate expected relationships
      const expectedRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.regions.length,
        0
      );

      expect(insertedCount).toBe(expectedRelationships);
    });
  });
});
