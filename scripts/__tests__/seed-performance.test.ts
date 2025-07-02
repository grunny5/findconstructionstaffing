import { seedTrades } from '../seed-database';

describe('Trade Seeding Performance', () => {
  it('should complete seeding in under 2 seconds', async () => {
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
    await seedTrades(mockClient as any);
    const duration = Date.now() - startTime;

    // Should complete in well under 2 seconds (target from acceptance criteria)
    expect(duration).toBeLessThan(2000);

    // In practice with mocks, should be much faster
    expect(duration).toBeLessThan(500);
  });
});
