import { extractUniqueStates, createStateMapping, seedRegions } from '../seed-database';
import { mockAgencies, allStates } from '../../lib/mock-data';
import { createSlug } from '../../lib/supabase';

describe('Region Seeding Functions', () => {
  describe('extractUniqueStates', () => {
    it('should extract all unique states from mock data', () => {
      const states = extractUniqueStates();
      
      // Collect expected states manually
      const expectedStates = new Set<string>();
      mockAgencies.forEach(agency => {
        agency.regions.forEach(state => expectedStates.add(state));
      });
      
      expect(states.length).toBe(expectedStates.size);
      expect(states).toEqual(Array.from(expectedStates).sort());
    });

    it('should return sorted state names', () => {
      const states = extractUniqueStates();
      const sortedStates = [...states].sort();
      
      expect(states).toEqual(sortedStates);
    });

    it('should not contain duplicates', () => {
      const states = extractUniqueStates();
      const uniqueSet = new Set(states);
      
      expect(states.length).toBe(uniqueSet.size);
    });

    it('should handle all states used in mock data', () => {
      const states = extractUniqueStates();
      
      // These are all states mentioned in the mock data
      const expectedStates = [
        'Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Florida', 'Georgia', 'Illinois', 'Indiana',
        'Iowa', 'Kansas', 'Louisiana', 'Massachusetts', 'Michigan',
        'Mississippi', 'Missouri', 'Montana', 'Nevada', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota',
        'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'South Carolina',
        'Tennessee', 'Texas', 'Utah', 'Washington', 'Wisconsin', 'Wyoming'
      ];
      
      expect(states).toEqual(expectedStates);
    });
  });

  describe('createStateMapping', () => {
    it('should create a complete state name to code mapping', () => {
      const mapping = createStateMapping();
      
      expect(mapping.size).toBe(allStates.length);
      expect(mapping.get('Texas')).toBe('TX');
      expect(mapping.get('California')).toBe('CA');
      expect(mapping.get('New York')).toBe('NY');
    });

    it('should include all states from allStates', () => {
      const mapping = createStateMapping();
      
      allStates.forEach(state => {
        expect(mapping.has(state.name)).toBe(true);
        expect(mapping.get(state.name)).toBe(state.code);
      });
    });
  });

  describe('seedRegions', () => {
    it('should insert all regions when none exist', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `id-${d.state_code}` })),
              error: null
            }))
          }))
        }))
      };

      const result = await seedRegions(mockClient as any);
      const expectedStates = extractUniqueStates();
      
      expect(result.size).toBe(expectedStates.length);
      expect(mockClient.from).toHaveBeenCalledWith('regions');
    });

    it('should skip existing regions', async () => {
      const existingRegions = [
        { id: 'existing-1', name: 'Texas', state_code: 'TX' },
        { id: 'existing-2', name: 'California', state_code: 'CA' }
      ];

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn((field: string, values: string[]) => {
              const matching = existingRegions.filter(r => values.includes(r.state_code));
              return Promise.resolve({ data: matching, error: null });
            })
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `new-${d.state_code}` })),
              error: null
            }))
          }))
        }))
      };

      const result = await seedRegions(mockClient as any);
      
      // Should have existing regions with their original IDs
      expect(result.get('TX')).toBe('existing-1');
      expect(result.get('CA')).toBe('existing-2');
    });

    it('should handle invalid state names gracefully', async () => {
      // Test the seedRegions function directly by mocking the data it uses
      // We'll mock the seed-database module to control what extractUniqueStates returns
      
      // First, we need to re-import the module with mocked data
      jest.resetModules();
      
      // Mock the mock-data module before importing seed-database
      jest.doMock('../../lib/mock-data', () => ({
        mockAgencies: [
          {
            name: 'Test Agency',
            regions: ['InvalidState', 'Texas'], // InvalidState won't be in allStates
            trades: [],
            description: 'Test',
            logo_url: 'test.png',
            website: 'https://test.com',
            offers_per_diem: false,
            is_union: false,
            founded_year: 2020,
            employee_count: '1-10',
            headquarters: 'Test City, TX'
          }
        ],
        allStates: [
          { name: 'Texas', code: 'TX' }
          // InvalidState is not included
        ]
      }));
      
      // Now import the seed-database module with mocked data
      const { seedRegions: mockSeedRegions } = require('../seed-database');
      
      const insertMock = jest.fn((data: any[]) => ({
        select: jest.fn(() => Promise.resolve({
          data: data.map(d => ({ ...d, id: `id-${d.state_code}` })),
          error: null
        }))
      }));
      
      const mockClient = {
        from: jest.fn((table: string) => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: insertMock
        }))
      };

      // Mock console.log to capture warning
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await mockSeedRegions(mockClient as any);

      // Check that warning was logged
      const warningCalls = logSpy.mock.calls.filter(call => 
        call[0] && call[0].includes('Unknown state name') && call[0].includes('InvalidState')
      );
      expect(warningCalls.length).toBe(1);

      // Check that only valid states were processed
      expect(insertMock).toHaveBeenCalledTimes(1);
      expect(insertMock.mock.calls[0][0]).toHaveLength(1);
      expect(insertMock.mock.calls[0][0][0].state_code).toBe('TX');

      // Restore
      console.log = originalLog;
      jest.resetModules();
      jest.unmock('../../lib/mock-data');
    });

    it('should generate proper slugs for regions', async () => {
      const insertMock = jest.fn((data: any[]) => ({
        select: jest.fn(() => Promise.resolve({
          data: data.map(d => ({ ...d, id: `id-${d.state_code}` })),
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

      await seedRegions(mockClient as any);
      
      // Get all insert calls
      const allInsertedData = insertMock.mock.calls.flatMap(call => call[0]);
      
      // Verify slugs are generated correctly (should be lowercase state codes)
      allInsertedData.forEach((region: any) => {
        expect(region.slug).toBe(createSlug(region.state_code));
        expect(region.slug).toBe(region.state_code.toLowerCase());
      });
    });

    it('should validate state codes are 2-letter format', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `id-${d.state_code}` })),
              error: null
            }))
          }))
        }))
      };

      await seedRegions(mockClient as any);
      
      // Get all insert calls
      const insertCalls = (mockClient.from as jest.Mock).mock.results
        .flatMap(r => (r.value.insert as jest.Mock).mock.calls)
        .flatMap(call => call[0]);
      
      // All state codes should be exactly 2 uppercase letters
      insertCalls.forEach((region: any) => {
        expect(region.state_code).toMatch(/^[A-Z]{2}$/);
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

      await expect(seedRegions(mockClient as any)).rejects.toThrow(
        'Failed to fetch existing regions: Database connection failed'
      );
    });

    it('should complete within performance target', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() => Promise.resolve({
              data: data.map(d => ({ ...d, id: `id-${d.state_code}` })),
              error: null
            }))
          }))
        }))
      };

      const startTime = Date.now();
      await seedRegions(mockClient as any);
      const duration = Date.now() - startTime;
      
      // Should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});