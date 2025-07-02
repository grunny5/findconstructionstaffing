import { supabase, createClient } from '../supabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js');

describe('Supabase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should export a supabase client instance', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mockClient = { from: jest.fn() };
    (createSupabaseClient as jest.Mock).mockReturnValue(mockClient);

    // Re-import to trigger module execution
    jest.resetModules();
    const { supabase } = require('../supabase');

    expect(supabase).toBeDefined();
  });

  it('should call createClient with correct parameters', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mockClient = { from: jest.fn() };
    (createSupabaseClient as jest.Mock).mockReturnValue(mockClient);

    const client = createClient('https://test.supabase.co', 'test-anon-key');

    expect(createSupabaseClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBe(mockClient);
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Re-import to trigger error
    jest.resetModules();
    expect(() => require('../supabase')).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
    );
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Re-import to trigger error
    jest.resetModules();
    expect(() => require('../supabase')).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
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
      jest.clearAllMocks();
      process.env.NEXT_PUBLIC_SUPABASE_URL = config.url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = config.key;

      const mockClient = { from: jest.fn() };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      // Re-import with new env vars
      jest.resetModules();
      const { supabase } = require('../supabase');

      expect(createSupabaseClient).toHaveBeenCalledWith(config.url, config.key);
    });
  });
});
