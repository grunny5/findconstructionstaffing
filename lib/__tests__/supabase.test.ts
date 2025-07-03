// Mock @supabase/supabase-js before imports
jest.mock('@supabase/supabase-js');

import { supabase, createClient } from '../supabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

describe('Supabase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set up the mock
    const mockClient = { from: jest.fn() };
    (createSupabaseClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should export a supabase client instance', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Re-import to trigger module execution
    jest.resetModules();
    const { supabase } = require('../supabase');

    expect(supabase).toBeDefined();
  });

  it('should call createClient with correct parameters', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const client = createClient('https://test.supabase.co', 'test-anon-key');

    expect(createSupabaseClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBeDefined();
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing in non-test env', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    (process.env as any).NODE_ENV = 'production'; // Temporarily set to non-test

    // Re-import to trigger error
    jest.resetModules();
    expect(() => require('../supabase')).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
    );

    (process.env as any).NODE_ENV = 'test'; // Reset to test
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in non-test env', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    (process.env as any).NODE_ENV = 'production'; // Temporarily set to non-test

    // Re-import to trigger error
    jest.resetModules();
    expect(() => require('../supabase')).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );

    (process.env as any).NODE_ENV = 'test'; // Reset to test
  });

  it('should use dummy values in test environment when env vars are missing', () => {
    // Clear env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    (process.env as any).NODE_ENV = 'test';

    // Clear all mocks and modules
    jest.clearAllMocks();
    jest.resetModules();

    // Re-mock the createClient function
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn().mockReturnValue({ from: jest.fn() }),
    }));

    // Re-import - should not throw in test env
    const { supabase } = require('../supabase');
    const { createClient: mockCreateClient } = require('@supabase/supabase-js');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://dummy.supabase.co',
      'dummy-anon-key'
    );
    expect(supabase).toBeDefined();
  });

  it('should handle different environment configurations', () => {
    const configs = [
      {
        url: 'https://prod.supabase.co',
        key: 'prod-key',
      },
      {
        url: 'https://staging.supabase.co',
        key: 'staging-key',
      },
    ];

    configs.forEach((config) => {
      // Reset everything
      jest.clearAllMocks();
      jest.resetModules();

      // Set env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = config.url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = config.key;
      (process.env as any).NODE_ENV = 'test';

      // Re-mock
      jest.mock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue({ from: jest.fn() }),
      }));

      // Re-import with new env vars
      const { supabase } = require('../supabase');
      const {
        createClient: mockCreateClient,
      } = require('@supabase/supabase-js');

      expect(mockCreateClient).toHaveBeenCalledWith(config.url, config.key);
    });
  });
});
