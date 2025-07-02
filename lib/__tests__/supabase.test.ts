import { createClient } from '../supabase';
import { createBrowserClient } from '@supabase/ssr';

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

describe('Supabase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create a browser client with correct URL and anon key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mockClient = { from: jest.fn() };
    (createBrowserClient as jest.Mock).mockReturnValue(mockClient);

    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBe(mockClient);
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(() => createClient()).toThrow('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  });

  it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => createClient()).toThrow('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('should cache the client instance', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mockClient = { from: jest.fn() };
    (createBrowserClient as jest.Mock).mockReturnValue(mockClient);

    const client1 = createClient();
    const client2 = createClient();

    // Should only create one client
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
    expect(client1).toBe(client2);
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
      (createBrowserClient as jest.Mock).mockReturnValue(mockClient);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(config.url, config.key);
    });
  });
});