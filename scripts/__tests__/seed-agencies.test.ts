import { seedAgencies } from '../seed-database';
import { mockAgencies } from '../../lib/mock-data';
import { createSlug } from '../../lib/supabase';

describe('Agency Seeding Functions', () => {
  describe('seedAgencies', () => {
    it('should insert all agencies when none exist', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: data.map((d) => ({ ...d, id: `id-${d.name}` })),
                error: null,
              })
            ),
          })),
        })),
      };

      const result = await seedAgencies(mockClient as any);

      expect(result.size).toBe(mockAgencies.length);
      expect(mockClient.from).toHaveBeenCalledWith('agencies');

      // Verify all agencies are in the map
      mockAgencies.forEach((agency) => {
        expect(result.has(agency.name)).toBe(true);
        expect(result.get(agency.name)).toBe(`id-${agency.name}`);
      });
    });

    it('should skip existing agencies', async () => {
      const existingAgencies = [
        { id: 'existing-1', name: 'Industrial Staffing Solutions' },
        { id: 'existing-2', name: 'TradePower Recruiting' },
      ];

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
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: data.map((d) => ({ ...d, id: `new-${d.name}` })),
                error: null,
              })
            ),
          })),
        })),
      };

      const result = await seedAgencies(mockClient as any);

      // Should have existing agencies with their original IDs
      expect(result.get('Industrial Staffing Solutions')).toBe('existing-1');
      expect(result.get('TradePower Recruiting')).toBe('existing-2');

      // Other agencies should have new IDs
      const otherAgencies = mockAgencies.filter(
        (a) =>
          a.name !== 'Industrial Staffing Solutions' &&
          a.name !== 'TradePower Recruiting'
      );
      otherAgencies.forEach((agency) => {
        expect(result.get(agency.name)).toBe(`new-${agency.name}`);
      });
    });

    it('should apply correct data transformations', async () => {
      const insertMock = jest.fn((data: any[]) => ({
        select: jest.fn(() =>
          Promise.resolve({
            data: data.map((d) => ({ ...d, id: `id-${d.name}` })),
            error: null,
          })
        ),
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: insertMock,
        })),
      };

      await seedAgencies(mockClient as any);

      // Get all inserted data
      const allInsertedData = insertMock.mock.calls.flatMap((call) => call[0]);

      expect(allInsertedData.length).toBe(mockAgencies.length);

      // Verify transformations for each agency
      allInsertedData.forEach((insertedAgency: any, index: number) => {
        const originalAgency = mockAgencies.find(
          (a) => a.name === insertedAgency.name
        );

        // Verify slug generation
        expect(insertedAgency.slug).toBe(createSlug(insertedAgency.name));

        // Verify boolean defaults
        expect(insertedAgency.is_claimed).toBe(false);
        expect(insertedAgency.is_active).toBe(true);

        // Verify timestamps
        expect(insertedAgency.created_at).toBeDefined();
        expect(insertedAgency.updated_at).toBeDefined();
        expect(insertedAgency.created_at).toBe(insertedAgency.updated_at);

        // Verify null handling for optional fields
        if (!originalAgency?.phone) {
          expect(insertedAgency.phone).toBeNull();
        }
        if (!originalAgency?.email) {
          expect(insertedAgency.email).toBeNull();
        }

        // Verify other fields are preserved
        expect(insertedAgency.offers_per_diem).toBe(
          originalAgency?.offers_per_diem
        );
        expect(insertedAgency.is_union).toBe(originalAgency?.is_union);
      });
    });

    it('should handle database errors gracefully', async () => {
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

      await expect(seedAgencies(mockClient as any)).rejects.toThrow(
        'Failed to fetch existing agencies: Database connection failed'
      );
    });

    it('should handle insert errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Unique constraint violation' },
              })
            ),
          })),
        })),
      };

      await expect(seedAgencies(mockClient as any)).rejects.toThrow(
        'Failed to insert agencies: Unique constraint violation'
      );
    });

    it('should batch process agencies for performance', async () => {
      const selectMock = jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: selectMock,
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: data.map((d) => ({ ...d, id: `id-${d.name}` })),
                error: null,
              })
            ),
          })),
        })),
      };

      await seedAgencies(mockClient as any);

      // With batch size of 20 and 12 agencies, we should have 1 batch
      const expectedBatches = Math.ceil(mockAgencies.length / 20);
      expect(selectMock).toHaveBeenCalledTimes(expectedBatches);
    });

    it('should complete within performance target', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: jest.fn((data: any[]) => ({
            select: jest.fn(() =>
              Promise.resolve({
                data: data.map((d) => ({ ...d, id: `id-${d.name}` })),
                error: null,
              })
            ),
          })),
        })),
      };

      const startTime = Date.now();
      await seedAgencies(mockClient as any);
      const duration = Date.now() - startTime;

      // Should complete in under 3 seconds (target from acceptance criteria)
      expect(duration).toBeLessThan(3000);

      // In practice with mocks, should be much faster
      expect(duration).toBeLessThan(500);
    });

    it('should preserve all agency fields correctly', async () => {
      const insertMock = jest.fn((data: any[]) => ({
        select: jest.fn(() =>
          Promise.resolve({
            data: data.map((d) => ({ ...d, id: `id-${d.name}` })),
            error: null,
          })
        ),
      }));

      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            in: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          insert: insertMock,
        })),
      };

      await seedAgencies(mockClient as any);

      const allInsertedData = insertMock.mock.calls.flatMap((call) => call[0]);

      // Check first agency has all expected fields
      const firstAgency = allInsertedData[0];
      const expectedFields = [
        'name',
        'slug',
        'description',
        'logo_url',
        'website',
        'phone',
        'email',
        'is_claimed',
        'is_active',
        'offers_per_diem',
        'is_union',
        'founded_year',
        'employee_count',
        'headquarters',
        'created_at',
        'updated_at',
      ];

      expectedFields.forEach((field) => {
        expect(firstAgency).toHaveProperty(field);
      });
    });
  });
});
