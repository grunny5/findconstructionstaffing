import {
  validateEnvironment,
  createSupabaseClient,
  testConnection,
  log,
} from '../seed-database';

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

// Mock process.exit
const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`Process.exit called with code ${code}`);
  });

// Ensure we're not in test environment for these tests
const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => {
  // Use Object.defineProperty to modify read-only NODE_ENV
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'production',
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  // Restore original NODE_ENV
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: originalNodeEnv,
    writable: true,
    configurable: true,
  });
  mockExit.mockClear();
});

describe('seed-database.ts', () => {
  describe('validateEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should validate when both environment variables are set correctly', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.test';

      const result = validateEnvironment();
      expect(result).toEqual({
        url: 'https://test.supabase.co',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    });

    it('should use test defaults when in test environment and env vars are missing', () => {
      // Temporarily set NODE_ENV to test for this specific test
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
      });

      // Save current DATABASE_URL to restore later
      const savedDatabaseUrl = process.env.DATABASE_URL;

      process.env.SUPABASE_URL = undefined;
      process.env.DATABASE_URL = undefined;
      process.env.SUPABASE_SERVICE_ROLE_KEY = undefined;

      // When not forcing validation, it should return defaults in test environment
      const result = validateEnvironment(false);
      expect(result).toEqual({
        url: 'http://localhost:54321',
        key: 'test-service-role-key',
      });

      // Restore DATABASE_URL
      process.env.DATABASE_URL = savedDatabaseUrl;

      // Reset back to production for other tests
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
    });

    it('should exit when SUPABASE_URL is missing', () => {
      // Save current DATABASE_URL to restore later
      const savedDatabaseUrl = process.env.DATABASE_URL;

      process.env.SUPABASE_URL = undefined;
      process.env.DATABASE_URL = undefined; // Also unset DATABASE_URL since it can be used as fallback
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.test';

      expect(() => validateEnvironment(true)).toThrow(
        'Process.exit called with code 1'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      // Restore DATABASE_URL
      process.env.DATABASE_URL = savedDatabaseUrl;
    });

    it('should exit when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = undefined;

      expect(() => validateEnvironment(true)).toThrow(
        'Process.exit called with code 1'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit when SUPABASE_URL has invalid format', () => {
      process.env.SUPABASE_URL = 'not-a-valid-url';
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.test';

      expect(() => validateEnvironment(true)).toThrow(
        'Process.exit called with code 1'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit when service role key has invalid JWT format', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'not-a-jwt-token';

      expect(() => validateEnvironment(true)).toThrow(
        'Process.exit called with code 1'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('createSupabaseClient', () => {
    it('should create a client with correct configuration', () => {
      const url = 'https://test.supabase.co';
      const key = 'test-key';

      const client = createSupabaseClient(url, key);

      // Check that client is created (we can't test internal config easily)
      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('log utilities', () => {
    it('should have all logging methods', () => {
      expect(log.info).toBeDefined();
      expect(log.success).toBeDefined();
      expect(log.warning).toBeDefined();
      expect(log.error).toBeDefined();
      expect(log.section).toBeDefined();
    });

    it('should call console methods', () => {
      const logCallsBefore = (console.log as jest.Mock).mock.calls.length;
      const errorCallsBefore = (console.error as jest.Mock).mock.calls.length;

      log.info('test info');
      log.success('test success');
      log.warning('test warning');
      log.error('test error');
      log.section('test section');

      const logCallsAfter = (console.log as jest.Mock).mock.calls.length;
      const errorCallsAfter = (console.error as jest.Mock).mock.calls.length;

      expect(logCallsAfter - logCallsBefore).toBe(4);
      expect(errorCallsAfter - errorCallsBefore).toBe(1);
    });
  });
});
