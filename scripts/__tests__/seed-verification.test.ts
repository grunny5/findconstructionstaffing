import {
  verifySeededData,
  extractUniqueTrades,
  extractUniqueStates,
} from '../database/seed-database';
import { mockAgencies, mockComplianceData } from '../../lib/mock-data';

describe('Verification Functions', () => {
  describe('verifySeededData', () => {
    it('should verify all data correctly when everything matches', async () => {
      // Calculate expected counts
      const expectedAgencyCount = mockAgencies.length;
      const expectedTradeCount = extractUniqueTrades().length;
      const expectedRegionCount = extractUniqueStates().length;
      const expectedTradeRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.trades.length,
        0
      );
      const expectedRegionRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.regions.length,
        0
      );
      const expectedComplianceCount = mockComplianceData.reduce(
        (sum, agency) => sum + agency.complianceItems.length,
        0
      );

      const mockClient = {
        from: jest.fn((table: string) => {
          switch (table) {
            case 'agencies':
              return {
                select: jest.fn((query: string, options?: any) => {
                  if (options?.count === 'exact' && options?.head === true) {
                    return Promise.resolve({
                      count: expectedAgencyCount,
                      error: null,
                    });
                  }
                  return {
                    eq: jest.fn(() => ({
                      single: jest.fn(() =>
                        Promise.resolve({
                          data: {
                            name: 'Industrial Staffing Solutions',
                            trades: mockAgencies
                              .find(
                                (a) =>
                                  a.name === 'Industrial Staffing Solutions'
                              )
                              ?.trades.map((t) => ({ trade: { name: t } })),
                          },
                          error: null,
                        })
                      ),
                    })),
                  };
                }),
              };
            case 'trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedTradeCount,
                    error: null,
                  })
                ),
              };
            case 'regions':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedRegionCount,
                    error: null,
                  })
                ),
              };
            case 'agency_trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedTradeRelationships,
                    error: null,
                  })
                ),
              };
            case 'agency_regions':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedRegionRelationships,
                    error: null,
                  })
                ),
              };
            case 'agency_compliance':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedComplianceCount,
                    error: null,
                  })
                ),
              };
            default:
              throw new Error(`Unexpected table: ${table}`);
          }
        }),
      };

      // Mock console.log to capture output
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      const result = await verifySeededData(mockClient as any);

      // Restore console.log
      console.log = originalLog;

      expect(result).toBe(true);

      // Check for success messages
      const successMessages = logSpy.mock.calls.filter((call) =>
        call[0].includes('✓')
      );
      expect(successMessages.length).toBeGreaterThan(0);

      // Check that all verification checks passed
      const allPassedMessage = logSpy.mock.calls.find((call) =>
        call[0].includes('All verification checks passed!')
      );
      expect(allPassedMessage).toBeDefined();
    });

    it('should detect incorrect agency count', async () => {
      const mockClient = {
        from: jest.fn((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn((query: string, options?: any) => {
                if (options?.count === 'exact' && options?.head === true) {
                  return Promise.resolve({
                    count: 10, // Wrong count
                    error: null,
                  });
                }
                return {
                  eq: jest.fn(() => ({
                    single: jest.fn(() =>
                      Promise.resolve({
                        data: null,
                        error: null,
                      })
                    ),
                  })),
                };
              }),
            };
          }
          // Return valid counts for other tables
          return {
            select: jest.fn(() =>
              Promise.resolve({
                count: 0,
                error: null,
              })
            ),
          };
        }),
      };

      // Mock console.log and console.error
      const originalLog = console.log;
      const originalError = console.error;
      const logSpy = jest.fn();
      const errorSpy = jest.fn();
      console.log = logSpy;
      console.error = errorSpy;

      const result = await verifySeededData(mockClient as any);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      expect(result).toBe(false);

      // Check for error message about agency count
      const errorMessage = errorSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Agency count:') &&
          call[0].includes('Expected: 12, Found: 10')
      );
      expect(errorMessage).toBeDefined();
    });

    it('should detect incorrect trade count', async () => {
      const expectedTradeCount = extractUniqueTrades().length;

      const mockClient = {
        from: jest.fn((table: string) => {
          switch (table) {
            case 'agencies':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: mockAgencies.length,
                    error: null,
                  })
                ),
              };
            case 'trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedTradeCount - 2, // Wrong count
                    error: null,
                  })
                ),
              };
            default:
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: 0,
                    error: null,
                  })
                ),
              };
          }
        }),
      };

      const result = await verifySeededData(mockClient as any);
      expect(result).toBe(false);
    });

    it('should detect incorrect region count', async () => {
      const expectedRegionCount = extractUniqueStates().length;

      const mockClient = {
        from: jest.fn((table: string) => {
          switch (table) {
            case 'agencies':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: mockAgencies.length,
                    error: null,
                  })
                ),
              };
            case 'trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: extractUniqueTrades().length,
                    error: null,
                  })
                ),
              };
            case 'regions':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedRegionCount + 5, // Wrong count
                    error: null,
                  })
                ),
              };
            default:
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: 0,
                    error: null,
                  })
                ),
              };
          }
        }),
      };

      const result = await verifySeededData(mockClient as any);
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn((query: string, options?: any) => {
            if (options?.count === 'exact' && options?.head === true) {
              return Promise.resolve({
                count: null,
                error: { message: 'Database connection failed' },
              });
            }
            return {
              eq: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Database connection failed' },
                  })
                ),
              })),
            };
          }),
        })),
      };

      // Mock console methods
      const originalLog = console.log;
      const originalError = console.error;
      const logSpy = jest.fn();
      const errorSpy = jest.fn();
      console.log = logSpy;
      console.error = errorSpy;

      const result = await verifySeededData(mockClient as any);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      expect(result).toBe(false);

      // Check for error message
      const errorMessage = errorSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Error: Database connection failed')
      );
      expect(errorMessage).toBeDefined();
    });

    it('should verify sample agency trades correctly', async () => {
      const sampleAgency = mockAgencies.find(
        (a) => a.name === 'Industrial Staffing Solutions'
      );
      const expectedTrades = sampleAgency?.trades || [];
      const expectedTradeCount = extractUniqueTrades().length;
      const expectedRegionCount = extractUniqueStates().length;
      const expectedTradeRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.trades.length,
        0
      );
      const expectedRegionRelationships = mockAgencies.reduce(
        (sum, agency) => sum + agency.regions.length,
        0
      );
      const expectedComplianceCount = mockComplianceData.reduce(
        (sum, agency) => sum + agency.complianceItems.length,
        0
      );

      const mockClient = {
        from: jest.fn((table: string) => {
          switch (table) {
            case 'agencies':
              return {
                select: jest.fn((query: string, options?: any) => {
                  if (options?.count === 'exact' && options?.head === true) {
                    return Promise.resolve({
                      count: mockAgencies.length,
                      error: null,
                    });
                  }
                  return {
                    eq: jest.fn(() => ({
                      single: jest.fn(() =>
                        Promise.resolve({
                          data: {
                            name: 'Industrial Staffing Solutions',
                            trades: expectedTrades.map((t) => ({
                              trade: { name: t },
                            })),
                          },
                          error: null,
                        })
                      ),
                    })),
                  };
                }),
              };
            case 'trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedTradeCount,
                    error: null,
                  })
                ),
              };
            case 'regions':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedRegionCount,
                    error: null,
                  })
                ),
              };
            case 'agency_trades':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedTradeRelationships,
                    error: null,
                  })
                ),
              };
            case 'agency_regions':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedRegionRelationships,
                    error: null,
                  })
                ),
              };
            case 'agency_compliance':
              return {
                select: jest.fn(() =>
                  Promise.resolve({
                    count: expectedComplianceCount,
                    error: null,
                  })
                ),
              };
            default:
              throw new Error(`Unexpected table: ${table}`);
          }
        }),
      };

      const result = await verifySeededData(mockClient as any);
      expect(result).toBe(true);
    });

    it('should detect missing trades for sample agency', async () => {
      const sampleAgency = mockAgencies.find(
        (a) => a.name === 'Industrial Staffing Solutions'
      );
      const expectedTrades = sampleAgency?.trades || [];

      const mockClient = {
        from: jest.fn((table: string) => {
          if (table === 'agencies') {
            return {
              select: jest.fn((query: string, options?: any) => {
                if (options?.count === 'exact' && options?.head === true) {
                  return Promise.resolve({
                    count: mockAgencies.length,
                    error: null,
                  });
                }
                return {
                  eq: jest.fn(() => ({
                    single: jest.fn(() =>
                      Promise.resolve({
                        data: {
                          name: 'Industrial Staffing Solutions',
                          trades: [{ trade: { name: expectedTrades[0] } }], // Missing some trades
                        },
                        error: null,
                      })
                    ),
                  })),
                };
              }),
            };
          }
          // Return valid counts for other tables
          return {
            select: jest.fn(() =>
              Promise.resolve({
                count: 1,
                error: null,
              })
            ),
          };
        }),
      };

      const result = await verifySeededData(mockClient as any);
      expect(result).toBe(false);
    });

    it('should output clear pass/fail summary', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn((query: string, options?: any) => {
            if (options?.count === 'exact' && options?.head === true) {
              return Promise.resolve({
                count: 0,
                error: null,
              });
            }
            return {
              eq: jest.fn(() => ({
                single: jest.fn(() =>
                  Promise.resolve({
                    data: { name: 'Test', trades: [] },
                    error: null,
                  })
                ),
              })),
            };
          }),
        })),
      };

      // Mock console methods
      const originalLog = console.log;
      const originalError = console.error;
      const logSpy = jest.fn();
      const errorSpy = jest.fn();
      console.log = logSpy;
      console.error = errorSpy;

      await verifySeededData(mockClient as any);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      // Should have section header
      const sectionHeader = logSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Verification Results')
      );
      expect(sectionHeader).toBeDefined();

      // Should have final summary
      const failSummary = errorSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Some verification checks failed')
      );
      expect(failSummary).toBeDefined();
    });

    it('should complete within performance target', async () => {
      // Create a mock that simulates realistic query times
      const mockClient = {
        from: jest.fn((table: string) => ({
          select: jest.fn(async () => {
            // Simulate small query delay
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { count: 1, error: null };
          }),
        })),
      };

      const startTime = Date.now();
      await verifySeededData(mockClient as any);
      const duration = Date.now() - startTime;

      // Should complete in under 5 seconds (target from acceptance criteria)
      expect(duration).toBeLessThan(5000);

      // In practice with mocks, should be much faster
      expect(duration).toBeLessThan(1000);
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      // Mock console methods
      const originalLog = console.log;
      const originalError = console.error;
      const logSpy = jest.fn();
      const errorSpy = jest.fn();
      console.log = logSpy;
      console.error = errorSpy;

      const result = await verifySeededData(mockClient as any);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      expect(result).toBe(false);

      // Check for unexpected error message
      const errorMessage = errorSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Verification failed with unexpected error')
      );
      expect(errorMessage).toBeDefined();
    });
  });
});
