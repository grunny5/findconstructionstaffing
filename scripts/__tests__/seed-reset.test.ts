import { resetDatabase } from '../seed-database';

describe('Reset Database Function', () => {
  describe('resetDatabase', () => {
    it('should delete all records in correct order', async () => {
      // Track deletion calls in order
      const deletionCalls: string[] = [];
      
      const mockClient = {
        from: jest.fn((table: string) => {
          deletionCalls.push(table);
          return {
            delete: jest.fn(() => ({
              neq: jest.fn(() => {
                // Simulate different counts for each table
                const counts: Record<string, number> = {
                  'agency_trades': 60,
                  'agency_regions': 58,
                  'agencies': 12,
                  'trades': 48,
                  'regions': 35
                };
                
                return Promise.resolve({ 
                  count: counts[table] || 0, 
                  error: null 
                });
              })
            }))
          };
        })
      };

      // Mock console methods
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await resetDatabase(mockClient as any);

      // Restore console
      console.log = originalLog;

      // Verify deletion order (junction tables first, then main tables)
      expect(deletionCalls).toEqual([
        'agency_trades',
        'agency_regions',
        'agencies',
        'trades',
        'regions'
      ]);

      // Verify success messages
      const successMessages = logSpy.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('✓')
      );
      expect(successMessages.length).toBeGreaterThan(0);

      // Verify summary was logged
      const summaryMessage = logSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('Total records deleted: 213')
      );
      expect(summaryMessage).toBeDefined();
    });

    it('should handle deletion errors gracefully', async () => {
      const mockClient = {
        from: jest.fn((table: string) => ({
          delete: jest.fn(() => ({
            neq: jest.fn(() => {
              if (table === 'agencies') {
                return Promise.resolve({ 
                  count: null, 
                  error: { message: 'Foreign key constraint violation' } 
                });
              }
              return Promise.resolve({ count: 0, error: null });
            })
          }))
        }))
      };

      await expect(resetDatabase(mockClient as any)).rejects.toThrow(
        'Failed to delete agencies: Foreign key constraint violation'
      );
    });

    it('should use neq with UUID to delete all records', async () => {
      const neqMock = jest.fn(() => Promise.resolve({ count: 0, error: null }));
      const deleteMock = jest.fn(() => ({ neq: neqMock }));

      const mockClient = {
        from: jest.fn(() => ({
          delete: deleteMock
        }))
      };

      await resetDatabase(mockClient as any);

      // Verify neq was called with zero UUID for each table
      expect(neqMock).toHaveBeenCalledTimes(5);
      expect(neqMock).toHaveBeenCalledWith('agency_id', '00000000-0000-0000-0000-000000000000');
      expect(neqMock).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000');
    });

    it('should log warning on error', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            neq: jest.fn(() => Promise.resolve({ 
              count: null, 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      };

      // Mock console methods
      const originalLog = console.log;
      const originalError = console.error;
      const logSpy = jest.fn();
      const errorSpy = jest.fn();
      console.log = logSpy;
      console.error = errorSpy;

      await expect(resetDatabase(mockClient as any)).rejects.toThrow();

      // Restore console
      console.log = originalLog;
      console.error = originalError;

      // Should log warning about inconsistent state
      const warningMessage = logSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && 
        call[0].includes('Database may be in an inconsistent state')
      );
      expect(warningMessage).toBeDefined();
    });

    it('should track and report deletion counts correctly', async () => {
      const mockClient = {
        from: jest.fn((table: string) => ({
          delete: jest.fn(() => ({
            neq: jest.fn(() => {
              const counts: Record<string, number> = {
                'agency_trades': 25,
                'agency_regions': 30,
                'agencies': 5,
                'trades': 10,
                'regions': 8
              };
              return Promise.resolve({ 
                count: counts[table] || 0, 
                error: null 
              });
            })
          }))
        }))
      };

      // Mock console
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await resetDatabase(mockClient as any);

      console.log = originalLog;

      // Check individual table deletion logs
      expect(logSpy.mock.calls).toContainEqual(
        expect.arrayContaining([expect.stringContaining('agency_trades: Deleted 25 records')])
      );
      expect(logSpy.mock.calls).toContainEqual(
        expect.arrayContaining([expect.stringContaining('agency_regions: Deleted 30 records')])
      );
      expect(logSpy.mock.calls).toContainEqual(
        expect.arrayContaining([expect.stringContaining('agencies: Deleted 5 records')])
      );

      // Check total count
      const totalMessage = logSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && 
        call[0].includes('Total records deleted: 78')
      );
      expect(totalMessage).toBeDefined();
    });

    it('should complete within reasonable time', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            neq: jest.fn(() => new Promise(resolve => {
              // Simulate small delay
              setTimeout(() => resolve({ count: 10, error: null }), 10);
            }))
          }))
        }))
      };

      const startTime = Date.now();
      await resetDatabase(mockClient as any);
      const duration = Date.now() - startTime;

      // Should complete in under 1 second even with delays
      expect(duration).toBeLessThan(1000);
    });

    it('should handle zero records gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            neq: jest.fn(() => Promise.resolve({ count: 0, error: null }))
          }))
        }))
      };

      // Mock console
      const originalLog = console.log;
      const logSpy = jest.fn();
      console.log = logSpy;

      await resetDatabase(mockClient as any);

      console.log = originalLog;

      // Should still report success with 0 records
      const totalMessage = logSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && 
        call[0].includes('Total records deleted: 0')
      );
      expect(totalMessage).toBeDefined();

      // Should complete successfully
      const successMessage = logSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && 
        call[0].includes('Database reset completed')
      );
      expect(successMessage).toBeDefined();
    });
  });
});