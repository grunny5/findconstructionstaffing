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
    
    // Clear any existing module cache
    Object.keys(require.cache).forEach(key => {
      if (key.includes('supabase')) {
        delete require.cache[key];
      }
    });
    
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
    // Clear all environment variables and set to development
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NODE_ENV = 'development';

    // Reset modules to ensure fresh import
    jest.resetModules();
    
    // Clear the module cache to force re-evaluation
    delete require.cache[require.resolve('../supabase')];
    
    // Expect the error to be thrown during module import
    expect(() => {
      require('../supabase');
    }).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');

    // Reset back to test environment
    process.env.NODE_ENV = 'test';
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in non-test env', () => {
    // Set URL but clear ANON_KEY, set to development
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = 'development';

    // Reset modules to ensure fresh import
    jest.resetModules();
    
    // Clear the module cache to force re-evaluation
    delete require.cache[require.resolve('../supabase')];
    
    // Expect the error to be thrown during module import
    expect(() => {
      require('../supabase');
    }).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Reset back to test environment
    process.env.NODE_ENV = 'test';
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
