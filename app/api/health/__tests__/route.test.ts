// Import centralized mock helpers first
import { configureSupabaseMock, supabaseMockHelpers, resetSupabaseMock } from '@/__tests__/utils/supabase-mock';

// The mock is already set up at module level in supabase-mock.ts
// Import supabase AFTER the mock setup
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers)
    }))
  }
}));

// Import the route AFTER all mocks are set up
import { GET } from '../route';

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to default state
    resetSupabaseMock(supabase);
    // Reset environment to original state
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Healthy State', () => {
    it('should return healthy status when all checks pass', async () => {
      // Setup environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      // Configure mock for successful query - the mock already chains properly
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1' }]
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks).toEqual({
        api: true,
        database: true,
        environment: true
      });
      expect(data.details.message).toBeUndefined();
    });
  });

  describe('Unhealthy States', () => {
    it('should return unhealthy when environment variables are missing', async () => {
      // Remove required environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.environment).toBe(false);
      expect(data.details.message).toContain('Missing environment variables');
    });

    it('should return unhealthy when database connection fails', async () => {
      // Setup environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      // Use centralized mock configuration
      configureSupabaseMock(supabase, {
        error: { message: 'Connection refused' }
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.database).toBe(false);
      expect(data.details.message).toContain('Database check failed');
      
      // Use assertion helpers
      supabaseMockHelpers.expectTableQueried(supabase, 'agencies');
      supabaseMockHelpers.expectSelectCalled(supabase, 'id');
    });

    it('should return unhealthy when supabase client is not initialized', async () => {
      // Setup environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      // Mock null supabase client
      jest.resetModules();
      jest.doMock('@/lib/supabase', () => ({
        supabase: null
      }));
      
      const { GET: GETWithNoSupabase } = await import('../route');
      const response = await GETWithNoSupabase();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.database).toBe(false);
      expect(data.details.message).toContain('Database client not initialized');
    });
  });

  describe('Response Headers', () => {
    it('should include no-cache headers', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1' }]
      });

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
    });
  });

  describe('Response Structure', () => {
    it('should include all required fields in response', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      configureSupabaseMock(supabase, {
        defaultData: [{ id: '1' }]
      });

      const response = await GET();
      const data = await response.json();

      // Check structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('details');
      
      // Check timestamp format
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
      
      // Check details
      expect(data.details).toHaveProperty('environment');
      expect(data.details.environment).toBe('test'); // Jest sets NODE_ENV to 'test'
    });
  });
});